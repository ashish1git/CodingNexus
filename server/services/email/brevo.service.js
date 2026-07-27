/**
 * Brevo Email Service Module
 * 
 * A production-ready email service using Brevo TransactionalEmailsApi
 * Supports dual API key fallback — if primary reaches daily quota, secondary kicks in automatically
 * 
 * Environment Variables Required:
 * - BREVO_API_KEY: Primary Brevo API key (official account)
 * - BREVO_API_KEY_SECONDARY: Fallback Brevo API key (backup account)
 * - EMAIL_FROM: Primary sender email address
 * - EMAIL_FROM_SECONDARY: Fallback sender email address
 * - EMAIL_FROM_NAME: Sender display name
 */

import * as brevo from '@getbrevo/brevo';

// Validate required environment variables
const validateConfig = () => {
  const hasPrimary = process.env.BREVO_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_FROM_NAME;
  const hasFallback = process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY;
  
  if (!hasPrimary && !hasFallback) {
    console.warn('⚠️  Missing Brevo configuration: no API keys configured');
    return false;
  }
  return true;
};

// API client cache: primary + fallback
let apiPrimary = null;
let apiFallback = null;

const initClient = (apiKey) => {
  try {
    const api = new brevo.TransactionalEmailsApi();
    api.authentications['apiKey'].apiKey = apiKey;
    return api;
  } catch (error) {
    console.error('❌ Failed to initialize Brevo client:', error.message);
    return null;
  }
};

const initializeBrevo = () => {
  if (!apiPrimary && process.env.BREVO_API_KEY) {
    apiPrimary = initClient(process.env.BREVO_API_KEY);
    if (apiPrimary) console.log('✅ Brevo primary (official) initialized');
  }
  if (!apiFallback && process.env.BREVO_API_KEY_SECONDARY) {
    apiFallback = initClient(process.env.BREVO_API_KEY_SECONDARY);
    if (apiFallback) console.log('✅ Brevo fallback (backup) initialized');
  }
  return apiPrimary || apiFallback;
};

/**
 * Send email using Brevo with automatic fallback to secondary account
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body (optional)
 * @param {string} options.text - Plain text email body (optional)
 * @param {Array} options.cc - CC recipients (optional)
 * @param {Array} options.bcc - BCC recipients (optional)
 * @param {Array} options.attachments - Attachments (optional)
 * 
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string, usedFallback?: boolean }
 */
export const sendEmail = async (options) => {
  const { to, subject, html, text, cc, bcc, attachments } = options;

  if (!to || !subject) {
    return { success: false, error: 'Missing required parameters: to and subject are required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: `Invalid email address: ${to}` };
  }

  const trySend = async (apiKey, senderEmail) => {
    const api = initClient(apiKey);
    if (!api) return { success: false, error: 'Brevo client init failed' };

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: process.env.EMAIL_FROM_NAME || 'Coding Nexus' };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    if (html) sendSmtpEmail.htmlContent = html;
    if (text) sendSmtpEmail.textContent = text;
    if (cc?.length) sendSmtpEmail.cc = cc.map(e => ({ email: e }));
    if (bcc?.length) sendSmtpEmail.bcc = bcc.map(e => ({ email: e }));
    if (attachments?.length) sendSmtpEmail.attachment = attachments;

    const result = await api.sendTransacEmail(sendSmtpEmail);
    const messageId = result.body?.messageId || result.messageId || 'unknown';
    return { success: true, messageId };
  };

  // Try primary first
  if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
    try {
      console.log(`📤 Sending via primary (${process.env.EMAIL_FROM}) to ${to}`);
      const result = await trySend(process.env.BREVO_API_KEY, process.env.EMAIL_FROM);
      if (result.success) {
        console.log(`📧 Sent successfully via primary, Message ID: ${result.messageId}`);
        return { ...result, usedFallback: false };
      }
    } catch (err) {
      const isQuotaError = err.status === 429 || err.response?.status === 429 || 
        (err.message && err.message.includes('429'));
      if (isQuotaError) {
        console.warn(`⚠️  Primary Brevo quota exhausted (429), trying fallback...`);
      } else {
        console.warn(`⚠️  Primary Brevo failed: ${err.message}. Trying fallback...`);
      }
    }
  }

  // Try fallback
  if (process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY) {
    try {
      console.log(`📤 Sending via fallback (${process.env.EMAIL_FROM_SECONDARY}) to ${to}`);
      const result = await trySend(process.env.BREVO_API_KEY_SECONDARY, process.env.EMAIL_FROM_SECONDARY);
      if (result.success) {
        console.log(`📧 Sent successfully via fallback, Message ID: ${result.messageId}`);
        return { ...result, usedFallback: true };
      }
    } catch (err) {
      console.error(`❌ Fallback Brevo also failed:`, err.message);
      return { success: false, error: `Both primary and fallback failed: ${err.message}` };
    }
  }

  return { success: false, error: 'No Brevo account available' };
};

/**
 * Send email to multiple recipients with rate limiting and auto-retry
 * Sends sequentially to avoid rate limits (Brevo allows ~100 req/s)
 * Failed emails are retried up to 2 times with backoff
 * 
 * @param {Object} options - Email options
 * @param {Array<string>} options.to - Array of recipient email addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body (optional)
 * @param {string} options.text - Plain text email body (optional)
 * @param {number} options.rateLimitMs - Delay between sends (default: 100ms = 10/sec, safe)
 * 
 * @returns {Promise<Object>} - { total, sent, failed, errors }
 */
export const sendBulkEmail = async (options) => {
  const { to, subject, html, text, rateLimitMs = 100 } = options;

  if (!Array.isArray(to) || to.length === 0) {
    return { total: 0, sent: 0, failed: 0, errors: ['recipient list is empty or not an array'] };
  }

  const results = { total: to.length, sent: 0, failed: 0, errors: [] };
  const failedEmails = [];

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  console.log(`📊 Starting bulk send to ${to.length} recipients (${rateLimitMs}ms delay between sends)`);

  for (let i = 0; i < to.length; i++) {
    const email = to[i];
    try {
      const result = await sendEmail({ to: email, subject, html, text });

      if (result.success) {
        results.sent++;
      } else {
        failedEmails.push({ email, error: result.error });
      }

      if ((i + 1) % 10 === 0 || i === to.length - 1) {
        console.log(`📊 Bulk progress: ${i + 1}/${to.length} (${results.sent} sent, ${failedEmails.length} failed)`);
      }
    } catch (error) {
      failedEmails.push({ email, error: error.message });
    }

    if (i < to.length - 1) {
      await delay(rateLimitMs);
    }
  }

  if (failedEmails.length > 0) {
    console.log(`🔄 Retrying ${failedEmails.length} failed emails after 2s cooldown...`);
    await delay(2000);

    for (const { email } of failedEmails.splice(0, failedEmails.length)) {
      try {
        const result = await sendEmail({ to: email, subject, html, text });
        if (result.success) {
          results.sent++;
          console.log(`  ✅ Retry succeeded: ${email}`);
        } else {
          results.failed++;
          results.errors.push({ email, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email, error: error.message });
      }
      await delay(rateLimitMs);
    }
  }

  for (const { email, error } of failedEmails) {
    results.failed++;
    results.errors.push({ email, error });
  }

  console.log(`📊 Bulk email done: ${results.sent}/${results.total} sent, ${results.failed} failed`);
  return results;
};

/**
 * Send event registration confirmation email
 * 
 * @param {Object} event - Event object with id, title, eventDate, venue, description
 * @param {Object} participant - Participant object with id, name, email
 * 
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
export const sendEventRegistrationEmail = async (event, participant) => {
  try {
    let frontendUrl = 'https://codingnexus.apsit.edu.in';
    
    if (process.env.NODE_ENV === 'production') {
      frontendUrl = 'https://codingnexus.apsit.edu.in';
    } else if (process.env.FRONTEND_URL) {
      const urls = process.env.FRONTEND_URL.split(',').map(u => u.trim());
      const httpsUrl = urls.find(u => u.startsWith('https'));
      frontendUrl = httpsUrl || urls[0] || frontendUrl;
    }
    
    const portalName = process.env.EMAIL_FROM_NAME || 'Coding Nexus';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .event-info { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>${portalName}</p>
          </div>
          <div class="content">
            <p>Dear <strong>${participant.name}</strong>,</p>
            
            <p>Thank you for registering for our event! Your registration has been successfully confirmed.</p>
            
            <div class="details">
              <h3>📋 Event Details</h3>
              <div class="event-info">
                <p><strong>Event Name:</strong> ${event.title}</p>
                <p><strong>Date & Time:</strong> ${new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                ${event.eventEndDate ? `<p><strong>End Date:</strong> ${new Date(event.eventEndDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>` : ''}
                ${event.venue ? `<p><strong>Venue:</strong> ${event.venue}</p>` : '<p><strong>Venue:</strong> To be announced</p>'}
                <p><strong>Event Type:</strong> ${event.eventType || 'Workshop'}</p>
              </div>
              
              ${event.description ? `
                <div style="margin: 15px 0; background: white; padding: 15px; border-radius: 8px;">
                  <h4>About the Event:</h4>
                  <p>${event.description}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="details">
              <h3>👤 Your Registration Details</h3>
              <p><strong>Name:</strong> ${participant.name}</p>
              <p><strong>Email:</strong> ${participant.email}</p>
              <p><strong>Portal:</strong> ${portalName}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">📌 Important Information</h4>
              <ul style="color: #856404; margin: 10px 0;">
                <li>Please save this email for your reference</li>
                <li>Make sure to arrive on time on the event date</li>
                <li>Keep your confirmation email handy during check-in</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}" class="button" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
                🔐 Visit Event Portal
              </a>
            </div>
            
            <p>If you have any questions or need to make changes to your registration, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br><strong>${portalName} Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>© ${new Date().getFullYear()} ${portalName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Registration Confirmed - ${event.title}

Dear ${participant.name},

Thank you for registering for our event!

Event Details:
- Event: ${event.title}
- Date: ${new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Venue: ${event.venue || 'To be announced'}
- Type: ${event.eventType || 'Workshop'}

Your Registration:
- Name: ${participant.name}
- Email: ${participant.email}

Portal: ${portalName}

Best regards,
${portalName} Team
    `.trim();

    return await sendEmail({
      to: participant.email,
      subject: `Confirmed: ${event.title} Registration - ${portalName}`,
      html: htmlContent,
      text: textContent
    });

  } catch (error) {
    console.error('Error sending event registration email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Brevo configuration without sending email
 * 
 * @returns {Object} - { isConfigured: boolean, message: string }
 */
export const verifyConfiguration = () => {
  if (!validateConfig()) {
    return {
      isConfigured: false,
      message: 'Brevo configuration is incomplete. Check environment variables.',
      apiKey: process.env.BREVO_API_KEY,
      sender: process.env.EMAIL_FROM,
      senderName: process.env.EMAIL_FROM_NAME,
      hasSecondary: !!(process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY)
    };
  }

  const primary = process.env.BREVO_API_KEY ? initClient(process.env.BREVO_API_KEY) : null;
  const fallback = process.env.BREVO_API_KEY_SECONDARY ? initClient(process.env.BREVO_API_KEY_SECONDARY) : null;
  
  return {
    isConfigured: true,
    message: 'Brevo email service is properly configured',
    primary: primary ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>` : 'not configured',
    fallback: fallback ? `Backup: ${process.env.EMAIL_FROM_SECONDARY}` : 'not configured',
    fallbackAvailable: !!fallback
  };
};

export default {
  sendEmail,
  sendBulkEmail,
  sendEventRegistrationEmail,
  verifyConfiguration
};

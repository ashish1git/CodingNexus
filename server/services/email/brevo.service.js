/**
 * Brevo Email Service Module
 * 
 * A production-ready email service using Brevo TransactionalEmailsApi
 * Supports dual API key fallback — if primary reaches daily quota, secondary kicks in automatically
 * 
 * Environment Variables Required:
 * - BREVO_API_KEY: Primary Brevo API key (official account)
 * - BREVO_API_KEY_SECONDARY: Fallback Brevo API key (backup account)
 * - EMAIL_FROM: Primary sender email address (MUST be verified in Brevo)
 * - EMAIL_FROM_SECONDARY: Fallback sender email address (MUST be verified in Brevo)
 * - EMAIL_FROM_NAME: Sender display name
 * 
 * IMPORTANT: Both EMAIL_FROM and EMAIL_FROM_SECONDARY must be verified sender
 * identities in their respective Brevo accounts. Without verification, Brevo
 * returns a 200 OK with a messageId but silently drops the email.
 */

import * as brevo from '@getbrevo/brevo';

const log = (msg, ...args) => console.log(msg, ...args);
const warn = (msg, ...args) => console.warn(msg, ...args);
const error = (msg, ...args) => console.error(msg, ...args);

const initClient = (apiKey, label) => {
  if (!apiKey) return null;
  try {
    const api = new brevo.TransactionalEmailsApi();
    api.authentications['apiKey'].apiKey = apiKey;
    log(`✅ Brevo client "${label}" initialized`);
    return api;
  } catch (err) {
    error(`❌ Failed to init Brevo client "${label}":`, err.message);
    return null;
  }
};

/**
 * Try sending with one Brevo account.
 * Returns { success, messageId } on success, throws on failure.
 */
const trySend = async (apiKey, senderEmail, options) => {
  const { to, subject, html, text, cc, bcc, attachments } = options;

  const clientLabel = apiKey === process.env.BREVO_API_KEY ? 'primary' : 'fallback';
  const api = initClient(apiKey, clientLabel);
  if (!api) throw new Error(`Brevo client "${clientLabel}" init failed`);

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { email: senderEmail, name: process.env.EMAIL_FROM_NAME || 'Coding Nexus' };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  if (html) sendSmtpEmail.htmlContent = html;
  if (text) sendSmtpEmail.textContent = text;
  if (cc?.length) sendSmtpEmail.cc = cc.map(e => ({ email: e }));
  if (bcc?.length) sendSmtpEmail.bcc = bcc.map(e => ({ email: e }));
  if (attachments?.length) sendSmtpEmail.attachment = attachments;

  log(`  🔌 Calling Brevo API (${clientLabel}, sender=${senderEmail})...`);
  const result = await api.sendTransacEmail(sendSmtpEmail);
  const messageId = result?.body?.messageId || result?.response?.body?.messageId || result?.messageId || 'unknown';

  log(`  📬 Brevo accepted (${clientLabel}): messageId=${messageId}` +
    `  ⚠️  Verify sender "${senderEmail}" is approved in Brevo dashboard, or email may be silently dropped.`);

  return { success: true, messageId };
};

/**
 * Send email using Brevo with automatic fallback to secondary account.
 *
 * IMPORTANT: Brevo returns 200 OK + messageId even for unverified senders.
 * The email will NOT actually be delivered unless the sender email is verified
 * in the Brevo dashboard (Senders & IP → Senders → Verify).
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body (optional)
 * @param {string} options.text - Plain text body (optional)
 * @param {Array} options.cc - CC recipients (optional)
 * @param {Array} options.bcc - BCC recipients (optional)
 * @param {Array} options.attachments - Attachments (optional)
 * @param {boolean} options.forceFallback - If true, also send via fallback even when primary succeeds.
 *   Use this when you suspect the primary sender may be unverified and you need delivery guarantees.
 *
 * @returns {Promise<Object>} - { success, messageId?, error?, usedFallback?, triedPrimary?, triedFallback? }
 */
export const sendEmail = async (options) => {
  const { to, subject, html, text, cc, bcc, attachments, forceFallback } = options;

  if (!to || !subject) {
    return { success: false, error: 'Missing to or subject', triedPrimary: false, triedFallback: false };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: `Invalid email: ${to}`, triedPrimary: false, triedFallback: false };
  }

  // ── Primary ──
  if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
    try {
      log(`📤 PRIMARY → ${to} (from: ${process.env.EMAIL_FROM})`);
      const result = await trySend(process.env.BREVO_API_KEY, process.env.EMAIL_FROM, options);
      log(`✅ PRIMARY accepted: messageId=${result.messageId}`);

      // If forceFallback is set, also fire the fallback for delivery confidence.
      // This handles Brevo's silent-drop behavior for unverified senders.
      if (forceFallback && process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY) {
        try {
          log(`📤 FALLBACK (force) → ${to} (from: ${process.env.EMAIL_FROM_SECONDARY})`);
          const fbResult = await trySend(process.env.BREVO_API_KEY_SECONDARY, process.env.EMAIL_FROM_SECONDARY, options);
          log(`✅ FALLBACK (force) accepted: messageId=${fbResult.messageId}`);
          return { success: true, messageId: fbResult.messageId, usedFallback: true, triedPrimary: true, triedFallback: true };
        } catch (fbErr) {
          warn(`⚠️  Force-fallback failed: ${fbErr.message}`);
          // Primary succeeded, so return that success even though fallback failed
        }
      }

      return { success: true, messageId: result.messageId, usedFallback: false, triedPrimary: true };
    } catch (err) {
      const statusCode = err.statusCode || err.response?.statusCode || err.status;
      const body = err.body ? JSON.stringify(err.body).substring(0, 300) : '';
      warn(`⚠️  PRIMARY failed: status=${statusCode}, msg="${err.message}", body=${body}`);

      if (statusCode === 401 || statusCode === 403) {
        warn('   → Auth error. Check BREVO_API_KEY validity.');
      } else if (statusCode === 429) {
        warn('   → Daily quota exhausted on primary. Falling back...');
      } else if (statusCode === 400) {
        warn('   → Bad request. Check sender email is VERIFIED in Brevo dashboard.');
      } else {
        warn(`   → Unexpected error. Falling back to secondary...`);
      }
    }
  } else {
    warn('⚠️  PRIMARY not configured (missing BREVO_API_KEY or EMAIL_FROM)');
  }

  // ── Fallback ──
  if (process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY) {
    try {
      log(`📤 FALLBACK → ${to} (from: ${process.env.EMAIL_FROM_SECONDARY})`);
      const result = await trySend(process.env.BREVO_API_KEY_SECONDARY, process.env.EMAIL_FROM_SECONDARY, options);
      log(`✅ FALLBACK accepted: messageId=${result.messageId}`);
      return { success: true, messageId: result.messageId, usedFallback: true, triedPrimary: true, triedFallback: true };
    } catch (err) {
      const statusCode = err.statusCode || err.response?.statusCode || err.status;
      const body = err.body ? JSON.stringify(err.body).substring(0, 300) : '';
      error(`❌ FALLBACK also failed: status=${statusCode}, msg="${err.message}", body=${body}`);
      return {
        success: false,
        error: `Primary and fallback both failed. Last error: ${err.message}`,
        triedPrimary: true,
        triedFallback: true
      };
    }
  } else {
    warn('⚠️  FALLBACK not configured (missing BREVO_API_KEY_SECONDARY or EMAIL_FROM_SECONDARY)');
  }

  return {
    success: false,
    error: 'No Brevo account available. Configure BREVO_API_KEY + EMAIL_FROM, or BREVO_API_KEY_SECONDARY + EMAIL_FROM_SECONDARY.',
    triedPrimary: !!process.env.BREVO_API_KEY,
    triedFallback: !!process.env.BREVO_API_KEY_SECONDARY
  };
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
  const hasPrimary = !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
  const hasFallback = !!(process.env.BREVO_API_KEY_SECONDARY && process.env.EMAIL_FROM_SECONDARY);

  if (!hasPrimary && !hasFallback) {
    return {
      isConfigured: false,
      message: 'Brevo configuration is incomplete. Check environment variables.',
      primaryKey: !!process.env.BREVO_API_KEY,
      primarySender: process.env.EMAIL_FROM || 'not set',
      senderName: process.env.EMAIL_FROM_NAME || 'not set',
      hasSecondary: hasFallback
    };
  }

  return {
    isConfigured: true,
    message: 'Brevo email service is properly configured',
    primary: hasPrimary ? `${process.env.EMAIL_FROM_NAME || 'Coding Nexus'} <${process.env.EMAIL_FROM}>` : 'not configured',
    fallback: hasFallback ? `Backup: ${process.env.EMAIL_FROM_SECONDARY}` : 'not configured',
    fallbackAvailable: hasFallback
  };
};

export default {
  sendEmail,
  sendBulkEmail,
  sendEventRegistrationEmail,
  verifyConfiguration
};

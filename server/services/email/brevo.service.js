/**
 * Brevo Email Service Module
 * 
 * A production-ready email service using Brevo TransactionalEmailsApi
 * Supports HTML and plain text emails with proper error handling
 * 
 * Environment Variables Required:
 * - BREVO_API_KEY: Brevo API key for authentication
 * - EMAIL_FROM: Sender email address
 * - EMAIL_FROM_NAME: Sender display name
 */

import * as brevo from '@getbrevo/brevo';

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = ['BREVO_API_KEY', 'EMAIL_FROM', 'EMAIL_FROM_NAME'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing Brevo configuration: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

// Initialize Brevo API client
let apiInstance = null;

const initializeBrevo = () => {
  if (apiInstance) return apiInstance;
  
  if (!validateConfig()) {
    console.error('❌ Brevo configuration is incomplete. Email service disabled.');
    return null;
  }

  try {
    apiInstance = new brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    console.log('✅ Brevo email service initialized successfully');
    return apiInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Brevo:', error.message);
    return null;
  }
};

/**
 * Send email using Brevo
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
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 * 
 * @example
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Hello</h1>',
 *   text: 'Hello'
 * });
 */
export const sendEmail = async (options) => {
  const { to, subject, html, text, cc, bcc, attachments } = options;

  // Validate required parameters
  if (!to || !subject) {
    return {
      success: false,
      error: 'Missing required parameters: to and subject are required'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return {
      success: false,
      error: `Invalid email address: ${to}`
    };
  }

  try {
    const api = initializeBrevo();
    
    if (!api) {
      return {
        success: false,
        error: 'Brevo service is not configured or initialized'
      };
    }

    // Create SendSmtpEmail object
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    // Set sender
    sendSmtpEmail.sender = {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME
    };

    // Set recipient(s)
    sendSmtpEmail.to = [{ email: to }];

    // Set subject
    sendSmtpEmail.subject = subject;

    // Set content
    if (html) {
      sendSmtpEmail.htmlContent = html;
    }
    
    if (text) {
      sendSmtpEmail.textContent = text;
    }

    // Set optional fields if provided
    if (cc && Array.isArray(cc)) {
      sendSmtpEmail.cc = cc.map(email => ({ email }));
    }

    if (bcc && Array.isArray(bcc)) {
      sendSmtpEmail.bcc = bcc.map(email => ({ email }));
    }

    if (attachments && Array.isArray(attachments)) {
      sendSmtpEmail.attachment = attachments;
    }

    // Send email via Brevo
    console.log('📤 Sending via Brevo...');
    console.log('Payload:', JSON.stringify({
      to: sendSmtpEmail.to,
      subject: sendSmtpEmail.subject,
      sender: sendSmtpEmail.sender,
      hasHtml: !!sendSmtpEmail.htmlContent,
      hasText: !!sendSmtpEmail.textContent
    }, null, 2));

    const result = await api.sendTransacEmail(sendSmtpEmail);

    // Extract messageId from response body (Brevo SDK structure)
    const messageId = result.body?.messageId || result.messageId || 'unknown';

    // Log success
    console.log(`📧 Email sent successfully to ${to}, Message ID: ${messageId}`);

    return {
      success: true,
      messageId: messageId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // Log error
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error('Error Status:', error.status);
    console.error('Error Response:', error.response?.body || error.response?.text);

    // Return error details
    return {
      success: false,
      error: error.message || 'Failed to send email',
      details: error.response?.body || error.response?.text || error.toString()
    };
  }
};

/**
 * Send email to multiple recipients
 * 
 * @param {Object} options - Email options
 * @param {Array<string>} options.to - Array of recipient email addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body (optional)
 * @param {string} options.text - Plain text email body (optional)
 * 
 * @returns {Promise<Object>} - { total, sent, failed, errors }
 */
export const sendBulkEmail = async (options) => {
  const { to, subject, html, text } = options;

  if (!Array.isArray(to) || to.length === 0) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
      errors: ['recipient list is empty or not an array']
    };
  }

  const results = {
    total: to.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  // Send to each recipient in parallel
  const promises = to.map(async (email) => {
    try {
      const result = await sendEmail({
        to: email,
        subject,
        html,
        text
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({ email, error: result.error });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ email, error: error.message });
    }
  });

  await Promise.all(promises);

  console.log(
    `📊 Bulk email results: ${results.sent}/${results.total} sent successfully, ${results.failed} failed`
  );

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
    // Smart URL selection: Use production URL if in production, otherwise use local
    let frontendUrl = 'http://localhost:22000';
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use the production/live URL
      frontendUrl = 'https://codingnexus.vercel.app';
    } else if (process.env.FRONTEND_URL) {
      // In development, try to parse the configured URLs
      // Prefer https URLs (production) or use the first one
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
      senderName: process.env.EMAIL_FROM_NAME
    };
  }

  const api = initializeBrevo();
  
  if (!api) {
    return {
      isConfigured: false,
      message: 'Failed to initialize Brevo API',
      apiKey: process.env.BREVO_API_KEY,
      sender: process.env.EMAIL_FROM,
      senderName: process.env.EMAIL_FROM_NAME
    };
  }

  return {
    isConfigured: true,
    message: 'Brevo email service is properly configured',
    apiKey: process.env.BREVO_API_KEY,
    sender: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    senderName: process.env.EMAIL_FROM_NAME
  };
};

export default {
  sendEmail,
  sendBulkEmail,
  sendEventRegistrationEmail,
  verifyConfiguration
};

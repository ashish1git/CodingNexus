import nodemailer from 'nodemailer';
import prisma from '../config/db.js';

// Email transporter configuration
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ Email credentials not configured. Email notifications will be skipped.');
    return null;
  }

  // Brevo/Sendinblue SMTP Configuration
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send event registration confirmation email
export const sendRegistrationConfirmation = async (event, participant, verificationToken) => {
  const transporter = createTransporter();
  if (!transporter) return { status: 'skipped', message: 'Email not configured' };

  try {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:22000';
    
    const mailOptions = {
      from: `Coding Nexus <${process.env.EMAIL_USER}>`,
      to: participant.email,
      subject: `Registration Confirmed - ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Registration Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${participant.name},</p>
              <p>Congratulations! Your registration for <strong>${event.title}</strong> has been confirmed.</p>
              
              <div class="details">
                <h3>📋 Event Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>📌 <strong>Event:</strong> ${event.title}</li>
                  <li>📅 <strong>Date:</strong> ${new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
                  <li>📍 <strong>Venue:</strong> ${event.venue || 'To be announced'}</li>
                  <li>🎯 <strong>Type:</strong> ${event.eventType}</li>
                </ul>
              </div>

              ${event.description ? `<p><strong>About the Event:</strong><br>${event.description}</p>` : ''}

              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>🔐 Your Login Credentials:</h4>
                <p><strong>Email:</strong> ${participant.email}</p>
                <p style="font-size: 12px; color: #856404;">No password needed! You'll login using your email, phone, division, and branch during the event.</p>
              </div>

              ${verificationToken ? `<div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/verify-email?token=${verificationToken}" class="button">
                  ✅ Verify Email
                </a>
              </div>` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/event-login" class="button">
                  🔐 Access Event Portal
                </a>
              </div>

              <p style="margin-top: 30px;">We're excited to have you join us! You'll receive more updates as the event approaches.</p>
              
              <p>If you have any questions, feel free to reach out to us.</p>
              
              <p>Best regards,<br><strong>Coding Nexus Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log email
    await prisma.eventEmailLog.create({
      data: {
        eventId: event.id,
        participantId: participant.id,
        emailType: 'registration_confirmation',
        subject: mailOptions.subject,
        message: mailOptions.html,
        emailStatus: 'sent'
      }
    });

    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    
    // Log failed email
    try {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'registration_confirmation',
          subject: `Registration Confirmed - ${event.title}`,
          message: error.message,
          emailStatus: 'failed'
        }
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    return { status: 'failed', error: error.message };
  }
};

// Send certificate email
export const sendCertificateEmail = async (event, participant, certificate) => {
  const transporter = createTransporter();
  if (!transporter) return { status: 'skipped', message: 'Email not configured' };

  try {
    const mailOptions = {
      from: `Coding Nexus <${process.env.EMAIL_USER}>`,
      to: participant.email,
      subject: `🎓 Your Certificate - ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .cert-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Certificate Ready!</h1>
            </div>
            <div class="content">
              <p>Dear ${participant.name},</p>
              <p>Congratulations! Your certificate of ${certificate.templateType} for <strong>${event.title}</strong> is now ready.</p>
              
              <div class="cert-box">
                <h3 style="color: #667eea; margin-top: 0;">Certificate Details</h3>
                <p><strong>Certificate Number:</strong> ${certificate.certificateNumber}</p>
                <p><strong>Event:</strong> ${event.title}</p>
                <p><strong>Issue Date:</strong> ${new Date(certificate.issueDate).toLocaleDateString('en-IN')}</p>
              </div>

              ${certificate.certificateUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${certificate.certificateUrl}" class="button">
                    📥 Download Certificate
                  </a>
                </div>
              ` : ''}

              <p>You can also access your certificate anytime from your event dashboard.</p>
              
              <p>Congratulations once again!</p>
              
              <p>Best regards,<br><strong>Coding Nexus Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log email
    await prisma.eventEmailLog.create({
      data: {
        eventId: event.id,
        participantId: participant.id,
        emailType: 'certificate',
        subject: mailOptions.subject,
        message: mailOptions.html,
        emailStatus: 'sent'
      }
    });

    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    console.error('Certificate email error:', error);
    return { status: 'failed', error: error.message };
  }
};

// Send event reminder
export const sendEventReminder = async (event, participant) => {
  const transporter = createTransporter();
  if (!transporter) return { status: 'skipped', message: 'Email not configured' };

  try {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:22000';
    
    const mailOptions = {
      from: `Coding Nexus <${process.env.EMAIL_USER}>`,
      to: participant.email,
      subject: `⏰ Reminder: ${event.title} is Tomorrow!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Event Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${participant.name},</p>
              <p>This is a friendly reminder that <strong>${event.title}</strong> is happening soon!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Event Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>📅 <strong>Date:</strong> ${new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
                  <li>📍 <strong>Venue:</strong> ${event.venue || 'To be announced'}</li>
                </ul>
              </div>

              <p>We look forward to seeing you there!</p>
              
              <p>Best regards,<br><strong>Coding Nexus Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    await prisma.eventEmailLog.create({
      data: {
        eventId: event.id,
        participantId: participant.id,
        emailType: 'event_reminder',
        subject: mailOptions.subject,
        message: mailOptions.html,
        emailStatus: 'sent'
      }
    });

    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    console.error('Reminder email error:', error);
    return { status: 'failed', error: error.message };
  }
};

export default {
  sendRegistrationConfirmation,
  sendCertificateEmail,
  sendEventReminder
};

import prisma from '../config/db.js';
import { sendEmail } from './email/brevo.service.js';
import * as emailTemplates from './email/emailTemplates.js';

// Send event registration confirmation email
export const sendRegistrationConfirmation = async (event, participant, verificationToken) => {
  try {
    const eventDetails = `Location: ${event.venue || 'To be announced'}\nType: ${event.eventType}\n${event.description ? 'About: ' + event.description : ''}`;
    
    const result = await sendEmail({
      to: participant.email,
      subject: `Registration Confirmed - ${event.title}`,
      html: emailTemplates.eventRegistration(
        participant.name,
        event.title,
        new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        eventDetails
      ),
      text: emailTemplates.plainTextFallback('eventRegistration', {
        userName: participant.name,
        eventName: event.title,
        eventDate: new Date(event.eventDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      })
    });
    
    // Log email
    if (result.success) {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'registration_confirmation',
          subject: `Registration Confirmed - ${event.title}`,
          message: 'Email sent successfully via Brevo',
          emailStatus: 'sent'
        }
      }).catch(err => console.error('Failed to log email:', err));
    }

    return { status: result.success ? 'sent' : 'failed', messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Registration email error:', error);
    
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
  try {
    const certificateUrl = certificate.certificateUrl || certificate.url || '';
    
    const result = await sendEmail({
      to: participant.email,
      subject: `🎓 Certificate Ready - ${event.title}`,
      html: emailTemplates.certificateDelivery(
        participant.name,
        event.title,
        certificateUrl
      ),
      text: emailTemplates.plainTextFallback('certificateDelivery', {
        userName: participant.name,
        eventName: event.title
      })
    });
    
    // Log email
    if (result.success) {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'certificate',
          subject: `🎓 Certificate Ready - ${event.title}`,
          message: 'Certificate email sent successfully via Brevo',
          emailStatus: 'sent'
        }
      }).catch(err => console.error('Failed to log email:', err));
    }

    return { status: result.success ? 'sent' : 'failed', messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Certificate email error:', error);
    
    try {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'certificate',
          subject: `🎓 Certificate Ready - ${event.title}`,
          message: error.message,
          emailStatus: 'failed'
        }
      });
    } catch (logError) {
      console.error('Failed to log certificate email error:', logError);
    }

    return { status: 'failed', error: error.message };
  }
};

// Send event reminder (1 hour before event)
export const sendEventReminder = async (event, participant) => {
  try {
    const eventDateTime = new Date(event.eventDate).toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata', 
      year: 'numeric', 
      month: 'long', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const reminderMessage = `This is a friendly reminder that ${event.title} is starting soon!\n\n⏰ Event starts at: ${eventDateTime}\n📍 Venue: ${event.venue || 'To be announced'}\n\nMake sure you're prepared and arrive a few minutes early!`;
    
    const result = await sendEmail({
      to: participant.email,
      subject: `⏰ Reminder: ${event.title} is Starting Soon!`,
      html: emailTemplates.generalNotification(
        participant.name,
        '⏰ Event is Starting Soon!',
        `<p>This is a friendly reminder that <strong>${event.title}</strong> is starting soon!</p>
        <div class="warning-box">
          <strong>📅 Event Details:</strong><br/>
          <strong>Date & Time:</strong> ${eventDateTime}<br/>
          <strong>Venue:</strong> ${event.venue || 'To be announced'}
        </div>
        <p>Make sure you're prepared and arrive a few minutes early!</p>
        <p>We look forward to seeing you there!</p>`,
        'warning'
      ),
      text: reminderMessage
    });
    
    // Log email
    if (result.success) {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'event_reminder',
          subject: `⏰ Reminder: ${event.title} is Starting Soon!`,
          message: 'Reminder email sent successfully via Brevo',
          emailStatus: 'sent'
        }
      }).catch(err => console.error('Failed to log reminder email:', err));
    }

    return { status: result.success ? 'sent' : 'failed', messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Reminder email error:', error);
    
    try {
      await prisma.eventEmailLog.create({
        data: {
          eventId: event.id,
          participantId: participant.id,
          emailType: 'event_reminder',
          subject: `⏰ Reminder: ${event.title}`,
          message: error.message,
          emailStatus: 'failed'
        }
      });
    } catch (logError) {
      console.error('Failed to log reminder email error:', logError);
    }

    return { status: 'failed', error: error.message };
  }
};

export default {
  sendRegistrationConfirmation,
  sendCertificateEmail,
  sendEventReminder
};

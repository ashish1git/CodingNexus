/**
 * Professional Email Templates with Coding Nexus Branding
 * Includes templates for different email types with logo and styling
 */

const LOGO_URL = 'https://codingnexus.apsit.edu.in/favicon.svg';
const PRIMARY_COLOR = '#667eea';
const SECONDARY_COLOR = '#764ba2';
const SUCCESS_COLOR = '#10b981';
const WARNING_COLOR = '#f59e0b';

/**
 * Base email wrapper with header and footer
 */
const baseTemplate = (content, logoUrl = LOGO_URL) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coding Nexus</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: ${PRIMARY_COLOR};
      margin-bottom: 20px;
      font-weight: 500;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: ${SECONDARY_COLOR};
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${PRIMARY_COLOR};
    }
    .message {
      color: #555;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .info-box {
      background: #f0f4ff;
      border-left: 4px solid ${PRIMARY_COLOR};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-box {
      background: #ecfdf5;
      border-left: 4px solid ${SUCCESS_COLOR};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      color: #065f46;
    }
    .warning-box {
      background: #fffbeb;
      border-left: 4px solid ${WARNING_COLOR};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      color: #78350f;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table tr {
      border-bottom: 1px solid #e0e0e0;
    }
    .details-table td {
      padding: 12px;
      font-size: 14px;
    }
    .details-table .label {
      font-weight: 600;
      color: ${PRIMARY_COLOR};
      width: 40%;
    }
    .details-table .value {
      color: #333;
    }
    .footer {
      background: #fafafa;
      padding: 25px 30px;
      text-align: center;
      color: #777;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .footer-links {
      margin-bottom: 15px;
    }
    .footer-links a {
      color: ${PRIMARY_COLOR};
      text-decoration: none;
      margin: 0 10px;
    }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 30px 0;
    }
    .banner-danger {
      background: #fee2e2;
      color: #991b1b;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #dc2626;
    }
    @media (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
      .header {
        padding: 30px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">
        <img src="${logoUrl}" alt="Coding Nexus Logo" style="width: 100%; height: auto;">
      </div>
      <h1>Coding Nexus</h1>
      <p>APSIT Coding Competition & Community</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-links">
        <a href="https://codingnexus.apsit.edu.in">Website</a> |
        <a href="mailto:ashishapsit@gmail.com">Contact us</a>
      </div>
      <p>© 2026 Coding Nexus. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this address.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Team Application Submission Confirmation
 */
export const teamApplicationSubmission = (userName, teamName, applicationId) => {
  const content = `
    <p class="greeting">Hello ${userName},</p>
    
    <p>Thank you for submitting your team application to <strong>Coding Nexus</strong>! 🎉</p>
    
    <div class="success-box">
      <strong>✓ Application Received Successfully!</strong>
      <p>Your team application has been received and is now under review.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Application Details</div>
      <table class="details-table">
        <tr>
          <td class="label">Team Name:</td>
          <td class="value"><strong>${teamName}</strong></td>
        </tr>
        <tr>
          <td class="label">Application ID:</td>
          <td class="value">${applicationId}</td>
        </tr>
        <tr>
          <td class="label">Submitted On:</td>
          <td class="value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    <div class="info-box">
      <strong>What happens next?</strong>
      <p>Our review team will evaluate your application and notify you of the status within 3-5 business days.</p>
    </div>
    
    <div class="section">
      <p>If you have any questions, feel free to reach out to us.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Team Application Status Update
 */
export const teamApplicationStatus = (userName, teamName, status, feedbackMessage = '') => {
  const statusColor = status.toLowerCase() === 'accepted' ? SUCCESS_COLOR : status.toLowerCase() === 'rejected' ? '#ef4444' : WARNING_COLOR;
  const statusIcon = status.toLowerCase() === 'accepted' ? '✓' : status.toLowerCase() === 'rejected' ? '✕' : '⏳';
  
  let boxContent = '';
  if (status.toLowerCase() === 'accepted') {
    boxContent = `<div class="success-box"><strong>${statusIcon} Congratulations! Your application has been <strong>ACCEPTED</strong></strong></div>`;
  } else if (status.toLowerCase() === 'rejected') {
    boxContent = `<div class="banner-danger"><strong>${statusIcon} Your application status: <strong>REJECTED</strong></strong></div>`;
  } else {
    boxContent = `<div class="warning-box"><strong>${statusIcon} Your application is under <strong>REVIEW</strong></strong></div>`;
  }

  const content = `
    <p class="greeting">Hello ${userName},</p>
    
    <p>We have an update regarding your team application: <strong>${teamName}</strong></p>
    
    ${boxContent}
    
    <div class="section">
      <div class="section-title">Application Status Update</div>
      <table class="details-table">
        <tr>
          <td class="label">Team Name:</td>
          <td class="value"><strong>${teamName}</strong></td>
        </tr>
        <tr>
          <td class="label">Status:</td>
          <td class="value"><strong style="color: ${statusColor};">${status.toUpperCase()}</strong></td>
        </tr>
        <tr>
          <td class="label">Updated On:</td>
          <td class="value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    ${feedbackMessage ? `
    <div class="section">
      <div class="section-title">Feedback</div>
      <div class="message">${feedbackMessage}</div>
    </div>
    ` : ''}
    
    <div class="section">
      <p>${
        status.toLowerCase() === 'accepted' 
          ? 'Thank you for joining Coding Nexus! We look forward to seeing your team participate in upcoming competitions and events.' 
          : status.toLowerCase() === 'rejected'
          ? 'We appreciate your interest in Coding Nexus. We encourage you to apply again in the future!'
          : 'We are currently reviewing your application. Please check back for updates.'
      }</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Event Registration Confirmation
 */
export const eventRegistration = (userName, eventName, eventDate, eventDetails = '') => {
  const content = `
    <p class="greeting">Hello ${userName},</p>
    
    <p>Thank you for registering for <strong>${eventName}</strong>! 🎊</p>
    
    <div class="success-box">
      <strong>✓ Registration Confirmed!</strong>
      <p>You are now registered for this event. A confirmation email has been sent to your address.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Event Details</div>
      <table class="details-table">
        <tr>
          <td class="label">Event:</td>
          <td class="value"><strong>${eventName}</strong></td>
        </tr>
        <tr>
          <td class="label">Date:</td>
          <td class="value">${eventDate}</td>
        </tr>
        <tr>
          <td class="label">Registered On:</td>
          <td class="value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    ${eventDetails ? `
    <div class="section">
      <div class="section-title">Additional Information</div>
      <div class="message">${eventDetails}</div>
    </div>
    ` : ''}
    
    <div class="info-box">
      <strong>Mark your calendar!</strong>
      <p>Make sure to note down the date and time. We'll send you a reminder before the event.</p>
    </div>
    
    <div class="section">
      <p>If you have any questions, feel free to reach out to us.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Certificate Delivery Notification
 */
export const certificateDelivery = (userName, eventName, certificateUrl = '') => {
  const content = `
    <p class="greeting">Hello ${userName},</p>
    
    <p>Congratulations! 🏆 Your certificate for <strong>${eventName}</strong> is ready!</p>
    
    <div class="success-box">
      <strong>✓ Certificate Ready!</strong>
      <p>Your participation certificate has been generated and is available for download.</p>
    </div>
    
    <div class="section">
      <div class="section-title">Certificate Information</div>
      <table class="details-table">
        <tr>
          <td class="label">Event:</td>
          <td class="value"><strong>${eventName}</strong></td>
        </tr>
        <tr>
          <td class="label">Issued On:</td>
          <td class="value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    
    ${certificateUrl ? `
    <div class="section" style="text-align: center;">
      <a href="${certificateUrl}" class="button">Download Certificate</a>
    </div>
    ` : ''}
    
    <div class="info-box">
      <strong>Share Your Achievement!</strong>
      <p>You can now download and share your certificate across social media platforms. Great job! 👏</p>
    </div>
    
    <div class="section">
      <p>Thank you for participating in Coding Nexus events. We look forward to seeing you in our future competitions!</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * General Notification (Admin use)
 */
export const generalNotification = (userName, title, message, type = 'info') => {
  const boxClass = type === 'success' ? 'success-box' : type === 'warning' ? 'warning-box' : type === 'danger' ? 'banner-danger' : 'info-box';
  
  const content = `
    <p class="greeting">Hello ${userName},</p>
    
    <div class="${boxClass}">
      <strong>${title}</strong>
    </div>
    
    <div class="message">${message}</div>
    
    <div class="section">
      <p>If you have any questions, feel free to reach out to us.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Plain Text Fallback
 */
export const plainTextFallback = (type, data) => {
  switch(type) {
    case 'teamApplicationSubmission':
      return `Hello ${data.userName},\n\nThank you for submitting your team application to Coding Nexus!\n\nTeam Name: ${data.teamName}\nApplication ID: ${data.applicationId}\nSubmitted On: ${new Date().toLocaleDateString()}\n\nOur review team will evaluate your application and notify you within 3-5 business days.\n\nBest regards,\nCoding Nexus Team`;
    
    case 'teamApplicationStatus':
      return `Hello ${data.userName},\n\nYour team application status update:\n\nTeam Name: ${data.teamName}\nStatus: ${data.status}\nUpdated On: ${new Date().toLocaleDateString()}\n\n${data.feedbackMessage ? 'Feedback: ' + data.feedbackMessage : ''}\n\nBest regards,\nCoding Nexus Team`;
    
    case 'eventRegistration':
      return `Hello ${data.userName},\n\nThank you for registering for ${data.eventName}!\n\nEvent: ${data.eventName}\nDate: ${data.eventDate}\nRegistered On: ${new Date().toLocaleDateString()}\n\nBest regards,\nCoding Nexus Team`;
    
    case 'certificateDelivery':
      return `Hello ${data.userName},\n\nCongratulations! Your certificate for ${data.eventName} is ready!\n\nEvent: ${data.eventName}\nIssued On: ${new Date().toLocaleDateString()}\n\nBest regards,\nCoding Nexus Team`;
    
    default:
      return `Hello ${data.userName},\n\n${data.message}\n\nBest regards,\nCoding Nexus Team`;
  }
};

export default {
  teamApplicationSubmission,
  teamApplicationStatus,
  eventRegistration,
  certificateDelivery,
  generalNotification,
  plainTextFallback
};

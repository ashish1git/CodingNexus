#!/usr/bin/env node
/**
 * Send Interview Shortlist Email - Final Version
 * With Coding Nexus logo and professional footer
 */

import 'dotenv/config';
import { sendEmail } from './server/services/email/brevo.service.js';

const finalEmailTemplate = (applicantName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Shortlist - Coding Nexus</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      background: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo img {
      width: 50px;
      height: 50px;
      object-fit: contain;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 45px 40px;
    }
    
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      font-weight: 500;
      color: #333;
    }
    
    .message {
      font-size: 15px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 25px;
    }
    
    .highlight-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 20px 25px;
      margin: 30px 0;
      border-radius: 6px;
    }
    
    .highlight-box p {
      color: #333;
      font-size: 15px;
      margin-bottom: 10px;
      font-weight: 500;
    }
    
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    
    .highlight-box strong {
      color: #667eea;
    }
    
    .coming-soon {
      background: #fffbf0;
      border-left: 4px solid #ff9800;
      padding: 18px 25px;
      margin: 30px 0;
      font-size: 14px;
      color: #666;
      border-radius: 6px;
    }
    
    .coming-soon strong {
      color: #ff9800;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 40px 30px;
      text-align: center;
      border-top: 2px solid #e9ecef;
    }
    
    .footer-logo-section {
      margin-bottom: 20px;
    }
    
    .footer-logo {
      width: 50px;
      height: 50px;
      margin: 0 auto 15px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .footer-logo img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    
    .footer-brand {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 5px;
    }
    
    .footer-tagline {
      font-size: 13px;
      color: #999;
      margin-bottom: 20px;
    }
    
    .footer-links {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }
    
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 15px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .footer-copyright {
      font-size: 12px;
      color: #ccc;
      margin-top: 15px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Logo -->
    <div class="header">
      <div class="logo">
        <img src="https://codingnexus.apsit.edu.in/favicon.svg" alt="Coding Nexus Logo">
      </div>
      <h1>You're Shortlisted</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="greeting">Dear ${applicantName},</p>
      
      <p class="message">
        Congratulations! You have been shortlisted for the Coding Nexus Team Interview.
      </p>
      
      <!-- Interview Details Box -->
      <div class="highlight-box">
        <p><strong>Interview Format:</strong> Q&A Round</p>
        <p><strong>Duration:</strong> 15-20 minutes</p>
        <p><strong>Time & Venue:</strong> To be notified via email soon</p>
      </div>
      
      <!-- Coming Soon Notice -->
      <div class="coming-soon">
        <strong>Note:</strong> Please keep checking your inbox for detailed interview schedule and instructions.
      </div>
      
      <p class="message">
        We look forward to meeting you.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo-section">
        <div class="footer-logo">
          <img src="https://codingnexus.apsit.edu.in/favicon.svg" alt="Coding Nexus Logo">
        </div>
        <div class="footer-brand">Coding Nexus</div>
        <p class="footer-tagline">APSIT Coding Competition & Community</p>
      </div>
      
      <div class="footer-links">
        <a href="https://codingnexus.apsit.edu.in">Website</a>
        <a href="mailto:ashishapsit@gmail.com">Contact us</a>
      </div>
      
      <p class="footer-copyright">© 2026 Coding Nexus. All rights reserved.</p>
      <p class="footer-text">This is an automated email. Please do not reply to this address.</p>
    </div>
  </div>
</body>
</html>
  `;
};

async function sendShortlistEmail() {
  try {
    console.log('\n📧 Interview Shortlist Email - FINAL VERSION (WITH LOGO & FOOTER)');
    console.log('═'.repeat(65) + '\n');

    const email = '23106031@apsit.edu.in';
    const applicantName = 'Applicant';

    console.log(`📤 Sending FINAL email to: ${email}\n`);

    const result = await sendEmail({
      to: email,
      subject: `Shortlist Notification - Coding Nexus Team Interview`,
      html: finalEmailTemplate(applicantName),
      text: `Dear ${applicantName},\n\nCongratulations! You have been shortlisted for the Coding Nexus Team Interview.\n\nInterview Format: Q&A Round\nDuration: 15-20 minutes\nTime & Venue: To be notified via email soon\n\nPlease keep checking your inbox for detailed interview schedule.\n\nBest regards,\nCoding Nexus Team`
    });

    if (result.success) {
      console.log('✅ SUCCESS - FINAL EMAIL SENT!\n');
      console.log('📬 Email Details:');
      console.log(`   To: ${email}`);
      console.log(`   Subject: Shortlist Notification - Coding Nexus Team Interview`);
      console.log(`   Duration: 15-20 minutes`);
      console.log(`   Message ID: ${result.messageId}\n`);
      console.log('✨ Template includes:');
      console.log('   ✓ Coding Nexus official logo');
      console.log('   ✓ Professional header with gradient');
      console.log('   ✓ Interview details (Q&A Round, 15-20 mins)');
      console.log('   ✓ Coming soon notice');
      console.log('   ✓ Professional footer with logo');
      console.log('   ✓ Footer links (Website, Contact)');
      console.log('   ✓ Copyright & disclaimer\n');
      console.log('📅 Ready to send to all applicants!\n');
    } else {
      console.log('❌ FAILED!');
      console.log(`Error: ${result.error}\n`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

sendShortlistEmail();

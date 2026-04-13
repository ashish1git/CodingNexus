#!/usr/bin/env node
/**
 * Send Interview Shortlist Email - Final Version
 * Formal, short, with logo and 15-20 min duration
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
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #667eea;
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    
    .logo-section {
      margin-bottom: 15px;
    }
    
    .logo {
      width: 50px;
      height: 50px;
      background: white;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    
    .content {
      padding: 35px 30px;
    }
    
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    
    .message {
      font-size: 15px;
      line-height: 1.7;
      color: #555;
      margin-bottom: 25px;
    }
    
    .highlight-box {
      background: #f0f4ff;
      border-left: 3px solid #667eea;
      padding: 15px 20px;
      margin: 25px 0;
    }
    
    .highlight-box p {
      color: #333;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    
    .coming-soon {
      background: #fffbf0;
      border-left: 3px solid #ff9800;
      padding: 15px 20px;
      margin: 25px 0;
      font-size: 14px;
      color: #666;
    }
    
    .footer {
      background: #f8f8f8;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    
    .footer-text {
      font-size: 13px;
      color: #999;
      margin-bottom: 8px;
    }
    
    .brand-name {
      font-size: 16px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">🚀</div>
      </div>
      <h1>You're Shortlisted</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Dear ${applicantName},</p>
      
      <p class="message">
        Congratulations! You have been shortlisted for the Coding Nexus Team Interview.
      </p>
      
      <div class="highlight-box">
        <p><strong>Interview Format:</strong> Q&A Round</p>
        <p><strong>Duration:</strong> 15-20 minutes</p>
        <p><strong>Time & Venue:</strong> To be notified via email soon</p>
      </div>
      
      <div class="coming-soon">
        <strong>Note:</strong> Please keep checking your inbox for detailed interview schedule and instructions.
      </div>
      
      <p class="message">
        We look forward to meeting you.
      </p>
    </div>
    
    <div class="footer">
      <div class="brand-name">Coding Nexus</div>
      <p class="footer-text">APSIT Coding Competition & Community</p>
      <p class="footer-text">© 2026 Coding Nexus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

async function sendShortlistEmail() {
  try {
    console.log('\n📧 Interview Shortlist Email - FINAL VERSION');
    console.log('═'.repeat(60) + '\n');

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
      console.log('   ✓ Coding Nexus logo (🚀)');
      console.log('   ✓ Professional greeting');
      console.log('   ✓ Interview format (Q&A Round)');
      console.log('   ✓ Duration (15-20 mins)');
      console.log('   ✓ Coming soon notice for time & venue\n');
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

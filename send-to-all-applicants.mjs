#!/usr/bin/env node
/**
 * Send Interview Shortlist Emails to ALL Applicants
 * Automatically fetches from database and sends to everyone
 */

import 'dotenv/config';
import prisma from './server/config/db.js';
import { sendEmail } from './server/services/email/brevo.service.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const emailTemplate = (applicantName) => {
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
    <div class="header">
      <div class="logo">
        <img src="https://codingnexus.apsit.edu.in/favicon.svg" alt="Coding Nexus Logo">
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

async function sendToAllApplicants() {
  try {
    console.log('\n📧 Sending Shortlist Emails to ALL Applicants');
    console.log('═'.repeat(75) + '\n');

    console.log('🔍 Fetching all applicants from database...\n');
    
    // Fetch all team applications
    const applicants = await prisma.teamApplication.findMany({
      select: {
        id: true,
        fullName: true,
        email: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    if (!applicants || applicants.length === 0) {
      console.log('❌ No applicants found in database.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(0);
    }

    // Display list of applicants
    console.log(`✅ Found ${applicants.length} applicants:\n`);
    console.log('─'.repeat(75));
    applicants.forEach((app, index) => {
      const name = app.fullName || 'Unknown';
      const email = app.email || 'No email';
      console.log(`${String(index + 1).padStart(3)}. ${name.padEnd(35)} | ${email}`);
    });
    console.log('─'.repeat(75) + '\n');

    // Ask for confirmation
    const confirm = await question(`⚠️  Ready to send emails to ${applicants.length} applicants? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(0);
    }

    console.log('\n📤 Sending emails...\n');
    console.log('─'.repeat(75));

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const applicant of applicants) {
      try {
        const name = applicant.fullName || 'Applicant';
        const email = applicant.email;

        if (!email) {
          failureCount++;
          errors.push({ email: 'N/A', name: name, error: 'No email address' });
          console.log(`❌ ${name.padEnd(35)} ← No email address`);
          continue;
        }

        const result = await sendEmail({
          to: email,
          subject: `Shortlist Notification - Coding Nexus Team Interview`,
          html: emailTemplate(name),
          text: `Dear ${name},\n\nCongratulations! You have been shortlisted for the Coding Nexus Team Interview.\n\nInterview Format: Q&A Round\nDuration: 15-20 minutes\nTime & Venue: To be notified via email soon\n\nPlease keep checking your inbox for detailed interview schedule.\n\nBest regards,\nCoding Nexus Team`
        });

        if (result.success) {
          successCount++;
          console.log(`✅ ${name.padEnd(35)} ← ${email}`);
        } else {
          failureCount++;
          errors.push({ email: email, name: name, error: result.error });
          console.log(`❌ ${name.padEnd(35)} ← ${email} (Failed)`);
        }
      } catch (error) {
        failureCount++;
        const name = applicant.fullName || 'Unknown';
        const email = applicant.email || 'No email';
        errors.push({ email: email, name: name, error: error.message });
        console.log(`❌ ${name.padEnd(35)} ← ${email}`);
      }
    }

    console.log('─'.repeat(75));
    console.log('\n' + '═'.repeat(75));
    console.log('📊 FINAL SUMMARY');
    console.log('═'.repeat(75));
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📊 Total applicants: ${applicants.length}`);
    if (successCount > 0) {
      console.log(`📈 Success Rate: ${Math.round((successCount / applicants.length) * 100)}%`);
    }
    console.log('═'.repeat(75) + '\n');

    if (errors.length > 0) {
      console.log('⚠️  Errors:');
      errors.forEach(err => {
        console.log(`   • ${err.name} (${err.email}): ${err.error}`);
      });
      console.log();
    }

    await prisma.$disconnect();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
    rl.close();
    process.exit(1);
  }
}

sendToAllApplicants();

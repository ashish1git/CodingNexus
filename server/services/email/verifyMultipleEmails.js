/**
 * Email Service Verification - Multiple Recipients
 * 
 * Test sending emails to verify service is working
 */

import dotenv from 'dotenv';
import { sendEmail, verifyConfiguration } from './brevo.service.js';

dotenv.config();

console.log('\n📧 Email Service Verification - Multiple Recipients');
console.log('====================================================\n');

const testEmails = [
  'sumit13thakur124@gmail.com',
  '23106034@apsit.edu.in'
];

// Verify configuration first
console.log('🔐 Verifying Brevo Configuration...\n');
const config = verifyConfiguration();
console.log(`Status: ${config.isConfigured ? '✅' : '❌'}`);
console.log(`Sender: ${config.sender}\n`);

if (!config.isConfigured) {
  console.error('❌ Cannot proceed - Brevo not configured');
  process.exit(1);
}

// Send test emails
console.log('📤 Sending Test Emails...\n');
console.log('─'.repeat(50) + '\n');

let successCount = 0;
let failureCount = 0;

for (const email of testEmails) {
  console.log(`📍 Sending to: ${email}\n`);
  
  const result = await sendEmail({
    to: email,
    subject: '✅ Coding Nexus - Email Service Verification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
          .content { line-height: 1.6; color: #333; }
          .status { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Service Verifieds!</h1>
            <p>Coding Nexus Portal</p>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            
            <p>This is a <strong>verification test email</strong> to confirm that our email service is working correctly.</p>
            
            <div class="status">
              <h3 style="margin-top: 0;">✅ Service Status</h3>
              <p>The Coding Nexus email system is operational and ready to send event registrations, notifications, and announcements.</p>
            </div>
            
            <h3>📋 What This Means</h3>
            <ul>
              <li>When you register for events, you'll receive confirmation emails</li>
              <li>You'll be notified of any changes to events you're registered for</li>
              <li>All communications will come from <strong>noreply@codingnexus.apsit.edu.in</strong></li>
            </ul>
            
            <h3>🔗 Quick Links</h3>
            <p>
              <a href="http://localhost:22000" class="button">🏠 Visit Portal (Local)</a>
              <a href="https://codingnexus.vercel.app" class="button">🌐 Visit Portal (Live)</a>
            </p>
            
            <p>If you have any questions, please contact us through the portal.</p>
            
            <p>Best regards,<br><strong>Coding Nexus Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated verification email. Please do not reply directly.</p>
            <p>© 2026 Coding Nexus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
✅ Email Service Verified - Coding Nexus Portal

Hello,

This is a verification test email to confirm that our email service is working correctly.

Service Status: ✅ OPERATIONAL

When you register for events, you'll receive confirmation emails
You'll be notified of any changes to events you're registered for
All communications will come from: noreply@codingnexus.apsit.edu.in

Quick Links:
- Local Portal: http://localhost:22000
- Live Portal: https://codingnexus.vercel.app

If you have any questions, please contact us through the portal.

Best regards,
Coding Nexus Team

---
This is an automated verification email. Please do not reply directly.
© 2026 Coding Nexus. All rights reserved.
    `.trim()
  });
  
  if (result.success) {
    console.log(`   ✅ SUCCESS`);
    console.log(`   Message ID: ${result.messageId}`);
    successCount++;
  } else {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${result.error}`);
    failureCount++;
  }
  console.log();
}

// Summary
console.log('─'.repeat(50) + '\n');
console.log('📊 Test Results\n');
console.log(`   Total Emails: ${testEmails.length}`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Failed: ${failureCount}`);
console.log();

if (failureCount === 0) {
  console.log('🎉 All emails sent successfully!\n');
  console.log('📬 Check these inboxes:');
  testEmails.forEach(email => console.log(`   • ${email}`));
  console.log('\n(Also check spam/junk folders)\n');
} else {
  console.log('⚠️  Some emails failed. Check the errors above.\n');
}

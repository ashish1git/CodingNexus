/**
 * Test Brevo Email Configuration
 * Sends a test email to verify the setup is working
 */

import dotenv from 'dotenv';
import { sendEmail, verifyConfiguration } from './server/services/email/brevo.service.js';

dotenv.config();

console.log('\n📧 Testing Brevo Email Configuration');
console.log('=====================================\n');

// Verify configuration
console.log('🔐 Verifying Configuration...\n');
const config = verifyConfiguration();

console.log(`✅ API Key: ${config.apiKey ? '***' + config.apiKey.slice(-10) : 'NOT SET'}`);
console.log(`✅ Sender Email: ${config.sender}`);
console.log(`✅ Sender Name: ${config.senderName}`);
console.log(`✅ Status: ${config.isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}\n`);

if (!config.isConfigured) {
  console.error('❌ Brevo is not configured properly. Check your .env file.');
  process.exit(1);
}

// Send test email
console.log('📤 Sending Test Email...\n');
console.log('─'.repeat(50) + '\n');

const testEmail = '23106031@apsit.edu.in';
console.log(`📍 Recipient: ${testEmail}\n`);

try {
  const result = await sendEmail({
    to: testEmail,
    subject: '✅ Coding Nexus - Email Service Setup Successful',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 20px;
            margin: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 15px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px; 
            line-height: 1.8; 
            color: #333; 
          }
          .success-box {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
          }
          .success-box h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #667eea;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { 
            background: #f5f5f5; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 10px 5px;
            font-weight: 600;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          li:last-child {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Service Active</h1>
          </div>
          
          <div class="content">
            <p>Hello from <strong>Coding Nexus</strong>!</p>
            
            <div class="success-box">
              <h3>🎉 Configuration Successful!</h3>
              <p>Your Brevo email service is now properly configured and operational.</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 What This Means</h3>
              <ul>
                <li>✅ Email notifications are enabled</li>
                <li>✅ Event registration confirmations will be sent</li>
                <li>✅ Certificate delivery emails will work</li>
                <li>✅ Event reminders will be dispatched</li>
              </ul>
            </div>
            
            <h3>🔧 Email Service Details</h3>
            <ul>
              <li><strong>Provider:</strong> Brevo (SendinBlue)</li>
              <li><strong>Sender:</strong> Coding Nexus &lt;ashishapsit@gmail.com&gt;</li>
              <li><strong>Status:</strong> ✅ Active</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
            </ul>
            
            <h3>🔗 Quick Links</h3>
            <p style="text-align: center;">
              <a href="http://localhost:22000" class="button">🏠 Local Portal</a>
              <a href="https://codingnexus.vercel.app" class="button">🌐 Live Portal</a>
            </p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;"><strong>📝 Note:</strong> This is a test email to confirm your email service is working correctly. You don't need to take any action.</p>
            </div>
            
            <p>If you have any questions or need assistance, please contact the Coding Nexus team through the portal.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated test email from Coding Nexus.</p>
            <p>© 2026 Coding Nexus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
✅ Email Service Active - Coding Nexus

Hello from Coding Nexus!

🎉 Configuration Successful!
Your Brevo email service is now properly configured and operational.

What This Means:
- Email notifications are enabled
- Event registration confirmations will be sent
- Certificate delivery emails will work
- Event reminders will be dispatched

Email Service Details:
- Provider: Brevo (SendinBlue)
- Sender: Coding Nexus <ashishapsit@gmail.com>
- Status: ✅ Active
- Test Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Quick Links:
- Local Portal: http://localhost:22000
- Live Portal: https://codingnexus.vercel.app

This is a test email to confirm your email service is working correctly. You don't need to take any action.

Best regards,
Coding Nexus Team

---
© 2026 Coding Nexus. All rights reserved.
    `.trim()
  });

  if (result.success) {
    console.log('✅ SUCCESS!\n');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Timestamp: ${result.timestamp}\n`);
    console.log('─'.repeat(50) + '\n');
    console.log('🎉 Email sent successfully!\n');
    console.log('📬 Check the inbox: 23106031@apsit.edu.in');
    console.log('   (Also check spam/junk folder if not in inbox)\n');
  } else {
    console.log('❌ FAILED!\n');
    console.log(`   Error: ${result.error}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}

console.log('✅ Test completed successfully!\n');

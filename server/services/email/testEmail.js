/**
 * Brevo Email Service Test File
 * 
 * This file tests the Brevo email service locally
 * 
 * Usage:
 * 1. Edit line 25 below to add your test email address
 * 2. Run: node server/services/email/testEmail.js
 * 
 * Make sure your .env file has:
 * - BREVO_API_KEY
 * - EMAIL_FROM
 * - EMAIL_FROM_NAME
 */

import dotenv from 'dotenv';
import { sendEmail, verifyConfiguration, sendBulkEmail } from './brevo.service.js';

// Load environment variables
dotenv.config();

// Test email address - CHANGE THIS TO YOUR EMAIL
const TEST_EMAIL = 'your-email@example.com';

console.log('\n📧 Brevo Email Service Test\n');
console.log('================================\n');

// Test 1: Verify configuration
console.log('📋 Test 1: Verifying Brevo Configuration...\n');
const config = verifyConfiguration();
console.log(`Status: ${config.isConfigured ? '✅' : '❌'}`);
console.log(`Message: ${config.message}`);
if (config.sender) {
  console.log(`Sender: ${config.sender}`);
}
console.log('\n');

if (!config.isConfigured) {
  console.error('❌ Brevo is not configured. Please check your environment variables.');
  console.error('\nRequired variables in .env:');
  console.error('  - BREVO_API_KEY');
  console.error('  - EMAIL_FROM');
  console.error('  - EMAIL_FROM_NAME');
  process.exit(1);
}

// Test 2: Send simple email
const runTest = async () => {
  try {
    console.log('📤 Test 2: Sending Simple HTML Email...\n');

    if (TEST_EMAIL === 'your-email@example.com') {
      console.warn('⚠️  Please update TEST_EMAIL on line 25 with your actual email address');
      console.warn('   Current: your-email@example.com\n');
      return;
    }

    const result = await sendEmail({
      to: TEST_EMAIL,
      subject: 'Brevo Email Service Test',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; color: #667eea; margin-bottom: 20px;">
                <h1>✅ Brevo Email Service Test</h1>
              </div>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Hello! 👋
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                This is a test email from <strong>Coding Nexus</strong> to verify that the Brevo email service is working correctly.
              </p>
              
              <div style="background-color: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <p style="color: #667eea; font-weight: bold; margin: 0;">✨ Service Status: Active</p>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                  Your email service is configured and operational.<br>
                  Timestamp: ${new Date().toISOString()}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>Coding Nexus Development Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated test email. Please do not reply directly to this message.
              </p>
            </div>
          </body>
        </html>
      `,
      text: 'Brevo Email Service Test - This is a test email from Coding Nexus. Your email service is working correctly!'
    });

    if (result.success) {
      console.log('✅ Email sent successfully!\n');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`To: ${TEST_EMAIL}`);
      console.log(`Timestamp: ${result.timestamp}`);
    } else {
      console.error('❌ Failed to send email\n');
      console.error(`Error: ${result.error}`);
      if (result.details) {
        console.error(`Details:`, result.details);
      }
    }

    // Test 3: Send plain text email
    console.log('\n\n📤 Test 3: Sending Plain Text Email...\n');

    const textResult = await sendEmail({
      to: TEST_EMAIL,
      subject: 'Plain Text Test - Brevo Email Service',
      text: `Hello,\n\nThis is a plain text email test from Coding Nexus.\n\nIf you received this email, the plain text email functionality is working correctly.\n\nBest regards,\nCoding Nexus Team\n\nTimestamp: ${new Date().toISOString()}`
    });

    if (textResult.success) {
      console.log('✅ Plain text email sent successfully!\n');
      console.log(`Message ID: ${textResult.messageId}`);
      console.log(`To: ${TEST_EMAIL}`);
      console.log(`Timestamp: ${textResult.timestamp}`);
    } else {
      console.error('❌ Failed to send plain text email\n');
      console.error(`Error: ${textResult.error}`);
    }

    // Test 4: Bulk email (optional)
    console.log('\n\n📤 Test 4: Bulk Email Test (Example)...\n');

    const bulkResult = await sendBulkEmail({
      to: [TEST_EMAIL], // Using same email for test
      subject: 'Bulk Email Test - Brevo Service',
      html: '<h2>Bulk Email Test</h2><p>This is a bulk email test. Your email service supports sending to multiple recipients.</p>'
    });

    console.log(`Total: ${bulkResult.total}`);
    console.log(`Sent: ${bulkResult.sent}`);
    console.log(`Failed: ${bulkResult.failed}`);
    if (bulkResult.errors.length > 0) {
      console.log(`Errors:`, bulkResult.errors);
    }

    // Summary
    console.log('\n\n================================');
    console.log('📊 Test Summary');
    console.log('================================\n');
    console.log('✅ Configuration verified');
    console.log(`✅ HTML email test: ${result.success ? 'Passed' : 'Failed'}`);
    console.log(`✅ Plain text email test: ${textResult.success ? 'Passed' : 'Failed'}`);
    console.log(`✅ Bulk email test: ${bulkResult.sent > 0 ? 'Passed' : 'Failed'}`);
    console.log('\n✨ All tests completed!\n');
    console.log('Check your email inbox (and spam folder) to verify you received the test emails.');
    console.log('\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
};

// Run tests
runTest();

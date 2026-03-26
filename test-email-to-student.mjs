import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './server/services/email/brevo.service.js';

const testEmail = async () => {
  console.log('🔍 Testing Brevo Email Configuration\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ NOT SET'}`);
  console.log(`EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || '❌ NOT SET'}\n`);

  // Send test email
  const result = await sendEmail({
    to: '23106031@apsit.edu.in',
    subject: 'Testing Brevo Email Service - Coding Nexus',
    html: `
      <h1>Brevo Email Test</h1>
      <p>Hello,</p>
      <p>This is a test email from <strong>Coding Nexus</strong> to verify Brevo email service is working correctly.</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>Sent At: ${new Date().toISOString()}</li>
        <li>From: ${process.env.EMAIL_FROM}</li>
        <li>Service: Brevo (SendinBlue)</li>
      </ul>
      <p>If you received this email, the service is working properly on production! ✅</p>
      <p>Best regards,<br/>Coding Nexus Team</p>
    `,
    text: `
Test email from Coding Nexus
Sent at: ${new Date().toISOString()}
If you received this, Brevo email service is working!
    `
  });

  console.log('\n📤 Email Send Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log('Check your email inbox for the test message.');
  } else {
    console.log('\n❌ Email failed to send.');
    console.log('Error:', result.error);
    console.log('Details:', result.details);
  }
};

testEmail().catch(console.error);

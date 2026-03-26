import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './server/services/email/brevo.service.js';
import * as emailTemplates from './server/services/email/emailTemplates.js';

const testEmailTemplates = async () => {
  console.log('🎨 Testing Beautiful Email Templates\n');
  console.log('Sending sample emails to 23106031@apsit.edu.in...\n');
  
  const testEmail = '23106031@apsit.edu.in';
  
  // Test 1: Team Application Submission
  console.log('1️⃣  Sending Team Application Submission Email...');
  const result1 = await sendEmail({
    to: testEmail,
    subject: 'Team Application Submitted - Coding Nexus',
    html: emailTemplates.teamApplicationSubmission('Ashish Kumar', 'Code Warriors', 'APP-2026-001'),
    text: emailTemplates.plainTextFallback('teamApplicationSubmission', {
      userName: 'Ashish Kumar',
      teamName: 'Code Warriors',
      applicationId: 'APP-2026-001'
    })
  });
  console.log(result1.success ? '✅ Sent successfully!' : '❌ Failed: ' + result1.error);
  console.log(`   Message ID: ${result1.messageId}\n`);
  
  // Test 2: Team Application Accepted
  console.log('2️⃣  Sending Team Application Acceptance Email...');
  const result2 = await sendEmail({
    to: testEmail,
    subject: 'Team Application Accepted! - Coding Nexus',
    html: emailTemplates.teamApplicationStatus(
      'Ashish Kumar',
      'Code Warriors',
      'Accepted',
      'Great application! Your team demonstrates excellent problem-solving skills. Welcome to Coding Nexus!'
    ),
    text: emailTemplates.plainTextFallback('teamApplicationStatus', {
      userName: 'Ashish Kumar',
      teamName: 'Code Warriors',
      status: 'Accepted',
      feedbackMessage: 'Great application! Your team demonstrates excellent problem-solving skills.'
    })
  });
  console.log(result2.success ? '✅ Sent successfully!' : '❌ Failed: ' + result2.error);
  console.log(`   Message ID: ${result2.messageId}\n`);
  
  // Test 3: Event Registration
  console.log('3️⃣  Sending Event Registration Confirmation Email...');
  const result3 = await sendEmail({
    to: testEmail,
    subject: 'Event Registration Confirmed - Coding Nexus',
    html: emailTemplates.eventRegistration(
      'Ashish Kumar',
      'Java Bootcamp 2026',
      '28 March 2026, 10:00 AM',
      'Location: APSIT Auditorium\nDuration: 8 hours\nBring your laptop and enthusiasm!'
    ),
    text: emailTemplates.plainTextFallback('eventRegistration', {
      userName: 'Ashish Kumar',
      eventName: 'Java Bootcamp 2026',
      eventDate: '28 March 2026, 10:00 AM'
    })
  });
  console.log(result3.success ? '✅ Sent successfully!' : '❌ Failed: ' + result3.error);
  console.log(`   Message ID: ${result3.messageId}\n`);
  
  // Test 4: Certificate Delivery
  console.log('4️⃣  Sending Certificate Delivery Email...');
  const result4 = await sendEmail({
    to: testEmail,
    subject: 'Certificate Ready! - Coding Nexus',
    html: emailTemplates.certificateDelivery(
      'Ashish Kumar',
      'Coding Competition 2026',
      'https://codingnexus.apsit.edu.in/certificates/APP-2026-001.pdf'
    ),
    text: emailTemplates.plainTextFallback('certificateDelivery', {
      userName: 'Ashish Kumar',
      eventName: 'Coding Competition 2026'
    })
  });
  console.log(result4.success ? '✅ Sent successfully!' : '❌ Failed: ' + result4.error);
  console.log(`   Message ID: ${result4.messageId}\n`);
  
  console.log('\n✨ All template tests completed!');
  console.log('Check your email inbox to see the beautifully formatted emails with the Coding Nexus logo and branding.');
};

testEmailTemplates().catch(console.error);

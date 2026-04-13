#!/usr/bin/env node
/**
 * Simple Test - Send Interview Shortlist Email
 * No database required - just for testing the email
 */

import 'dotenv/config';
import { sendEmail } from './server/services/email/brevo.service.js';
import * as emailTemplates from './server/services/email/emailTemplates.js';

async function testShortlistEmail() {
  console.log('\n📧 Interview Shortlist Email - TEST');
  console.log('═'.repeat(60) + '\n');

  const testEmail = '23106031@apsit.edu.in';
  const applicantName = 'Test Applicant';
  const interviewDate = 'Tomorrow';

  console.log(`📤 Sending test email to: ${testEmail}`);
  console.log(`   Applicant: ${applicantName}`);
  console.log(`   Interview: ${interviewDate}`);
  console.log('\n⏳ Sending... Please wait\n');

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: `You're Shortlisted! 🎉 - Coding Nexus Team Interview`,
      html: emailTemplates.generalNotification(
        applicantName,
        '🎊 Congratulations! You\'re Shortlisted!',
        `<p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the Coding Nexus team interview.</p>
        
        <div class="success-box">
          <strong>📅 Interview Details:</strong><br/>
          <strong>Date:</strong> ${interviewDate}<br/>
          <strong>Time:</strong> To be confirmed<br/>
          <strong>Venue:</strong> APSIT Campus
        </div>
        
        <p><strong>What to expect:</strong></p>
        <ul style="margin-left: 20px;">
          <li>Technical coding round</li>
          <li>Problem-solving discussion</li>
          <li>Team fit assessment</li>
          <li>Q&A session</li>
        </ul>
        
        <p style="margin-top: 20px;"><strong>Please be ready with:</strong></p>
        <ul style="margin-left: 20px;">
          <li>Laptop/Computer</li>
          <li>Resume/Portfolio</li>
          <li>Your GitHub profile link</li>
          <li>Your enthusiasm! 🚀</li>
        </ul>
        
        <p style="margin-top: 20px;">Keep checking your inbox for the exact time and venue details. We look forward to meeting you!</p>
        <p style="margin-top: 20px;">In case of any queries, feel free to reach out to us.</p>`,
        'success'
      ),
      text: `Hello ${applicantName},\n\nCongratulations! You have been shortlisted for the Coding Nexus team interview.\n\nInterview Date: ${interviewDate}\nVenue: APSIT Campus\n\nPlease keep checking your inbox for the exact time and further details.\n\nBest regards,\nCoding Nexus Team`
    });

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!\n');
      console.log(`📬 Message ID: ${result.messageId}`);
      console.log(`📧 To: ${testEmail}`);
      console.log(`👤 Applicant: ${applicantName}`);
      console.log(`📅 Interview Date: ${interviewDate}\n`);
      console.log('💡 Check your inbox (23106031@apsit.edu.in) to verify the email looks good and the formatting is perfect.\n');
      console.log('✨ Once confirmed, we can send the same template to all applicants!\n');
    } else {
      console.log('❌ FAILED! Could not send email\n');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${result.details}`);
      }
      console.log();
    }
  } catch (error) {
    console.log('❌ ERROR!\n');
    console.log(`Error: ${error.message}\n`);
  }

  process.exit(0);
}

testShortlistEmail();

#!/usr/bin/env node
/**
 * Send Interview Shortlist Emails to Applicants
 * Test first, then send to all
 */

import 'dotenv/config';
import prisma from './server/config/db.js';
import { sendEmail } from './server/services/email/brevo.service.js';
import * as emailTemplates from './server/services/email/emailTemplates.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function sendShortlistEmail(email, fullName, interviewDate = 'Tomorrow') {
  try {
    const result = await sendEmail({
      to: email,
      subject: `You're Shortlisted! 🎉 - Coding Nexus Team Interview`,
      html: emailTemplates.generalNotification(
        fullName,
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
      text: `Hello ${fullName},\n\nCongratulations! You have been shortlisted for the Coding Nexus team interview.\n\nInterview Date: ${interviewDate}\nVenue: APSIT Campus\n\nPlease keep checking your inbox for the exact time and further details.\n\nBest regards,\nCoding Nexus Team`
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('\n📧 Interview Shortlist Email System');
  console.log('═'.repeat(70) + '\n');

  try {
    const mode = await question('What would you like to do?\n1. Send test email\n2. Send to all shortlisted applicants\n\nEnter choice (1 or 2): ');

    if (mode === '1') {
      // Test mode
      console.log('\n🧪 TEST MODE\n');
      const testEmail = await question('Enter test email (default: 23106031@apsit.edu.in): ') || '23106031@apsit.edu.in';
      const testName = await question('Enter applicant name (default: Test Applicant): ') || 'Test Applicant';
      const interviewDate = await question('Enter interview date (default: Tomorrow): ') || 'Tomorrow';

      console.log(`\n📤 Sending test email to: ${testEmail}`);
      console.log('⏳ Please wait...\n');

      const result = await sendShortlistEmail(testEmail, testName, interviewDate);

      if (result.success) {
        console.log('✅ SUCCESS! Email sent successfully!\n');
        console.log(`Message ID: ${result.messageId}`);
        console.log(`Recipient: ${testEmail}`);
        console.log(`Name: ${testName}`);
        console.log(`Interview Date: ${interviewDate}\n`);
        console.log('💡 Check the inbox to verify the email looks good.');
        console.log('Once confirmed, run this script again and choose "Send to all applicants"\n');
      } else {
        console.log('❌ FAILED! Could not send email');
        console.log(`Error: ${result.error}\n`);
      }
    } else if (mode === '2') {
      // Send to all
      console.log('\n📤 SEND TO ALL MODE\n');
      const interviewDate = await question('Enter interview date (default: Tomorrow): ') || 'Tomorrow';
      const interviewTime = await question('Enter interview time (optional, e.g., 2:00 PM): ') || '';

      // Get all applications
      console.log('\n🔍 Fetching all shortlisted applicants...\n');
      const applications = await prisma.teamApplication.findMany({
        where: {
          status: 'shortlisted'
        },
        select: {
          id: true,
          fullName: true,
          email: true
        }
      });

      if (applications.length === 0) {
        console.log('❌ No shortlisted applicants found in database.\n');
        rl.close();
        process.exit(0);
      }

      console.log(`✅ Found ${applications.length} shortlisted applicants\n`);
      console.log('Applicants:');
      applications.forEach((app, index) => {
        console.log(`  ${index + 1}. ${app.fullName} (${app.email})`);
      });

      const confirm = await question(`\n⚠️  This will send emails to ${applications.length} applicants. Continue? (yes/no): `);

      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('\n❌ Cancelled.\n');
        rl.close();
        process.exit(0);
      }

      console.log('\n📤 Sending emails...\n');

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const app of applications) {
        try {
          const result = await sendShortlistEmail(
            app.email,
            app.fullName,
            interviewTime ? `${interviewDate} at ${interviewTime}` : interviewDate
          );

          if (result.success) {
            successCount++;
            console.log(`✅ ${successCount}. ${app.fullName} (${app.email})`);
          } else {
            failureCount++;
            errors.push({ email: app.email, name: app.fullName, error: result.error });
            console.log(`❌ ${app.fullName} (${app.email}) - Error: ${result.error}`);
          }
        } catch (error) {
          failureCount++;
          errors.push({ email: app.email, name: app.fullName, error: error.message });
          console.log(`❌ ${app.fullName} (${app.email}) - Error: ${error.message}`);
        }
      }

      console.log('\n' + '═'.repeat(70));
      console.log('📊 SUMMARY');
      console.log('═'.repeat(70));
      console.log(`✅ Sent: ${successCount}`);
      console.log(`❌ Failed: ${failureCount}`);
      console.log(`📊 Total: ${applications.length}\n`);

      if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(err => {
          console.log(`  • ${err.name} (${err.email}): ${err.error}`);
        });
      }

      console.log('\n');
    } else {
      console.log('\n❌ Invalid choice. Exiting.\n');
    }

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();

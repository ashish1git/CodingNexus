/**
 * Bulk Email Script - Send Custom Emails to All Students
 * 
 * Usage:
 * node send-bulk-email-to-students.mjs
 * 
 * Features:
 * - Send to all students or filter by batch
 * - Custom subject and message
 * - HTML email support
 * - Progress tracking
 * - Error handling
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

console.log('\n📧 Bulk Email System - Send to All Students');
console.log('═'.repeat(60) + '\n');

async function main() {
  try {
    // Step 1: Get all students or filter by batch
    console.log('📊 Fetching students from database...\n');
    
    const filterChoice = await question('Filter by batch? (y/n): ');
    let students;
    
    if (filterChoice.toLowerCase() === 'y') {
      const batch = await question('Enter batch (e.g., Basic, Python, Web, Advanced): ');
      students = await prisma.user.findMany({
        where: {
          role: 'student',
          isActive: true,
          studentProfile: {
            batch: {
              equals: batch.toLowerCase(),
              mode: 'insensitive'
            }
          }
        },
        include: {
          studentProfile: true
        },
        orderBy: {
          email: 'asc'
        }
      });
      console.log(`\n✅ Found ${students.length} students in ${batch} batch\n`);
    } else {
      students = await prisma.user.findMany({
        where: {
          role: 'student',
          isActive: true
        },
        include: {
          studentProfile: true
        },
        orderBy: {
          email: 'asc'
        }
      });
      console.log(`\n✅ Found ${students.length} total active students\n`);
    }

    if (students.length === 0) {
      console.log('❌ No students found with the specified criteria.');
      rl.close();
      return;
    }

    // Step 2: Preview recipients
    console.log('📋 Recipients Preview (first 10):');
    console.log('─'.repeat(60));
    students.slice(0, 10).forEach((student, index) => {
      const name = student.studentProfile?.name || 'Unknown';
      const batch = student.studentProfile?.batch || 'N/A';
      console.log(`${(index + 1).toString().padStart(2)}. ${name.padEnd(25)} | ${student.email.padEnd(35)} | ${batch}`);
    });
    if (students.length > 10) {
      console.log(`    ... and ${students.length - 10} more students`);
    }
    console.log('─'.repeat(60) + '\n');

    // Step 3: Get email subject
    const subject = await question('Enter email subject: ');
    if (!subject.trim()) {
      console.log('❌ Subject cannot be empty!');
      rl.close();
      return;
    }

    // Step 4: Get email message
    console.log('\nEnter email message (HTML supported):');
    console.log('(Type your message and press Enter twice when done)\n');
    
    let message = '';
    let emptyLines = 0;
    
    const messageInput = () => new Promise((resolve) => {
      const inputListener = (line) => {
        if (line === '') {
          emptyLines++;
          if (emptyLines >= 2) {
            rl.removeListener('line', inputListener);
            resolve();
          }
        } else {
          emptyLines = 0;
          message += line + '\n';
        }
      };
      rl.on('line', inputListener);
    });

    await messageInput();

    if (!message.trim()) {
      console.log('❌ Message cannot be empty!');
      rl.close();
      return;
    }

    // Step 5: Confirm before sending
    console.log('\n📧 Email Preview:');
    console.log('═'.repeat(60));
    console.log(`Subject: ${subject}`);
    console.log(`Recipients: ${students.length} students`);
    console.log(`Message Preview:\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}`);
    console.log('═'.repeat(60) + '\n');

    const confirm = await question('Send this email to all recipients? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Email sending cancelled.');
      rl.close();
      return;
    }

    // Step 6: Send emails
    console.log('\n📤 Sending emails...\n');
    console.log('─'.repeat(60));

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const name = student.studentProfile?.name || 'Student';
      const email = student.email;

      process.stdout.write(`[${i + 1}/${students.length}] Sending to ${email.padEnd(35)} ... `);

      try {
        // Create HTML email with student name personalization
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
              }
              .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 10px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content { 
                padding: 30px; 
              }
              .greeting {
                font-size: 18px;
                color: #667eea;
                margin-bottom: 15px;
              }
              .message {
                white-space: pre-wrap;
                line-height: 1.8;
              }
              .footer { 
                background: #f5f5f5; 
                padding: 20px; 
                text-align: center; 
                color: #666; 
                font-size: 14px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Coding Nexus</h1>
              </div>
              <div class="content">
                <p class="greeting">Hello ${name},</p>
                <div class="message">${message}</div>
                <p style="margin-top: 30px;">Best regards,<br><strong>Coding Nexus Team</strong></p>
              </div>
              <div class="footer">
                <p>© 2026 Coding Nexus. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const result = await sendEmail({
          to: email,
          subject: subject,
          html: htmlContent,
          text: `Hello ${name},\n\n${message}\n\nBest regards,\nCoding Nexus Team`
        });

        if (result.success) {
          console.log('✅ SUCCESS');
          successCount++;
        } else {
          console.log(`❌ FAILED: ${result.error}`);
          failureCount++;
          errors.push({ email, error: result.error });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        failureCount++;
        errors.push({ email, error: error.message });
      }
    }

    // Step 7: Summary
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Email Sending Summary\n');
    console.log(`   Total Recipients: ${students.length}`);
    console.log(`   ✅ Successfully Sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   Success Rate: ${((successCount / students.length) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n❌ Failed Emails:');
      errors.forEach(({ email, error }) => {
        console.log(`   • ${email}: ${error}`);
      });
    }

    console.log('\n✅ Bulk email operation completed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();

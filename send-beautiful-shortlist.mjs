#!/usr/bin/env node
/**
 * Send Beautiful Interview Shortlist Email
 * Fetches applicant name from database and sends personalized email
 */

import 'dotenv/config';
import prisma from './server/config/db.js';
import { sendEmail } from './server/services/email/brevo.service.js';

const beautifulEmailTemplate = (applicantName) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Shortlisted! - Coding Nexus</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    
    .header-icon {
      font-size: 60px;
      margin-bottom: 15px;
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: -0.5px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 500;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    .greeting {
      font-size: 18px;
      color: #2c3e50;
      margin-bottom: 25px;
      font-weight: 600;
    }
    
    .message {
      font-size: 16px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 30px;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-left: 4px solid #667eea;
      padding: 25px;
      border-radius: 10px;
      margin: 30px 0;
    }
    
    .highlight-box h3 {
      color: #667eea;
      font-size: 16px;
      margin-bottom: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .highlight-box p {
      color: #2c3e50;
      font-size: 15px;
      margin-bottom: 10px;
      font-weight: 500;
    }
    
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
    }
    
    .info-item {
      text-align: center;
    }
    
    .info-label {
      font-size: 13px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    
    .info-value {
      font-size: 16px;
      color: #667eea;
      font-weight: 700;
    }
    
    .checklist {
      list-style: none;
      margin: 25px 0;
    }
    
    .checklist li {
      padding: 12px 0;
      padding-left: 35px;
      position: relative;
      color: #555;
      font-size: 15px;
      line-height: 1.6;
    }
    
    .checklist li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-size: 20px;
      font-weight: bold;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin-top: 25px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
      transition: transform 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
    }
    
    .coming-soon {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      font-size: 15px;
      color: #856404;
    }
    
    .coming-soon strong {
      color: #ff9800;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    
    .footer-text {
      font-size: 14px;
      color: #999;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    
    .footer-links {
      margin-top: 20px;
      font-size: 13px;
    }
    
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 15px;
      font-weight: 600;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">🎉</div>
      <h1>You're Shortlisted!</h1>
      <p>Congratulations on your selection</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="greeting">Hey ${applicantName}! 👋</p>
      
      <p class="message">
        We're thrilled to let you know that <strong>you've been shortlisted</strong> for the <strong>Coding Nexus Team Interview!</strong>
      </p>
      
      <p class="message">
        Your application impressed us, and we'd love to get to know you better. Let's dive in and have a great conversation about your coding journey!
      </p>
      
      <!-- Interview Details -->
      <div class="highlight-box">
        <h3>📅 Interview Details</h3>
        <p><strong>Format:</strong> Q&A Round</p>
        <p><strong>Duration:</strong> ~30-45 minutes</p>
        <p><strong>Time & Venue:</strong> Coming soon via email!</p>
      </div>
      
      <!-- Coming Soon -->
      <div class="coming-soon">
        <strong>⏰ Keep your eyes on your inbox!</strong> We'll send you the exact interview time and venue details via an email very soon. No stress – just be ready to have a great chat with us! 😊
      </div>
      
      <!-- What to Know -->
      <div class="message">
        <strong>What to expect:</strong>
      </div>
      <ul class="checklist">
        <li>Casual conversation about your coding journey</li>
        <li>Discussion on your projects and interests</li>
        <li>Questions about why you want to join Coding Nexus</li>
        <li>Q&A – feel free to ask us anything!</li>
      </ul>
      
      <!-- Just chill vibes -->
      <div class="message">
        <strong>Pro tip:</strong> Just be yourself and have fun! There's no trick questions here – we genuinely want to know you and your passion for coding. 🚀
      </div>
      
      <!-- CTA -->
      <a href="https://codingnexus.apsit.edu.in" class="cta-button">Visit Coding Nexus</a>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="logo">Coding Nexus</div>
      <p class="footer-text">APSIT Coding Competition & Community</p>
      <p class="footer-text">See you soon at the interview! 💻</p>
      
      <div class="footer-links">
        <a href="https://codingnexus.apsit.edu.in">Website</a>
        <a href="mailto:ashishapsit@gmail.com">Contact</a>
      </div>
      
      <p class="footer-text" style="margin-top: 20px; font-size: 12px; color: #ccc;">
        © 2026 Coding Nexus. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

async function sendShortlistEmail(email) {
  try {
    console.log('\n📧 Interview Shortlist Email - Beautiful Template');
    console.log('═'.repeat(65) + '\n');

    // Fetch applicant from database
    console.log(`🔍 Fetching applicant details for: ${email}`);
    
    const application = await prisma.teamApplication.findFirst({
      where: {
        email: email.toLowerCase()
      },
      select: {
        fullName: true,
        email: true
      }
    });

    if (!application) {
      console.log('\n❌ ERROR: No applicant found with this email!\n');
      console.log(`Email: ${email}`);
      await prisma.$disconnect();
      process.exit(1);
    }

    const applicantName = application.fullName;
    console.log(`✅ Found: ${applicantName} (${email})\n`);

    console.log('📤 Sending beautiful email...\n');

    const result = await sendEmail({
      to: email,
      subject: `🎉 You're Shortlisted! Coding Nexus Team Interview`,
      html: beautifulEmailTemplate(applicantName),
      text: `Hi ${applicantName},\n\nCongratulations! You've been shortlisted for the Coding Nexus Team Interview!\n\nWe'll be sending you the interview time and venue details via email very soon.\n\nExpect a Q&A round where we'll have a casual conversation about your coding journey.\n\nJust be yourself and have fun!\n\nBest regards,\nCoding Nexus Team`
    });

    if (result.success) {
      console.log('✅ SUCCESS! Email sent with flying colors!\n');
      console.log('📬 Details:');
      console.log(`   ✓ To: ${applicantName} (${email})`);
      console.log(`   ✓ Subject: 🎉 You're Shortlisted! Coding Nexus Team Interview`);
      console.log(`   ✓ Message ID: ${result.messageId}\n`);
      console.log('🌟 Beautiful HTML template with:');
      console.log('   ✓ Animated gradient header');
      console.log('   ✓ Professional styling');
      console.log('   ✓ Q&A round description');
      console.log('   ✓ "Coming soon" notice for time & venue');
      console.log('   ✓ Chill, friendly vibes\n');
    } else {
      console.log('❌ FAILED! Could not send email\n');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${result.details}`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Send to specified email
const targetEmail = '23106031@apsit.edu.in';
sendShortlistEmail(targetEmail);

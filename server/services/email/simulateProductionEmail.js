/**
 * Production Email Simulation
 * 
 * Shows what the email will look like in production
 */

import dotenv from 'dotenv';

dotenv.config();

// Simulate production environmentss
process.env.NODE_ENV = 'production';

import { sendEventRegistrationEmail } from './brevo.service.js';

console.log('\n🌐 Production Email Simulation');
console.log('=============================\n');
console.log('Environment: production');
console.log(`Backend: Render deployment`);
console.log(`Frontend: https://codingnexus.vercel.app\n`);

console.log('─'.repeat(60) + '\n');

// Simulate a production event registration
const productionEvent = {
  id: 'evt-prod-001',
  title: 'Advanced Data Structures & Algorithms',
  eventDate: new Date('2026-03-15T10:00:00'),
  eventEndDate: new Date('2026-03-15T16:00:00'),
  venue: 'APSIT Main Auditorium, Nerul, Navi Mumbai 400706',
  eventType: 'Workshop',
  description: 'Master advanced data structures, algorithms optimization, and problem-solving techniques used in competitive programming and technical interviews. This comprehensive workshop covers linked lists, trees, graphs, dynamic programming, and more.'
};

const productionParticipant = {
  id: 'part-prod-001',
  name: 'Student User',
  email: 'sumit13thakur124@gmail.com'
};

console.log('📨 Test Event Registration Email (Production Version)\n');
console.log(`Event: ${productionEvent.title}`);
console.log(`Date: ${productionEvent.eventDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
console.log(`Participant: ${productionParticipant.name}`);
console.log(`Email: ${productionParticipant.email}\n`);

console.log('📧 Sending production test email...\n');

const result = await sendEventRegistrationEmail(productionEvent, productionParticipant);

if (result.success) {
  console.log('✅ Production email sent successfully!\n');
  console.log(`Message ID: ${result.messageId}`);
  console.log(`Timestamp: ${result.timestamp}`);
  console.log('\n📬 Email includes:');
  console.log('  ✅ Event title: Advanced Data Structures & Algorithms');
  console.log('  ✅ Event date: 15/3/2026, 10:00 AM (IST)');
  console.log('  ✅ Event venue: APSIT Main Auditorium');
  console.log('  ✅ Event type: Workshop');
  console.log('  ✅ Event description: Full description');
  console.log('  ✅ Participant name: Student User');
  console.log('  ✅ Participant email: sumit13thakur124@gmail.com');
  console.log(`  ✅ Portal link: https://codingnexus.vercel.app 🔗`);
  console.log(`  ✅ Sender: Coding Nexus <noreply@codingnexus.apsit.edu.in>`);
  console.log('\n🎉 Production deployment ready!\n');
} else {
  console.log(`❌ Failed: ${result.error}`);
}

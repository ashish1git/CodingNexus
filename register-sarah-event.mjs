import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Try different connection strings
const connectionStrings = [
  process.env.DATABASE_URL,
  'postgresql://sumit:sumit123@127.0.0.1:5432/sumitdb',
  'postgresql://sumit:sumit123@localhost:5432/sumitdb',
];

let pool = null;

async function testConnection(connString) {
  try {
    const testPool = new pg.Pool({ 
      connectionString: connString,
      ssl: connString.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    await testPool.query('SELECT 1');
    testPool.end();
    return true;
  } catch (e) {
    return false;
  }
}

async function registerSarah() {
  try {
    // Find working connection
    console.log('🔍 Finding database connection...');
    let connStr = null;
    for (const cs of connectionStrings) {
      if (cs && await testConnection(cs)) {
        connStr = cs;
        console.log('✅ Connected to database');
        break;
      }
    }

    if (!connStr) {
      console.error('❌ Could not connect to database with any connection string');
      return;
    }

    pool = new pg.Pool({ 
      connectionString: connStr,
      ssl: connStr.includes('render.com') ? { rejectUnauthorized: false } : false
    });

    // 1. Find the "Career Blue Print" event
    console.log('\n🔍 Searching for "Career Blue Print" event...');
    const eventResult = await pool.query(`
      SELECT id, title, "maxParticipants", "registrationDeadline", status
      FROM "Event"
      WHERE LOWER(title) LIKE LOWER('%Career Blue Print%')
      LIMIT 1
    `);

    if (eventResult.rows.length === 0) {
      console.error('❌ Event "Career Blue Print" not found');
      
      // List available events
      const allEvents = await pool.query(`
        SELECT id, title, status, "eventDate", "registrationDeadline"
        FROM "Event"
        WHERE "isActive" = true
        ORDER BY "eventDate" DESC
        LIMIT 10
      `);
      
      console.log('\n📋 Available active events:');
      allEvents.rows.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.title} (${e.status})`);
      });
      return;
    }

    const event = eventResult.rows[0];
    console.log(`✅ Event found: "${event.title}"`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Status: ${event.status}`);

    // 2. Check if EventParticipant exists for Sarah Mathew
    console.log('\n🔍 Searching for Sarah Mathew in EventParticipant...');
    
    let participantResult = await pool.query(`
      SELECT id, email, name, phone, branch, division
      FROM "EventParticipant"
      WHERE LOWER(name) LIKE LOWER('%Sarah%Mathew%') OR LOWER(name) LIKE LOWER('%Mathew%Sarah%')
    `);

    let participant = null;
    let isNew = false;

    if (participantResult.rows.length > 0) {
      participant = participantResult.rows[0];
      console.log(`✅ Found existing participant: ${participant.name}`);
      console.log(`   Email: ${participant.email}`);
      
      // Update participant details
      console.log('\n📝 Updating participant details...');
      await pool.query(`
        UPDATE "EventParticipant"
        SET 
          phone = $1,
          branch = $2,
          division = $3,
          "updatedAt" = NOW()
        WHERE id = $4
      `, ['9082445007', 'CSE AIML', 'H', participant.id]);
      
      console.log('✅ Details updated');
    } else {
      console.log('ℹ️  No existing participant found, creating new one...');
      isNew = true;

      // Generate random password and hash it
      const randomPassword = uuidv4().substring(0, 16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create EventParticipant
      const createResult = await pool.query(`
        INSERT INTO "EventParticipant" (
          name, email, phone, branch, division, 
          password, "userType", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'event_guest', true, NOW(), NOW()
        )
        RETURNING id, email, name
      `, [
        'Sarah Mathew',
        'sarah.mathew@student.com',
        '9082445007',
        'CSE AIML',
        'H'
      ]);

      participant = createResult.rows[0];
      console.log('✅ New EventParticipant created');
      console.log(`   ID: ${participant.id}`);
      console.log(`   Email: ${participant.email}`);
    }

    // 3. Check if already registered
    console.log('\n🔍 Checking for existing registration...');
    
    const regCheckResult = await pool.query(`
      SELECT id, "registrationStatus"
      FROM "EventRegistration"
      WHERE "eventId" = $1 AND "participantId" = $2
    `, [event.id, participant.id]);

    if (regCheckResult.rows.length > 0) {
      console.log('⚠️  Already registered for this event');
      console.log(`   Registration ID: ${regCheckResult.rows[0].id}`);
      console.log(`   Status: ${regCheckResult.rows[0].registrationStatus}`);
    } else {
      // 4. Create registration
      console.log('\n📝 Creating registration...');
      
      const regResult = await pool.query(`
        INSERT INTO "EventRegistration" (
          id, "eventId", "participantId", "registrationStatus", 
          "attendanceMarked", "certificateGenerated", 
          "certificateApprovedByAdmin", "quizAttended",
          "registrationDate"
        ) VALUES (
          gen_random_uuid(), $1, $2, 'confirmed', false, false, false, false, NOW()
        )
        RETURNING id, "registrationStatus", "registrationDate"
      `, [event.id, participant.id]);

      const registration = regResult.rows[0];
      console.log('✅ Registration created successfully!');
      console.log(`   Registration ID: ${registration.id}`);
      console.log(`   Status: ${registration.registrationStatus}`);
      console.log(`   Registered At: ${registration.registrationDate}`);
    }

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ REGISTRATION COMPLETED');
    console.log('='.repeat(60));
    console.log('\n📋 Registration Details:');
    console.log(`   Event: ${event.title}`);
    console.log(`   Student: Sarah Mathew`);
    console.log(`   Division: H`);
    console.log(`   Branch: CSE AIML`);
    console.log(`   Phone: 9082445007`);
    console.log(`   Status: CONFIRMED`);
    console.log(`   Email: ${participant.email}`);
    console.log('\n✅ Sarah can now login to view the event!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Details:', error.detail);
    if (error.code) console.error('   Code:', error.code);
  } finally {
    if (pool) await pool.end();
  }
}

registerSarah();

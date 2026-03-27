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

async function registerStudent(studentName, moodleId, division, branch, phone) {
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
      return;
    }

    const event = eventResult.rows[0];
    console.log(`✅ Event found: "${event.title}"`);

    // 2. Check if EventParticipant exists
    console.log(`\n🔍 Searching for ${studentName} in EventParticipant...`);
    
    let participantResult = await pool.query(`
      SELECT id, email, name, phone, branch, division
      FROM "EventParticipant"
      WHERE LOWER(name) LIKE LOWER($1) OR "moodleId" = $2
    `, [`%${studentName}%`, moodleId]);

    let participant = null;

    if (participantResult.rows.length > 0) {
      participant = participantResult.rows[0];
      console.log(`✅ Found existing participant: ${participant.name}`);
      
      // Update participant details
      console.log('\n📝 Updating participant details...');
      await pool.query(`
        UPDATE "EventParticipant"
        SET 
          phone = $1,
          branch = $2,
          division = $3,
          "moodleId" = $4,
          "updatedAt" = NOW()
        WHERE id = $5
      `, [phone, branch, division, moodleId, participant.id]);
      
      console.log('✅ Details updated');
    } else {
      console.log('ℹ️  No existing participant found, creating new one...');

      // Generate random password and hash it
      const randomPassword = uuidv4().substring(0, 16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create EventParticipant
      const createResult = await pool.query(`
        INSERT INTO "EventParticipant" (
          name, email, phone, branch, division, "moodleId",
          password, "userType", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'event_guest', true, NOW(), NOW()
        )
        RETURNING id, email, name
      `, [
        studentName,
        `${moodleId}@apsit.edu.in`,
        phone,
        branch,
        division,
        moodleId
      ]);

      participant = createResult.rows[0];
      console.log('✅ New EventParticipant created');
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
    }

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ REGISTRATION COMPLETED');
    console.log('='.repeat(60));
    console.log('\n📋 Registration Details:');
    console.log(`   Event: ${event.title}`);
    console.log(`   Student: ${studentName}`);
    console.log(`   Moodle ID: ${moodleId}`);
    console.log(`   Division: ${division}`);
    console.log(`   Branch: ${branch}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Status: CONFIRMED`);
    console.log(`   Email: ${participant.email}`);
    console.log('\n✅ Student can now login to view the event!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Details:', error.detail);
  } finally {
    if (pool) await pool.end();
  }
}

// Register Shravani Pande
registerStudent('Shravani Pande', '25106171', 'H', 'CSE(AIML)', '9082008029');

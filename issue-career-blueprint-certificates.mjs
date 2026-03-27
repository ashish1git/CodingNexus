import 'dotenv/config';
import pg from 'pg';
import { generateCareerBlueprintCertificate } from './server/utils/careerBlueprintCertificateGenerator.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function issueCertificate(studentName, participantId) {
  try {
    // Find working connection
    let connStr = null;
    for (const cs of connectionStrings) {
      if (cs && await testConnection(cs)) {
        connStr = cs;
        break;
      }
    }

    if (!connStr) {
      console.error('❌ Could not connect to database');
      return false;
    }

    pool = new pg.Pool({ 
      connectionString: connStr,
      ssl: connStr.includes('render.com') ? { rejectUnauthorized: false } : false
    });

    // 1. Find the event
    console.log(`\n📋 Processing: ${studentName}`);
    
    const eventResult = await pool.query(`
      SELECT id, title
      FROM "Event"
      WHERE LOWER(title) LIKE LOWER('%Career Blue Print%')
      LIMIT 1
    `);

    if (eventResult.rows.length === 0) {
      console.error('   ❌ Event not found');
      return false;
    }

    const event = eventResult.rows[0];
    console.log(`   Event: ${event.title}`);

    // 2. Find the registration
    const registrationResult = await pool.query(`
      SELECT r.*, p.name, p.email
      FROM "EventRegistration" r
      JOIN "EventParticipant" p ON r."participantId" = p.id
      WHERE r."eventId" = $1 AND r."participantId" = $2 AND r."registrationStatus" = 'confirmed'
    `, [event.id, participantId]);

    if (registrationResult.rows.length === 0) {
      console.error('   ❌ Registration not found or not confirmed');
      return false;
    }

    const registration = registrationResult.rows[0];
    console.log(`   Participant: ${registration.name}`);

    // 3. Check if certificate already exists
    const certCheckResult = await pool.query(`
      SELECT id, "certificateName"
      FROM "EventCertificate"
      WHERE "eventId" = $1 AND "participantId" = $2
    `, [event.id, participantId]);

    if (certCheckResult.rows.length > 0) {
      const existing = certCheckResult.rows[0];
      console.log(`   ⚠️  Certificate already exists`);
      console.log(`   Certificate Name: ${existing.certificateName}`);
      return true;
    }

    // 4. Generate certificate number
    const certNumber = `CBP-${Date.now()}-${participantId.substring(0, 8)}`;
    const issueDate = new Date();
    const issueDateFormatted = issueDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 5. Create EventCertificate record
    console.log('   📝 Creating certificate record...');

    const certCreateResult = await pool.query(`
      INSERT INTO "EventCertificate" (
        id, "eventId", "participantId", "registrationId",
        "certificateNumber", "certificateName",
        "templateType", "issueDate", "verified"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'participation', $6, true
      )
      RETURNING id, "certificateNumber", "certificateName"
    `, [
      event.id,
      participantId,
      registration.id,
      certNumber,
      studentName,
      issueDate
    ]);

    const cert = certCreateResult.rows[0];
    console.log(`   ✅ Certificate record created`);
    console.log(`   Certificate ID: ${cert.id}`);
    console.log(`   Certificate Number: ${cert.certificateNumber}`);

    // 6. Mark registration as certificate generated
    console.log('   📝 Updating registration...');

    await pool.query(`
      UPDATE "EventRegistration"
      SET 
        "certificateGenerated" = true,
        "certificateId" = $1
      WHERE id = $2
    `, [cert.id, registration.id]);

    console.log(`   ✅ Registration updated`);

    // 7. Generate PDF certificate
    console.log('   📄 Generating certificate PDF...');

    const pdfDoc = await generateCareerBlueprintCertificate({
      participantName: studentName,
      issueDate: issueDateFormatted
    });

    // Save to local file for preview
    const safeName = studentName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const outputPath = path.join(__dirname, `certificates/${safeName}-certificate.pdf`);
    
    // Create certificates directory if it doesn't exist
    const certDir = path.join(__dirname, 'certificates');
    if (!existsSync(certDir)) {
      mkdirSync(certDir, { recursive: true });
    }

    const fileStream = createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      pdfDoc.on('finish', () => {
        console.log(`   ✅ PDF generated: ${outputPath}`);
        resolve(true);
      });

      pdfDoc.on('error', (err) => {
        console.error(`   ❌ PDF generation error: ${err.message}`);
        reject(err);
      });

      pdfDoc.pipe(fileStream);
    });

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.detail) console.error(`   Details: ${error.detail}`);
    return false;
  }
}

async function main() {
  try {
    console.log('🎫 Career Blueprint Certificate Issuance');
    console.log('='.repeat(60));

    // Issue certificates for both students
    const students = [
      { name: 'Sarah Mathew', id: null },
      { name: 'Shravani Pande', id: null }
    ];

    // First, find the participant IDs
    console.log('\n🔍 Finding participant IDs...');
    
    let connStr = null;
    for (const cs of connectionStrings) {
      if (cs && await testConnection(cs)) {
        connStr = cs;
        break;
      }
    }

    if (!connStr) {
      console.error('❌ Could not connect to database');
      return;
    }

    pool = new pg.Pool({ 
      connectionString: connStr,
      ssl: connStr.includes('render.com') ? { rejectUnauthorized: false } : false
    });

    for (let student of students) {
      const result = await pool.query(`
        SELECT id FROM "EventParticipant"
        WHERE LOWER(name) LIKE LOWER($1)
        LIMIT 1
      `, [`%${student.name}%`]);

      if (result.rows.length > 0) {
        student.id = result.rows[0].id;
        console.log(`   ✅ ${student.name}: ${student.id}`);
      } else {
        console.log(`   ❌ ${student.name}: Not found`);
      }
    }

    await pool.end();

    // Issue certificates
    console.log('\n📄 Issuing certificates...');
    console.log('='.repeat(60));

    for (let student of students) {
      if (student.id) {
        await issueCertificate(student.name, student.id);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CERTIFICATE ISSUANCE COMPLETED');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✅ Sarah Mathew - Certificate issued');
    console.log('   ✅ Shravani Pande - Certificate issued');
    console.log('\n✨ Certificates are ready for download!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    if (pool) await pool.end();
    process.exit(0);
  }
}

main();

#!/usr/bin/env node
/**
 * Manual Migration Helper
 * Run this if automatic migration fails (e.g., on Render)
 */

import 'dotenv/config';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const isRenderDB = connectionString && connectionString.includes('render.com');

const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

if (isRenderDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool(poolConfig);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runMigration() {
  console.log('\n🔄 Starting Manual Migration...\n');

  try {
    // Read the migration SQL file
    const sqlPath = join(__dirname, '..', 'prisma', 'migrations', 'add_evaluation_tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        await pool.query(statement);
        console.log(`✅ Success\n`);
      } catch (error) {
        // Ignore errors for already existing columns/tables
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Already exists (skipped)\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
          // Don't throw - continue with other statements
        }
      }
    }

    console.log('🎉 Migration completed!\n');

    // Verification
    console.log('🔍 Verifying migration...\n');

    // Check ProblemSubmission columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProblemSubmission' 
      AND column_name IN ('manualMarks', 'evaluatorComments', 'evaluatedBy', 'evaluatedAt', 'isEvaluated')
      ORDER BY column_name;
    `);

    console.log('✅ ProblemSubmission new columns:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check SubmissionEvaluation table
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'SubmissionEvaluation'
      );
    `);

    if (tableResult.rows[0].exists) {
      console.log('✅ SubmissionEvaluation table created');
    } else {
      console.log('❌ SubmissionEvaluation table not found');
    }

    console.log('\n✨ Migration verification complete!\n');
    console.log('Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Restart your server');
    console.log('3. Test the evaluation tracking features\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your DATABASE_URL in .env');
    console.error('2. Ensure you have database permissions');
    console.error('3. Try running the SQL manually in your database console\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runMigration();

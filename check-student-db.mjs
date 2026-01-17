import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const isRenderDB = connectionString && connectionString.includes('render.com');

const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

if (isRenderDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool(poolConfig);

async function checkStudent() {
  try {
    const result = await pool.query(`
      SELECT s.*, u.email 
      FROM "Student" s 
      JOIN "User" u ON s."userId" = u.id 
      WHERE s."rollNo" = '23106025' OR s.name ILIKE '%Bhoir%'
    `);
    
    console.log('Student(s) found:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkStudent();

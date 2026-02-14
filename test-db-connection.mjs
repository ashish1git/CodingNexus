import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

console.log('🔍 Testing Database Connection...');
console.log('Connection URL:', connectionString ? connectionString.substring(0, 50) + '...' : 'NOT SET');

async function testConnection() {
  try {
    // Test 1: Raw PostgreSQL connection
    console.log('\n📝 Test 1: Raw PostgreSQL Connection');
    const pool = new pg.Pool({ connectionString });
    
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ PostgreSQL connected!');
    console.log('Server time:', result.rows[0].now);
    
    // Test 2: Prisma connection
    console.log('\n📝 Test 2: Prisma Client Connection');
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma connected!');
    
    // Test 3: Check if Judge0Queue table exists
    console.log('\n📝 Test 3: Judge0Queue Table');
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'Judge0Queue'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Judge0Queue table EXISTS');
      
      // Count existing records
      const count = await prisma.judge0Queue.count();
      console.log(`📊 Records in Judge0Queue: ${count}`);
    } else {
      console.log('❌ Judge0Queue table NOT FOUND');
    }
    
    // Test 4: List all tables
    console.log('\n📝 Test 4: All Tables');
    const allTables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    console.log('Tables in database:');
    allTables.forEach(t => console.log(`  - ${t.tablename}`));
    
    await prisma.$disconnect();
    console.log('\n✅ All database tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    process.exit(1);
  }
}

testConnection();

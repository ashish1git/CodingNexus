import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not set in .env file');
  process.exit(1);
}

// Render databases require SSL
const isRenderDB = connectionString.includes('render.com');

const poolConfig = { connectionString };
if (isRenderDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool(poolConfig);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin accounts...\n');
    
    const admins = await prisma.user.findMany({
      where: { role: { in: ['superadmin', 'admin'] } },
      select: { 
        email: true, 
        role: true, 
        adminProfile: { 
          select: { name: true } 
        } 
      }
    });
    
    console.log('=== Admin Accounts ===');
    if (admins.length === 0) {
      console.log('❌ No admin accounts found.');
      console.log('\n💡 To create an admin, run: npm run create-admin');
    } else {
      console.log(`✅ Found ${admins.length} admin account(s):\n`);
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.adminProfile?.name || 'N/A'}`);
        console.log(`   Role: ${admin.role}\n`);
      });
      console.log('🔒 (Passwords are hashed and cannot be displayed)');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('\n💡 Make sure DATABASE_URL is correct in .env file');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkAdmin();

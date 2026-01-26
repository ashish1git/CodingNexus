import 'dotenv/config';
import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const { PrismaClient } = prismaPkg;
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
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkStudent() {
  try {
    const userId = 'aa5f601a-d1f5-4f4a-b1b5-26325732d09a';
    
    console.log('Checking user and student profile...\n');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found!');
    } else {
      console.log('✅ User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Active:', user.isActive);
      console.log('\nStudent Profile:', user.studentProfile);
      
      if (user.studentProfile) {
        console.log('\n📋 Student Details:');
        console.log('- Name:', user.studentProfile.name);
        console.log('- Batch:', user.studentProfile.batch);
        console.log('- Roll No:', user.studentProfile.rollNo);
        console.log('- Phone:', user.studentProfile.phone);
      } else {
        console.log('\n❌ No student profile found!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();

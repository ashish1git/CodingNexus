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

async function checkQuizzes() {
  try {
    console.log('Checking quizzes in database...\n');
    
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total quizzes in DB: ${quizzes.length}\n`);
    
    if (quizzes.length === 0) {
      console.log('❌ No quizzes found in database!');
    } else {
      quizzes.forEach((q, i) => {
        console.log(`${i + 1}. ${q.title}`);
        console.log(`   - Batch: ${q.batch}`);
        console.log(`   - Duration: ${q.duration} minutes`);
        console.log(`   - Active: ${q.isActive}`);
        console.log(`   - Start: ${q.startTime}`);
        console.log(`   - End: ${q.endTime}`);
        console.log(`   - Questions: ${Array.isArray(q.questions) ? q.questions.length : 0}`);
        console.log('');
      });
    }
    
    // Also check students
    const students = await prisma.student.findMany({
      select: { name: true, batch: true }
    });
    
    console.log(`\nTotal students: ${students.length}`);
    const batches = [...new Set(students.map(s => s.batch))];
    console.log('Batches:', batches.join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuizzes();

#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
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

async function fixBatchIssue() {
  try {
    console.log('🔧 Fixing Batch Case Sensitivity Issue\n');
    
    // Get all quizzes
    const allQuizzes = await prisma.quiz.findMany();
    
    console.log(`Found ${allQuizzes.length} quizzes to check\n`);
    
    let updatedCount = 0;
    
    for (const quiz of allQuizzes) {
      // Check if batch starts with capital letter (like "Basic", "Advanced")
      if (quiz.batch && quiz.batch[0] === quiz.batch[0].toUpperCase() && quiz.batch !== 'All') {
        const newBatch = quiz.batch.toLowerCase();
        
        console.log(`📝 Updating quiz: "${quiz.title}"`);
        console.log(`   Batch: "${quiz.batch}" → "${newBatch}"`);
        
        await prisma.quiz.update({
          where: { id: quiz.id },
          data: { batch: newBatch }
        });
        
        updatedCount++;
        console.log(`   ✅ Updated\n`);
      }
    }
    
    console.log('='.repeat(60));
    console.log(`✅ Fixed ${updatedCount} quizzes with batch case issue\n`);
    
    // Verify the fix
    const sampleStudent = await prisma.student.findFirst();
    
    if (sampleStudent) {
      console.log(`🔍 Verification:`);
      console.log(`Student: ${sampleStudent.name}`);
      console.log(`Batch: "${sampleStudent.batch}"\n`);
      
      const visibleQuizzes = await prisma.quiz.findMany({
        where: {
          OR: [
            { batch: sampleStudent.batch },
            { batch: 'All' }
          ],
          isActive: true
        }
      });
      
      console.log(`✅ Now visible: ${visibleQuizzes.length} quizzes`);
      visibleQuizzes.forEach(q => console.log(`   - "${q.title}" (batch="${q.batch}")`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixBatchIssue();

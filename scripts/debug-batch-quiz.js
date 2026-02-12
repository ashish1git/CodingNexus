#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Parse connection string to add SSL if it's a Render database
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

async function debugBatchIssue() {
  try {
    console.log('🔍 Debugging Batch Issue\n');
    
    // Get all unique student batches
    const studentBatches = await prisma.student.findMany({
      select: { batch: true },
      distinct: ['batch']
    });
    
    console.log('📚 Student Batches:');
    studentBatches.forEach(s => console.log(`  - "${s.batch}"`));
    console.log();
    
    // Get count of students per batch
    const studentBatchCount = await prisma.student.groupBy({
      by: ['batch'],
      _count: { id: true }
    });
    
    console.log('👥 Student Count per Batch:');
    studentBatchCount.forEach(item => console.log(`  - "${item.batch}": ${item._count.id} students`));
    console.log();
    
    // Get all quizzes with their batches
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        batch: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎯 All Quizzes (${quizzes.length} total):`);
    quizzes.forEach(q => {
      console.log(`  - "${q.title}"`);
      console.log(`    Batch: "${q.batch}"`);
      console.log(`    Active: ${q.isActive}`);
      console.log(`    Created: ${q.createdAt.toISOString()}\n`);
    });
    
    // Check for batch matching issues
    console.log('\n⚙️ Batch Matching Check:');
    
    for (const quiz of quizzes) {
      const matchingStudents = await prisma.student.findMany({
        where: {
          OR: [
            { batch: quiz.batch },
            { batch: 'All' }
          ]
        },
        select: { id: true, name: true, batch: true },
        take: 3
      });
      
      console.log(`\n"${quiz.title}" (batch="${quiz.batch}")`);
      console.log(`  Matching students: ${matchingStudents.length}`);
      matchingStudents.forEach(s => console.log(`    - ${s.name} (batch="${s.batch}")`));
    }
    
    // Check a specific student
    console.log('\n\n🔎 Sample Student Quiz Query:');
    const sampleStudent = await prisma.student.findFirst();
    
    if (sampleStudent) {
      console.log(`\nStudent: ${sampleStudent.name}`);
      console.log(`Batch: "${sampleStudent.batch}"`);
      
      const visibleQuizzes = await prisma.quiz.findMany({
        where: {
          OR: [
            { batch: sampleStudent.batch },
            { batch: 'All' }
          ],
          isActive: true
        }
      });
      
      console.log(`Visible quizzes: ${visibleQuizzes.length}`);
      visibleQuizzes.forEach(q => console.log(`  - "${q.title}" (batch="${q.batch}")`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debugBatchIssue();

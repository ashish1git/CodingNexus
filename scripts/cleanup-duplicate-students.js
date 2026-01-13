#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

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

const MOODLE_IDS = ['23106069', '23106092', '23106062', '23106104'];
const DEFAULT_PASSWORD = '123456';
const DEFAULT_BATCH = '2024';

async function cleanupAndRecreateStudents() {
  console.log('\n=== Cleanup & Recreate Duplicate Students ===\n');
  console.log('Target Moodle IDs:', MOODLE_IDS.join(', '));
  
  try {
    let userCounter = 1;
    
    for (const moodleId of MOODLE_IDS) {
      console.log(`\n📌 Processing Moodle ID: ${moodleId}`);
      
      // Find all users with this moodle ID
      const users = await prisma.user.findMany({
        where: { moodleId },
        include: { studentProfile: true }
      });
      
      if (users.length === 0) {
        console.log(`   ℹ️  No records found for this Moodle ID`);
        continue;
      }
      
      console.log(`   Found ${users.length} record(s)`);
      
      if (users.length > 1) {
        console.log(`   ⚠️  Multiple entries found! Deleting duplicates...`);
        
        // Delete all old entries
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          try {
            await prisma.user.delete({
              where: { id: user.id }
            });
            console.log(`      ✓ Deleted: ${user.email}`);
          } catch (err) {
            console.log(`      ✗ Error deleting ${user.email}: ${err.message}`);
          }
        }
      } else {
        // Single entry exists, delete it to recreate fresh
        const user = users[0];
        try {
          await prisma.user.delete({
            where: { id: user.id }
          });
          console.log(`   ✓ Deleted old entry: ${user.email}`);
        } catch (err) {
          console.log(`   ✗ Error deleting: ${err.message}`);
        }
      }
      
      // Now create fresh entry with user1, user2, etc.
      const username = `user${userCounter}`;
      const email = `${username}@student.mu.ac.in`;
      const studentName = `Student ${userCounter} (${moodleId})`;
      
      try {
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'student',
            moodleId,
            isActive: true,
            studentProfile: {
              create: {
                name: studentName,
                batch: DEFAULT_BATCH,
                rollNo: moodleId,
                phone: null,
                profilePhotoUrl: null
              }
            }
          },
          include: {
            studentProfile: true
          }
        });
        
        console.log(`   ✅ Created fresh entry:`);
        console.log(`      Username: ${username}`);
        console.log(`      Email: ${email}`);
        console.log(`      Password: ${DEFAULT_PASSWORD}`);
        console.log(`      Moodle ID: ${moodleId}`);
        
        userCounter++;
      } catch (error) {
        console.log(`   ❌ Error creating new entry: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Cleanup and recreation completed!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

cleanupAndRecreateStudents();

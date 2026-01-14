#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { parseString } from 'xml2js';

// Parse connection string to add SSL if it's a Render database
const connectionString = process.env.DATABASE_URL;
const isRenderDB = connectionString && connectionString.includes('render.com');

// Create PostgreSQL pool with SSL for Render
const poolConfig = {
  connectionString: process.env.DATABASE_URL
};

// Add SSL only for Render databases
if (isRenderDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool(poolConfig);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default values for students
const DEFAULT_PASSWORD = '123456'; // All students will have this password initially
const DEFAULT_BATCH = '2024'; // Default batch
const DEFAULT_ROLE = 'student';

async function parseXMLFile(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { 
      explicitArray: false,
      mergeAttrs: true,
      ignoreAttrs: false
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function extractStudentsFromXML(xmlData) {
  const students = [];
  
  try {
    // Navigate through the namespace-prefixed structure
    const workbook = xmlData.Workbook;
    const worksheet = workbook['ss:Worksheet'] || workbook.Worksheet;
    const table = worksheet.Table;
    let rows = table.Row;
    
    // Ensure rows is an array
    if (!Array.isArray(rows)) {
      rows = [rows];
    }
    
    // Skip header row (first row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Check if row has cells
      let cells = row.Cell;
      if (!cells) {
        continue;
      }
      
      // Ensure cells is an array
      if (!Array.isArray(cells)) {
        cells = [cells];
      }
      
      if (cells.length < 2) {
        continue;
      }
      
      // Extract Moodle ID and Name
      let moodleId = null;
      let name = null;
      
      // Get first cell (Moodle ID) - handle both Data._ and direct text
      const cell0 = cells[0];
      if (cell0 && cell0.Data) {
        const data = cell0.Data;
        if (typeof data === 'string') {
          moodleId = data.trim();
        } else if (data._ !== undefined) {
          moodleId = data._.toString().trim();
        } else if (data[0] !== undefined) {
          moodleId = data[0].toString().trim();
        }
      }
      
      // Get second cell (Name)
      const cell1 = cells[1];
      if (cell1 && cell1.Data) {
        const data = cell1.Data;
        if (typeof data === 'string') {
          name = data.trim();
        } else if (data._ !== undefined) {
          name = data._.toString().trim();
        } else if (data[0] !== undefined) {
          name = data[0].toString().trim();
        }
      }
      
      if (moodleId && name) {
        students.push({ moodleId, name });
      }
    }
  } catch (error) {
    console.error('Error parsing XML structure:', error.message);
  }
  
  return students;
}

async function createStudent(moodleId, name, password) {
  try {
    // Generate email from moodle ID
    const email = `${moodleId}@student.mu.ac.in`;
    
    // Check if student already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { moodleId }
        ]
      }
    });
    
    if (existing) {
      console.log(`⚠️  Skipping ${name} (${moodleId}) - Already exists`);
      return { success: false, reason: 'already_exists' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create student user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: DEFAULT_ROLE,
        moodleId,
        isActive: true,
        studentProfile: {
          create: {
            name,
            batch: DEFAULT_BATCH,
            rollNo: moodleId, // Use moodleId as roll number
            phone: null, // Can be updated later
            profilePhotoUrl: null // Can be updated later
          }
        }
      },
      include: {
        studentProfile: true
      }
    });
    
    console.log(`✅ Created: ${name} (${moodleId}) - ${email}`);
    return { success: true, user };
  } catch (error) {
    console.error(`❌ Error creating ${name} (${moodleId}):`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

async function importStudents() {
  console.log('\n=== Import Students from XML ===\n');
  
  const xmlFilePath = 'users (1).xml';
  
  try {
    // Check if file exists
    if (!fs.existsSync(xmlFilePath)) {
      console.error(`File not found: ${xmlFilePath}`);
      console.error('Please make sure "users (1).xml" exists in the project root.');
      process.exit(1);
    }
    
    console.log(`📂 Reading file: ${xmlFilePath}`);
    
    // Parse XML
    const xmlData = await parseXMLFile(xmlFilePath);
    const students = extractStudentsFromXML(xmlData);
    
    console.log(`\n📊 Found ${students.length} students in XML file\n`);
    console.log(`Default settings:`);
    console.log(`   - Password: ${DEFAULT_PASSWORD}`);
    console.log(`   - Batch: ${DEFAULT_BATCH}`);
    console.log(`   - Email format: {moodleId}@student.mu.ac.in`);
    console.log(`   - Status: Active\n`);
    
    // Import students
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      const result = await createStudent(student.moodleId, student.name, DEFAULT_PASSWORD);
      
      if (result.success) {
        successCount++;
      } else if (result.reason === 'already_exists') {
        skipCount++;
      } else {
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 Import Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully created: ${successCount} students`);
    console.log(`⚠️  Skipped (already exist): ${skipCount} students`);
    console.log(`❌ Failed: ${errorCount} students`);
    console.log(`📊 Total processed: ${students.length} students`);
    console.log('='.repeat(50) + '\n');
    
    if (successCount > 0) {
      console.log('🎉 Students created successfully!');
      console.log(`   Default password for all students: ${DEFAULT_PASSWORD}`);
      console.log('   Students can login with their email and change their password later.\n');
    }
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the import
importStudents();

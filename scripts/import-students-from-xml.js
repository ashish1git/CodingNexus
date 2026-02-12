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
import xlsx from 'xlsx';

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
const DEFAULT_BATCH = 'basic'; // Default batch
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

async function activateExistingStudents() {
  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Get all students with moodleId
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'student',
        moodleId: { not: null }
      },
      select: {
        id: true,
        email: true,
        moodleId: true,
        isActive: true,
        studentProfile: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (allStudents.length === 0) {
      return { activated: 0 };
    }
    
    // Update all students to be active with default password and batch
    const updatePromises = allStudents.map(student =>
      prisma.user.update({
        where: { id: student.id },
        data: {
          isActive: true,
          password: hashedPassword,
          studentProfile: student.studentProfile ? {
            update: {
              batch: DEFAULT_BATCH
            }
          } : undefined
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    return { activated: allStudents.length, students: allStudents };
  } catch (error) {
    console.error('Error activating existing students:', error.message);
    return { activated: 0, error: error.message };
  }
}

function findUsersFile() {
  const possibleFiles = ['users.ods', 'users.xlsx', 'users.xls', 'users.xml', 'users (1).xml'];
  
  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      return file;
    }
  }
  
  return null;
}

function extractStudentsFromSpreadsheet(filePath) {
  const students = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header row, start from index 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length < 2) continue;
      
      let moodleId = (row[0] || '').toString().trim();
      let name = (row[1] || '').toString().trim();
      
      if (moodleId && name) {
        students.push({ moodleId, name });
      }
    }
  } catch (error) {
    console.error('Error parsing spreadsheet:', error.message);
  }
  
  return students;
}

async function importStudents() {
  console.log('\n=== Import & Activate All Students ===\n');
  
  const usersFile = findUsersFile();
  
  if (!usersFile) {
    console.error('❌ No users file found!');
    console.error('Please add one of these files to the project root:');
    console.error('   - users.xml');
    console.error('   - users.ods');
    console.error('   - users.xlsx');
    process.exit(1);
  }
  
  console.log(`📂 Found file: ${usersFile}\n`);
  
  let students = [];
  
  try {
    // Parse different file formats
    if (usersFile.endsWith('.xml')) {
      const xmlData = await parseXMLFile(usersFile);
      students = extractStudentsFromXML(xmlData);
    } else {
      // Handle .ods and .xlsx/.xls files
      students = extractStudentsFromSpreadsheet(usersFile);
    }
    
    console.log(`📊 Found ${students.length} students in file\n`);
    
    if (students.length === 0) {
      console.log('⚠️  No students found in file. Please check the file format.');
      process.exit(0);
    }
    
    console.log(`Default settings:`);
    console.log(`   - Password: ${DEFAULT_PASSWORD}`);
    console.log(`   - Batch: ${DEFAULT_BATCH}`);
    console.log(`   - Email format: {moodleId}@student.mu.ac.in`);
    console.log(`   - Status: ACTIVATED\n`);
    
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
    
    // Activate all existing students too
    console.log('\n🔄 Activating all existing students...\n');
    const activationResult = await activateExistingStudents();
    
    if (activationResult.students && activationResult.students.length > 0) {
      console.log(`✅ Activated ${activationResult.activated} students by Moodle ID:\n`);
      activationResult.students.forEach((student, index) => {
        console.log(`   ${index + 1}. Moodle ID: ${student.moodleId} | Email: ${student.email}`);
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Import & Activation Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} new students`);
    console.log(`⚠️  Skipped (already exist): ${skipCount} students`);
    console.log(`🔓 Activated total: ${activationResult.activated} students`);
    console.log(`❌ Failed: ${errorCount} students`);
    console.log(`📊 Total processed from file: ${students.length}`);
    console.log('='.repeat(60) + '\n');
    
    if (successCount > 0 || activationResult.activated > 0) {
      console.log('🎉 Operation completed successfully!');
      console.log(`   ✅ Default password for all students: ${DEFAULT_PASSWORD}`);
      console.log(`   ✅ All students activated and can login!\n`);
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

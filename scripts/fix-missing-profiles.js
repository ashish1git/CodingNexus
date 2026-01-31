// Script to find and fix students missing their profile records
import prisma from '../server/config/db.js';

async function findMissingProfiles() {
  console.log('🔍 Finding students without profiles...\n');

  // Find all users with role 'student' who don't have a studentProfile
  const studentsWithoutProfile = await prisma.user.findMany({
    where: {
      role: 'student',
      studentProfile: null
    },
    select: {
      id: true,
      email: true,
      moodleId: true,
      isActive: true,
      createdAt: true
    }
  });

  if (studentsWithoutProfile.length === 0) {
    console.log('✅ All students have profiles!');
    return;
  }

  console.log(`❌ Found ${studentsWithoutProfile.length} students WITHOUT profiles:\n`);
  
  for (const student of studentsWithoutProfile) {
    console.log(`  - ${student.email} (Moodle ID: ${student.moodleId || 'N/A'})`);
  }

  console.log('\n📝 Creating missing profiles...\n');

  for (const student of studentsWithoutProfile) {
    // Extract name from email (e.g., 23106031@student.mu.ac.in -> Student 23106031)
    const moodleId = student.moodleId || student.email.split('@')[0];
    const name = `Student ${moodleId}`;

    try {
      await prisma.student.create({
        data: {
          userId: student.id,
          name: name,
          batch: 'Basic', // Default batch - admin can update later
          phone: null,
          rollNo: moodleId
        }
      });
      console.log(`  ✅ Created profile for ${student.email} (Name: ${name})`);
    } catch (error) {
      console.error(`  ❌ Failed to create profile for ${student.email}:`, error.message);
    }
  }

  console.log('\n✅ Done! Students can now update their profiles or admin can edit them.');
}

async function listAllStudents() {
  console.log('\n📋 All students in database:\n');

  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: { studentProfile: true },
    orderBy: { email: 'asc' }
  });

  for (const student of students) {
    const hasProfile = !!student.studentProfile;
    const status = hasProfile ? '✅' : '❌';
    const name = student.studentProfile?.name || 'NO PROFILE';
    const batch = student.studentProfile?.batch || 'N/A';
    
    console.log(`${status} ${student.email.padEnd(35)} | Name: ${name.padEnd(25)} | Batch: ${batch}`);
  }

  console.log(`\nTotal: ${students.length} students`);
  console.log(`With profiles: ${students.filter(s => s.studentProfile).length}`);
  console.log(`Without profiles: ${students.filter(s => !s.studentProfile).length}`);
}

async function main() {
  try {
    await listAllStudents();
    await findMissingProfiles();
    await listAllStudents();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

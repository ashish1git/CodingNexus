import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudent() {
  try {
    // Check by roll number
    const student = await prisma.student.findFirst({
      where: { rollNo: '23106025' },
      include: { user: { select: { email: true, id: true } } }
    });
    
    console.log('Student found by rollNo:', JSON.stringify(student, null, 2));
    
    // Also check by name
    const studentByName = await prisma.student.findFirst({
      where: { 
        name: { contains: 'Bhoir', mode: 'insensitive' }
      },
      include: { user: { select: { email: true, id: true } } }
    });
    
    console.log('\nStudent found by name:', JSON.stringify(studentByName, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();

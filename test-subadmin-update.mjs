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

async function testUpdate() {
  try {
    console.log('=== Testing Sub-Admin Permission Update ===\n');

    // Get the first sub-admin
    const firstSubAdmin = await prisma.user.findFirst({
      where: { role: 'subadmin' },
      include: { adminProfile: true }
    });

    if (!firstSubAdmin) {
      console.log('No sub-admin found');
      return;
    }

    console.log(`Testing with User ID: ${firstSubAdmin.id}`);
    console.log(`Admin Name: ${firstSubAdmin.adminProfile.name}`);
    console.log(`Current Permissions: ${firstSubAdmin.adminProfile.permissions}\n`);

    // Simulate what the backend does
    const userId = firstSubAdmin.id;
    const newPermissions = {
      manageStudents: true,
      manageNotes: true,
      manageAnnouncements: true,
      markAttendance: true,
      createQuizzes: true,
      viewTickets: true,
      respondTickets: true
    };

    console.log('Step 1: Finding admin profile...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (user.role !== 'subadmin') {
      console.log('❌ User is not a sub-admin');
      return;
    }

    if (!user.adminProfile) {
      console.log('❌ Admin profile not found');
      return;
    }

    console.log('✅ User and admin profile found\n');

    console.log('Step 2: Updating permissions...');
    const updated = await prisma.admin.update({
      where: { userId },
      data: { 
        permissions: JSON.stringify(newPermissions)
      }
    });

    console.log('✅ Update successful');
    console.log(`Updated Admin ID: ${updated.id}`);
    console.log(`New Permissions: ${updated.permissions}\n`);

    // Verify the update
    console.log('Step 3: Verifying update...');
    const verified = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true }
    });

    console.log('✅ Verification complete');
    console.log(`New Permissions in DB: ${verified.adminProfile.permissions}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull Error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();

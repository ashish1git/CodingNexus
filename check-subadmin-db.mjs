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

async function checkSubAdminData() {
  try {
    console.log('=== Checking Sub-Admin Data ===\n');

    // Get all sub-admins
    const subAdmins = await prisma.user.findMany({
      where: { role: 'subadmin' },
      include: { adminProfile: true }
    });

    console.log(`Found ${subAdmins.length} sub-admin users\n`);

    if (subAdmins.length === 0) {
      console.log('No sub-admins found in database');
      return;
    }

    subAdmins.forEach((user, index) => {
      console.log(`\n--- Sub-Admin ${index + 1} ---`);
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Has Admin Profile: ${!!user.adminProfile}`);
      
      if (user.adminProfile) {
        console.log(`Admin ID: ${user.adminProfile.id}`);
        console.log(`Admin Name: ${user.adminProfile.name}`);
        console.log(`Admin userId: ${user.adminProfile.userId}`);
        console.log(`Permissions: ${user.adminProfile.permissions}`);
        console.log(`Created By: ${user.adminProfile.createdBy}`);
      }
    });

    // Test what the GET endpoint would return
    console.log('\n=== GET Endpoint Response Format ===\n');
    const response = subAdmins.map(u => ({
      id: u.id,
      userId: u.id,
      adminId: u.adminProfile?.id,
      email: u.email,
      name: u.adminProfile?.name,
      permissions: u.adminProfile?.permissions ? 
        (u.adminProfile.permissions === 'all' ? 'all' : JSON.parse(u.adminProfile.permissions)) 
        : 'all'
    }));

    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubAdminData();

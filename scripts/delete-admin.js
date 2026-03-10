#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import readline from 'readline';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, (answer) => {
  resolve(String(answer).trim());
}));

async function deleteAdmin() {
  try {
    console.log('\n=== Delete Admin ===\n');

    const email = await question('Admin Email to delete: ');

    if (!email) {
      console.error('❌ Email is required!');
      process.exit(1);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { adminProfile: true }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`\n⚠️  About to delete:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.adminProfile?.name}`);
    console.log(`   Role: ${user.role}`);

    const confirm = await question('\n❓ Are you sure? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }

    // Delete admin profile first (foreign key constraint)
    if (user.adminProfile) {
      await prisma.adminProfile.delete({
        where: { userId: user.id }
      });
    }

    // Then delete user
    await prisma.user.delete({
      where: { email }
    });

    console.log(`\n✅ Admin deleted successfully!\n`);
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    rl.close();
  }
}

deleteAdmin();

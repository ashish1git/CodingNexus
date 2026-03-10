#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, (answer) => {
  resolve(String(answer).trim());
}));

async function createAdmin() {
  try {
    console.log('\n=== Create Super Admin ===\n');

    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Password: ');

    if (!name || !email || !password) {
      console.error('❌ All fields are required!');
      process.exit(1);
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      console.error('❌ Invalid input types!');
      process.exit(1);
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        adminProfile: {
          create: {
            name,
            permissions: 'all'
          }
        }
      },
      include: {
        adminProfile: true
      }
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.adminProfile.name}`);
    console.log(`   Role: ${user.role}\n`);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    rl.close();
  }
}

createAdmin();

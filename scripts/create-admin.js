#!/usr/bin/env node
import 'dotenv/config';
import process from 'process';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    console.log('\n=== Create Super Admin ===\n');

    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Password: ');

    if (!name || !email || !password) {
      console.error('All fields are required!');
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.error(`User with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
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
    console.error('Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    rl.close();
  }
}

createAdmin();

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
const prisma = new PrismaClient({ adapter });

export default prisma;

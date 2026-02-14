import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Load from parent directory if not already loaded
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');
config({ path: envPath });

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Checked paths: .env, ../../.env');
  process.exit(1);
}

console.log('📡 Initializing Database Connection Pool...');

// Create PostgreSQL pool with conservative settings for free-tier databases
// These settings prevent connection exhaustion on Render/Neon free tier
const pool = new pg.Pool({
  connectionString,
  max: 5,  // REDUCED: Render free tier = 5 concurrent connections
  idleTimeoutMillis: 10000,  // Release unused connections quickly
  connectionTimeoutMillis: 3000,  // Fail fast on connection issues
  maxUses: 100,  // Recycle connections to prevent stale connections
});

// Handle pool errors gracefully without crashing
pool.on('error', (error) => {
  console.warn('⚠️  Pool error (non-critical):', error.message);
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Connection retry configuration
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

// Initialize Prisma Client with error handling
const prisma = new PrismaClient({
  adapter,
  log: [] // Disable logging to reduce load
});

// Verify connection with retries
async function verifyConnection() {
  for (let i = 0; i < maxConnectionAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectionAttempts = 0;
      console.log('✅ Database connection verified');
      return true;
    } catch (error) {
      connectionAttempts++;
      console.warn(`⚠️  Connection attempt ${i + 1}/${maxConnectionAttempts} failed`);
      
      if (i < maxConnectionAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  console.warn('⚠️  Database connection unavailable - server will continue');
  return false;
}

// Test connection on startup but don't block server
verifyConnection().catch(() => {
  console.warn('⚠️  Initial connection check failed');
});

// Export health check function for health endpoints
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date() 
    };
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM - closing database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT - closing database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

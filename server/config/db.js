import 'dotenv/config';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Try .env.docker first (production), fallback to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFiles = ['.env.docker', '.env'];
for (const file of envFiles) {
  const p = path.resolve(process.cwd(), file);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

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
  min: 1,  // Keep at least 1 connection active
  idleTimeoutMillis: 30000,  // Release unused connections after 30 seconds (was 10s - too aggressive)
  connectionTimeoutMillis: 5000,  // Increase timeout to handle slower connections
  statement_timeout: 30000,  // 30 second timeout for queries
  application_name: 'coding-nexus-server',  // Identify connections in database logs
});

// Handle pool errors with recovery logic
let poolErrorCount = 0;
pool.on('error', (error, client) => {
  poolErrorCount++;
  // Log the error but don't block server
  if (error.message.includes('Connection terminated')) {
    console.warn(`⚠️  Connection closed (${poolErrorCount} occurrences):`, error.message);
  } else {
    console.warn('⚠️  Pool error (non-critical):', error.message);
  }
  
  // NOTE: Do NOT manually release the client here!
  // pg-pool handles connection cleanup internally
  // Manual release causes "double-release" errors
});

// Reset error counter after 60 seconds of no errors
setInterval(() => {
  poolErrorCount = 0;
}, 60000);

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

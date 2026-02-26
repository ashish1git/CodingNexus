import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import competitionRoutes from './routes/competition.js';
import contestRoutes from './routes/contest.js';
import certificateRoutes from './routes/certificate.js';
import asyncSubmissionRoutes, { checkPendingSubmissions } from './routes/async-submissions.js';
import eventRoutes from './routes/events.js';
import prisma from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 21000;

// Test database connection on startup (don't await - run async)
testDatabaseConnection();

function testDatabaseConnection() {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      console.error('Server will continue but database operations will fail');
    });
}
//chetan ashish sumit Aachal dhruv love

// CORS configuration - allow all origins for now
// Middleware
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Maintenance Mode Middleware
app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      success: false,
      status: 503,
      message: 'Service Unavailable',
      detail: 'We are currently under scheduled maintenance. Please try again soon.',
      estimatedTime: '24-48 hours'
    });
  }
  next();
});

// 🔍 DEBUG LOGGING: Log ALL API requests
app.use('/api', (req, res, next) => {
  console.log(`\n📨 [API REQUEST] ${req.method} ${req.path}`);
  console.log('   Competition path:', req.path.includes('/competitions'));
  console.log('   Execute-test:', req.path.includes('/execute-test'));
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/contest', contestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/submissions', asyncSubmissionRoutes);  // ✅ NEW: Async submissions
app.use('/api/events', eventRoutes);  // ✅ NEW: Event management

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Server is listening and will stay alive...`);
  
  // ✅ OPTIONAL Background polling job - disabled by default on free tier
  // Set ENABLE_POLLING=true in .env to enable
  const pollingEnabled = process.env.ENABLE_POLLING === 'true';
  
  if (!pollingEnabled) {
    console.log('⏸️  Polling job disabled (set ENABLE_POLLING=true to enable)');
    console.log('   Submissions will still work - results will be fetched on-demand');
    return;
  }
  
  // Only enable polling if explicitly configured (for paid tier)
  const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '15000', 10); // Default 15 seconds, more conservative
  console.log(`⏱️  Background polling job configured (${POLL_INTERVAL}ms intervals)`);
  
  // Wait 2 seconds before starting polling to ensure database is ready
  setTimeout(() => {
    console.log('🎯 Starting background polling job...');
    
    setInterval(async () => {
      try {
        await checkPendingSubmissions();
      } catch (error) {
        console.error('❌ Background job error:', error.message);
        // Continue running - don't crash
      }
    }, POLL_INTERVAL);
  }, 2000);
});

server.on('error', (error) => {
  console.error('🚨 Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

console.log(`✅ Server initialization complete - process will stay alive`);


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep server running
});

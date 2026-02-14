import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import competitionRoutes from './routes/competition.js';
import contestRoutes from './routes/contest.js';
import certificateRoutes from './routes/certificate.js';
import asyncSubmissionRoutes, { checkPendingSubmissions } from './routes/async-submissions.js';
import prisma from './config/db.js';

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

// CORS configuration - support multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/contest', contestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/submissions', asyncSubmissionRoutes);  // ✅ NEW: Async submissions

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep server running
});

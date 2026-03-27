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
import codeRoutes from './routes/code.js';
import teamApplicationsRoutes from './routes/team-applications.js';
import guestRoutes from './routes/guest.js';
import prisma from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use('/api/submissions', asyncSubmissionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/team-applications', teamApplicationsRoutes);
app.use('/api/guest', guestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const distPath = path.join(__dirname, '../dist');
const docsDistPath = path.join(distPath, 'docs');

// Serve docs on same frontend port at /docs and /api/docs
if (process.env.MAINTENANCE_MODE !== 'true') {
  app.get('/api/docs', (req, res, next) => {
    const docsIndexPath = path.join(docsDistPath, 'index.html');
    res.sendFile(docsIndexPath, (err) => {
      if (err) next();
    });
  });

  app.use('/api/docs', express.static(docsDistPath, {
    index: false,
    fallthrough: true
  }));

  app.get('/api/docs/*path', (req, res, next) => {
    const docsIndexPath = path.join(docsDistPath, 'index.html');
    res.sendFile(docsIndexPath, (err) => {
      if (err) next();
    });
  });

  app.get('/docs', (req, res, next) => {
    const docsIndexPath = path.join(docsDistPath, 'index.html');
    res.sendFile(docsIndexPath, (err) => {
      if (err) next();
    });
  });

  app.use('/docs', express.static(docsDistPath, {
    index: false,
    fallthrough: true
  }));

  // Docs SPA fallback for nested docs routes
  app.get('/docs/*path', (req, res, next) => {
    const docsIndexPath = path.join(docsDistPath, 'index.html');
    res.sendFile(docsIndexPath, (err) => {
      if (err) next();
    });
  });
}

// Serve frontend static files
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get('/*path', (req, res, next) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
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

  const pollingEnabled = process.env.ENABLE_POLLING === 'true';

  if (!pollingEnabled) {
    console.log('⏸️  Polling job disabled (set ENABLE_POLLING=true to enable)');
    console.log('   Submissions will still work - results will be fetched on-demand');
    return;
  }

  const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '15000', 10);
  console.log(`⏱️  Background polling job configured (${POLL_INTERVAL}ms intervals)`);

  setTimeout(() => {
    console.log('🎯 Starting background polling job...');

    setInterval(async () => {
      try {
        await checkPendingSubmissions();
      } catch (error) {
        console.error('❌ Background job error:', error.message);
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

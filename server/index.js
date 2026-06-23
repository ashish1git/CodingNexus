import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
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
import recruitmentRoutes from './routes/recruitment.js';
import guestRoutes from './routes/guest.js';
import aptitudeRoutes from './routes/aptitude.js';
import aptitudeQuestionRoutes from './routes/aptitude/questions.js';
import aptitudeAiRoutes from './routes/aptitude/aiQuestions.js';
import aptitudePracticeRoutes from './routes/aptitude/practice.js';
import aptitudeCompetitionRoutes from './routes/aptitude/competition.js';
import prisma from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

testDatabaseConnection();

function testDatabaseConnection() {
  prisma.$connect()
    .then(() => {
      logger.ok('Database connected successfully');
    })
    .catch((error) => {
      logger.error('Database connection failed:', error.message);
      logger.error('Server will continue but database operations will fail');
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
  logger.apiRequest(req);
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
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/aptitude/ai-questions', aptitudeAiRoutes);
app.use('/api/aptitude/practice', aptitudePracticeRoutes);
app.use('/api/aptitude/competition', aptitudeCompetitionRoutes);
app.use('/api/aptitude/questions', aptitudeQuestionRoutes);
app.use('/api/aptitude', aptitudeRoutes);

// Health check & server time
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/timer', (req, res) => {
  res.json({ serverTime: new Date().toISOString() });
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
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const server = app.listen(PORT, () => {
  logger.ok(`Server running on port ${PORT}`);

  const pollingEnabled = process.env.ENABLE_POLLING === 'true';

  if (!pollingEnabled) {
    logger.info('Polling job disabled (set ENABLE_POLLING=true to enable)');
    return;
  }

  const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '15000', 10);
  logger.info(`Background polling job configured (${POLL_INTERVAL}ms intervals)`);

  setTimeout(() => {
    logger.info('Starting background polling job...');

    setInterval(async () => {
      try {
        await checkPendingSubmissions();
      } catch (error) {
        logger.error('Background job error:', error.message);
      }
    }, POLL_INTERVAL);
  }, 2000);
});

server.on('error', (error) => {
  logger.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

logger.ok('Server initialization complete');

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

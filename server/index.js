import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
// competitionRoutes removed — handled by competition-service on port 3001 (routed via Nginx)
import contestRoutes from './routes/contest.js';
import certificateRoutes from './routes/certificate.js';
import asyncSubmissionRoutes, { checkPendingSubmissions } from './routes/async-submissions.js';
import eventRoutes from './routes/events.js';
import codeRoutes from './routes/code.js';
import teamApplicationsRoutes from './routes/team-applications.js';
import recruitmentRoutes from './routes/recruitment.js';
import monitoringRoutes from './routes/monitoring.js';
import guestRoutes from './routes/guest.js';
import aptitudeRoutes from './routes/aptitude.js';
import dsaRoutes from './routes/dsa.js';
import dsaSheetRoutes from './routes/dsa-sheet.js';
import aptitudeQuestionRoutes from './routes/aptitude/questions.js';
import aptitudeAiRoutes from './routes/aptitude/aiQuestions.js';
import aptitudePracticeRoutes from './routes/aptitude/practice.js';
import aptitudeCompetitionRoutes from './routes/aptitude/competition.js';
import prisma from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Lecture reminder intervals (label -> ms before lecture)
const LECTURE_REMINDER_INTERVALS = [
  { label: '14hr', ms: 14 * 60 * 60 * 1000 },
  { label: '2hr',  ms: 2 * 60 * 60 * 1000 },
  { label: '1hr',  ms: 1 * 60 * 60 * 1000 },
  { label: '30min', ms: 30 * 60 * 1000 },
];

const REMINDER_CHECK_MS = 60 * 1000; // Check every 1 minute

async function sendLectureReminders() {
  try {
    const { sendEmail } = await import('./services/email/brevo.service.js');
    const now = new Date();

    const upcomingLectures = await prisma.dsaLecture.findMany({
      where: {
        status: 'scheduled',
        lectureDate: { gte: now },
        trainer: { isActive: true }
      },
      include: {
        trainer: {
          include: {
            admin: {
              include: { user: { select: { email: true } } }
            }
          }
        }
      }
    });

    for (const lecture of upcomingLectures) {
      const trainerEmail = lecture.trainer?.admin?.user?.email;
      const trainerName = lecture.trainer?.admin?.name;
      if (!trainerEmail) continue;

      const lectureTime = new Date(lecture.lectureDate);
      if (lecture.startTime) {
        const [h, m] = lecture.startTime.split(':').map(Number);
        lectureTime.setHours(h || 0, m || 0, 0, 0);
      }
      const diffMs = lectureTime.getTime() - now.getTime();
      if (diffMs <= 0) continue;

      const sentReminders = lecture.reminderSent ? lecture.reminderSent.split(',') : [];

      let changed = false;
      for (const interval of LECTURE_REMINDER_INTERVALS) {
        if (sentReminders.includes(interval.label)) continue;

        // Fire all unsent reminders whose threshold has been crossed
        if (diffMs <= interval.ms) {
          const dateStr = lecture.lectureDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = lecture.startTime || 'scheduled time';
          const notesMsg = lecture.notesRequired
            ? 'Please ensure your lecture notes are uploaded and approved before the lecture.'
            : 'Notes are not required for this lecture.';

          try {
            const descHtml = lecture.description ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-top:10px;"><p style="margin:0;font-size:12px;color:#475569;white-space:pre-wrap;font-family:monospace;">${lecture.description.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>` : '';
            const descText = lecture.description ? `\nDescription:\n${lecture.description}` : '';
            await sendEmail({
              to: trainerEmail,
              subject: `⏰ Reminder: "${lecture.topic}" in ${interval.label.replace('hr',' hours').replace('min',' minutes')}`,
              html: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;">
                <h2 style="color:#4f46e5;">Lecture Reminder</h2>
                <p>Hi <strong>${trainerName}</strong>,</p>
                <p>You have a DSA lecture coming up:</p>
                <div style="background:#eef2ff;border-left:4px solid #4f46e5;padding:15px;margin:20px 0;border-radius:4px;">
                  <p style="margin:0;"><strong>Topic:</strong> ${lecture.topic}</p>
                  <p style="margin:8px 0 0 0;"><strong>Date:</strong> ${dateStr}</p>
                  <p style="margin:8px 0 0 0;"><strong>Time:</strong> ${timeStr}</p>
                  ${lecture.batch ? `<p style="margin:8px 0 0 0;"><strong>Batch:</strong> ${lecture.batch}</p>` : ''}
                  ${lecture.division ? `<p style="margin:8px 0 0 0;"><strong>Division:</strong> ${lecture.division}</p>` : ''}
                </div>
                ${descHtml}
                <p style="margin-top:16px;">${notesMsg}</p>
                <a href="https://codingnexus.apsit.edu.in/admin/dashboard" style="display:inline-block;background:#4f46e5;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">Go to DSA Management</a>
                <p style="margin-top:24px;color:#666;font-size:14px;">Best regards,<br/>Coding Nexus Admin</p>
              </div>`,
              text: `Lecture Reminder\n\nHi ${trainerName},\n\nYou have a DSA lecture on ${dateStr} at ${timeStr}.\nTopic: ${lecture.topic}${lecture.batch ? `\nBatch: ${lecture.batch}` : ''}${lecture.division ? `\nDivision: ${lecture.division}` : ''}${descText}\n\n${notesMsg}\n\nBest regards,\nCoding Nexus Admin`
            });

            sentReminders.push(interval.label);
            changed = true;
          } catch (emailErr) {
            console.error(`Failed to send ${interval.label} reminder for lecture ${lecture.id}:`, emailErr.message);
          }
        }
      }
      if (changed) {
        await prisma.dsaLecture.update({
          where: { id: lecture.id },
          data: { reminderSent: sentReminders.join(',') }
        });
      }
    }
  } catch (err) {
    console.error('Lecture reminder job error:', err.message);
  }
}

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

// Forward /api/competitions → competition-service (port 3001)
const COMPETITION_SERVICE_URL = process.env.COMPETITION_SERVICE_URL || 'http://127.0.0.1:3001';
app.use('/api/competitions', async (req, res) => {
  try {
    const targetUrl = `${COMPETITION_SERVICE_URL}${req.originalUrl}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      validateStatus: () => true
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('[Proxy -> competition-service] Error:', error.message);
    res.status(502).json({ error: 'Failed to connect to competition service' });
  }
});

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
app.use('/api/admin/dsa', dsaRoutes);
app.use('/api/student/dsa-sheet', dsaSheetRoutes);
app.use('/api/admin/monitoring', monitoringRoutes);

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

// Helper: serve index.html with API URL meta tag injected
const serveIndexWithApiUrl = (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  const apiUrl = process.env.VITE_API_URL || (req.protocol + '://' + req.get('host') + '/api');
  const metaTag = `<meta name="api-url" content="${apiUrl}">`;
  html = html.replace('<head>', `<head>\n    ${metaTag}`);
  res.send(html);
};

// Serve frontend static files (but NOT index.html directly — we inject meta tag)
app.use(express.static(distPath, { index: false }));

// Serve root with injected API URL
app.get('/', (req, res) => {
  try { serveIndexWithApiUrl(req, res); } catch (err) { res.status(500).send('Server error'); }
});

// SPA fallback — serve index.html for all non-API routes, inject API URL meta
app.get('/*path', (req, res) => {
  try { serveIndexWithApiUrl(req, res); } catch (err) { res.status(500).send('Server error'); }
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

  // Lecture reminder: check every minute
  setInterval(() => {
    sendLectureReminders().catch(err => logger.error('Reminder job error:', err.message));
  }, REMINDER_CHECK_MS);
  logger.info(`DSA lecture reminder job started (checking every ${REMINDER_CHECK_MS / 1000}s)`);

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

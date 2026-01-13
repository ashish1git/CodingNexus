import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import upload, { uploadToCloudinary } from '../middleware/upload.js';

const router = express.Router();

// All routes require student authentication
router.use(authenticate);
router.use(authorizeRole('student'));

// ============ NOTES ============

// Get notes for student's batch
router.get('/notes', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ]
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ QUIZZES ============

// Get quizzes for student's batch
router.get('/quizzes', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ],
        isActive: true
      },
      orderBy: { startTime: 'desc' }
    });

    res.json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz by ID
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit quiz attempt
router.post('/quizzes/:id/attempt', async (req, res) => {
  try {
    const { answers, score, maxScore } = req.body;
    const quizId = req.params.id;

    // Check if already attempted
    const existing = await prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz already attempted' 
      });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: req.user.id,
        answers,
        score,
        maxScore,
        submittedAt: new Date()
      }
    });

    res.json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quiz attempt
router.get('/quizzes/:id/attempt', async (req, res) => {
  try {
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId: req.params.id,
          userId: req.user.id
        }
      }
    });

    res.json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all quiz attempts for current student
router.get('/quiz-attempts', async (req, res) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user.id },
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            duration: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ATTENDANCE ============

// Get student's attendance
router.get('/attendance', async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANNOUNCEMENTS ============

// Get announcements for student's batch
router.get('/announcements', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { batch: student.batch },
          { batch: 'All' }
        ],
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SUPPORT TICKETS ============

// Create ticket
router.post('/tickets', async (req, res) => {
  try {
    const { subject, message, priority } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        priority: priority || 'normal'
      }
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ PROFILE ============

// Upload profile photo
router.post('/profile/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'codingnexus/profiles');

    // Update student profile with new photo URL
    await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        profilePhotoUrl: result.secure_url
      }
    });

    res.json({
      success: true,
      profilePhotoUrl: result.secure_url
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, profilePhotoUrl } = req.body;

    await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        name,
        phone,
        profilePhotoUrl
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

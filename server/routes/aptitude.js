import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Derive status from startTime / endTime.
// If no schedule is set the test is treated as always ongoing (backward compat).
function getTestStatus(test) {
  if (!test.startTime || !test.endTime) return 'ongoing';
  const now = new Date();
  if (now < new Date(test.startTime)) return 'upcoming';
  if (now > new Date(test.endTime)) return 'ended';
  return 'ongoing';
}

// ────────────────────────────────────────────────────────────
// Student Routes (authenticated, any role)
// ────────────────────────────────────────────────────────────

// GET /api/aptitude — list active tests (with status)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    const where = { isActive: true };
    if (category && category !== 'all') where.category = category;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;

    const tests = await prisma.aptitudeTest.findMany({
      where,
      include: {
        _count: { select: { questions: true, attempts: true } },
        attempts: {
          where: { userId: req.user.id },
          select: { id: true, score: true, maxScore: true, submittedAt: true },
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = tests.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
      duration: t.duration,
      startTime: t.startTime,
      endTime: t.endTime,
      status: getTestStatus(t),
      questionCount: t._count.questions,
      totalAttempts: t._count.attempts,
      myBestAttempt: t.attempts[0] || null
    }));

    res.json({ success: true, tests: enriched });
  } catch (error) {
    console.error('Get aptitude tests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch aptitude tests' });
  }
});

// GET /api/aptitude/:id — get single test (questions without correct answers)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const test = await prisma.aptitudeTest.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            orderIndex: true
            // correctOption NOT included — hidden from student during test
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    const status = getTestStatus(test);
    if (status === 'upcoming') {
      return res.status(403).json({ success: false, error: 'Test has not started yet', status: 'upcoming', startTime: test.startTime });
    }
    if (status === 'ended') {
      return res.status(403).json({ success: false, error: 'Test window has ended', status: 'ended' });
    }

    res.json({
      success: true,
      test: {
        ...test,
        startTime: test.startTime,
        endTime: test.endTime,
        status
      }
    });
  } catch (error) {
    console.error('Get aptitude test error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch test' });
  }
});

// POST /api/aptitude/:id/submit — submit answers
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    const test = await prisma.aptitudeTest.findUnique({
      where: { id: req.params.id, isActive: true },
      include: { questions: true }
    });

    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    // Block submission after window closes
    if (test.endTime && new Date() > new Date(test.endTime)) {
      return res.status(403).json({ success: false, error: 'Test window has ended — submission not accepted' });
    }

    // Calculate score
    let score = 0;
    const maxScore = test.questions.length;
    const detailedResults = test.questions.map(q => {
      const selected = answers?.[q.id] || null;
      const isCorrect = selected === q.correctOption;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selected,
        correctOption: q.correctOption,
        explanation: q.explanation,
        isCorrect
      };
    });

    const attempt = await prisma.aptitudeAttempt.create({
      data: {
        testId: req.params.id,
        userId: req.user.id,
        answers: answers || {},
        score,
        maxScore,
        timeTaken: timeTaken || 0,
        submittedAt: new Date()
      }
    });

    res.json({
      success: true,
      attempt: {
        id: attempt.id,
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt,
        results: detailedResults
      }
    });
  } catch (error) {
    console.error('Submit aptitude attempt error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit attempt' });
  }
});

// GET /api/aptitude/:id/my-attempts — student's own attempts for a test
router.get('/:id/my-attempts', authenticate, async (req, res) => {
  try {
    const attempts = await prisma.aptitudeAttempt.findMany({
      where: { testId: req.params.id, userId: req.user.id },
      orderBy: { startedAt: 'desc' }
    });

    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attempts' });
  }
});

// GET /api/aptitude/:id/leaderboard — top scores for a test
router.get('/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const allAttempts = await prisma.aptitudeAttempt.findMany({
      where: { testId: req.params.id, submittedAt: { not: null } },
      include: {
        user: {
          select: {
            id: true,
            studentProfile: { select: { name: true, batch: true, rollNo: true } }
          }
        }
      },
      orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }]
    });

    // Keep only best attempt per user
    const seen = new Set();
    const leaderboard = [];
    for (const attempt of allAttempts) {
      if (!seen.has(attempt.userId)) {
        seen.add(attempt.userId);
        leaderboard.push({
          rank: leaderboard.length + 1,
          userId: attempt.userId,
          name: attempt.user.studentProfile?.name || 'Unknown',
          batch: attempt.user.studentProfile?.batch || '-',
          rollNo: attempt.user.studentProfile?.rollNo || '-',
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: Math.round((attempt.score / attempt.maxScore) * 100),
          timeTaken: attempt.timeTaken
        });
      }
      if (leaderboard.length >= 50) break;
    }

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// ────────────────────────────────────────────────────────────
// Admin Routes
// ────────────────────────────────────────────────────────────

// GET /api/aptitude/admin/all — all tests (including inactive), with status
router.get('/admin/all', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const tests = await prisma.aptitudeTest.findMany({
      include: {
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = tests.map(t => ({
      ...t,
      status: getTestStatus(t)
    }));

    res.json({ success: true, tests: enriched });
  } catch (error) {
    console.error('Admin get tests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tests' });
  }
});

// GET /api/aptitude/admin/:id — full test with correct answers
router.get('/admin/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const test = await prisma.aptitudeTest.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { attempts: true } }
      }
    });

    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    res.json({ success: true, test: { ...test, status: getTestStatus(test) } });
  } catch (error) {
    console.error('Admin get test error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch test' });
  }
});

// POST /api/aptitude/admin — create test with questions
router.post('/admin', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, startTime, endTime, questions } = req.body;

    if (!title || !duration || !questions?.length) {
      return res.status(400).json({ success: false, error: 'title, duration and at least one question are required' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'startTime and endTime are required' });
    }
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: false, error: 'endTime must be after startTime' });
    }

    const test = await prisma.aptitudeTest.create({
      data: {
        title,
        description: description || '',
        category: category || 'general',
        difficulty: difficulty || 'medium',
        duration: Number(duration),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdBy: req.user.id,
        questions: {
          create: questions.map((q, idx) => ({
            question: q.question,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation || null,
            orderIndex: idx
          }))
        }
      },
      include: { questions: true, _count: { select: { questions: true } } }
    });

    res.status(201).json({ success: true, test: { ...test, status: getTestStatus(test) }, message: 'Test created successfully' });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ success: false, error: 'Failed to create test' });
  }
});

// PUT /api/aptitude/admin/:id — update test metadata + replace questions
router.put('/admin/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, startTime, endTime, isActive, questions } = req.body;

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: false, error: 'endTime must be after startTime' });
    }

    await prisma.aptitudeTest.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(difficulty !== undefined && { difficulty }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // If questions provided, replace all
    if (questions && Array.isArray(questions)) {
      await prisma.aptitudeQuestion.deleteMany({ where: { testId: req.params.id } });
      await prisma.aptitudeQuestion.createMany({
        data: questions.map((q, idx) => ({
          testId: req.params.id,
          question: q.question,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || null,
          orderIndex: idx
        }))
      });
    }

    const updated = await prisma.aptitudeTest.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { orderIndex: 'asc' } }, _count: { select: { questions: true } } }
    });

    res.json({ success: true, test: { ...updated, status: getTestStatus(updated) }, message: 'Test updated successfully' });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ success: false, error: 'Failed to update test' });
  }
});

// DELETE /api/aptitude/admin/:id — delete test
router.delete('/admin/:id', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    await prisma.aptitudeTest.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete test' });
  }
});

// GET /api/aptitude/admin/:id/submissions — all attempts for a test
router.get('/admin/:id/submissions', authenticate, authorizeRole('admin', 'subadmin', 'superadmin'), async (req, res) => {
  try {
    const attempts = await prisma.aptitudeAttempt.findMany({
      where: { testId: req.params.id, submittedAt: { not: null } },
      include: {
        user: {
          select: {
            id: true,
            studentProfile: { select: { name: true, batch: true, rollNo: true } }
          }
        }
      },
      orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }]
    });

    const formatted = attempts.map((a, idx) => ({
      rank: idx + 1,
      attemptId: a.id,
      userId: a.userId,
      name: a.user.studentProfile?.name || 'Unknown',
      batch: a.user.studentProfile?.batch || '-',
      rollNo: a.user.studentProfile?.rollNo || '-',
      score: a.score,
      maxScore: a.maxScore,
      percentage: Math.round((a.score / a.maxScore) * 100),
      timeTaken: a.timeTaken,
      submittedAt: a.submittedAt
    }));

    res.json({ success: true, submissions: formatted });
  } catch (error) {
    console.error('Admin get submissions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

export default router;

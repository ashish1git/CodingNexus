import express from 'express';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole('student'));

// GET /progress — returns completed & bookmarked problem IDs for the student
router.get('/progress', async (req, res) => {
  try {
    const records = await prisma.dsaProblem.findMany({
      where: { studentId: req.user.id },
      select: { problemId: true, completed: true, bookmarked: true, completedAt: true },
    });

    const completed = [];
    const bookmarked = [];
    const completedDates = {};
    for (const r of records) {
      if (r.completed) {
        completed.push(r.problemId);
        if (r.completedAt) completedDates[r.problemId] = r.completedAt;
      }
      if (r.bookmarked) bookmarked.push(r.problemId);
    }

    res.json({ success: true, data: { completed, bookmarked, completedDates } });
  } catch (error) {
    console.error('DSA progress fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /toggle-complete — toggle completion for a problem
router.post('/toggle-complete', async (req, res) => {
  try {
    const { problemId } = req.body;
    if (!problemId) return res.status(400).json({ success: false, error: 'problemId required' });

    const existing = await prisma.dsaProblem.findUnique({
      where: { problemId_studentId: { problemId, studentId: req.user.id } },
    });

    const nowCompleted = !existing?.completed;

    await prisma.dsaProblem.upsert({
      where: { problemId_studentId: { problemId, studentId: req.user.id } },
      update: { completed: nowCompleted, completedAt: nowCompleted ? new Date() : null },
      create: { problemId, studentId: req.user.id, completed: true, completedAt: new Date() },
    });

    res.json({ success: true, data: { problemId, completed: nowCompleted } });
  } catch (error) {
    console.error('DSA toggle-complete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /toggle-bookmark — toggle bookmark for a problem
router.post('/toggle-bookmark', async (req, res) => {
  try {
    const { problemId } = req.body;
    if (!problemId) return res.status(400).json({ success: false, error: 'problemId required' });

    const existing = await prisma.dsaProblem.findUnique({
      where: { problemId_studentId: { problemId, studentId: req.user.id } },
    });

    const nowBookmarked = !existing?.bookmarked;

    if (existing) {
      await prisma.dsaProblem.update({
        where: { problemId_studentId: { problemId, studentId: req.user.id } },
        data: { bookmarked: nowBookmarked },
      });
    } else {
      await prisma.dsaProblem.create({
        data: { problemId, studentId: req.user.id, bookmarked: true },
      });
    }

    res.json({ success: true, data: { problemId, bookmarked: nowBookmarked } });
  } catch (error) {
    console.error('DSA toggle-bookmark error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /stats — aggregated statistics
router.get('/stats', async (req, res) => {
  try {
    const records = await prisma.dsaProblem.findMany({
      where: { studentId: req.user.id },
      select: { problemId: true, completed: true, bookmarked: true, completedAt: true },
    });

    const completedSet = new Set(records.filter(r => r.completed).map(r => r.problemId));
    const totalCompleted = completedSet.size;
    const totalBookmarked = records.filter(r => r.bookmarked).length;

    // Recently solved (last 7 days, sorted by most recent)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlySolved = records
      .filter(r => r.completed && r.completedAt && new Date(r.completedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .map(r => r.problemId);

    res.json({
      success: true,
      data: { totalCompleted, totalBookmarked, completedIds: [...completedSet], recentlySolved },
    });
  } catch (error) {
    console.error('DSA stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

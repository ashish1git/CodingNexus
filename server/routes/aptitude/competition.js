import express from 'express';
import { authenticate, authorizeRole } from '../../middleware/auth.js';
import * as svc from '../../services/aptitude/competition.service.js';

const router = express.Router();

function handleError(res, error) {
  console.error('[aptitude/competition]', error.message);
  res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
}

// ─── Student routes ───────────────────────────────────────────────────────────

router.use(authenticate);

// GET /api/aptitude/competition — list all active competitions + user state
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const data = await svc.listCompetitions(req.user.id, { status });
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// GET /api/aptitude/competition/:id/timer — server-authoritative timer sync
router.get('/:id/timer', async (req, res) => {
  try {
    const data = await svc.getTimerSync(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// GET /api/aptitude/competition/:id/leaderboard — leaderboard (gated)
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const data = await svc.getLeaderboard(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// GET /api/aptitude/competition/:id — get competition + questions for attempt
router.get('/:id', async (req, res) => {
  try {
    const data = await svc.getCompetitionForAttempt(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// POST /api/aptitude/competition/:id/register — student joins
router.post('/:id/register', async (req, res) => {
  try {
    const data = await svc.registerForCompetition(req.params.id, req.user.id);
    res.status(201).json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// POST /api/aptitude/competition/:id/submit — student submits answers
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const data = await svc.submitCompetition(req.params.id, req.user.id, { answers, timeTaken });
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

const adminOnly = authorizeRole('admin', 'subadmin', 'superadmin');

// GET /api/aptitude/competition/admin/all
router.get('/admin/all', adminOnly, async (req, res) => {
  try {
    const data = await svc.adminGetAllCompetitions();
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// GET /api/aptitude/competition/admin/:id
router.get('/admin/:id', adminOnly, async (req, res) => {
  try {
    const data = await svc.adminGetCompetition(req.params.id);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// GET /api/aptitude/competition/admin/:id/submissions
router.get('/admin/:id/submissions', adminOnly, async (req, res) => {
  try {
    const data = await svc.adminGetSubmissions(req.params.id);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// POST /api/aptitude/competition/admin — create competition
router.post('/admin', adminOnly, async (req, res) => {
  try {
    const data = await svc.createCompetition({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// PUT /api/aptitude/competition/admin/:id
router.put('/admin/:id', adminOnly, async (req, res) => {
  try {
    const data = await svc.updateCompetition(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { handleError(res, e); }
});

// DELETE /api/aptitude/competition/admin/:id
router.delete('/admin/:id', adminOnly, async (req, res) => {
  try {
    await svc.deleteCompetition(req.params.id);
    res.json({ success: true, message: 'Competition deleted' });
  } catch (e) { handleError(res, e); }
});

export default router;

import express from 'express';
import { authenticate, authorizeRole } from '../../middleware/auth.js';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
  getRandomQuestions,
  getQuestionStats,
} from '../../services/aptitude/question.service.js';

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Send a service-layer error or fall back to 500. */
function handleError(res, error) {
  console.error('[aptitude/questions]', error.message);
  res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
}

/** Parse and clamp pagination query params. */
function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
  return { page, limit };
}

// ────────────────────────────────────────────────────────────────────────────
// Student Routes  (authenticated, any role)
// ────────────────────────────────────────────────────────────────────────────

// GET /api/aptitude/questions/random
// Fetch N random questions for a practice session bootstrap.
// Query: count, categoryId, topicId, difficulty, exclude (comma-separated IDs)
router.get('/random', authenticate, async (req, res) => {
  try {
    const { categoryId, topicId, difficulty, exclude } = req.query;
    const count      = Math.min(50, Math.max(1, parseInt(req.query.count || '10', 10)));
    const excludeIds = exclude ? exclude.split(',').map(s => s.trim()).filter(Boolean) : [];

    const questions = await getRandomQuestions({ count, categoryId, topicId, difficulty, excludeIds });
    res.json({ success: true, questions, count: questions.length });
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/aptitude/questions/:id
// Fetch a single question — student view (no correctOption / explanation).
router.get('/:id', authenticate, async (req, res) => {
  try {
    const question = await getQuestion(req.params.id, { forAdmin: false });
    res.json({ success: true, question });
  } catch (error) {
    handleError(res, error);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Admin Routes  (admin / subadmin / superadmin only)
// ────────────────────────────────────────────────────────────────────────────

const adminOnly = authorizeRole('admin', 'subadmin', 'superadmin');

// GET /api/aptitude/questions
// List all questions with filters + pagination.
// Query: testId, categoryId, topicId, difficulty, tag, page, limit
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { testId, categoryId, topicId, difficulty, tag } = req.query;
    const { page, limit } = parsePagination(req.query);

    const result = await listQuestions({
      filters: { testId, categoryId, topicId, difficulty, tag },
      page,
      limit,
      forAdmin: true,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/aptitude/questions/admin/stats
// Aggregate counts for the admin dashboard.
router.get('/admin/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const stats = await getQuestionStats();
    res.json({ success: true, stats });
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/aptitude/questions/admin/:id
// Full question detail including correctOption + explanation.
router.get('/admin/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const question = await getQuestion(req.params.id, { forAdmin: true });
    res.json({ success: true, question });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/questions
// Create a single question (standalone bank entry or tied to a testId).
// Body: { question, options, correctOption, explanation?, difficulty?, orderIndex?,
//         testId?, categoryId?, topicId?, tags?, sourceRef? }
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const question = await createQuestion(req.body);
    res.status(201).json({ success: true, question, message: 'Question created' });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/questions/bulk
// Create multiple questions at once.
// Body: { questions: [...] }
router.post('/bulk', authenticate, adminOnly, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'questions must be a non-empty array' });
    }
    if (questions.length > 500) {
      return res.status(400).json({ success: false, error: 'Maximum 500 questions per bulk request' });
    }

    const result = await bulkCreateQuestions(questions);
    res.status(201).json({ success: true, count: result.count, message: `${result.count} question(s) created` });
  } catch (error) {
    handleError(res, error);
  }
});

// PUT /api/aptitude/questions/:id
// Partial update — only supplied fields are changed.
// Body: any subset of { question, options, correctOption, explanation,
//                       difficulty, orderIndex, categoryId, topicId,
//                       tags, sourceRef, isActive }
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const question = await updateQuestion(req.params.id, req.body);
    res.json({ success: true, question, message: 'Question updated' });
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE /api/aptitude/questions/:id
// Hard delete — cascades from AptitudeTestQuestion join rows automatically.
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await deleteQuestion(req.params.id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

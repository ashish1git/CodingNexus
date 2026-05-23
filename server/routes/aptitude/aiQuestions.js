import express from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';
import {
  generateVariations,
  generateFromTopic,
  batchGenerateVariations,
  PROMPT_TEMPLATES,
} from '../../services/aptitude/aiQuestionGenerator.service.js';

const router = express.Router();

// All AI generation endpoints are admin-only — students never trigger AI calls.
router.use(authenticate);
router.use(authorizeRole('admin', 'subadmin', 'superadmin'));

// ─── helpers ─────────────────────────────────────────────────────────────────

function handleError(res, error) {
  console.error('[aptitude/ai-questions]', error.message);
  res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
}

// Shape a generated question into the DB insert format used by question.service.js
function toDbShape(q, overrides = {}) {
  return {
    question:      q.question,
    options:       q.options,
    correctOption: q.correctOption,
    explanation:   q.explanation || null,
    difficulty:    q.difficulty  || 'medium',
    ...overrides,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/aptitude/ai-questions/templates
// Return the prompt templates so the frontend can display/preview them.
// No AI call made here — zero tokens consumed.
router.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: {
      GENERATE_VARIATIONS: {
        description: 'Generate variations of existing seed questions',
        systemInstruction: PROMPT_TEMPLATES.GENERATE_VARIATIONS.systemInstruction,
      },
      GENERATE_FROM_TOPIC: {
        description: 'Generate fresh questions from a topic description',
        systemInstruction: PROMPT_TEMPLATES.GENERATE_FROM_TOPIC.systemInstruction,
      },
    }
  });
});

// POST /api/aptitude/ai-questions/generate-variations
// Generate N variations from one or more seed question IDs (or inline seeds).
//
// Body (pick one source):
//   { questionIds: ["uuid", ...], count: 3, category: "quantitative", difficulty: "medium" }
//   { seeds: [{ question, options, correctOption, explanation }], count: 3, ... }
//
// Optional:
//   { saveToBank: true }  — persist generated questions to AptitudeQuestion table
//   { testId: "uuid" }    — also attach to an existing test
router.post('/generate-variations', async (req, res) => {
  try {
    const { questionIds, seeds: inlineSeeds, count = 3, category, difficulty, saveToBank = false, testId } = req.body;

    // ── Resolve seeds ──────────────────────────────────────────────────────
    let seeds = [];

    if (Array.isArray(questionIds) && questionIds.length > 0) {
      if (questionIds.length > 5) {
        return res.status(400).json({ success: false, error: 'Maximum 5 questionIds per request' });
      }
      const dbQuestions = await prisma.aptitudeQuestion.findMany({
        where: { id: { in: questionIds } }
      });
      if (dbQuestions.length === 0) {
        return res.status(404).json({ success: false, error: 'No matching questions found' });
      }
      seeds = dbQuestions.map(q => ({
        question:      q.question,
        options:       q.options,
        correctOption: q.correctOption,
        explanation:   q.explanation || '',
      }));
    } else if (Array.isArray(inlineSeeds) && inlineSeeds.length > 0) {
      seeds = inlineSeeds;
    } else {
      return res.status(400).json({ success: false, error: 'Provide questionIds (array of DB IDs) or inline seeds array' });
    }

    // ── Generate ───────────────────────────────────────────────────────────
    const generated = await generateVariations(seeds, { count, category, difficulty });

    // ── Optionally persist ─────────────────────────────────────────────────
    let saved = null;
    if (saveToBank) {
      const rows = generated.map((q, idx) => toDbShape(q, {
        orderIndex: idx,
        ...(testId && { testId }),
        ...(category && { categoryId: category }),  // forward-compat field
      }));
      await prisma.aptitudeQuestion.createMany({ data: rows, skipDuplicates: true });
      saved = rows.length;
    }

    res.status(201).json({
      success: true,
      generated,
      count: generated.length,
      saved,
      message: saveToBank
        ? `${generated.length} question(s) generated and saved to question bank`
        : `${generated.length} question(s) generated (not saved — pass saveToBank: true to persist)`,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/ai-questions/generate-from-topic
// Generate brand-new questions for a topic from scratch.
//
// Body: { topic: "Time and Work", category: "quantitative", difficulty: "medium",
//         count: 5, saveToBank: false, testId?: "uuid" }
router.post('/generate-from-topic', async (req, res) => {
  try {
    const { topic, category, difficulty = 'medium', count = 5, saveToBank = false, testId } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, error: 'topic is required' });
    }

    const generated = await generateFromTopic({ topic, category, difficulty, count });

    let saved = null;
    if (saveToBank) {
      const rows = generated.map((q, idx) => toDbShape(q, {
        orderIndex: idx,
        ...(testId && { testId }),
        ...(category && { categoryId: category }),
      }));
      await prisma.aptitudeQuestion.createMany({ data: rows, skipDuplicates: true });
      saved = rows.length;
    }

    res.status(201).json({
      success: true,
      generated,
      count: generated.length,
      saved,
      message: saveToBank
        ? `${generated.length} question(s) generated and saved`
        : `${generated.length} question(s) generated (pass saveToBank: true to persist)`,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/ai-questions/expand-test/:testId
// Expand an entire existing test — generates variationsPerSeed new questions
// per existing question in that test, then saves all to the question bank
// (and optionally appends them back to the same test).
//
// Body: { variationsPerSeed: 2, appendToTest: false }
router.post('/expand-test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variationsPerSeed = 2, appendToTest = false } = req.body;

    // Fetch the test with its questions (including answers — admin route)
    const test = await prisma.aptitudeTest.findUnique({
      where:   { id: testId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    if (test.questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Test has no questions to expand from' });
    }
    if (test.questions.length * variationsPerSeed > 40) {
      return res.status(400).json({
        success: false,
        error: `This would generate ${test.questions.length * variationsPerSeed} questions. Max is 40 per request. Reduce variationsPerSeed or expand fewer questions.`
      });
    }

    const seeds = test.questions.map(q => ({
      question:      q.question,
      options:       q.options,
      correctOption: q.correctOption,
      explanation:   q.explanation || '',
    }));

    const generated = await batchGenerateVariations(seeds, {
      variationsPerSeed,
      category:   test.category || undefined,
      difficulty: test.difficulty || undefined,
    });

    // Save to question bank (always — this is an expand operation)
    const rows = generated.map((q, idx) => toDbShape(q, {
      orderIndex: test.questions.length + idx,
      ...(appendToTest && { testId }),
    }));

    await prisma.aptitudeQuestion.createMany({ data: rows, skipDuplicates: true });

    res.status(201).json({
      success: true,
      testId,
      testTitle:    test.title,
      seedCount:    test.questions.length,
      generated,
      count:        generated.length,
      appendedToTest: appendToTest,
      message: `${generated.length} question(s) generated from ${test.questions.length} seed(s)${appendToTest ? ' and appended to the test' : ' and saved to question bank'}`,
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

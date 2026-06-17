import express from 'express';
import prisma from '../../config/db.js';
import { authenticate } from '../../middleware/auth.js';
import { getRandomQuestions } from '../../services/aptitude/question.service.js';

const router = express.Router();
router.use(authenticate);

function handleError(res, error) {
  console.error('[aptitude/practice]', error.message);
  res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
}

// In-memory global AI quota flag with auto-reset (stores timestamp when quota was last exhausted)
// Resets automatically when a new day starts (midnight server time) or on next successful call
let g_aiQuotaExhaustedAt = null;
const QUOTA_EXHAUSTED_RESET_HOURS = 6;

function isQuotaExhausted() {
  if (!g_aiQuotaExhaustedAt) return false;
  const now = new Date();
  const exhaustedDate = new Date(g_aiQuotaExhaustedAt);
  // Reset if a new day started (midnight has passed) since quota was exhausted
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exhaustedDayStart = new Date(exhaustedDate.getFullYear(), exhaustedDate.getMonth(), exhaustedDate.getDate());
  if (todayStart.getTime() > exhaustedDayStart.getTime()) {
    g_aiQuotaExhaustedAt = null;
    console.log('[quota] Auto-reset: new day detected');
    return false;
  }
  // Also reset if more than QUOTA_EXHAUSTED_RESET_HOURS have passed
  if (now - exhaustedDate > QUOTA_EXHAUSTED_RESET_HOURS * 3600000) {
    g_aiQuotaExhaustedAt = null;
    console.log('[quota] Auto-reset: timeout reached');
    return false;
  }
  return true;
}

// GET /api/aptitude/practice/ai-limit
router.get('/ai-limit', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const usedToday = await prisma.aptitudePracticeSession.count({
      where: {
        userId: req.user.id,
        mode: 'ai',
        startedAt: { gte: todayStart },
      },
    });

    const limit = 3;
    const personalRemaining = Math.max(0, limit - usedToday);

    res.json({
      success: true,
      usedToday,
      limit,
      remaining: isQuotaExhausted() ? 0 : personalRemaining,
      quotaExhausted: isQuotaExhausted(),
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/practice/start
router.post('/start', async (req, res) => {
  try {
    let {
      category,
      topicId,
      difficulty = 'medium',
      count      = 10,
      mode       = 'static',
    } = req.body;

    const clampedCount = Math.min(30, Math.max(1, Number(count)));
    let questions = [];
    let aiGenerated = false;

    if (mode === 'ai') {
      // ── Rate limit: max 3 AI practice sessions per user per day ──
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const aiCountToday = await prisma.aptitudePracticeSession.count({
        where: {
          userId: req.user.id,
          mode: 'ai',
          startedAt: { gte: todayStart },
        },
      });
      if (aiCountToday >= 3) {
        return res.status(429).json({
          success: false,
          error: 'You have reached the daily limit of 3 AI-generated practice sessions. Please try again tomorrow or use the Question Bank.',
        });
      }

      try {
        const { generateFromTopic } = await import('../../services/aptitude/aiQuestionGenerator.service.js');
        const topic = topicId || category || 'general aptitude';
        const generated = await generateFromTopic({ topic, category, difficulty, count: clampedCount });

        // Clear quota-exhausted flag on success (quota may have reset)
        g_aiQuotaExhaustedAt = null;

        questions = generated.map((q, i) => ({
          id:            `ai-${Date.now()}-${i}`,
          orderIndex:    i,
          question:      q.question,
          options:       q.options,
          explanation:   q.explanation,
          difficulty:    q.difficulty,
          concept:       q.concept || null,
          correctOption: q.correctOption,
          isAI:          true,
        }));
        aiGenerated = true;
      } catch (aiErr) {
        const msg = aiErr.message || '';
        const isPermanentQuota = aiErr.isPermanentQuota === true;
        const isKeyIssue = msg.includes('API_KEY') || msg.includes('API key not valid') || msg.includes('403');
        console.warn('[practice/start] AI generation failed:', msg);

        if (isPermanentQuota) {
          g_aiQuotaExhaustedAt = new Date();
          return res.status(429).json({
            success: false,
            error: 'AI question generation is temporarily unavailable — we have reached the daily AI service limit. Please try again later or use the Question Bank.',
          });
        }

        if (isKeyIssue) {
          return res.status(503).json({
            success: false,
            error: 'AI question generation is not configured yet. Please use the Question Bank for now.',
          });
        }

        // Other errors — fall back to static silently
        mode = 'static';
      }
    }

    if (!aiGenerated) {
      // static fallback – try with filters, then relax
      questions = await getRandomQuestions({
        count: clampedCount,
        categoryId: category,
        topicId,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
      });

      // If strict filter returns nothing, retry without topic
      if (questions.length === 0 && topicId) {
        questions = await getRandomQuestions({
          count: clampedCount,
          categoryId: category,
          difficulty: difficulty !== 'all' ? difficulty : undefined,
        });
      }

      // If still nothing, retry with just difficulty
      if (questions.length === 0 && (category || topicId)) {
        questions = await getRandomQuestions({
          count: clampedCount,
          difficulty: difficulty !== 'all' ? difficulty : undefined,
        });
      }

      // Absolute fallback – any active questions
      if (questions.length === 0) {
        questions = await getRandomQuestions({
          count: clampedCount,
        });
      }

      if (questions.length > 0) {
        const ids = questions.map(q => q.id);
        const full = await prisma.aptitudeQuestion.findMany({ where: { id: { in: ids } } });
        const fullMap = Object.fromEntries(full.map(q => [q.id, q]));
        questions = questions.map((q, idx) => ({
          ...q,
          orderIndex: idx,
          correctOption: fullMap[q.id]?.correctOption,
          explanation:   fullMap[q.id]?.explanation,
        }));
      }
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No questions found for these filters. Try a different category or difficulty.'
      });
    }

    const session = await prisma.aptitudePracticeSession.create({
      data: {
        userId:       req.user.id,
        categoryId:   category   || null,
        topicId:      topicId    || null,
        difficulty:   difficulty !== 'all' ? difficulty : null,
        mode:         aiGenerated ? 'ai' : 'static',
        totalAnswered: 0,
        totalCorrect:  0,
      }
    });

    // Insert answer slots — create one-by-one to get IDs back
    const answerSlots = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const slot = await prisma.aptitudePracticeAnswer.create({
        data: {
          sessionId:    session.id,
          questionId:   q.isAI ? null : q.id,
          aiQuestion:   q.isAI ? JSON.stringify({
            question: q.question,
            options:  q.options,
            correctOption: q.correctOption,
            explanation:   q.explanation,
            concept:       q.concept,
          }) : null,
          correctOption: q.correctOption,
          orderIndex:    i,
          selected:      null,
          isCorrect:     false,
          timeTaken:     0,
        }
      });
      answerSlots.push({ id: slot.id, orderIndex: i });
    }

    // Send to client with answerSlotId for answering, stripped of correctOption
    const safeQuestions = questions.map(({ correctOption, ...rest }, idx) => ({
      ...rest,
      answerSlotId: answerSlots[idx].id,
    }));

    res.status(201).json({
      success:      true,
      sessionId:    session.id,
      mode:         aiGenerated ? 'ai' : 'static',
      questions:    safeQuestions,
      totalCount:   safeQuestions.length,
      startedAt:    session.startedAt,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/practice/:sessionId/answer
router.post('/:sessionId/answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answerSlotId, selected, timeTaken = 0 } = req.body;

    const session = await prisma.aptitudePracticeSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not your session' });
    if (session.endedAt) return res.status(400).json({ success: false, error: 'Session already finished' });

    const answerSlot = await prisma.aptitudePracticeAnswer.findUnique({
      where: { id: answerSlotId }
    });

    if (!answerSlot || answerSlot.sessionId !== sessionId) {
      return res.status(404).json({ success: false, error: 'Answer slot not found in this session' });
    }
    if (answerSlot.selected) {
      return res.status(400).json({ success: false, error: 'Already answered' });
    }

    const isCorrect = selected ? selected === answerSlot.correctOption : false;

    await prisma.aptitudePracticeAnswer.update({
      where:  { id: answerSlot.id },
      data:   { selected: selected || null, isCorrect, timeTaken: Number(timeTaken) }
    });

    await prisma.aptitudePracticeSession.update({
      where: { id: sessionId },
      data: {
        totalAnswered: { increment: 1 },
        totalCorrect:  isCorrect ? { increment: 1 } : undefined,
      }
    });

    let explanation = null;
    if (answerSlot.aiQuestion) {
      try { explanation = JSON.parse(answerSlot.aiQuestion).explanation; } catch {}
    } else if (answerSlot.questionId) {
      const q = await prisma.aptitudeQuestion.findUnique({ where: { id: answerSlot.questionId }, select: { explanation: true } });
      explanation = q?.explanation;
    }

    res.json({
      success:       true,
      isCorrect,
      correctOption: answerSlot.correctOption,
      explanation,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/aptitude/practice/:sessionId/finish
router.post('/:sessionId/finish', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.aptitudePracticeSession.findUnique({
      where:   { id: sessionId },
      include: { answers: true }
    });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not your session' });

    await prisma.aptitudePracticeSession.update({
      where: { id: sessionId },
      data:  { endedAt: new Date() }
    });

    const total    = session.answers.length;
    const answered = session.answers.filter(a => a.selected).length;
    const correct  = session.answers.filter(a => a.isCorrect).length;
    const pct      = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({
      success: true,
      summary: {
        sessionId,
        total,
        answered,
        correct,
        wrong:   answered - correct,
        skipped: total - answered,
        percentage: pct,
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/aptitude/practice/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.aptitudePracticeSession.findUnique({
      where:   { id: sessionId },
      include: { answers: { orderBy: { orderIndex: 'asc' } } }
    });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not your session' });

    const enriched = await Promise.all(session.answers.map(async (a) => {
      let questionData = {};
      if (a.aiQuestion) {
        try { questionData = JSON.parse(a.aiQuestion); } catch {}
      } else if (a.questionId) {
        const q = await prisma.aptitudeQuestion.findUnique({ where: { id: a.questionId } });
        if (q) questionData = { question: q.question, options: q.options, explanation: q.explanation };
      }
      return {
        answerSlotId:  a.id,
        questionId:    a.questionId || `ai-${a.id}`,
        question:      questionData.question || '(question unavailable)',
        options:       questionData.options   || [],
        correctOption: a.correctOption,
        explanation:   questionData.explanation || null,
        selected:      a.selected,
        isCorrect:     a.isCorrect,
        timeTaken:     a.timeTaken,
        isAI:          !!a.aiQuestion,
      };
    }));

    const total    = enriched.length;
    const correct  = enriched.filter(a => a.isCorrect).length;
    const answered = enriched.filter(a => a.selected).length;

    res.json({
      success: true,
      session: {
        id:         session.id,
        startedAt:  session.startedAt,
        endedAt:    session.endedAt,
        categoryId: session.categoryId,
        topicId:    session.topicId,
        difficulty: session.difficulty,
        summary: {
          total, correct, answered,
          wrong:   answered - correct,
          skipped: total - answered,
          percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        },
        answers: enriched,
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;

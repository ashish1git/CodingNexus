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

// ─── POST /api/aptitude/practice/start ───────────────────────────────────────
// Creates a practice session and returns the first batch of questions.
// Body: { category, topicId, difficulty, count, mode }
//   mode: "static"  — questions from question bank only
//         "ai"      — questions generated on-the-fly by Gemini (falls back to static if AI fails)
router.post('/start', async (req, res) => {
  try {
    const {
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
      // Attempt AI generation; fall back to static on any error
      try {
        const { generateFromTopic } = await import('../../services/aptitude/aiQuestionGenerator.service.js');
        const topic = topicId || category || 'general aptitude';
        const generated = await generateFromTopic({ topic, category, difficulty, count: clampedCount });
        // AI questions have no DB id — assign a temporary client-side id
        questions = generated.map((q, i) => ({
          id:            `ai-${Date.now()}-${i}`,
          question:      q.question,
          options:       q.options,
          explanation:   q.explanation,
          difficulty:    q.difficulty,
          concept:       q.concept || null,
          correctOption: q.correctOption,  // included — validated per-answer server-side
          isAI:          true,
        }));
        aiGenerated = true;
      } catch (aiErr) {
        console.warn('[practice/start] AI generation failed, falling back to static:', aiErr.message);
        mode = 'static';
      }
    }

    if (!aiGenerated) {
      // Static: pull from question bank
      questions = await getRandomQuestions({
        count: clampedCount,
        categoryId: category,
        topicId,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
      });

      // For static questions fetched via getRandomQuestions (student-safe — no correctOption),
      // we need correctOption for server-side validation during the session.
      // Fetch full records for the returned IDs.
      if (questions.length > 0) {
        const ids = questions.map(q => q.id);
        const full = await prisma.aptitudeQuestion.findMany({ where: { id: { in: ids } } });
        const fullMap = Object.fromEntries(full.map(q => [q.id, q]));
        questions = questions.map(q => ({
          ...q,
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

    // Persist session to DB
    const session = await prisma.aptitudePracticeSession.create({
      data: {
        userId:       req.user.id,
        categoryId:   category   || null,
        topicId:      topicId    || null,
        difficulty:   difficulty !== 'all' ? difficulty : null,
        totalAnswered: 0,
        totalCorrect:  0,
      }
    });

    // Store question snapshot in DB for answer validation + result reconstruction
    // We store correctOption server-side only — never send it in the start response.
    await prisma.aptitudePracticeAnswer.createMany({
      data: questions.map((q, idx) => ({
        sessionId:  session.id,
        questionId: q.isAI ? null : q.id,
        aiQuestion: q.isAI ? JSON.stringify({
          question: q.question,
          options:  q.options,
          correctOption: q.correctOption,
          explanation:   q.explanation,
          concept:       q.concept,
        }) : null,
        correctOption: q.correctOption,
        orderIndex:    idx,
        selected:      null,
        isCorrect:     false,
        timeTaken:     0,
      }))
    });

    // Strip correctOption before sending to client
    const safeQuestions = questions.map(({ correctOption, ...rest }) => rest);

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

// ─── POST /api/aptitude/practice/:sessionId/answer ───────────────────────────
// Validate and record a single answer. Returns immediate feedback.
// Body: { questionId, selected, timeTaken }
router.post('/:sessionId/answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, selected, timeTaken = 0 } = req.body;

    const session = await prisma.aptitudePracticeSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, error: 'Practice session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not your session' });
    if (session.endedAt) return res.status(400).json({ success: false, error: 'Session already finished' });

    // Find the answer slot for this question
    const answerSlot = await prisma.aptitudePracticeAnswer.findFirst({
      where: {
        sessionId,
        OR: [
          { questionId: questionId || undefined },
          // For AI questions there's no questionId — match by order from client
        ]
      }
    });

    if (!answerSlot) return res.status(404).json({ success: false, error: 'Question not found in this session' });
    if (answerSlot.selected) return res.status(400).json({ success: false, error: 'Already answered' });

    const isCorrect = selected ? selected === answerSlot.correctOption : false;

    // Update the answer slot
    await prisma.aptitudePracticeAnswer.update({
      where:  { id: answerSlot.id },
      data:   { selected: selected || null, isCorrect, timeTaken: Number(timeTaken) }
    });

    // Increment session counters
    await prisma.aptitudePracticeSession.update({
      where: { id: sessionId },
      data: {
        totalAnswered: { increment: 1 },
        totalCorrect:  isCorrect ? { increment: 1 } : undefined,
      }
    });

    // Fetch explanation for immediate feedback
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

// ─── POST /api/aptitude/practice/:sessionId/finish ───────────────────────────
// Mark session complete; returns full result summary.
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

// ─── GET /api/aptitude/practice/:sessionId ───────────────────────────────────
// Full session detail for the results page.
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.aptitudePracticeSession.findUnique({
      where:   { id: sessionId },
      include: { answers: { orderBy: { orderIndex: 'asc' } } }
    });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not your session' });

    // Enrich answers with full question text (from DB or embedded AI JSON)
    const enriched = await Promise.all(session.answers.map(async (a) => {
      let questionData = {};
      if (a.aiQuestion) {
        try { questionData = JSON.parse(a.aiQuestion); } catch {}
      } else if (a.questionId) {
        const q = await prisma.aptitudeQuestion.findUnique({ where: { id: a.questionId } });
        if (q) questionData = { question: q.question, options: q.options, explanation: q.explanation };
      }
      return {
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

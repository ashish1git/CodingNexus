import prisma from '../../config/db.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function err(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function competitionStatus(c) {
  const now = new Date();
  if (now < c.startTime) return 'upcoming';
  if (now > c.endTime)   return 'ended';
  return 'live';
}

// Strip correct answers for student-facing questions
function sanitizeQuestion(q) {
  const { correctOption, explanation, ...safe } = q;
  return safe;
}

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────

export async function createCompetition({ title, description, category, difficulty, duration, startTime, endTime, maxParticipants, showLeaderboard, allowLateJoin, questionIds = [], createdBy }) {
  if (!title || !duration || !startTime || !endTime)
    throw err('title, duration, startTime, endTime are required');
  if (new Date(startTime) >= new Date(endTime))
    throw err('startTime must be before endTime');
  if (!questionIds.length)
    throw err('At least one question is required');

  return prisma.aptitudeCompetition.create({
    data: {
      title, description, category, difficulty,
      duration: Number(duration),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      showLeaderboard: showLeaderboard !== false,
      allowLateJoin: allowLateJoin === true,
      createdBy,
      questions: {
        create: questionIds.map((qId, idx) => ({
          questionId: qId,
          orderIndex: idx,
          marks: 1,
        })),
      },
    },
    include: { questions: true },
  });
}

export async function updateCompetition(id, data) {
  const existing = await prisma.aptitudeCompetition.findUnique({ where: { id } });
  if (!existing) throw err('Competition not found', 404);

  const { questionIds, ...fields } = data;
  const updateData = {};
  if (fields.title !== undefined)          updateData.title = fields.title;
  if (fields.description !== undefined)    updateData.description = fields.description;
  if (fields.category !== undefined)       updateData.category = fields.category;
  if (fields.difficulty !== undefined)     updateData.difficulty = fields.difficulty;
  if (fields.duration !== undefined)       updateData.duration = Number(fields.duration);
  if (fields.startTime !== undefined)      updateData.startTime = new Date(fields.startTime);
  if (fields.endTime !== undefined)        updateData.endTime = new Date(fields.endTime);
  if (fields.maxParticipants !== undefined) updateData.maxParticipants = fields.maxParticipants ? Number(fields.maxParticipants) : null;
  if (fields.showLeaderboard !== undefined) updateData.showLeaderboard = fields.showLeaderboard;
  if (fields.allowLateJoin !== undefined)  updateData.allowLateJoin = fields.allowLateJoin;
  if (fields.isActive !== undefined)       updateData.isActive = fields.isActive;

  if (questionIds && Array.isArray(questionIds)) {
    // Replace questions: delete all then recreate
    await prisma.aptitudeCompetitionQuestion.deleteMany({ where: { competitionId: id } });
    updateData.questions = {
      create: questionIds.map((qId, idx) => ({ questionId: qId, orderIndex: idx, marks: 1 })),
    };
  }

  return prisma.aptitudeCompetition.update({
    where: { id },
    data: updateData,
    include: { questions: true },
  });
}

export async function deleteCompetition(id) {
  const existing = await prisma.aptitudeCompetition.findUnique({ where: { id } });
  if (!existing) throw err('Competition not found', 404);
  await prisma.aptitudeCompetition.delete({ where: { id } });
}

export async function adminGetAllCompetitions() {
  const comps = await prisma.aptitudeCompetition.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      _count: { select: { registrations: true, attempts: true, questions: true } },
    },
  });
  return comps.map(c => ({ ...c, status: competitionStatus(c) }));
}

export async function adminGetCompetition(id) {
  const c = await prisma.aptitudeCompetition.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
      },
      _count: { select: { registrations: true, attempts: true } },
    },
  });
  if (!c) throw err('Competition not found', 404);

  // Resolve full question data (from AptitudeQuestion bank)
  const questionIds = c.questions.map(q => q.questionId);
  const fullQuestions = questionIds.length
    ? await prisma.aptitudeQuestion.findMany({ where: { id: { in: questionIds } } })
    : [];
  const qMap = Object.fromEntries(fullQuestions.map(q => [q.id, q]));

  return {
    ...c,
    status: competitionStatus(c),
    questions: c.questions.map(cq => ({
      ...cq,
      questionData: qMap[cq.questionId] || null,
    })),
  };
}

export async function adminGetSubmissions(competitionId) {
  const attempts = await prisma.aptitudeCompetitionAttempt.findMany({
    where: { competitionId },
    include: {
      user: { include: { studentProfile: { select: { name: true, batch: true, rollNo: true } } } },
    },
    orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
  });
  return attempts.map((a, idx) => ({
    ...a,
    rank: idx + 1,
    studentName: a.user?.studentProfile?.name || a.user?.email,
    batch: a.user?.studentProfile?.batch,
    rollNo: a.user?.studentProfile?.rollNo,
  }));
}

// ─── Student: Browse ─────────────────────────────────────────────────────────

export async function listCompetitions(userId, { status } = {}) {
  const comps = await prisma.aptitudeCompetition.findMany({
    where: { isActive: true },
    orderBy: { startTime: 'asc' },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  // Batch-fetch user's registrations and attempts
  const ids = comps.map(c => c.id);
  const [userRegs, userAttempts] = await Promise.all([
    prisma.aptitudeCompetitionRegistration.findMany({
      where: { competitionId: { in: ids }, userId },
      select: { competitionId: true, registeredAt: true },
    }),
    prisma.aptitudeCompetitionAttempt.findMany({
      where: { competitionId: { in: ids }, userId },
      select: { competitionId: true, score: true, maxScore: true, percentage: true, rank: true, submittedAt: true },
    }),
  ]);

  const regMap = Object.fromEntries(userRegs.map(r => [r.competitionId, r]));
  const attemptMap = Object.fromEntries(userAttempts.map(a => [a.competitionId, a]));

  let result = comps.map(c => ({
    ...c,
    status: competitionStatus(c),
    isRegistered: !!regMap[c.id],
    myAttempt: attemptMap[c.id] || null,
    participantCount: c._count.registrations,
  }));

  if (status) result = result.filter(c => c.status === status);
  return result;
}

// ─── Student: Register ────────────────────────────────────────────────────────

export async function registerForCompetition(competitionId, userId) {
  const comp = await prisma.aptitudeCompetition.findUnique({ where: { id: competitionId } });
  if (!comp || !comp.isActive) throw err('Competition not found', 404);

  const now = new Date();
  if (now > comp.endTime) throw err('Competition has already ended');

  const status = competitionStatus(comp);
  if (status === 'live' && !comp.allowLateJoin)
    throw err('Competition has already started and late join is disabled');

  if (comp.maxParticipants) {
    const count = await prisma.aptitudeCompetitionRegistration.count({ where: { competitionId } });
    if (count >= comp.maxParticipants) throw err('Competition is full');
  }

  const existing = await prisma.aptitudeCompetitionRegistration.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });
  if (existing) throw err('Already registered');

  return prisma.aptitudeCompetitionRegistration.create({ data: { competitionId, userId } });
}

// ─── Student: Get competition for attempt ────────────────────────────────────

export async function getCompetitionForAttempt(competitionId, userId) {
  const comp = await prisma.aptitudeCompetition.findUnique({
    where: { id: competitionId },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!comp || !comp.isActive) throw err('Competition not found', 404);

  const now = new Date();
  if (now < comp.startTime) throw err('Competition has not started yet');
  if (now > comp.endTime)   throw err('Competition has ended');

  // Must be registered
  const reg = await prisma.aptitudeCompetitionRegistration.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });
  if (!reg) throw err('You are not registered for this competition');

  // Cannot attempt twice
  const existingAttempt = await prisma.aptitudeCompetitionAttempt.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });
  if (existingAttempt?.submittedAt) throw err('You have already submitted this competition');

  // Fetch real question data from question bank
  const questionIds = comp.questions.map(q => q.questionId);
  const bankQuestions = questionIds.length
    ? await prisma.aptitudeQuestion.findMany({ where: { id: { in: questionIds } } })
    : [];
  const qMap = Object.fromEntries(bankQuestions.map(q => [q.id, q]));

  // Compute per-student time remaining
  // If student started earlier (attempt row exists), use startedAt; else now
  let startedAt = existingAttempt?.startedAt || now;
  if (!existingAttempt) {
    // Create draft attempt row to lock startedAt
    await prisma.aptitudeCompetitionAttempt.create({
      data: { competitionId, userId, answers: {}, score: 0, maxScore: 0, percentage: 0, startedAt: now },
    });
    startedAt = now;
  }

  const durationSec    = comp.duration * 60;
  const elapsedSec     = Math.floor((now - startedAt) / 1000);
  const windowEndSec   = Math.floor((comp.endTime - now) / 1000);  // time left in competition window
  const studentEndSec  = durationSec - elapsedSec;                  // time left on student's clock
  const secondsLeft    = Math.max(0, Math.min(studentEndSec, windowEndSec));

  return {
    id: comp.id,
    title: comp.title,
    description: comp.description,
    category: comp.category,
    difficulty: comp.difficulty,
    duration: comp.duration,
    startTime: comp.startTime,
    endTime: comp.endTime,
    secondsLeft,
    startedAt,
    questions: comp.questions.map(cq => {
      const q = qMap[cq.questionId];
      if (!q) return null;
      return {
        competitionQuestionId: cq.id,
        questionId: q.id,
        orderIndex: cq.orderIndex,
        marks: cq.marks,
        ...sanitizeQuestion(q),
      };
    }).filter(Boolean),
  };
}

// ─── Student: Submit ─────────────────────────────────────────────────────────

export async function submitCompetition(competitionId, userId, { answers, timeTaken }) {
  const comp = await prisma.aptitudeCompetition.findUnique({
    where: { id: competitionId },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!comp) throw err('Competition not found', 404);

  // Allow submit if competition window has ended (grace: 30s) OR still live
  const now = new Date();
  const grace = new Date(comp.endTime.getTime() + 30_000);
  if (now > grace) throw err('Submission window has closed');

  // Check existing attempt
  const attempt = await prisma.aptitudeCompetitionAttempt.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });
  if (!attempt) throw err('No active attempt found — did not start the competition');
  if (attempt.submittedAt) throw err('Already submitted');

  // Fetch correct answers from question bank
  const questionIds = comp.questions.map(q => q.questionId);
  const bankQuestions = await prisma.aptitudeQuestion.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctOption: true },
  });
  const correctMap = Object.fromEntries(bankQuestions.map(q => [q.id, q.correctOption]));
  const marksMap   = Object.fromEntries(comp.questions.map(q => [q.questionId, q.marks]));

  // Score
  let score = 0, maxScore = 0;
  for (const cq of comp.questions) {
    const qMarks = marksMap[cq.questionId] || 1;
    maxScore += qMarks;
    const given   = answers?.[cq.questionId];
    const correct = correctMap[cq.questionId];
    if (given && given === correct) score += qMarks;
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100 * 100) / 100 : 0;
  const elapsed    = Math.floor((now - attempt.startedAt) / 1000);
  const actualTime = Math.min(timeTaken || elapsed, comp.duration * 60);

  const updated = await prisma.aptitudeCompetitionAttempt.update({
    where: { competitionId_userId: { competitionId, userId } },
    data: {
      answers: answers || {},
      score,
      maxScore,
      percentage,
      timeTaken: actualTime,
      submittedAt: now,
    },
  });

  // Recompute ranks for this competition (async, non-blocking)
  recomputeRanks(competitionId).catch(() => {});

  return { ...updated, correctAnswers: correctMap };
}

// Rank = ordered by score DESC, timeTaken ASC (tie-break)
async function recomputeRanks(competitionId) {
  const attempts = await prisma.aptitudeCompetitionAttempt.findMany({
    where: { competitionId, submittedAt: { not: null } },
    orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
    select: { id: true },
  });
  await prisma.$transaction(
    attempts.map((a, idx) =>
      prisma.aptitudeCompetitionAttempt.update({ where: { id: a.id }, data: { rank: idx + 1 } })
    )
  );
}

// ─── Student: Leaderboard ────────────────────────────────────────────────────

export async function getLeaderboard(competitionId, userId) {
  const comp = await prisma.aptitudeCompetition.findUnique({
    where: { id: competitionId },
    select: { id: true, title: true, showLeaderboard: true, endTime: true, maxScore: true },
  });
  if (!comp) throw err('Competition not found', 404);

  // Only show leaderboard if enabled OR if competition has ended
  const now = new Date();
  if (!comp.showLeaderboard && now < comp.endTime)
    throw err('Leaderboard is not available during the competition');

  const rows = await prisma.aptitudeCompetitionAttempt.findMany({
    where: { competitionId, submittedAt: { not: null } },
    orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
    take: 100,
    include: {
      user: { include: { studentProfile: { select: { name: true, batch: true, rollNo: true } } } },
    },
  });

  const myAttempt = await prisma.aptitudeCompetitionAttempt.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });

  return {
    competitionId,
    title: comp.title,
    myAttempt: myAttempt || null,
    leaderboard: rows.map((a, idx) => ({
      rank: a.rank || idx + 1,
      userId: a.userId,
      name: a.user?.studentProfile?.name || a.user?.email || 'Anonymous',
      batch: a.user?.studentProfile?.batch,
      rollNo: a.user?.studentProfile?.rollNo,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      timeTaken: a.timeTaken,
      submittedAt: a.submittedAt,
      isMe: a.userId === userId,
    })),
  };
}

// ─── Timer sync endpoint ─────────────────────────────────────────────────────
// Returns the server's computed secondsLeft for the student's active attempt.
// Clients poll this every ~10s to keep their countdown in sync.

export async function getTimerSync(competitionId, userId) {
  const comp = await prisma.aptitudeCompetition.findUnique({
    where: { id: competitionId },
    select: { startTime: true, endTime: true, duration: true },
  });
  if (!comp) throw err('Competition not found', 404);

  const attempt = await prisma.aptitudeCompetitionAttempt.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
    select: { startedAt: true, submittedAt: true },
  });
  if (!attempt) throw err('No active attempt', 404);
  if (attempt.submittedAt) return { secondsLeft: 0, submitted: true };

  const now = new Date();
  const durationSec  = comp.duration * 60;
  const elapsedSec   = Math.floor((now - attempt.startedAt) / 1000);
  const windowEndSec = Math.floor((comp.endTime - now) / 1000);
  const secondsLeft  = Math.max(0, Math.min(durationSec - elapsedSec, windowEndSec));

  return { secondsLeft, submitted: false, serverTime: now.toISOString() };
}

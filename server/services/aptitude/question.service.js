import prisma from '../../config/db.js';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Strip correctOption from a question so students never see the answer.
 */
function sanitizeForStudent(q) {
  const { correctOption, explanation, ...safe } = q;
  return safe;
}

/**
 * Build a Prisma `where` clause from validated filter params.
 * Works against the current schema (testId-based) and is forward-compatible
 * with the upcoming categoryId / topicId / tags / difficulty fields once
 * the schema migration runs.
 */
function buildQuestionWhere(filters) {
  const where = { isActive: true };

  if (filters.testId)     where.testId     = filters.testId;
  if (filters.difficulty && filters.difficulty !== 'all') where.difficulty = filters.difficulty;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.topicId)    where.topicId    = filters.topicId;

  // tag filter — postgres array contains (requires tags column to exist)
  if (filters.tag)        where.tags       = { has: filters.tag };

  return where;
}

// ─── exports ────────────────────────────────────────────────────────────────

/**
 * List questions with optional filters.
 * Admin gets correctOption + explanation; student gets neither.
 */
export async function listQuestions({ filters = {}, page = 1, limit = 50, forAdmin = false }) {
  const where  = buildQuestionWhere(filters);
  const skip   = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    prisma.aptitudeQuestion.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.aptitudeQuestion.count({ where }),
  ]);

  return {
    questions: forAdmin ? questions : questions.map(sanitizeForStudent),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Fetch a single question by ID.
 * Throws if not found.
 */
export async function getQuestion(id, { forAdmin = false } = {}) {
  const q = await prisma.aptitudeQuestion.findUnique({ where: { id } });
  if (!q) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }
  return forAdmin ? q : sanitizeForStudent(q);
}

/**
 * Create a standalone question (not tied to any test — question bank entry).
 * `testId` is optional here; required only when the schema enforces it.
 */
export async function createQuestion(data) {
  const {
    testId,
    question,
    options,
    correctOption,
    explanation,
    difficulty = 'medium',
    orderIndex  = 0,
    categoryId,
    topicId,
    tags        = [],
    sourceRef,
  } = data;

  if (!question || !options || !correctOption) {
    const err = new Error('question, options, and correctOption are required');
    err.status = 400;
    throw err;
  }

  if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
    const err = new Error('correctOption must be A, B, C, or D');
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(options) || options.length < 2) {
    const err = new Error('options must be an array with at least 2 entries');
    err.status = 400;
    throw err;
  }

  // Build data object — only include fields that exist in the live schema.
  // New fields (categoryId, topicId, tags, difficulty, sourceRef, isActive)
  // are silently omitted by Prisma if the columns don't exist yet.
  const payload = {
    question,
    options,
    correctOption,
    orderIndex,
    ...(testId      && { testId }),
    ...(explanation && { explanation }),
  };

  // Forward-compatible fields — Prisma ignores unknown fields if they're not
  // in the generated client, so these are safe to include now.
  if (difficulty)  payload.difficulty  = difficulty;
  if (categoryId)  payload.categoryId  = categoryId;
  if (topicId)     payload.topicId     = topicId;
  if (tags.length) payload.tags        = tags;
  if (sourceRef)   payload.sourceRef   = sourceRef;

  return prisma.aptitudeQuestion.create({ data: payload });
}

/**
 * Bulk-create questions — used when building a test's question set.
 */
export async function bulkCreateQuestions(questionsData) {
  if (!Array.isArray(questionsData) || questionsData.length === 0) {
    const err = new Error('questionsData must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const rows = questionsData.map((q, idx) => {
    if (!q.question || !q.options || !q.correctOption) {
      const err = new Error(`Question at index ${idx} is missing required fields`);
      err.status = 400;
      throw err;
    }
    return {
      question:      q.question,
      options:       q.options,
      correctOption: q.correctOption,
      explanation:   q.explanation   || null,
      orderIndex:    q.orderIndex    ?? idx,
      ...(q.testId      && { testId:     q.testId }),
      ...(q.difficulty  && { difficulty: q.difficulty }),
      ...(q.categoryId  && { categoryId: q.categoryId }),
      ...(q.topicId     && { topicId:    q.topicId }),
      ...(q.tags        && { tags:       q.tags }),
      ...(q.sourceRef   && { sourceRef:  q.sourceRef }),
    };
  });

  return prisma.aptitudeQuestion.createMany({ data: rows, skipDuplicates: true });
}

/**
 * Update a question. Partial update — only supplied fields are changed.
 */
export async function updateQuestion(id, data) {
  const existing = await prisma.aptitudeQuestion.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }

  if (data.correctOption && !['A', 'B', 'C', 'D'].includes(data.correctOption)) {
    const err = new Error('correctOption must be A, B, C, or D');
    err.status = 400;
    throw err;
  }

  const allowed = [
    'question', 'options', 'correctOption', 'explanation',
    'orderIndex', 'difficulty', 'categoryId', 'topicId',
    'tags', 'sourceRef', 'isActive',
  ];

  const payload = {};
  for (const key of allowed) {
    if (data[key] !== undefined) payload[key] = data[key];
  }

  return prisma.aptitudeQuestion.update({ where: { id }, data: payload });
}

/**
 * Delete a single question.
 */
export async function deleteQuestion(id) {
  const existing = await prisma.aptitudeQuestion.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }
  return prisma.aptitudeQuestion.delete({ where: { id } });
}

/**
 * Fetch N random questions — used by practice session bootstrapping.
 * Filters by category / topic / difficulty when those columns exist.
 */
export async function getRandomQuestions({ count = 10, categoryId, topicId, difficulty, excludeIds = [] }) {
  const where = { isActive: true };

  if (categoryId) where.categoryId = categoryId;
  if (topicId)    where.topicId    = topicId;
  if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
  if (excludeIds.length) where.id = { notIn: excludeIds };

  // Fetch a larger pool then slice — avoids a heavy ORDER BY RANDOM() on 100k rows.
  const pool = await prisma.aptitudeQuestion.findMany({
    where,
    take: count * 5,
    orderBy: { createdAt: 'desc' },
  });

  // Fisher-Yates shuffle on the pool then take `count`
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).map(sanitizeForStudent);
}

/**
 * Get question stats for admin dashboard.
 */
export async function getQuestionStats() {
  const [total, byDifficulty] = await Promise.all([
    prisma.aptitudeQuestion.count(),
    prisma.aptitudeQuestion.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byDifficulty: byDifficulty.map(r => ({ difficulty: r.difficulty, count: r._count.id })),
  };
}

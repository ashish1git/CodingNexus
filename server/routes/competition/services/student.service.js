import { randomUUID } from 'crypto';
import prisma from '../../../config/db.js';
import { formatDisplayName, generateStarterCode } from '../../../utils/helpers.js';
import { executeJudge0Submissions } from './shared.service.js';

export async function getCompetitions({ userId, status, difficulty }) {
  const now = new Date();
  let whereClause = { isActive: true };

  // Filter by status (ongoing, upcoming, past)
  if (status === 'ongoing') {
    whereClause.startTime = { lte: now };
    whereClause.endTime = { gte: now };
  } else if (status === 'upcoming') {
    whereClause.startTime = { gt: now };
  } else if (status === 'past') {
    whereClause.endTime = { lt: now };
  }

  // Filter by difficulty
  if (difficulty) {
    whereClause.difficulty = difficulty;
  }

  const competitions = await prisma.competition.findMany({
    where: whereClause,
    include: {
      problems: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          points: true,
          orderIndex: true
        },
        orderBy: { orderIndex: 'asc' }
      },
      registrations: {
        select: { userId: true }
      },
      submissions: {
        where: { userId },
        select: { id: true, status: true }
      },
      _count: {
        select: { registrations: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  // Add computed fields
  const competitionsWithStatus = competitions.map(comp => {
    const isRegistered = comp.registrations.some(reg => reg.userId === userId);
    const hasSubmitted = comp.submissions.some(s => s.status !== 'incomplete');
    const participantCount = comp._count.registrations;
    
    let compStatus = 'past';
    if (comp.startTime > now) {
      compStatus = 'upcoming';
    } else if (comp.endTime > now) {
      compStatus = 'ongoing';
    }

    return {
      ...comp,
      status: compStatus,
      isRegistered,
      hasSubmitted,
      participantCount,
      problemCount: comp.problems.length,
      registrations: undefined, // Remove from response
      submissions: undefined,
      _count: undefined
    };
  });

  return competitionsWithStatus;
}

export async function getCompetitionById({ competitionId, userId }) {
  const now = new Date();

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      problems: {
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          points: true,
          orderIndex: true,
          constraints: true,
          examples: true,
          testCases: true, // Include all test cases
          timeLimit: true,
          memoryLimit: true,
          // LeetCode-style function signature fields
          functionName: true,
          parameters: true,
          returnType: true,
          starterCode: true
        },
        orderBy: { orderIndex: 'asc' }
      },
      registrations: {
        where: { userId },
        select: { id: true }
      },
      submissions: {
        where: { userId },
        select: { 
          id: true,
          submittedAt: true,
          totalScore: true,
          status: true,
          problemSubmissions: {
            select: {
              problemId: true,
              code: true,
              language: true
            }
          }
        }
      },
      _count: {
        select: { registrations: true }
      }
    }
  });

  if (!competition) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  let status = 'past';
  if (competition.startTime > now) {
    status = 'upcoming';
  } else if (competition.endTime > now) {
    status = 'ongoing';
  }

  // Exclude incomplete submissions from hasSubmitted check
  const activeSubmissions = competition.submissions.filter(s => s.status !== 'incomplete');
  // Get the incomplete submission (if any) for loading saved code
  const incompleteSub = competition.submissions.find(s => s.status === 'incomplete');

  // Load draft codes for the current user (if any)
  const draftCodes = await prisma.draftCode.findMany({
    where: { competitionId, userId }
  });

  // Build a draft map: { problemId: { code, language } }
  const draftMap = {};
  draftCodes.forEach(d => {
    draftMap[d.problemId] = { code: d.code, language: d.language };
  });

  // Regenerate starterCode from current function signature (always fresh)
  const problemsWithFreshCode = competition.problems.map(p => ({
    ...p,
    starterCode: p.functionName || p.parameters ? generateStarterCode(p) : p.starterCode
  }));

  return {
    ...competition,
    problems: problemsWithFreshCode,
    status,
    isRegistered: competition.registrations.length > 0,
    hasSubmitted: activeSubmissions.length > 0,
    incompleteResubmit: incompleteSub ? true : false,
    incompleteSubmissionData: incompleteSub || null,
    draftCodes: draftMap,              // ← auto-saved code from DB recovery
    participantCount: competition._count.registrations,
    registrations: undefined,
    submissions: undefined,
    _count: undefined
  };
}

export async function getMySubmission({ competitionId, userId }) {
  const submission = await prisma.competitionSubmission.findUnique({
    where: {
      competitionId_userId: {
        competitionId,
        userId
      }
    },
    include: {
      problemSubmissions: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              points: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      }
    }
  });

  if (!submission) {
    const error = new Error('No submission found for this competition');
    error.statusCode = 404;
    throw error;
  }

  return {
    submissionId: submission.id,
    status: submission.status,
    totalScore: submission.totalScore,
    totalTime: submission.totalTime,
    submittedAt: submission.submittedAt,
    problems: submission.problemSubmissions.map(ps => ({
      problemId: ps.problemId,
      problemTitle: ps.problem.title,
      difficulty: ps.problem.difficulty,
      score: ps.score,
      maxScore: ps.maxScore,
      testsPassed: ps.testsPassed,
      totalTests: ps.totalTests,
      executionTime: ps.executionTime,
      memoryUsed: ps.memoryUsed,
      status: ps.status,
      errorMessage: ps.errorMessage,
      language: ps.language,
      code: ps.code,
      judgedAt: ps.judgedAt,
      manualMarks: ps.manualMarks,
      evaluatorComments: ps.evaluatorComments,
      isEvaluated: ps.isEvaluated
    }))
  };
}

export async function getLeaderboard({ competitionId }) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { showLeaderboard: true, title: true }
  });

  if (!competition) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  if (!competition.showLeaderboard) {
    return { leaderboard: [], disabled: true, message: 'Leaderboard is currently hidden' };
  }

  const submissions = await prisma.competitionSubmission.findMany({
    where: {
      competitionId,
      status: 'completed'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          moodleId: true,
          studentProfile: {
            select: {
              name: true,
              batch: true,
              division: true
            }
          }
        }
      },
      problemSubmissions: {
        select: {
          score: true,
          maxScore: true,
          status: true
        }
      }
    },
    orderBy: [
      { totalScore: 'desc' },
      { submittedAt: 'asc' },
      { totalTime: 'asc' }
    ]
  });

  // Compute proper ranks with tie-breaking:
  const leaderboard = [];
  let currentRank = 0;
  let previousEntry = null;

  for (const sub of submissions) {
    const entry = {
      userId: sub.userId,
      name: formatDisplayName(sub.user.studentProfile?.name) || sub.user.email,
      moodleId: sub.user.moodleId || sub.user.email.split('@')[0],
      batch: sub.user.studentProfile?.batch,
      division: sub.user.studentProfile?.division || '',
      totalScore: sub.totalScore,
      problemsSolved: sub.problemSubmissions.filter(p => p.status === 'accepted' || p.score > 0).length,
      totalProblems: sub.problemSubmissions.length,
      executionTime: sub.totalTime,
      submittedAt: sub.submittedAt
    };

    // Tied rank: same score AND same submission time => shared rank
    if (previousEntry === null ||
        previousEntry.totalScore !== entry.totalScore ||
        new Date(previousEntry.submittedAt).getTime() !== new Date(entry.submittedAt).getTime()) {
      currentRank = leaderboard.length + 1;
    }

    entry.rank = currentRank;
    leaderboard.push(entry);
    previousEntry = entry;
  }

  console.log('🔍 Leaderboard data sample:', leaderboard[0]);
  console.log('📊 Total entries:', leaderboard.length);

  return leaderboard;
}

export async function getTimerSync({ competitionId }) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { startTime: true, endTime: true }
  });

  if (!competition) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    serverTime: new Date().toISOString(),
    startTime: competition.startTime.toISOString(),
    endTime: competition.endTime.toISOString()
  };
}

export async function registerUser({ competitionId, userId }) {
  // Check if competition exists and is upcoming/ongoing
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      _count: { select: { registrations: true } }
    }
  });

  if (!competition) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  if (!competition.isActive) {
    const error = new Error('Competition is not active');
    error.statusCode = 400;
    throw error;
  }

  if (competition.endTime < new Date()) {
    const error = new Error('Competition has ended');
    error.statusCode = 400;
    throw error;
  }

  if (competition.maxParticipants && competition._count.registrations >= competition.maxParticipants) {
    const error = new Error('Competition is full');
    error.statusCode = 400;
    throw error;
  }

  // Check if already registered
  const existingRegistration = await prisma.competitionRegistration.findUnique({
    where: {
      competitionId_userId: {
        competitionId,
        userId
      }
    }
  });

  if (existingRegistration) {
    const error = new Error('Already registered for this competition');
    error.statusCode = 400;
    throw error;
  }

  // Create registration
  const registration = await prisma.competitionRegistration.create({
    data: {
      id: randomUUID(),
      competitionId,
      userId
    }
  });

  return { message: 'Successfully registered', registration };
}

export async function submitSolutions({ competitionId, userId, solutions, violationLog }) {
  // Check if competition exists and is ongoing
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      problems: true,
      registrations: {
        where: { userId }
      }
    }
  });

  if (!competition) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  if (competition.startTime > now) {
    const error = new Error('Competition has not started yet');
    error.statusCode = 400;
    throw error;
  }

  // Allow submissions for 15 seconds after endTime
  const GRACE_PERIOD = 15000;
  const timeAfterEnd = now - competition.endTime;
  if (timeAfterEnd > GRACE_PERIOD) {
    const error = new Error('Competition has ended');
    error.statusCode = 400;
    throw error;
  }

  if (competition.registrations.length === 0) {
    const error = new Error('You must register before submitting');
    error.statusCode = 400;
    throw error;
  }

  // Check if already submitted
  const existingSubmission = await prisma.competitionSubmission.findUnique({
    where: {
      competitionId_userId: {
        competitionId,
        userId
      }
    }
  });

  if (existingSubmission && existingSubmission.status !== 'incomplete') {
    const error = new Error('You have already submitted for this competition');
    error.statusCode = 400;
    throw error;
  }

  // Validate solutions
  if (!Array.isArray(solutions) || solutions.length === 0) {
    const error = new Error('At least one solution must be provided');
    error.statusCode = 400;
    throw error;
  }

  let competitionSubmissionId;
  if (existingSubmission && existingSubmission.status === 'incomplete') {
    competitionSubmissionId = existingSubmission.id;
    await prisma.competitionSubmission.update({
      where: { id: competitionSubmissionId },
      data: { status: 'pending', totalScore: 0, totalTime: 0, rank: null, violationLog: violationLog || null }
    });
    await prisma.problemSubmission.deleteMany({
      where: { competitionSubmissionId }
    });
  } else {
    competitionSubmissionId = randomUUID();
    await prisma.competitionSubmission.create({
      data: {
        id: competitionSubmissionId,
        competitionId,
        userId,
        status: 'pending',
        violationLog: violationLog || null
      }
    });
  }

  // Create problem submissions
  const problemSubmissions = await Promise.all(
    solutions.map(async (solution) => {
      const problem = competition.problems.find(p => p.id === solution.problemId);
      if (!problem) return null;

      const testCases = problem.testCases;
      const totalTests = Array.isArray(testCases) ? testCases.length : 0;

      return prisma.problemSubmission.create({
        data: {
          id: randomUUID(),
          competitionSubmissionId,
          problemId: solution.problemId,
          userId,
          code: solution.code,
          language: solution.language,
          maxScore: problem.points,
          totalTests,
          status: 'pending'
        }
      });
    })
  );

  const validSubmissions = problemSubmissions.filter(s => s !== null);

  // Execute Judge0 evaluation asynchronously
  executeJudge0Submissions(competitionSubmissionId, validSubmissions, competition.problems);

  return {
    message: 'Submission received. Your code is being judged.',
    submissionId: competitionSubmissionId,
    problemCount: validSubmissions.length
  };
}

export async function saveDraftCode({ competitionId, userId, problemId, code, language }) {
  if (!problemId || code === undefined || !language) {
    const error = new Error('Missing required fields: problemId, code, language');
    error.statusCode = 400;
    throw error;
  }

  const draft = await prisma.draftCode.upsert({
    where: {
      competitionId_userId_problemId: { competitionId, userId, problemId }
    },
    update: { code, language },
    create: { competitionId, userId, problemId, code, language }
  });

  return { success: true, draft: { id: draft.id, updatedAt: draft.updatedAt } };
}

export async function clearDrafts({ competitionId, userId }) {
  await prisma.draftCode.deleteMany({
    where: { competitionId, userId }
  });

  return { success: true };
}

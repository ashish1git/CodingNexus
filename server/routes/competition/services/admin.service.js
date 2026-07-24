import { randomUUID } from 'crypto';
import prisma from '../../../config/db.js';
import { generateStarterCode } from '../../../utils/helpers.js';
import { updateCompetitionScoreAsync } from './shared.service.js';

export async function getCompetitionSubmissions({ competitionId }) {
  const submissions = await prisma.competitionSubmission.findMany({
    where: {
      competitionId
    },
    include: {
      user: {
        include: {
          studentProfile: {
            select: {
              name: true,
              rollNo: true,
              batch: true
            }
          }
        }
      },
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
    },
    orderBy: [
      { totalScore: 'desc' },
      { submittedAt: 'asc' }
    ]
  });

  const formattedSubmissions = submissions.map(sub => ({
    submissionId: sub.id,
    userId: sub.userId,
    userName: sub.user.studentProfile?.name || sub.user.email,
    rollNo: sub.user.studentProfile?.rollNo,
    batch: sub.user.studentProfile?.batch,
    status: sub.status,
    totalScore: sub.totalScore,
    totalTime: sub.totalTime,
    submittedAt: sub.submittedAt,
    violationLog: sub.violationLog,
    problemSubmissions: sub.problemSubmissions.map(ps => ({
      id: ps.id,
      problemId: ps.problemId,
      problemTitle: ps.problem.title,
      difficulty: ps.problem.difficulty,
      code: ps.code,
      language: ps.language,
      score: ps.score,
      maxScore: ps.maxScore,
      testsPassed: ps.testsPassed,
      totalTests: ps.totalTests,
      executionTime: ps.executionTime,
      memoryUsed: ps.memoryUsed,
      status: ps.status,
      errorMessage: ps.errorMessage,
      testResults: ps.testResults,
      judgedAt: ps.judgedAt,
      manualMarks: ps.manualMarks,
      evaluatorComments: ps.evaluatorComments,
      evaluatedBy: ps.evaluatedBy,
      evaluatedAt: ps.evaluatedAt,
      isEvaluated: ps.isEvaluated
    }))
  }));

  return formattedSubmissions;
}

export async function markSubmissionIncomplete({ submissionId }) {
  const submission = await prisma.competitionSubmission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.competitionSubmission.update({
    where: { id: submissionId },
    data: { status: 'incomplete', totalScore: 0, totalTime: 0, rank: null }
  });

  console.log(`✅ Submission ${submissionId} marked incomplete — student can resubmit`);
  return { message: 'Submission marked incomplete — student can resubmit with previous code' };
}

export async function createCompetition({ competitionData, userId }) {
  const { title, description, category, difficulty, startTime, endTime, duration, type, prizePool, maxParticipants, problems } = competitionData;

  const competitionId = randomUUID();

  const competition = await prisma.competition.create({
    data: {
      id: competitionId,
      title,
      description,
      category,
      difficulty,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      type,
      prizePool,
      maxParticipants,
      createdBy: userId,
      updatedAt: new Date(),
      problems: {
        create: (problems || []).map((problem, index) => ({
          id: randomUUID(),
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          points: problem.points,
          orderIndex: index,
          constraints: problem.constraints || [],
          examples: problem.examples || [],
          testCases: problem.testCases || [],
          timeLimit: problem.timeLimit || 3000,
          memoryLimit: problem.memoryLimit || 256,
          expectedComplexity: problem.expectedComplexity || null,
          expectedSpace: problem.expectedSpace || null,
          functionName: problem.functionName || 'solution',
          parameters: problem.parameters || [],
          returnType: problem.returnType || 'int',
          starterCode: problem.starterCode || {},
          updatedAt: new Date()
        }))
      }
    },
    include: {
      problems: true
    }
  });

  return { message: 'Competition created successfully', competition };
}

export async function updateCompetition({ competitionId, competitionData }) {
  const { title, description, category, difficulty, startTime, endTime, duration, type, prizePool, maxParticipants, isActive, showLeaderboard, problems } = competitionData;

  await prisma.competition.update({
    where: { id: competitionId },
    data: {
      title,
      description,
      category,
      difficulty,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration,
      type,
      prizePool,
      maxParticipants,
      isActive,
      showLeaderboard: showLeaderboard !== undefined ? showLeaderboard : undefined,
      updatedAt: new Date()
    }
  });

  if (problems && Array.isArray(problems)) {
    const existingProblems = await prisma.problem.findMany({
      where: { competitionId },
      select: { id: true }
    });
    const existingIds = new Set(existingProblems.map(p => p.id));
    const incomingIds = new Set(problems.filter(p => p.id).map(p => p.id));

    const idsToDelete = [...existingIds].filter(eid => !incomingIds.has(eid));
    if (idsToDelete.length > 0) {
      await prisma.problem.deleteMany({
        where: { id: { in: idsToDelete } }
      });
    }

    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      const freshStarterCode = generateStarterCode({
        functionName: p.functionName || 'solution',
        parameters: p.parameters || [{ name: 'nums', type: 'int[]' }],
        returnType: p.returnType || 'int'
      });
      const problemData = {
        title: p.title,
        description: p.description,
        difficulty: p.difficulty || 'medium',
        points: p.points || 100,
        orderIndex: i,
        constraints: p.constraints || [],
        examples: p.examples || [],
        testCases: p.testCases || [],
        timeLimit: p.timeLimit || 3000,
        memoryLimit: p.memoryLimit || 256,
        expectedComplexity: p.expectedComplexity || '',
        expectedSpace: p.expectedSpace || '',
        functionName: p.functionName || 'solution',
        parameters: p.parameters || [{ name: 'nums', type: 'int[]' }],
        returnType: p.returnType || 'int',
        starterCode: freshStarterCode
      };

      if (p.id && existingIds.has(p.id)) {
        await prisma.problem.update({
          where: { id: p.id },
          data: problemData
        });
      } else {
        await prisma.problem.create({
          data: {
            id: randomUUID(),
            competitionId,
            ...problemData
          }
        });
      }
    }
  }

  const updatedCompetition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      problems: {
        orderBy: { orderIndex: 'asc' },
        select: { id: true, title: true, difficulty: true, points: true, orderIndex: true }
      }
    }
  });

  return { message: 'Competition updated successfully', competition: updatedCompetition };
}

export async function deleteCompetition({ competitionId }) {
  await prisma.competition.delete({
    where: { id: competitionId }
  });

  return { message: 'Competition deleted successfully' };
}

export async function getCompetitionProblems({ competitionId }) {
  const problems = await prisma.problem.findMany({
    where: { competitionId },
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      points: true,
      orderIndex: true
    }
  });

  return problems;
}

export async function getProblemSubmissions({ competitionId, problemId }) {
  const submissions = await prisma.problemSubmission.findMany({
    where: {
      problemId,
      problem: {
        competitionId
      }
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
              rollNo: true
            }
          }
        }
      },
      problem: {
        select: {
          title: true,
          points: true
        }
      }
    },
    orderBy: [
      { submittedAt: 'desc' }
    ]
  });

  const formattedSubmissions = submissions.map(sub => ({
    ...sub,
    submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : new Date().toISOString(),
    user: sub.user || { id: null, email: 'Unknown', moodleId: 'N/A', studentProfile: { name: 'N/A', rollNo: 'N/A' } }
  }));

  return formattedSubmissions;
}

export async function evaluateSubmission({ competitionId, problemId, submissionId, marks, comments, evaluatorId, ipAddress }) {
  if (marks === undefined || marks === null) {
    const error = new Error('Marks are required');
    error.statusCode = 400;
    throw error;
  }

  const marksNum = parseFloat(marks);
  if (isNaN(marksNum) || marksNum < 0 || marksNum > 1000) {
    const error = new Error('Marks must be between 0 and 1000');
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentSubmission = await tx.problemSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        manualMarks: true,
        evaluatorComments: true,
        isEvaluated: true,
        competitionSubmissionId: true
      }
    });

    if (!currentSubmission) {
      const error = new Error('Submission not found');
      error.statusCode = 404;
      throw error;
    }

    const evaluator = await tx.user.findUnique({
      where: { id: evaluatorId },
      select: {
        role: true,
        email: true,
        adminProfile: {
          select: { name: true }
        }
      }
    });

    if (!evaluator) {
      const error = new Error('Evaluator not found');
      error.statusCode = 404;
      throw error;
    }

    const isUpdate = currentSubmission.isEvaluated;
    const previousMarks = currentSubmission.manualMarks;
    const previousComments = currentSubmission.evaluatorComments;
    const evaluatorName = evaluator.adminProfile?.name || evaluator.email;

    const submission = await tx.problemSubmission.update({
      where: { id: submissionId },
      data: {
        manualMarks: marksNum,
        evaluatorComments: comments || null,
        evaluatedBy: evaluatorId,
        evaluatedAt: new Date(),
        isEvaluated: true,
        score: Math.round(marksNum)
      }
    });

    await tx.submissionEvaluation.create({
      data: {
        submissionId,
        evaluatorId,
        evaluatorName,
        evaluatorRole: evaluator.role,
        marks: marksNum,
        comments: comments || null,
        action: isUpdate ? 'update' : 'create',
        previousMarks: isUpdate ? previousMarks : null,
        previousComments: isUpdate ? previousComments : null,
        ipAddress: ipAddress || null
      }
    });

    return { submission, isUpdate, evaluatorName };
  });

  updateCompetitionScoreAsync(result.submission.competitionSubmissionId).catch(err => {
    console.error('Error updating competition score:', err);
  });

  return {
    message: result.isUpdate ? 'Evaluation updated successfully' : 'Evaluation saved successfully',
    submission: result.submission,
    action: result.isUpdate ? 'update' : 'create',
    evaluatedBy: result.evaluatorName
  };
}

export async function getEvaluationHistory({ submissionId }) {
  const history = await prisma.submissionEvaluation.findMany({
    where: { submissionId },
    orderBy: { createdAt: 'desc' }
  });

  return history;
}

export async function getEvaluations({ competitionId }) {
  const evaluations = await prisma.submissionEvaluation.findMany({
    where: {
      submission: {
        problem: {
          competitionId
        }
      }
    },
    include: {
      submission: {
        include: {
          user: {
            include: {
              studentProfile: {
                select: {
                  name: true,
                  rollNo: true
                }
              }
            }
          },
          problem: {
            select: {
              title: true,
              competitionId: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedEvaluations = evaluations.map(ev => ({
    id: ev.id,
    evaluatorName: ev.evaluatorName,
    evaluatorRole: ev.evaluatorRole,
    studentName: ev.submission.user.studentProfile?.name || 'N/A',
    rollNo: ev.submission.user.studentProfile?.rollNo || 'N/A',
    problemTitle: ev.submission.problem.title,
    marks: ev.marks,
    comments: ev.comments,
    action: ev.action,
    previousMarks: ev.previousMarks,
    createdAt: ev.createdAt,
    ipAddress: ev.ipAddress
  }));

  return formattedEvaluations;
}

export async function getEvaluatorActivity({ competitionId }) {
  const evaluations = await prisma.submissionEvaluation.findMany({
    where: {
      submission: {
        problem: {
          competitionId
        }
      }
    },
    include: {
      submission: {
        include: {
          problem: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  const activityMap = {};
  evaluations.forEach(ev => {
    if (!activityMap[ev.evaluatorId]) {
      activityMap[ev.evaluatorId] = {
        evaluatorId: ev.evaluatorId,
        evaluatorName: ev.evaluatorName,
        evaluatorRole: ev.evaluatorRole,
        totalEvaluations: 0,
        creates: 0,
        updates: 0,
        reviews: 0,
        problemsEvaluated: new Set(),
        lastActivity: ev.createdAt
      };
    }
    
    const activity = activityMap[ev.evaluatorId];
    activity.totalEvaluations++;
    
    if (ev.action === 'create') activity.creates++;
    else if (ev.action === 'update') activity.updates++;
    else if (ev.action === 'review') activity.reviews++;
    
    activity.problemsEvaluated.add(ev.submission.problem.title);
    
    if (new Date(ev.createdAt) > new Date(activity.lastActivity)) {
      activity.lastActivity = ev.createdAt;
    }
  });

  const activitySummary = Object.values(activityMap).map(activity => ({
    ...activity,
    problemsEvaluated: Array.from(activity.problemsEvaluated)
  })).sort((a, b) => b.totalEvaluations - a.totalEvaluations);

  return activitySummary;
}

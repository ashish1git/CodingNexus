import express from 'express';
import axios from 'axios';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { wrapCodeForExecution } from '../utils/codeWrapper.js';

const router = express.Router();

// Judge0 Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://4.247.146.10';

// Language mapping for Judge0
const LANGUAGE_MAP = {
  'c': 50,        // C (GCC 9.2.0)
  'cpp': 54,      // C++ (GCC 9.2.0)
  'java': 62,     // Java (OpenJDK 13.0.1)
  'python': 71,   // Python (3.8.1)
  'javascript': 63 // JavaScript (Node.js 12.14.0)
};

// Get all competitions (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, difficulty } = req.query;
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
          where: { userId: req.user.id },
          select: { id: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Add computed fields
    const competitionsWithStatus = competitions.map(comp => {
      const isRegistered = comp.registrations.some(reg => reg.userId === req.user.id);
      const hasSubmitted = comp.submissions.length > 0;
      const participantCount = comp._count.registrations;
      
      let status = 'past';
      if (comp.startTime > now) {
        status = 'upcoming';
      } else if (comp.endTime > now) {
        status = 'ongoing';
      }

      return {
        ...comp,
        status,
        isRegistered,
        hasSubmitted,
        participantCount,
        problemCount: comp.problems.length,
        registrations: undefined, // Remove from response
        submissions: undefined,
        _count: undefined
      };
    });

    res.json(competitionsWithStatus);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get my submission details for a competition
router.get('/:id/my-submission', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await prisma.competitionSubmission.findUnique({
      where: {
        competitionId_userId: {
          competitionId: id,
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
                maxScore: true
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
      return res.status(404).json({ error: 'No submission found for this competition' });
    }

    const detailedResults = {
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
        testResults: ps.testResults, // JSON with per-testcase details
        language: ps.language,
        judgedAt: ps.judgedAt
      }))
    };

    res.json(detailedResults);
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
});

// Get leaderboard for competition
router.get('/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await prisma.competitionSubmission.findMany({
      where: {
        competitionId: id,
        status: 'completed'
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
          select: {
            score: true,
            maxScore: true,
            status: true
          }
        }
      },
      orderBy: [
        { totalScore: 'desc' },
        { totalTime: 'asc' },
        { submittedAt: 'asc' }
      ]
    });

    const leaderboard = submissions.map((sub, index) => ({
      rank: index + 1,
      userId: sub.userId,
      name: sub.user.studentProfile?.name || sub.user.email,
      rollNo: sub.user.studentProfile?.rollNo,
      batch: sub.user.studentProfile?.batch,
      totalScore: sub.totalScore,
      problemsSolved: sub.problemSubmissions.filter(p => p.status === 'accepted').length,
      totalProblems: sub.problemSubmissions.length,
      executionTime: sub.totalTime,
      submittedAt: sub.submittedAt
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get all submissions for a competition (Admin only)
router.get('/:id/submissions', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await prisma.competitionSubmission.findMany({
      where: {
        competitionId: id
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
      problemSubmissions: sub.problemSubmissions.map(ps => ({
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
        judgedAt: ps.judgedAt
      }))
    }));

    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get single competition with problems
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const competition = await prisma.competition.findUnique({
      where: { id },
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
            memoryLimit: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        registrations: {
          where: { userId: req.user.id },
          select: { id: true }
        },
        submissions: {
          where: { userId: req.user.id },
          select: { 
            id: true,
            submittedAt: true,
            totalScore: true,
            status: true
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    let status = 'past';
    if (competition.startTime > now) {
      status = 'upcoming';
    } else if (competition.endTime > now) {
      status = 'ongoing';
    }

    res.json({
      ...competition,
      status,
      isRegistered: competition.registrations.length > 0,
      hasSubmitted: competition.submissions.length > 0,
      participantCount: competition._count.registrations,
      registrations: undefined,
      _count: undefined
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// Register for competition
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if competition exists and is upcoming/ongoing
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!competition.isActive) {
      return res.status(400).json({ error: 'Competition is not active' });
    }

    if (competition.endTime < new Date()) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    if (competition.maxParticipants && competition._count.registrations >= competition.maxParticipants) {
      return res.status(400).json({ error: 'Competition is full' });
    }

    // Check if already registered
    const existingRegistration = await prisma.competitionRegistration.findUnique({
      where: {
        competitionId_userId: {
          competitionId: id,
          userId
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'Already registered for this competition' });
    }

    // Create registration
    const registration = await prisma.competitionRegistration.create({
      data: {
        competitionId: id,
        userId
      }
    });

    res.json({ message: 'Successfully registered', registration });
  } catch (error) {
    console.error('Error registering for competition:', error);
    res.status(500).json({ error: 'Failed to register for competition' });
  }
});

// Submit solutions for competition
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { solutions } = req.body; // Array of {problemId, code, language}

    // Check if competition exists and is ongoing
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        problems: true,
        registrations: {
          where: { userId }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const now = new Date();
    if (competition.startTime > now) {
      return res.status(400).json({ error: 'Competition has not started yet' });
    }

    if (competition.endTime < now) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    if (competition.registrations.length === 0) {
      return res.status(400).json({ error: 'You must register before submitting' });
    }

    // Check if already submitted
    const existingSubmission = await prisma.competitionSubmission.findUnique({
      where: {
        competitionId_userId: {
          competitionId: id,
          userId
        }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted for this competition' });
    }

    // Validate solutions
    if (!Array.isArray(solutions) || solutions.length === 0) {
      return res.status(400).json({ error: 'At least one solution must be provided' });
    }

    // Create competition submission
    const competitionSubmission = await prisma.competitionSubmission.create({
      data: {
        competitionId: id,
        userId,
        status: 'pending'
      }
    });

    // Create problem submissions
    const problemSubmissions = await Promise.all(
      solutions.map(async (solution) => {
        const problem = competition.problems.find(p => p.id === solution.problemId);
        if (!problem) return null;

        const testCases = problem.testCases;
        const totalTests = Array.isArray(testCases) ? testCases.length : 0;

        return prisma.problemSubmission.create({
          data: {
            competitionSubmissionId: competitionSubmission.id,
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

    // Filter out null submissions
    const validSubmissions = problemSubmissions.filter(s => s !== null);

    res.json({
      message: 'Submission received. Your code is being judged.',
      submissionId: competitionSubmission.id,
      problemCount: validSubmissions.length
    });

    // Execute Judge0 evaluation asynchronously (don't wait for results)
    executeJudge0Submissions(competitionSubmission.id, validSubmissions, competition.problems);
  } catch (error) {
    console.error('Error submitting competition:', error);
    res.status(500).json({ error: 'Failed to submit competition' });
  }
});

/**
 * Execute Judge0 submissions asynchronously
 * This runs in background after responding to user
 */
async function executeJudge0Submissions(submissionId, problemSubmissions, problems) {
  try {
    console.log(`🚀 Starting Judge0 execution for submission ${submissionId}`);
    
    for (const submission of problemSubmissions) {
      try {
        // Find problem details
        const problem = problems.find(p => p.id === submission.problemId);
        if (!problem || !problem.testCases) {
          console.error(`No test cases found for problem ${submission.problemId}`);
          continue;
        }

        // Update status to judging
        await prisma.problemSubmission.update({
          where: { id: submission.id },
          data: { status: 'judging' }
        });

        const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
        const languageId = LANGUAGE_MAP[submission.language.toLowerCase()];

        if (!languageId) {
          await prisma.problemSubmission.update({
            where: { id: submission.id },
            data: {
              status: 'compile-error',
              errorMessage: `Unsupported language: ${submission.language}`,
              judgedAt: new Date()
            }
          });
          continue;
        }

        let totalPassed = 0;
        let totalTime = 0;
        let totalMemory = 0;
        const testResults = [];

        // Run each test case
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          
          try {
            // Wrap user code with test harness if problem has function signature
            let executableCode = submission.code;
            if (problem.parameters && problem.functionName) {
              executableCode = wrapCodeForExecution(
                submission.code,
                submission.language,
                problem,
                testCase
              );
            }

            // Submit to Judge0 with wait=true for synchronous result
            const judge0Response = await axios.post(
              `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
              {
                source_code: executableCode,
                language_id: languageId,
                stdin: problem.parameters ? '' : (testCase.input || ''), // No stdin for function-only
                expected_output: testCase.output || '',
                cpu_time_limit: problem.timeLimit || 2, // seconds
                memory_limit: problem.memoryLimit || 128000 // KB
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000 // 30 seconds timeout
              }
            );

            const result = judge0Response.data;
            const stdout = (result.stdout || '').trim();
            const expected = (testCase.output || '').trim();
            const passed = stdout === expected && result.status?.id === 3; // 3 = Accepted

            if (passed) totalPassed++;
            
            totalTime += parseFloat(result.time || 0) * 1000; // Convert to ms
            totalMemory = Math.max(totalMemory, result.memory || 0);

            testResults.push({
              testCase: i + 1,
              input: testCase.input,
              expectedOutput: expected,
              actualOutput: stdout,
              passed,
              time: result.time,
              memory: result.memory,
              status: result.status?.description || 'Unknown',
              stderr: result.stderr,
              compile_output: result.compile_output
            });

          } catch (testError) {
            console.error(`Test case ${i + 1} execution error:`, testError.message);
            testResults.push({
              testCase: i + 1,
              passed: false,
              error: testError.message
            });
          }
        }

        // Calculate score
        const scorePercentage = testCases.length > 0 ? (totalPassed / testCases.length) : 0;
        const finalScore = Math.round(scorePercentage * submission.maxScore);

        // Determine final status
        let finalStatus = 'wrong-answer';
        if (totalPassed === testCases.length) {
          finalStatus = 'accepted';
        } else if (testResults.some(t => t.status === 'Time Limit Exceeded')) {
          finalStatus = 'tle';
        } else if (testResults.some(t => t.status === 'Runtime Error')) {
          finalStatus = 'runtime-error';
        } else if (testResults.some(t => t.compile_output)) {
          finalStatus = 'compile-error';
        }

        // Update problem submission with results
        await prisma.problemSubmission.update({
          where: { id: submission.id },
          data: {
            status: finalStatus,
            score: finalScore,
            testsPassed: totalPassed,
            executionTime: Math.round(totalTime),
            memoryUsed: totalMemory,
            testResults: testResults,
            judgedAt: new Date()
          }
        });

        console.log(`✅ Problem ${submission.problemId}: ${totalPassed}/${testCases.length} tests passed`);

      } catch (problemError) {
        console.error(`Error judging problem ${submission.problemId}:`, problemError.message);
        
        await prisma.problemSubmission.update({
          where: { id: submission.id },
          data: {
            status: 'runtime-error',
            errorMessage: problemError.message,
            judgedAt: new Date()
          }
        });
      }
    }

    // Update competition submission status and total score
    const updatedSubmissions = await prisma.problemSubmission.findMany({
      where: { competitionSubmissionId: submissionId }
    });

    const totalScore = updatedSubmissions.reduce((sum, s) => sum + s.score, 0);
    const totalTime = updatedSubmissions.reduce((sum, s) => sum + s.executionTime, 0);
    const allCompleted = updatedSubmissions.every(s => s.status !== 'pending' && s.status !== 'judging');

    await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: allCompleted ? 'completed' : 'judging',
        totalScore,
        totalTime
      }
    });

    console.log(`🎉 Competition submission ${submissionId} completed with score ${totalScore}`);

  } catch (error) {
    console.error(`❌ Judge0 execution failed for submission ${submissionId}:`, error.message);
    
    // Mark submission as failed
    await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: { status: 'failed' }
    });
  }
}

// Create competition (Admin only)
router.post('/', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { title, description, category, difficulty, startTime, endTime, duration, type, prizePool, maxParticipants, problems } = req.body;


    const competition = await prisma.competition.create({
      data: {
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
        createdBy: req.user.id,
        problems: {
          create: problems.map((problem, index) => ({
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            points: problem.points,
            orderIndex: index,
            constraints: problem.constraints || [],
            examples: problem.examples || [],
            testCases: problem.testCases || [],
            timeLimit: problem.timeLimit || 3000,
            memoryLimit: problem.memoryLimit || 256
          }))
        }
      },
      include: {
        problems: true
      }
    });

    res.status(201).json({ message: 'Competition created successfully', competition });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// Update competition (Admin only)
router.put('/:id', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, startTime, endTime, duration, type, prizePool, maxParticipants, isActive } = req.body;

    const competition = await prisma.competition.update({
      where: { id },
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
        isActive
      }
    });

    res.json({ message: 'Competition updated successfully', competition });
  } catch (error) {
    console.error('Error updating competition:', error);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// Delete competition (Admin only)
router.delete('/:id', authenticate, authorizeRole('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.competition.delete({
      where: { id }
    });

    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

export default router;

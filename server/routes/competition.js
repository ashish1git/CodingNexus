import express from 'express';
import axios from 'axios';
import { randomUUID } from 'crypto';
import prisma from '../config/db.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { wrapCodeForExecution } from '../utils/codeWrapper.js';

const router = express.Router();

// Judge0 Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://64.227.149.20:2358';

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
        language: ps.language,
        code: ps.code,
        judgedAt: ps.judgedAt,
        manualMarks: ps.manualMarks,
        evaluatorComments: ps.evaluatorComments,
        isEvaluated: ps.isEvaluated
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
        status: 'completed',
        user: {
          email: {
            notIn: ['23106064@student.mu.ac.in', '23106031@student.mu.ac.in', '23106025@student.mu.ac.in']
          }
        }
      },
      include: {
        user: {
          include: {
            Student: {
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
      name: sub.user.Student?.name || sub.user.email,
      rollNo: sub.user.Student?.rollNo,
      batch: sub.user.Student?.batch,
      totalScore: sub.totalScore,
      // Count problems that are either accepted OR evaluated (have score > 0)
      problemsSolved: sub.problemSubmissions.filter(p => p.status === 'accepted' || p.score > 0).length,
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
            Student: {
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
      userName: sub.user.Student?.name || sub.user.email,
      rollNo: sub.user.Student?.rollNo,
      batch: sub.user.Student?.batch,
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
        judgedAt: ps.judgedAt,
        manualMarks: ps.manualMarks,
        evaluatorComments: ps.evaluatorComments,
        evaluatedBy: ps.evaluatedBy,
        evaluatedAt: ps.evaluatedAt,
        isEvaluated: ps.isEvaluated
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
        id: randomUUID(),
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
    const competitionSubmissionId = randomUUID();
    const competitionSubmission = await prisma.competitionSubmission.create({
      data: {
        id: competitionSubmissionId,
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
            id: randomUUID(),
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
            // Parse test case input if it's a string and problem has parameters
            let parsedInput = testCase.input;
            if (typeof testCase.input === 'string' && problem.parameters?.length > 0) {
              // Parse "5, 3" or "5,3" into [5, 3]
              parsedInput = testCase.input.split(',').map(v => {
                const trimmed = v.trim();
                // Try to parse as number, otherwise keep as string
                return isNaN(trimmed) ? trimmed : (trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed));
              });
            }
            
            // Wrap user code with test harness if problem has function signature
            let executableCode = submission.code;
            if (problem.parameters && problem.functionName) {
              executableCode = wrapCodeForExecution(
                submission.code,
                submission.language,
                problem,
                {
                  ...testCase,
                  input: parsedInput
                }
              );
            }

            // Submit to Judge0 with wait=true for synchronous result
            const judge0Payload = {
              source_code: executableCode,
              language_id: languageId
            };
            
            // Add stdin if problem doesn't use parameters (stdin-based)
            if (!problem.parameters) {
              judge0Payload.stdin = testCase.input || '';
            }
            
            console.log(`[Judge0 Request] TestCase ${i + 1}:`, JSON.stringify({
              language_id: judge0Payload.language_id,
              has_stdin: !!judge0Payload.stdin,
              source_code_len: judge0Payload.source_code.length
            }, null, 2));

            const judge0Response = await axios.post(
              `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
              judge0Payload,
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000 // 60 seconds timeout
              }
            );
            
            console.log(`[Judge0 Response Received] TestCase ${i + 1}`);

            const result = judge0Response.data;
            
            console.log(`[Judge0 Response] TestCase ${i + 1}:`, JSON.stringify({
              status_id: result.status?.id,
              status_desc: result.status?.description,
              stdout: (result.stdout || '').substring(0, 100),
              stderr: (result.stderr || '').substring(0, 100),
              compile_output: (result.compile_output || '').substring(0, 100),
              time: result.time,
              memory: result.memory
            }, null, 2));
            
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
              stderr: result.stderr || (result.compile_output ? 'Compilation Error' : ''),
              compile_output: result.compile_output
            });

          } catch (testError) {
            console.error(`❌ Test case ${i + 1} FAILED:`, testError.message);
            console.error('Full error:', testError);
            if (testError.response) {
              console.error('Judge0 HTTP Status:', testError.response.status);
              console.error('Judge0 Error Data:', JSON.stringify(testError.response.data, null, 2));
            } else if (testError.code) {
              console.error('Error Code:', testError.code);
            }
            testResults.push({
              testCase: i + 1,
              passed: false,
              error: testError.response?.data?.message || testError.message
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
        createdBy: req.user.id,
        updatedAt: new Date(),
        problems: {
          create: problems.map((problem, index) => ({
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
            updatedAt: new Date()
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create competition', details: error.message });
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
        isActive,
        updatedAt: new Date()
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

// Get all problems for a competition (Admin only - for evaluation)
router.get('/:id/problems', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const problems = await prisma.problem.findMany({
      where: { competitionId: id },
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

    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get all submissions for a specific problem (Admin only - for evaluation)
router.get('/:competitionId/problems/:problemId/submissions', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { competitionId, problemId } = req.params;

    // Optimized query with minimal fields
    const submissions = await prisma.problemSubmission.findMany({
      where: {
        problemId: problemId,
        problem: {
          competitionId: competitionId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            moodleId: true,
            Student: {
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

    // Ensure submittedAt is properly formatted and user data is present
    const formattedSubmissions = submissions.map(sub => ({
      ...sub,
      submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : new Date().toISOString(),
      user: sub.user || { id: null, email: 'Unknown', moodleId: 'N/A', Student: { name: 'N/A', rollNo: 'N/A' } }
    }));

    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Save manual evaluation for a submission (Admin only) - OPTIMIZED WITH TRANSACTIONS
router.post('/:competitionId/problems/:problemId/submissions/:submissionId/evaluate', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, comments } = req.body;
    const evaluatorId = req.user.id;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ error: 'Marks are required' });
    }

    const marksNum = parseFloat(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      return res.status(400).json({ error: 'Marks must be between 0 and 100' });
    }

    // Use transaction to combine multiple operations efficiently
    const result = await prisma.$transaction(async (tx) => {
      // Get submission with minimal fields for evaluation
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
        throw new Error('Submission not found');
      }

      // Get evaluator info for history record
      const evaluator = await tx.user.findUnique({
        where: { id: evaluatorId },
        select: {
          role: true,
          email: true,
          Admin: {
            select: { name: true }
          }
        }
      });

      if (!evaluator) {
        throw new Error('Evaluator not found');
      }

      const isUpdate = currentSubmission.isEvaluated;
      const previousMarks = currentSubmission.manualMarks;
      const previousComments = currentSubmission.evaluatorComments;
      const evaluatorName = evaluator.Admin?.name || evaluator.email;

      // Update submission
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

      // Create evaluation history record
      await tx.submissionEvaluation.create({
        data: {
          submissionId: submissionId,
          evaluatorId: evaluatorId,
          evaluatorName: evaluatorName,
          evaluatorRole: evaluator.role,
          marks: marksNum,
          comments: comments || null,
          action: isUpdate ? 'update' : 'create',
          previousMarks: isUpdate ? previousMarks : null,
          previousComments: isUpdate ? previousComments : null,
          ipAddress: req.ip || req.connection.remoteAddress
        }
      });

      return { submission, isUpdate, evaluatorName };
    });

    // Update competition score asynchronously (non-blocking)
    updateCompetitionScoreAsync(result.submission.competitionSubmissionId).catch(err => {
      console.error('Error updating competition score:', err);
    });

    res.json({ 
      message: result.isUpdate ? 'Evaluation updated successfully' : 'Evaluation saved successfully',
      submission: result.submission,
      action: result.isUpdate ? 'update' : 'create',
      evaluatedBy: result.evaluatorName
    });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
});

// Helper function to update competition score asynchronously
async function updateCompetitionScoreAsync(competitionSubmissionId) {
  try {
    const competitionSubmission = await prisma.competitionSubmission.findUnique({
      where: { id: competitionSubmissionId },
      select: {
        id: true,
        problemSubmissions: {
          select: { score: true }
        }
      }
    });

    if (competitionSubmission) {
      const totalScore = competitionSubmission.problemSubmissions.reduce((sum, sub) => sum + sub.score, 0);
      await prisma.competitionSubmission.update({
        where: { id: competitionSubmission.id },
        data: { totalScore }
      });
    }
  } catch (error) {
    console.error('Error in async score update:', error);
  }
}

// Get evaluation history for a submission (Admin only)
router.get('/:competitionId/problems/:problemId/submissions/:submissionId/history', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { submissionId } = req.params;

    const history = await prisma.submissionEvaluation.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation history' });
  }
});

// Get all evaluations for a competition (Admin only) - See who evaluated what
router.get('/:competitionId/evaluations', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { competitionId } = req.params;

    const evaluations = await prisma.submissionEvaluation.findMany({
      where: {
        submission: {
          problem: {
            competitionId: competitionId
          }
        }
      },
      include: {
        submission: {
          include: {
            user: {
              include: {
                Student: {
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
      studentName: ev.submission.user.Student?.name || 'N/A',
      rollNo: ev.submission.user.Student?.rollNo || 'N/A',
      problemTitle: ev.submission.problem.title,
      marks: ev.marks,
      comments: ev.comments,
      action: ev.action,
      previousMarks: ev.previousMarks,
      createdAt: ev.createdAt,
      ipAddress: ev.ipAddress
    }));

    res.json(formattedEvaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Get evaluator activity summary (Admin only) - Who evaluated how many
router.get('/:competitionId/evaluator-activity', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { competitionId } = req.params;

    const evaluations = await prisma.submissionEvaluation.findMany({
      where: {
        submission: {
          problem: {
            competitionId: competitionId
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

    // Group by evaluator
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

    // Convert to array and format
    const activitySummary = Object.values(activityMap).map(activity => ({
      ...activity,
      problemsEvaluated: Array.from(activity.problemsEvaluated)
    })).sort((a, b) => b.totalEvaluations - a.totalEvaluations);

    res.json(activitySummary);
  } catch (error) {
    console.error('Error fetching evaluator activity:', error);
    res.status(500).json({ error: 'Failed to fetch evaluator activity' });
  }
});

export default router;


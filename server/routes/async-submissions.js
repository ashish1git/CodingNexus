import express from 'express';
import axios from 'axios';
import { randomUUID } from 'crypto';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { wrapCodeForExecution } from '../utils/codeWrapper.js';

const router = express.Router();

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://64.227.149.20:2358';

const LANGUAGE_MAP = {
  'c': 50,
  'cpp': 54,
  'java': 62,
  'python': 71,
  'javascript': 63
};

/**
 * RUN CODE ENDPOINT - Quick testing without saving
 * Uses Judge0 with wait=true for immediate results
 * Only runs against sample/visible test cases
 * 
 * ✅ Immediate response
 * ✅ No database save
 * ✅ For "Run Code" button
 */
router.post('/:problemId/run', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    // Get problem with test cases (testCases is a JSON field, not a relation)
    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const langId = LANGUAGE_MAP[language.toLowerCase()];
    if (!langId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // Get only sample/visible test cases for "Run" (not all test cases)
    // Admin UI uses 'hidden' field - we want non-hidden ones for sample testing
    const testCases = Array.isArray(problem.testCases) 
      ? problem.testCases.filter(tc => !tc.hidden).slice(0, 3) // Max 3 visible tests
      : [];

    if (testCases.length === 0) {
      // If no visible test cases, use first 3 regardless
      const allCases = Array.isArray(problem.testCases) ? problem.testCases.slice(0, 3) : [];
      if (allCases.length > 0) {
        testCases.push(...allCases);
      } else {
        testCases.push({ input: '', output: '' });
      }
    }

    console.log(`🏃 Running code for problem ${problemId} with ${testCases.length} test cases`);

    const results = [];
    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;
    let compilationError = null;

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // Wrap code if it's a function-based problem
        let execCode = code;
        if (problem.parameters && problem.functionName) {
          execCode = wrapCodeForExecution(code, language, problem, testCase);
        }

        // Submit to Judge0 with wait=true for immediate result
        const judge0Response = await axios.post(
          `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
          {
            source_code: execCode,
            language_id: langId,
            stdin: (!problem.parameters) ? (testCase.input || '') : '',
            expected_output: testCase.expectedOutput || null,
            cpu_time_limit: 5,
            memory_limit: 128000
          },
          { timeout: 15000 }
        );

        const result = judge0Response.data;
        
        // Judge0 status codes:
        // 1 = In Queue, 2 = Processing, 3 = Accepted, 4 = Wrong Answer
        // 5 = Time Limit, 6 = Compilation Error, 7-12 = Runtime Errors
        const statusId = result.status?.id;
        
        // Check for compilation error (only need to report once)
        if (statusId === 6) {
          compilationError = result.compile_output || 'Compilation failed';
          results.push({
            testCase: i + 1,
            passed: false,
            status: 'Compilation Error',
            error: compilationError,
            input: testCase.input?.substring(0, 100) || 'N/A'
          });
          break; // Stop on compilation error
        }

        // Compare actual output with expected output AND check status
        const stdout = (result.stdout || '').trim();
        const expected = (testCase.output || testCase.expectedOutput || '').trim();
        const passed = stdout === expected && statusId === 3;
        
        console.log(`Test ${i + 1}: Expected="${expected}", Actual="${stdout}", Status=${statusId}, Passed=${passed}`);
        
        if (passed) passedCount++;

        totalTime += parseFloat(result.time || 0) * 1000;
        maxMemory = Math.max(maxMemory, result.memory || 0);

        results.push({
          testCase: i + 1,
          passed,
          status: result.status?.description || 'Unknown',
          input: testCase.input?.substring(0, 100) || 'N/A',
          expectedOutput: (testCase.output || testCase.expectedOutput || '')?.substring(0, 100) || 'N/A',
          actualOutput: (result.stdout || '').trim().substring(0, 100) || 'No output',
          error: result.stderr || result.compile_output || null,
          time: result.time ? `${(parseFloat(result.time) * 1000).toFixed(0)}ms` : 'N/A',
          memory: result.memory ? `${(result.memory / 1024).toFixed(1)}MB` : 'N/A'
        });

      } catch (error) {
        console.error(`Test case ${i + 1} error:`, error.message);
        results.push({
          testCase: i + 1,
          passed: false,
          status: 'Error',
          error: error.message,
          input: testCase.input?.substring(0, 100) || 'N/A'
        });
      }
    }

    // Return results
    res.json({
      success: true,
      results,
      summary: {
        passed: passedCount,
        total: results.length,
        allPassed: passedCount === results.length && !compilationError,
        executionTime: `${totalTime.toFixed(0)}ms`,
        memoryUsed: `${(maxMemory / 1024).toFixed(1)}MB`,
        compilationError
      }
    });

  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ error: 'Failed to run code: ' + error.message });
  }
});

/**
 * NEW ENDPOINT: Submit code WITHOUT waiting for results
 * Returns immediately with submission token
 * 
 * ✅ NO TIMEOUT
 * ✅ NO BLOCKING
 * ✅ SCALABLE FOR 200+ STUDENTS
 */
router.post('/:problemId/submit-async', authenticate, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    // Get problem (testCases is a JSON field, not a relation)
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        competition: true
      }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const langId = LANGUAGE_MAP[language.toLowerCase()];
    if (!langId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // Create problem submission
    const submission = await prisma.problemSubmission.create({
      data: {
        problemId,
        userId,
        code,
        language,
        maxScore: problem.points,
        totalTests: Array.isArray(problem.testCases) ? problem.testCases.length : 0,
        status: 'submitted',
        competitionSubmissionId: 'temp' // Will be updated later if part of competition
      }
    });

    // ✅ RETURN IMMEDIATELY - NO WAIT!
    res.json({
      message: '✅ Code submitted! Checking status...',
      submissionId: submission.id,
      status: 'submitted'
    });

    // 🎯 Start async processing in background
    processSubmissionAsync(submission.id, problem, code, language, langId);

  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

/**
 * NEW ENDPOINT: Check submission status and results
 * 
 * Response examples:
 * { status: "submitted", completion: 0 }
 * { status: "processing", completion: 50 }
 * { status: "completed", score: 100, passed: 5, total: 5 }
 * { status: "error", message: "Compilation error" }
 */
router.get('/:submissionId/status', authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await prisma.problemSubmission.findUnique({
      where: { id: submissionId },
      include: {
        judge0Queue: true
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check authorization
    if (submission.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Map status with progress
    const statusMap = {
      'submitted': { status: 'submitted', completion: 0, message: '⏳ Queued for processing' },
      'judging': { status: 'processing', completion: 50, message: '🔄 Running tests...' },
      'completed': {
        status: 'completed',
        completion: 100,
        score: submission.score,
        passed: submission.testsPassed,
        total: submission.totalTests,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        message: `✅ Complete: ${submission.testsPassed}/${submission.totalTests} passed`
      },
      'compile-error': { 
        status: 'error', 
        message: '❌ Compilation Error',
        error: submission.errorMessage 
      },
      'runtime-error': { 
        status: 'error', 
        message: '❌ Runtime Error',
        error: submission.errorMessage 
      }
    };

    const response = statusMap[submission.status] || {
      status: submission.status,
      completion: 50,
      message: '🔄 Processing...'
    };

    res.json({
      submissionId,
      ...response,
      lastUpdate: submission.judgedAt || submission.submittedAt
    });

  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * Background async processing function
 * Runs AFTER responding to user (no wait)
 */
async function processSubmissionAsync(submissionId, problem, code, language, langId) {
  try {
    console.log(`🚀 [Async] Starting processing for submission ${submissionId}`);

    // Update status to judging
    await prisma.problemSubmission.update({
      where: { id: submissionId },
      data: { status: 'judging' }
    });

    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;
    const results = [];

    // Process each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // Wrap code if needed
        let execCode = code;
        if (problem.parameters && problem.functionName) {
          execCode = wrapCodeForExecution(code, language, problem, testCase);
        }

        // 🎯 SUBMIT TO JUDGE0 WITHOUT WAITING
        const judge0Response = await axios.post(
          `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
          {
            source_code: execCode,
            language_id: langId,
            stdin: (!problem.parameters) ? (testCase.input || '') : ''
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );

        // ✅ Got token back, now save it for later checking
        if (judge0Response.data.token) {
          const token = judge0Response.data.token;

          // Save token in Judge0Queue
          await prisma.judge0Queue.create({
            data: {
              id: randomUUID(),
              judge0Token: token,
              submissionId,
              userId: 'system', // We don't have userId in this context
              problemId: problem.id,
              competitionId: problem.competitionId,
              status: 'submitted'
            }
          });

          results.push({
            testCase: i + 1,
            token,
            status: 'queued'
          });

          console.log(`✅ [Async] Test ${i + 1}: Token ${token} saved`);
        }

      } catch (error) {
        console.error(`❌ [Async] Test ${i + 1} error:`, error.message);
        results.push({
          testCase: i + 1,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update submission with initial results
    await prisma.problemSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'processing',
        testResults: results
      }
    });

    console.log(`✅ [Async] All tokens queued for submission ${submissionId}`);

  } catch (error) {
    console.error('❌ [Async] Critical error:', error);
    
    await prisma.problemSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'error',
        errorMessage: error.message,
        judgedAt: new Date()
      }
    }).catch(e => console.error('Failed to update error status:', e));
  }
}

/**
 * Background job: Check pending Judge0 submissions
 * Run this every 5-10 seconds
 * 
 * Includes retry logic and graceful degradation
 */
export async function checkPendingSubmissions() {
  try {
    // Ensure database connection is valid
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (connError) {
      console.warn('⚠️ Database connection check failed, skipping this cycle');
      return; // Skip this cycle, will retry next time
    }

    // Get pending Judge0 tokens
    const pending = await prisma.judge0Queue.findMany({
      where: { status: 'submitted' },
      take: 20, // Process 20 at a time (Render free plan limit)
      orderBy: { submittedat: 'asc' } // Process oldest first
    });

    if (pending.length > 0) {
      console.log(`🔍 [${new Date().toISOString()}] Checking ${pending.length} pending submissions...`);
    }

    // Track success/failure counts
    let processedCount = 0;
    let errorCount = 0;

    for (const queue of pending) {
      try {
        // Check status from Judge0
        const response = await axios.get(
          `${JUDGE0_URL}/submissions/${queue.judge0Token}`,
          { timeout: 5000 }
        );

        const result = response.data;

        // Status codes:
        // 1 = In Queue, 2 = Processing, 3 = Accepted, 4+ = Error
        if ([1, 2].includes(result.status?.id)) {
          // Still processing, check again later
          continue;
        }

        // Completed (or error)
        const passed = result.status?.id === 3;

        await prisma.judge0Queue.update({
          where: { id: queue.id },
          data: {
            status: passed ? 'completed' : 'failed',
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            compilationerror: result.compile_output || '',
            executiontime: parseInt(result.time) || 0,
            memoryused: result.memory || 0,
            testresults: {
              passed,
              stderr: result.stderr,
              stdout: result.stdout,
              status: result.status?.description
            },
            completedat: new Date()
          }
        });

        processedCount++;
        console.log(`  ✅ Token ${queue.judge0Token.substring(0, 8)}... → ${passed ? 'PASS' : 'FAIL'}`);

      } catch (error) {
        errorCount++;
        // Log but continue - don't block other submissions
        if (error.response?.status === 404) {
          // Token not found - mark as failed
          await prisma.judge0Queue.update({
            where: { id: queue.id },
            data: { status: 'failed' }
          }).catch(e => console.warn('Failed to update token status:', e.message));
        } else {
          console.warn(`  ⚠️ Token ${queue.judge0Token.substring(0, 8)}... error: ${error.message}`);
        }
      }
    }

    if (pending.length > 0) {
      console.log(`  📊 Summary: ${processedCount} completed, ${pending.length - processedCount} still processing, ${errorCount} errors`);
    }

  } catch (error) {
    console.error(`❌ Critical error in checkPendingSubmissions: ${error.message}`);
    // Don't crash - the server will retry this function on the next interval
  }
}

/**
 * On-demand result fetching endpoint
 * Called by frontend when polling is disabled or slow
 * Fetches directly from Judge0 without waiting
 */
router.post('/:submissionId/fetch-results', authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await prisma.problemSubmission.findUnique({
      where: { id: submissionId },
      include: { judge0Queue: true }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If already has results, return them
    if (submission.status === 'completed') {
      return res.json({
        status: 'completed',
        score: submission.score,
        passed: submission.testsPassed,
        total: submission.totalTests,
        message: `✅ Complete: ${submission.testsPassed}/${submission.totalTests} passed`
      });
    }

    // If we have pending Judge0 tokens, check them
    if (submission.judge0Queue && submission.judge0Queue.length > 0) {
      let totalPassed = 0;
      let totalTests = submission.judge0Queue.length;
      let stillProcessing = false;

      for (const queueItem of submission.judge0Queue) {
        try {
          const response = await axios.get(
            `${JUDGE0_URL}/submissions/${queueItem.judge0token}`,
            { timeout: 5000 }
          );

          const result = response.data;
          const status = result.status?.id;

          if ([1, 2].includes(status)) {
            // Still in queue or processing
            stillProcessing = true;
          } else if (status === 3) {
            // Accepted
            totalPassed++;
          }
        } catch (error) {
          stillProcessing = true;
        }
      }

      if (!stillProcessing) {
        // All done - update database
        await prisma.problemSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'completed',
            testsPassed: totalPassed,
            score: (totalPassed / totalTests) * 100
          }
        }).catch(e => console.warn('Failed to update submission'));

        return res.json({
          status: 'completed',
          passed: totalPassed,
          total: totalTests,
          score: (totalPassed / totalTests) * 100,
          message: `✅ Complete: ${totalPassed}/${totalTests} passed`
        });
      } else {
        return res.json({
          status: 'processing',
          message: `🔄 Still running...`,
          passed: totalPassed,
          total: totalTests
        });
      }
    }

    return res.json({
      status: 'submitted',
      message: '⏳ Queued for processing'
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;

/**
 * Contest Submission System
 * 
 * Architecture:
 * - Frontend → Backend (this file) → Judge0 API
 * - Backend acts as gatekeeper (validation, rate limiting, one-submission enforcement)
 * - Judge0 submissions are ASYNC (non-blocking)
 * - Results are polled later (20-30 min delay acceptable)
 * 
 * Flow:
 * 1. User submits code via POST /contest/submit
 * 2. Backend validates: language, duplicate submission
 * 3. Backend POSTs to Judge0 /submissions (async mode)
 * 4. Judge0 returns a token immediately (queued for execution)
 * 5. Backend stores token + userId mapping
 * 6. Admin/system fetches results via GET /contest/results after delay
 * 7. Backend polls Judge0 /submissions/{token} for each stored token
 * 8. Returns verdicts (Accepted / Wrong Answer / etc.)
 */

import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Judge0 Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://64.227.149.20:2358';

// Supported languages (strict whitelist)
const ALLOWED_LANGUAGES = {
  50: 'C (GCC 9.2.0)',
  54: 'C++ (GCC 9.2.0)', 
  62: 'Java (OpenJDK 13.0.1)',
  71: 'Python (3.8.1)'
};

/**
 * In-memory storage (replace with database in production)
 * 
 * Structure:
 * submissions = Map<userId, { token, languageId, submittedAt, sourceCode }>
 * 
 * For production, use Prisma:
 * - Create ContestSubmission model with fields:
 *   { id, userId, contestId, judge0Token, languageId, sourceCode, status, result, submittedAt }
 */
const submissions = new Map();

/**
 * POST /contest/submit
 * 
 * Accepts code submission from authenticated user
 * Enforces ONE submission per user
 * Submits to Judge0 asynchronously
 */
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { sourceCode, languageId } = req.body;
    const userId = req.user.id;

    // ===== VALIDATION =====
    
    // 1. Check required fields
    if (!sourceCode || !languageId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceCode and languageId'
      });
    }

    // 2. Validate language (strict whitelist)
    if (!ALLOWED_LANGUAGES[languageId]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Allowed: C (50), C++ (54), Java (62), Python (71)`,
        allowedLanguages: ALLOWED_LANGUAGES
      });
    }

    // 3. Enforce one-submission-per-user rule
    // TODO: Replace with DB query - await prisma.contestSubmission.findFirst({ where: { userId, contestId } })
    if (submissions.has(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You have already submitted. Only ONE submission per user is allowed.',
        previousSubmission: {
          submittedAt: submissions.get(userId).submittedAt,
          language: ALLOWED_LANGUAGES[submissions.get(userId).languageId]
        }
      });
    }

    // ===== SUBMIT TO JUDGE0 (ASYNC) =====
    
    /**
     * Judge0 submission with ENABLE_WAIT_RESULT=false
     * 
     * Response will contain a token immediately (queued status)
     * Actual execution happens in background by Judge0 workers
     * We poll later to get results
     */
    const judge0Response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: sourceCode,
        language_id: parseInt(languageId),
        // Add stdin, expected_output if needed for test cases
        // For contests, you might want to submit against hidden test cases
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Add 'X-Auth-Token' if Judge0 requires authentication
        },
        timeout: 10000 // 10 second timeout for submission API
      }
    );

    const token = judge0Response.data.token;

    if (!token) {
      throw new Error('Judge0 did not return a submission token');
    }

    // ===== STORE SUBMISSION =====
    
    /**
     * Store token for later result fetching
     * 
     * TODO: Replace with database insert
     * await prisma.contestSubmission.create({
     *   data: {
     *     userId,
     *     contestId,
     *     judge0Token: token,
     *     languageId: parseInt(languageId),
     *     sourceCode,
     *     status: 'queued',
     *     submittedAt: new Date()
     *   }
     * })
     */
    submissions.set(userId, {
      token,
      languageId: parseInt(languageId),
      sourceCode,
      submittedAt: new Date().toISOString(),
      status: 'queued'
    });

    console.log(`✅ Submission stored: User ${userId}, Token ${token}, Language ${ALLOWED_LANGUAGES[languageId]}`);

    // ===== RESPONSE =====
    
    res.json({
      success: true,
      message: 'Submission received successfully. Results will be available in 20-30 minutes.',
      submission: {
        token, // Return token for tracking (optional, could hide this)
        language: ALLOWED_LANGUAGES[languageId],
        submittedAt: submissions.get(userId).submittedAt,
        estimatedResultsAt: new Date(Date.now() + 20 * 60 * 1000).toISOString() // +20 minutes
      }
    });

  } catch (error) {
    console.error('❌ Submission error:', error.message);
    
    // Handle Judge0 API errors
    if (error.response?.data) {
      return res.status(500).json({
        success: false,
        error: 'Judge0 submission failed',
        details: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process submission',
      message: error.message
    });
  }
});

/**
 * GET /contest/results
 * 
 * Fetches results for all submissions by polling Judge0
 * Should be called 20-30 minutes after contest ends
 * 
 * Can be restricted to admin-only or run as a cron job
 */
router.get('/results', authenticate, async (req, res) => {
  try {
    const results = [];

    /**
     * Poll Judge0 for each stored submission token
     * 
     * TODO: Replace with database query
     * const submissions = await prisma.contestSubmission.findMany({ 
     *   where: { contestId, status: { in: ['queued', 'processing'] } }
     * })
     */
    
    // Fetch results concurrently (Promise.all for speed)
    const fetchPromises = Array.from(submissions.entries()).map(async ([userId, submission]) => {
      try {
        const response = await axios.get(
          `${JUDGE0_URL}/submissions/${submission.token}?base64_encoded=false`,
          { timeout: 5000 }
        );

        const result = response.data;

        /**
         * Judge0 Status Codes:
         * 1 = In Queue
         * 2 = Processing
         * 3 = Accepted
         * 4 = Wrong Answer
         * 5 = Time Limit Exceeded
         * 6 = Compilation Error
         * 7 = Runtime Error (SIGSEGV)
         * 8 = Runtime Error (SIGXFSZ)
         * 9 = Runtime Error (SIGFPE)
         * 10 = Runtime Error (SIGABRT)
         * 11 = Runtime Error (NZEC)
         * 12 = Runtime Error (Other)
         * 13 = Internal Error
         * 14 = Exec Format Error
         */

        const statusName = result.status?.description || 'Unknown';
        const isProcessing = result.status?.id <= 2;

        /**
         * TODO: Update database with result
         * await prisma.contestSubmission.update({
         *   where: { userId },
         *   data: {
         *     status: statusName,
         *     result: result,
         *     time: result.time,
         *     memory: result.memory,
         *     gradedAt: new Date()
         *   }
         * })
         */

        // Update in-memory store
        submission.status = statusName;
        submission.result = result;

        return {
          userId,
          token: submission.token,
          language: ALLOWED_LANGUAGES[submission.languageId],
          status: statusName,
          verdict: statusName,
          time: result.time,
          memory: result.memory,
          isProcessing,
          // Only include output for accepted/wrong answer (hide for errors if needed)
          stdout: result.stdout,
          stderr: result.stderr,
          compile_output: result.compile_output,
          submittedAt: submission.submittedAt
        };

      } catch (error) {
        console.error(`❌ Failed to fetch result for user ${userId}:`, error.message);
        return {
          userId,
          error: 'Failed to fetch result',
          token: submission.token
        };
      }
    });

    const fetchedResults = await Promise.all(fetchPromises);
    
    /**
     * Filter logic:
     * - Skip submissions still in queue/processing (optional)
     * - Return only completed submissions
     */
    const completedResults = fetchedResults.filter(r => !r.isProcessing && !r.error);
    const pendingResults = fetchedResults.filter(r => r.isProcessing);

    /**
     * LEADERBOARD GENERATION (add this logic here or in separate endpoint)
     * 
     * For a contest with multiple problems:
     * - Calculate score based on Accepted verdicts
     * - Rank by: score DESC, submission time ASC
     * - Store in Redis sorted set for fast access
     * 
     * Example:
     * const leaderboard = completedResults
     *   .filter(r => r.verdict === 'Accepted')
     *   .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
     *   .map((r, index) => ({ rank: index + 1, userId: r.userId, time: r.time }))
     */

    res.json({
      success: true,
      totalSubmissions: submissions.size,
      completed: completedResults.length,
      pending: pendingResults.length,
      results: completedResults,
      pendingSubmissions: pendingResults.map(r => ({ userId: r.userId, status: r.status }))
    });

  } catch (error) {
    console.error('❌ Results fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message
    });
  }
});

/**
 * GET /contest/my-result
 * 
 * Individual result check for authenticated user
 */
router.get('/my-result', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Replace with DB query
    const submission = submissions.get(userId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found for your account'
      });
    }

    // Fetch latest result from Judge0
    const response = await axios.get(
      `${JUDGE0_URL}/submissions/${submission.token}?base64_encoded=false`,
      { timeout: 5000 }
    );

    const result = response.data;
    const statusName = result.status?.description || 'Unknown';

    res.json({
      success: true,
      submission: {
        language: ALLOWED_LANGUAGES[submission.languageId],
        submittedAt: submission.submittedAt,
        status: statusName,
        verdict: statusName,
        time: result.time,
        memory: result.memory,
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output
      }
    });

  } catch (error) {
    console.error('❌ My result fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your result'
    });
  }
});

/**
 * GET /contest/stats
 * 
 * Admin endpoint: Contest statistics
 * Add authorizeRole('admin') middleware in production
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // TODO: Replace with efficient DB aggregation queries
    
    const totalSubmissions = submissions.size;
    const languageBreakdown = {};
    
    submissions.forEach(sub => {
      const lang = ALLOWED_LANGUAGES[sub.languageId];
      languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        maxAllowedSubmissions: 200,
        remainingSlots: 200 - totalSubmissions,
        languageBreakdown,
        submissionTimeline: Array.from(submissions.values()).map(s => ({
          submittedAt: s.submittedAt,
          language: ALLOWED_LANGUAGES[s.languageId]
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export default router;

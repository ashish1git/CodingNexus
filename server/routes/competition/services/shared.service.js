import axios from 'axios';
import prisma from '../../../config/db.js';
import { wrapCodeForExecution } from '../../../utils/codeWrapper.js';

// Judge0 Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://202.179.85.68:2358';

// Language mapping for Judge0
const LANGUAGE_MAP = {
  'c': 50,        // C (GCC 9.2.0)
  'cpp': 54,      // C++ (GCC 9.2.0)
  'c++': 54,      // C++ (GCC 9.2.0)
  'java': 62,     // Java (OpenJDK 13.0.1)
  'python': 71,   // Python (3.8.1)
  'py': 71,       // Python (3.8.1)
  'javascript': 63, // JavaScript (Node.js 12.14.0)
  'js': 63        // JavaScript (Node.js 12.14.0)
};

/**
 * Execute Judge0 submissions asynchronously
 * This runs in background after responding to user
 */
export async function executeJudge0Submissions(submissionId, problemSubmissions, problems) {
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

            const decodeB64 = str => str ? Buffer.from(str, 'base64').toString('utf-8') : '';
            const encodeB64 = str => str != null ? Buffer.from(String(str), 'utf-8').toString('base64') : null;

            // Submit to Judge0 with wait=true and base64_encoded=true for safe UTF-8 handling
            const judge0Payload = {
              source_code: encodeB64(executableCode),
              language_id: languageId,
              // Add time and memory limits based on problem constraints
              cpu_time_limit: problem.timeLimit ? problem.timeLimit / 1000 : 3, // Convert ms to seconds
              memory_limit: problem.memoryLimit ? problem.memoryLimit * 1024 : 256000 // Convert MB to KB
            };
            
            // Add stdin if problem doesn't use parameters (stdin-based)
            if (!problem.parameters) {
              judge0Payload.stdin = encodeB64(testCase.input || '');
            }
            if (testCase.output || testCase.expectedOutput) {
              judge0Payload.expected_output = encodeB64(testCase.output || testCase.expectedOutput);
            }
            
            console.log(`[Judge0 Request] TestCase ${i + 1}:`, JSON.stringify({
              language_id: judge0Payload.language_id,
              has_stdin: !!judge0Payload.stdin,
              source_code_len: executableCode.length
            }, null, 2));

            const judge0Response = await axios.post(
              `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
              judge0Payload,
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000 // 60 seconds timeout
              }
            );
            
            console.log(`[Judge0 Response Received] TestCase ${i + 1}`);

            const data = judge0Response.data;
            const stdout = decodeB64(data.stdout).trim();
            const stderr = decodeB64(data.stderr).trim();
            const compile_output = decodeB64(data.compile_output).trim();
            const message = decodeB64(data.message).trim();
            
            console.log(`[Judge0 Response] TestCase ${i + 1}:`, JSON.stringify({
              status_id: data.status?.id,
              status_desc: data.status?.description,
              stdout: stdout.substring(0, 100),
              stderr: stderr.substring(0, 100),
              compile_output: compile_output.substring(0, 100),
              time: data.time,
              memory: data.memory
            }, null, 2));
            
            const expected = (testCase.output || testCase.expectedOutput || '').trim();
            const passed = stdout === expected && data.status?.id === 3; // 3 = Accepted
            const errStr = compile_output || stderr || (data.status?.id !== 3 ? (message || data.status?.description || 'Execution failed') : null);

            if (passed) totalPassed++;
            totalTime += parseFloat(data.time || 0) * 1000; // Convert to ms
            totalMemory = Math.max(totalMemory, data.memory || 0);

            testResults.push({
              testCase: i + 1,
              input: testCase.input,
              expectedOutput: expected,
              actualOutput: stdout || (errStr ? '' : 'No output'),
              passed,
              hidden: testCase.hidden || false,
              time: data.time,
              memory: data.memory,
              status: data.status?.description || 'Unknown',
              stderr: stderr || compile_output || '',
              compile_output: compile_output || null,
              error: errStr
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
        let finalScore = Math.round(scorePercentage * submission.maxScore);

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

        // Performance optimization scoring — deduct marks for slow but correct solutions
        let efficiencyMultiplier = 1.0;
        let optimizationFeedback = null;
        if (totalPassed === testCases.length && testCases.length > 0) {
          const avgTimePerCase = totalTime / testCases.length;
          const timeLimitMs = problem.timeLimit || 3000;

          if (avgTimePerCase > timeLimitMs * 0.50) {
            efficiencyMultiplier = 0.70;
            optimizationFeedback = 'Solution is significantly inefficient. Consider optimizing to meet expected complexity.';
          } else if (avgTimePerCase > timeLimitMs * 0.20) {
            efficiencyMultiplier = 0.85;
            optimizationFeedback = 'Solution works but is inefficient. Try to reduce time complexity.';
          } else if (avgTimePerCase > timeLimitMs * 0.05) {
            efficiencyMultiplier = 0.95;
            optimizationFeedback = 'Solution accepted but could be further optimized for better performance.';
          }

          if (efficiencyMultiplier < 1.0) {
            finalScore = Math.round(finalScore * efficiencyMultiplier);
          }
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
            judgedAt: new Date(),
            efficiencyMultiplier,
            optimizationFeedback
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

// Helper function to update competition score asynchronously
export async function updateCompetitionScoreAsync(competitionSubmissionId) {
  try {
    const competitionSubmission = await prisma.competitionSubmission.findUnique({
      where: { id: competitionSubmissionId },
      select: {
        id: true,
        problemSubmissions: {
          select: { score: true, executionTime: true }
        }
      }
    });

    if (competitionSubmission) {
      const totalScore = competitionSubmission.problemSubmissions.reduce((sum, sub) => sum + sub.score, 0);
      const totalTime = competitionSubmission.problemSubmissions.reduce((sum, sub) => sum + sub.executionTime, 0);
      await prisma.competitionSubmission.update({
        where: { id: competitionSubmission.id },
        data: { totalScore, totalTime }
      });
    }
  } catch (error) {
    console.error('Error in async score update:', error);
  }
}

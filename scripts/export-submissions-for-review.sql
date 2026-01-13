-- ============================================================================
-- PRODUCTION-READY: Export Student Submissions for Manual Evaluation
-- Database: PostgreSQL
-- Format: CSV (one file per problem)
-- ============================================================================

-- METHOD 1: EXPORT BY PROBLEM (Recommended for team evaluation)
-- Creates separate CSV files for each problem - optimal for parallel review by 4-5 evaluators

-- Query 1: Get list of all problems in a competition (run first to identify problems)
SELECT 
  p.id as problem_id,
  p.title as problem_title,
  c.title as competition_title,
  COUNT(DISTINCT ps.userId) as submission_count
FROM "Problem" p
JOIN "Competition" c ON p.competitionId = c.id
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
GROUP BY p.id, p.title, c.title
ORDER BY p.id;

-- ============================================================================
-- CORE EXPORT QUERY: Problem-wise CSV Generation
-- Run this for each problem_id to generate individual CSVs
-- ============================================================================

-- Query 2: Export submissions for a specific problem (PARAMETERIZED)
-- Replace {PROBLEM_ID} with actual problem ID
SELECT 
  ps.id as submission_id,
  s.name as student_name,
  s.rollNo as roll_number,
  u.email as student_email,
  p.title as problem_title,
  p.difficulty,
  p.points as max_points,
  ps.language,
  ps.code,
  ps.status,
  ps.score as obtained_score,
  ps.testsPassed || '/' || ps.totalTests as tests_passed,
  ps.executionTime || ' ms' as execution_time,
  COALESCE(ps.errorMessage, 'N/A') as error_message,
  ps.submittedAt as submission_timestamp
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
JOIN "Problem" p ON ps.problemId = p.id
WHERE ps.problemId = '{PROBLEM_ID}'
ORDER BY s.name, ps.submittedAt DESC;

-- ============================================================================
-- ALTERNATIVE: Export all submissions with problem grouping
-- Use when you need to export everything at once
-- ============================================================================

-- Query 3: All submissions with problem headers (for single unified CSV)
SELECT 
  p.id as problem_id,
  p.title as problem_title,
  p.difficulty,
  p.points,
  '---' as separator_1,
  s.name as student_name,
  s.rollNo as roll_number,
  u.email as student_email,
  ps.language as submission_language,
  ps.code as solution_code,
  ps.status as submission_status,
  ps.score as score_obtained,
  ps.testsPassed || '/' || ps.totalTests as tests_result,
  ps.executionTime as time_ms,
  COALESCE(ps.errorMessage, 'No Error') as error_details,
  ps.submittedAt as submission_time
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
JOIN "Problem" p ON ps.problemId = p.id
ORDER BY p.id, s.name, ps.submittedAt;

-- ============================================================================
-- QUERY 4: Metadata Export (Problems and Submissions Summary)
-- Use this to generate index/manifest file for evaluators
-- ============================================================================

SELECT 
  c.id as competition_id,
  c.title as competition_name,
  p.id as problem_id,
  p.title as problem_title,
  p.difficulty,
  p.points as total_points,
  COUNT(DISTINCT ps.userId) as total_submissions,
  COUNT(CASE WHEN ps.status = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN ps.status = 'wrong-answer' THEN 1 END) as wrong_answer_count,
  COUNT(CASE WHEN ps.status = 'compile-error' THEN 1 END) as compile_error_count,
  COUNT(CASE WHEN ps.status = 'tle' THEN 1 END) as tle_count,
  COUNT(CASE WHEN ps.status = 'runtime-error' THEN 1 END) as runtime_error_count,
  ROUND(AVG(ps.score)::numeric, 2) as avg_score,
  MAX(ps.score) as max_score,
  MIN(ps.score) as min_score
FROM "Problem" p
JOIN "Competition" c ON p.competitionId = c.id
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
GROUP BY c.id, c.title, p.id, p.title, p.difficulty, p.points
ORDER BY c.id, p.id;

-- ============================================================================
-- QUERY 5: Export by Language (if you want to assign reviewers by language)
-- ============================================================================

SELECT 
  ps.language as programming_language,
  p.title as problem_title,
  s.name as student_name,
  s.rollNo as roll_number,
  u.email as email,
  ps.code as submitted_code,
  ps.status,
  ps.score || '/' || ps.maxScore as score,
  ps.submittedAt
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
JOIN "Problem" p ON ps.problemId = p.id
ORDER BY ps.language, p.title, s.name;

-- ============================================================================
-- QUERY 6: Flagged for Manual Review (Ambiguous cases)
-- Submissions with errors or edge cases that need human review
-- ============================================================================

SELECT 
  p.id as problem_id,
  p.title as problem_title,
  s.name as student_name,
  s.rollNo as roll_number,
  u.email,
  ps.language,
  ps.code,
  ps.status as status_code,
  ps.score || '/' || ps.maxScore as score,
  COALESCE(ps.errorMessage, 'Wrong Answer') as reason_for_review,
  ps.submittedAt as submitted_time
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
JOIN "Problem" p ON ps.problemId = p.id
WHERE ps.status IN ('wrong-answer', 'runtime-error', 'tle', 'compile-error')
ORDER BY p.id, s.name;

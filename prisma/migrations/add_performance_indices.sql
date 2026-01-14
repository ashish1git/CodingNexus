-- Add composite indices for common query patterns
-- Improves performance for submission queries

-- Composite index for fetching submissions by problemId and competitionId
CREATE INDEX IF NOT EXISTS "idx_problem_submission_problem_id_user_id" 
ON "ProblemSubmission"("problemId", "userId");

-- Composite index for querying by competition and problem
CREATE INDEX IF NOT EXISTS "idx_problem_competition_id_order" 
ON "Problem"("competitionId", "orderIndex");

-- Composite index for sorting submissions by status and date
CREATE INDEX IF NOT EXISTS "idx_problem_submission_status_date" 
ON "ProblemSubmission"("status", "submittedAt" DESC);

-- Composite index for evaluated submissions
CREATE INDEX IF NOT EXISTS "idx_problem_submission_evaluated_date" 
ON "ProblemSubmission"("isEvaluated", "evaluatedAt" DESC);

-- Index for student lookup by roll number
CREATE INDEX IF NOT EXISTS "idx_student_roll_no" 
ON "Student"("rollNo");

-- Migration: Add Evaluation Tracking
-- Run this manually on your Render PostgreSQL database

-- Step 1: Add new fields to ProblemSubmission table
ALTER TABLE "ProblemSubmission" 
ADD COLUMN IF NOT EXISTS "manualMarks" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "evaluatorComments" TEXT,
ADD COLUMN IF NOT EXISTS "evaluatedBy" TEXT,
ADD COLUMN IF NOT EXISTS "evaluatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isEvaluated" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ProblemSubmission_isEvaluated_idx" ON "ProblemSubmission"("isEvaluated");
CREATE INDEX IF NOT EXISTS "ProblemSubmission_evaluatedBy_idx" ON "ProblemSubmission"("evaluatedBy");

-- Step 3: Create SubmissionEvaluation table for tracking history
CREATE TABLE IF NOT EXISTS "SubmissionEvaluation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "evaluatorName" TEXT NOT NULL,
    "evaluatorRole" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "action" TEXT NOT NULL,
    "previousMarks" DOUBLE PRECISION,
    "previousComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "SubmissionEvaluation_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create indexes on SubmissionEvaluation
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_submissionId_idx" ON "SubmissionEvaluation"("submissionId");
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_evaluatorId_idx" ON "SubmissionEvaluation"("evaluatorId");
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_createdAt_idx" ON "SubmissionEvaluation"("createdAt");
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_action_idx" ON "SubmissionEvaluation"("action");

-- Step 5: Add foreign key constraint
ALTER TABLE "SubmissionEvaluation" 
ADD CONSTRAINT IF NOT EXISTS "SubmissionEvaluation_submissionId_fkey" 
FOREIGN KEY ("submissionId") REFERENCES "ProblemSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verification queries (run these to check the migration)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ProblemSubmission' AND column_name IN ('manualMarks', 'evaluatorComments', 'evaluatedBy', 'evaluatedAt', 'isEvaluated');
-- SELECT * FROM "SubmissionEvaluation" LIMIT 1;

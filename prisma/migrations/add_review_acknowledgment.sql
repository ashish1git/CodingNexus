-- Migration: Add evaluator review acknowledgment
-- Run this manually on your PostgreSQL database (same as add_evaluation_tracking.sql)

-- Step 1: Add reviewAcknowledged field to ProblemSubmission table
-- Tracks whether the student has read/acknowledged the evaluator's review.
-- When an evaluator (re)evaluates a submission, this is reset to false so the
-- student sees a "new review" notification until they acknowledge it.
ALTER TABLE "ProblemSubmission"
ADD COLUMN IF NOT EXISTS "reviewAcknowledged" BOOLEAN NOT NULL DEFAULT false;

-- Verification query (run this to check the migration)
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'ProblemSubmission' AND column_name = 'reviewAcknowledged';

-- Add time tracking fields to Attendance table for manual attendance
-- These fields track start time, end time, and duration in minutes

ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(10);
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "endTime" VARCHAR(10);
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "duration" INTEGER;

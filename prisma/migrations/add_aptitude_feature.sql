-- Migration: add_aptitude_feature
-- Run this on the server to create the aptitude tables:
--   psql $DATABASE_URL -f prisma/migrations/add_aptitude_feature.sql
-- OR via deploy.sh which calls: npx prisma migrate deploy

-- CreateTable AptitudeTest
CREATE TABLE IF NOT EXISTS "AptitudeTest" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "category"    TEXT NOT NULL DEFAULT 'general',
    "difficulty"  TEXT NOT NULL DEFAULT 'medium',
    "duration"    INTEGER NOT NULL,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AptitudeTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable AptitudeQuestion
CREATE TABLE IF NOT EXISTS "AptitudeQuestion" (
    "id"            TEXT NOT NULL,
    "testId"        TEXT NOT NULL,
    "question"      TEXT NOT NULL,
    "options"       JSONB NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation"   TEXT,
    "orderIndex"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AptitudeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable AptitudeAttempt
CREATE TABLE IF NOT EXISTS "AptitudeAttempt" (
    "id"          TEXT NOT NULL,
    "testId"      TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "answers"     JSONB NOT NULL,
    "score"       INTEGER NOT NULL,
    "maxScore"    INTEGER NOT NULL,
    "timeTaken"   INTEGER NOT NULL,
    "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "AptitudeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex AptitudeTest
CREATE INDEX IF NOT EXISTS "AptitudeTest_category_idx"   ON "AptitudeTest"("category");
CREATE INDEX IF NOT EXISTS "AptitudeTest_difficulty_idx" ON "AptitudeTest"("difficulty");
CREATE INDEX IF NOT EXISTS "AptitudeTest_isActive_idx"   ON "AptitudeTest"("isActive");
CREATE INDEX IF NOT EXISTS "AptitudeTest_createdAt_idx"  ON "AptitudeTest"("createdAt");

-- CreateIndex AptitudeQuestion
CREATE INDEX IF NOT EXISTS "AptitudeQuestion_testId_idx" ON "AptitudeQuestion"("testId");

-- CreateIndex AptitudeAttempt
CREATE INDEX IF NOT EXISTS "AptitudeAttempt_testId_idx"     ON "AptitudeAttempt"("testId");
CREATE INDEX IF NOT EXISTS "AptitudeAttempt_userId_idx"      ON "AptitudeAttempt"("userId");
CREATE INDEX IF NOT EXISTS "AptitudeAttempt_submittedAt_idx" ON "AptitudeAttempt"("submittedAt");

-- AddForeignKey AptitudeQuestion → AptitudeTest
ALTER TABLE "AptitudeQuestion"
    ADD CONSTRAINT IF NOT EXISTS "AptitudeQuestion_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AptitudeAttempt → AptitudeTest
ALTER TABLE "AptitudeAttempt"
    ADD CONSTRAINT IF NOT EXISTS "AptitudeAttempt_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AptitudeAttempt → User
ALTER TABLE "AptitudeAttempt"
    ADD CONSTRAINT IF NOT EXISTS "AptitudeAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration: add_draft_code
-- Auto-saved draft code per problem per competition per user.
-- Run manually if needed:
--   psql $DATABASE_URL -f prisma/migrations/add_draft_code.sql

CREATE TABLE IF NOT EXISTS "DraftCode" (
  "id"            TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "problemId"     TEXT NOT NULL,
  "code"          TEXT NOT NULL DEFAULT '',
  "language"      TEXT NOT NULL DEFAULT 'java',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DraftCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DraftCode_competitionId_userId_problemId_key" UNIQUE ("competitionId", "userId", "problemId")
);

CREATE INDEX IF NOT EXISTS "DraftCode_competitionId_userId_idx" ON "DraftCode" ("competitionId", "userId");

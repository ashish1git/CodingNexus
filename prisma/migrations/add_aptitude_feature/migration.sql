-- CreateTable AptitudeTest
CREATE TABLE "AptitudeTest" (
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
CREATE TABLE "AptitudeQuestion" (
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
CREATE TABLE "AptitudeAttempt" (
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
CREATE INDEX "AptitudeTest_category_idx"   ON "AptitudeTest"("category");
CREATE INDEX "AptitudeTest_difficulty_idx" ON "AptitudeTest"("difficulty");
CREATE INDEX "AptitudeTest_isActive_idx"   ON "AptitudeTest"("isActive");
CREATE INDEX "AptitudeTest_createdAt_idx"  ON "AptitudeTest"("createdAt");

-- CreateIndex AptitudeQuestion
CREATE INDEX "AptitudeQuestion_testId_idx" ON "AptitudeQuestion"("testId");

-- CreateIndex AptitudeAttempt
CREATE INDEX "AptitudeAttempt_testId_idx"      ON "AptitudeAttempt"("testId");
CREATE INDEX "AptitudeAttempt_userId_idx"       ON "AptitudeAttempt"("userId");
CREATE INDEX "AptitudeAttempt_submittedAt_idx"  ON "AptitudeAttempt"("submittedAt");

-- AddForeignKey AptitudeQuestion → AptitudeTest
ALTER TABLE "AptitudeQuestion"
    ADD CONSTRAINT "AptitudeQuestion_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AptitudeAttempt → AptitudeTest
ALTER TABLE "AptitudeAttempt"
    ADD CONSTRAINT "AptitudeAttempt_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AptitudeAttempt → User
ALTER TABLE "AptitudeAttempt"
    ADD CONSTRAINT "AptitudeAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Judge0Queue
CREATE TABLE "Judge0Queue" (
    "id" TEXT NOT NULL,
    "judge0Token" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "stdout" TEXT,
    "stderr" TEXT,
    "compilationError" TEXT,
    "testResults" JSONB,
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "memoryUsed" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Judge0Queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Judge0Queue_judge0Token_key" ON "Judge0Queue"("judge0Token");

-- CreateIndex
CREATE INDEX "Judge0Queue_status_idx" ON "Judge0Queue"("status");

-- CreateIndex
CREATE INDEX "Judge0Queue_submittedAt_idx" ON "Judge0Queue"("submittedAt");

-- CreateIndex
CREATE INDEX "Judge0Queue_userId_idx" ON "Judge0Queue"("userId");

-- AddForeignKey
ALTER TABLE "Judge0Queue" ADD CONSTRAINT "Judge0Queue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProblemSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

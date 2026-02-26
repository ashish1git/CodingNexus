-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "moodleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Student
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "phone" TEXT,
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rollNo" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable Admin
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'all',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable Note
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "subject" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable Announcement
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable Quiz
CREATE TABLE IF NOT EXISTS "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "batch" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuizAttempt
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable AttendanceSession
CREATE TABLE IF NOT EXISTS "AttendanceSession" (
    "id" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'regular',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "maxDistance" INTEGER NOT NULL DEFAULT 100,
    "qrCode" TEXT,
    "qrExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "presentCount" INTEGER NOT NULL DEFAULT 0,
    "absentCount" INTEGER NOT NULL DEFAULT 0,
    "lateCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable AttendanceRecord
CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedBy" TEXT NOT NULL,
    "markedMethod" TEXT NOT NULL DEFAULT 'manual',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceFromSession" INTEGER,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "deviceFingerprint" TEXT,
    "notes" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable Attendance
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TEXT,
    "endTime" TEXT,
    "duration" INTEGER,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable SupportTicket
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "response" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable Competition
CREATE TABLE IF NOT EXISTS "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "difficulty" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'individual',
    "prizePool" TEXT,
    "maxParticipants" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable Problem
CREATE TABLE IF NOT EXISTS "Problem" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "constraints" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "testCases" JSONB NOT NULL,
    "timeLimit" INTEGER NOT NULL DEFAULT 3000,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "functionName" TEXT NOT NULL DEFAULT 'solution',
    "parameters" JSONB,
    "returnType" TEXT NOT NULL DEFAULT 'int',
    "starterCode" JSONB,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompetitionRegistration
CREATE TABLE IF NOT EXISTS "CompetitionRegistration" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable CompetitionSubmission
CREATE TABLE IF NOT EXISTS "CompetitionSubmission" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "CompetitionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProblemSubmission
CREATE TABLE IF NOT EXISTS "ProblemSubmission" (
    "id" TEXT NOT NULL,
    "competitionSubmissionId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL,
    "testsPassed" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL,
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "memoryUsed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "testResults" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "judgedAt" TIMESTAMP(3),
    "manualMarks" DOUBLE PRECISION,
    "evaluatorComments" TEXT,
    "evaluatedBy" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "isEvaluated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProblemSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable SubmissionEvaluation
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

-- CreateTable Certificate
CREATE TABLE IF NOT EXISTS "Certificate" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "batch" TEXT NOT NULL DEFAULT 'All',
    "templateType" TEXT NOT NULL DEFAULT 'participation',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable CertificateRequest
CREATE TABLE IF NOT EXISTS "CertificateRequest" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nameOnCertificate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable Event
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'workshop',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventEndDate" TIMESTAMP(3),
    "venue" TEXT,
    "posterUrl" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 100,
    "registrationStartTime" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "batch" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventParticipant
CREATE TABLE IF NOT EXISTS "EventParticipant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "moodleId" TEXT,
    "year" TEXT,
    "branch" TEXT,
    "division" TEXT,
    "collegeName" TEXT,
    "password" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'event_guest',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventRegistration
CREATE TABLE IF NOT EXISTS "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceMarked" BOOLEAN NOT NULL DEFAULT false,
    "attendanceTime" TIMESTAMP(3),
    "certificateGenerated" BOOLEAN NOT NULL DEFAULT false,
    "certificateId" TEXT,
    "registrationStatus" TEXT NOT NULL DEFAULT 'confirmed',
    "quizAttended" BOOLEAN NOT NULL DEFAULT false,
    "certificateApprovedByAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventCertificate
CREATE TABLE IF NOT EXISTS "EventCertificate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "registrationId" TEXT,
    "certificateNumber" TEXT NOT NULL,
    "certificateName" TEXT,
    "certificateUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateType" TEXT NOT NULL DEFAULT 'participation',
    "verified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventAccessControl
CREATE TABLE IF NOT EXISTS "EventAccessControl" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "accessAllowed" BOOLEAN NOT NULL DEFAULT true,
    "accessStartTime" TIMESTAMP(3),
    "accessEndTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAccessControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventEmailLog
CREATE TABLE IF NOT EXISTS "EventEmailLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailStatus" TEXT NOT NULL DEFAULT 'sent',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "EventEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventAnnouncement
CREATE TABLE IF NOT EXISTS "EventAnnouncement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "EventAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventQuiz
CREATE TABLE IF NOT EXISTS "EventQuiz" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventQuizAttempt
CREATE TABLE IF NOT EXISTS "EventQuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "EventQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventMedia
CREATE TABLE IF NOT EXISTS "EventMedia" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'document',
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable HackathonRegistration
CREATE TABLE IF NOT EXISTS "HackathonRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "problemStatementNo" INTEGER NOT NULL,
    "teamMember1Name" TEXT NOT NULL,
    "teamMember1Email" TEXT NOT NULL,
    "teamMember1Phone" TEXT NOT NULL,
    "teamMember2Name" TEXT,
    "teamMember2Email" TEXT,
    "teamMember2Phone" TEXT,
    "teamType" TEXT NOT NULL DEFAULT 'individual',
    "additionalInfo" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HackathonRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_moodleId_key" ON "User"("moodleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_moodleId_idx" ON "User"("moodleId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Student_batch_idx" ON "Student"("batch");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Note_batch_idx" ON "Note"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Note_uploadedAt_idx" ON "Note"("uploadedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Announcement_batch_idx" ON "Announcement"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quiz_batch_idx" ON "Quiz"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quiz_startTime_idx" ON "Quiz"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuizAttempt_quizId_userId_key" ON "QuizAttempt"("quizId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceSession_qrCode_key" ON "AttendanceSession"("qrCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceSession_batch_idx" ON "AttendanceSession"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceSession_isActive_idx" ON "AttendanceSession"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceSession_createdBy_idx" ON "AttendanceSession"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_userId_key" ON "AttendanceRecord"("sessionId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_markedAt_idx" ON "AttendanceRecord"("markedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attendance_batch_idx" ON "Attendance"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competition_startTime_idx" ON "Competition"("startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competition_endTime_idx" ON "Competition"("endTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competition_isActive_idx" ON "Competition"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Problem_competitionId_idx" ON "Problem"("competitionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Problem_orderIndex_idx" ON "Problem"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionRegistration_competitionId_userId_key" ON "CompetitionRegistration"("competitionId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitionRegistration_competitionId_idx" ON "CompetitionRegistration"("competitionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitionRegistration_userId_idx" ON "CompetitionRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionSubmission_competitionId_userId_key" ON "CompetitionSubmission"("competitionId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitionSubmission_competitionId_idx" ON "CompetitionSubmission"("competitionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitionSubmission_userId_idx" ON "CompetitionSubmission"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompetitionSubmission_totalScore_idx" ON "CompetitionSubmission"("totalScore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_competitionSubmissionId_idx" ON "ProblemSubmission"("competitionSubmissionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_problemId_idx" ON "ProblemSubmission"("problemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_userId_idx" ON "ProblemSubmission"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_status_idx" ON "ProblemSubmission"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_isEvaluated_idx" ON "ProblemSubmission"("isEvaluated");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProblemSubmission_evaluatedBy_idx" ON "ProblemSubmission"("evaluatedBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_submissionId_idx" ON "SubmissionEvaluation"("submissionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_evaluatorId_idx" ON "SubmissionEvaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_createdAt_idx" ON "SubmissionEvaluation"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubmissionEvaluation_action_idx" ON "SubmissionEvaluation"("action");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_batch_idx" ON "Certificate"("batch");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_isActive_idx" ON "Certificate"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_createdAt_idx" ON "Certificate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CertificateRequest_certificateId_userId_key" ON "CertificateRequest"("certificateId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CertificateRequest_userId_idx" ON "CertificateRequest"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CertificateRequest_certificateId_idx" ON "CertificateRequest"("certificateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CertificateRequest_status_idx" ON "CertificateRequest"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_isActive_idx" ON "Event"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_createdBy_idx" ON "Event"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventParticipant_email_key" ON "EventParticipant"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventParticipant_emailVerificationToken_key" ON "EventParticipant"("emailVerificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventParticipant_email_idx" ON "EventParticipant"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventParticipant_userType_idx" ON "EventParticipant"("userType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventParticipant_isEmailVerified_idx" ON "EventParticipant"("isEmailVerified");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventParticipant_moodleId_idx" ON "EventParticipant"("moodleId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_eventId_participantId_key" ON "EventRegistration"("eventId", "participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventRegistration_participantId_idx" ON "EventRegistration"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventRegistration_registrationStatus_idx" ON "EventRegistration"("registrationStatus");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventCertificate_certificateNumber_key" ON "EventCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventCertificate_participantId_idx" ON "EventCertificate"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventCertificate_eventId_idx" ON "EventCertificate"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventCertificate_certificateNumber_idx" ON "EventCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventAccessControl_eventId_idx" ON "EventAccessControl"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventAccessControl_resourceType_idx" ON "EventAccessControl"("resourceType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventEmailLog_eventId_idx" ON "EventEmailLog"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventEmailLog_participantId_idx" ON "EventEmailLog"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventEmailLog_emailType_idx" ON "EventEmailLog"("emailType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventAnnouncement_eventId_idx" ON "EventAnnouncement"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventAnnouncement_createdAt_idx" ON "EventAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventQuiz_eventId_idx" ON "EventQuiz"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventQuiz_startTime_idx" ON "EventQuiz"("startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventQuiz_isActive_idx" ON "EventQuiz"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventQuizAttempt_quizId_participantId_key" ON "EventQuizAttempt"("quizId", "participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventQuizAttempt_participantId_idx" ON "EventQuizAttempt"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventQuizAttempt_quizId_idx" ON "EventQuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventMedia_eventId_idx" ON "EventMedia"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventMedia_fileType_idx" ON "EventMedia"("fileType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HackathonRegistration_eventId_participantId_key" ON "HackathonRegistration"("eventId", "participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HackathonRegistration_eventId_idx" ON "HackathonRegistration"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HackathonRegistration_participantId_idx" ON "HackathonRegistration"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HackathonRegistration_problemStatementNo_idx" ON "HackathonRegistration"("problemStatementNo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HackathonRegistration_teamType_idx" ON "HackathonRegistration"("teamType");

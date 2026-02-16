-- Event Management System Migration
-- Run this in your Neon DB SQL Editor

-- ============================================
-- Event Tables Migration 
-- ============================================

-- 1. Events Table
CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "eventType" TEXT NOT NULL DEFAULT 'workshop',
  "eventDate" TIMESTAMP(3) NOT NULL,
  "eventEndDate" TIMESTAMP(3),
  "venue" TEXT,
  "posterUrl" TEXT,
  "maxParticipants" INTEGER NOT NULL DEFAULT 100,
  "registrationDeadline" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'upcoming',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "batch" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Event Participants Table
CREATE TABLE IF NOT EXISTS "EventParticipant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT NOT NULL,
  "year" TEXT,
  "branch" TEXT,
  "division" TEXT,
  "collegeName" TEXT,
  "password" TEXT NOT NULL,
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerificationToken" TEXT UNIQUE,
  "userType" TEXT NOT NULL DEFAULT 'event_guest',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Event Registrations Table
CREATE TABLE IF NOT EXISTS "EventRegistration" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attendanceMarked" BOOLEAN NOT NULL DEFAULT false,
  "attendanceTime" TIMESTAMP(3),
  "certificateGenerated" BOOLEAN NOT NULL DEFAULT false,
  "certificateId" TEXT,
  "registrationStatus" TEXT NOT NULL DEFAULT 'confirmed',
  CONSTRAINT "EventRegistration_eventId_participantId_key" UNIQUE ("eventId", "participantId"),
  CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventRegistration_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Event Certificates Table
CREATE TABLE IF NOT EXISTS "EventCertificate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "registrationId" TEXT,
  "certificateNumber" TEXT NOT NULL UNIQUE,
  "certificateUrl" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "templateType" TEXT NOT NULL DEFAULT 'participation',
  "verified" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "EventCertificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventCertificate_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Event Access Control Table
CREATE TABLE IF NOT EXISTS "EventAccessControl" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "accessAllowed" BOOLEAN NOT NULL DEFAULT true,
  "accessStartTime" TIMESTAMP(3),
  "accessEndTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventAccessControl_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Event Email Logs Table
CREATE TABLE IF NOT EXISTS "EventEmailLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "emailType" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "emailStatus" TEXT NOT NULL DEFAULT 'sent',
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  CONSTRAINT "EventEmailLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventEmailLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "EventParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Event Announcements Table
CREATE TABLE IF NOT EXISTS "EventAnnouncement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "eventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "announcementType" TEXT NOT NULL DEFAULT 'info',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "EventAnnouncement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");
CREATE INDEX IF NOT EXISTS "Event_eventDate_idx" ON "Event"("eventDate");
CREATE INDEX IF NOT EXISTS "Event_isActive_idx" ON "Event"("isActive");
CREATE INDEX IF NOT EXISTS "Event_createdBy_idx" ON "Event"("createdBy");

CREATE INDEX IF NOT EXISTS "EventParticipant_email_idx" ON "EventParticipant"("email");
CREATE INDEX IF NOT EXISTS "EventParticipant_userType_idx" ON "EventParticipant"("userType");
CREATE INDEX IF NOT EXISTS "EventParticipant_isEmailVerified_idx" ON "EventParticipant"("isEmailVerified");

CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX IF NOT EXISTS "EventRegistration_participantId_idx" ON "EventRegistration"("participantId");
CREATE INDEX IF NOT EXISTS "EventRegistration_registrationStatus_idx" ON "EventRegistration"("registrationStatus");

CREATE INDEX IF NOT EXISTS "EventCertificate_participantId_idx" ON "EventCertificate"("participantId");
CREATE INDEX IF NOT EXISTS "EventCertificate_eventId_idx" ON "EventCertificate"("eventId");
CREATE INDEX IF NOT EXISTS "EventCertificate_certificateNumber_idx" ON "EventCertificate"("certificateNumber");

CREATE INDEX IF NOT EXISTS "EventAccessControl_eventId_idx" ON "EventAccessControl"("eventId");
CREATE INDEX IF NOT EXISTS "EventAccessControl_resourceType_idx" ON "EventAccessControl"("resourceType");

CREATE INDEX IF NOT EXISTS "EventEmailLog_eventId_idx" ON "EventEmailLog"("eventId");
CREATE INDEX IF NOT EXISTS "EventEmailLog_participantId_idx" ON "EventEmailLog"("participantId");
CREATE INDEX IF NOT EXISTS "EventEmailLog_emailType_idx" ON "EventEmailLog"("emailType");

CREATE INDEX IF NOT EXISTS "EventAnnouncement_eventId_idx" ON "EventAnnouncement"("eventId");
CREATE INDEX IF NOT EXISTS "EventAnnouncement_createdAt_idx" ON "EventAnnouncement"("createdAt");

-- ============================================
-- Migration Complete
-- ============================================

-- Verify tables were created
SELECT 'Migration completed successfully!' as message;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'Event%'
ORDER BY table_name;

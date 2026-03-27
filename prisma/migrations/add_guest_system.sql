-- Migration: add_guest_system
-- Run this manually if `prisma migrate dev` fails due to prisma.config.ts:
--   psql $DATABASE_URL -f prisma/migrations/add_guest_system.sql
-- OR use:
--   npx prisma db push   (after temporarily renaming prisma.config.ts)

-- GuestSession: stores temporary guest identity
CREATE TABLE IF NOT EXISTS "GuestSession" (
  "id"        TEXT NOT NULL,
  "username"  TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GuestSession_username_idx"  ON "GuestSession"("username");
CREATE INDEX IF NOT EXISTS "GuestSession_isActive_idx"  ON "GuestSession"("isActive");
CREATE INDEX IF NOT EXISTS "GuestSession_expiresAt_idx" ON "GuestSession"("expiresAt");

-- GuestRouteConfig: admin-controlled per-route guest access
CREATE TABLE IF NOT EXISTS "GuestRouteConfig" (
  "id"        TEXT NOT NULL,
  "route"     TEXT NOT NULL,
  "label"     TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuestRouteConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuestRouteConfig_route_key" ON "GuestRouteConfig"("route");
CREATE INDEX IF NOT EXISTS "GuestRouteConfig_isEnabled_idx" ON "GuestRouteConfig"("isEnabled");

-- Seed default guest route config (competitions allowed by default)
INSERT INTO "GuestRouteConfig" ("id", "route", "label", "isEnabled", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, '/student/competitions',            'Competitions List',     true,  NOW(), NOW()),
  (gen_random_uuid()::text, '/student/competition/:id',        'Competition Problems',  true,  NOW(), NOW()),
  (gen_random_uuid()::text, '/student/competition/:id/results','Competition Results',   true,  NOW(), NOW()),
  (gen_random_uuid()::text, '/student/dashboard',              'Student Dashboard',     false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/profile',                'Student Profile',       false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/notes',                  'Notes Viewer',          false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/attendance',             'Attendance View',       false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/quiz/list',              'Quiz List',             false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/code-editor',            'Code Editor',           false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/support',                'Support Tickets',       false, NOW(), NOW()),
  (gen_random_uuid()::text, '/student/certificates',           'Certificates',          false, NOW(), NOW())
ON CONFLICT ("route") DO NOTHING;

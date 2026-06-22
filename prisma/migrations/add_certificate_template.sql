-- Migration: add_certificate_template
-- Adds certificate background template support with adjustable name position.
-- Run manually if needed:
--   psql $DATABASE_URL -f prisma/migrations/add_certificate_template.sql

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "certificateTemplateUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "certificateNameX" INTEGER DEFAULT 421;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "certificateNameY" INTEGER DEFAULT 328;

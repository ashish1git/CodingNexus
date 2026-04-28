-- Add replyEnabled field to SupportTicket
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "replyEnabled" BOOLEAN NOT NULL DEFAULT false;

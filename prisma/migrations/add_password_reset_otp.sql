-- Migration: add_password_reset_otp
-- Stores OTPs for password reset flow. OTPs expire after 10 minutes.
-- Run manually if needed:
--   psql $DATABASE_URL -f prisma/migrations/add_password_reset_otp.sql

CREATE TABLE IF NOT EXISTS "PasswordResetOTP" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "otp"       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isUsed"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetOTP_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetOTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PasswordResetOTP_userId_idx" ON "PasswordResetOTP" ("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetOTP_otp_idx" ON "PasswordResetOTP" ("otp");
CREATE INDEX IF NOT EXISTS "PasswordResetOTP_expiresAt_idx" ON "PasswordResetOTP" ("expiresAt");

-- CreateEnum
CREATE TYPE "SessionRevocationReason" AS ENUM ('ROTATED', 'REPLAY_DETECTED');

-- AlterTable
ALTER TABLE "Session"
ADD COLUMN "familyId" TEXT,
ADD COLUMN "replacedBySessionId" TEXT,
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedReason" "SessionRevocationReason";

-- Backfill existing sessions so each existing session starts its own family.
UPDATE "Session" SET "familyId" = "id" WHERE "familyId" IS NULL;

ALTER TABLE "Session" ALTER COLUMN "familyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Session_familyId_idx" ON "Session"("familyId");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

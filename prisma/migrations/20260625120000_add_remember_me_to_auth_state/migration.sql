-- AlterTable
ALTER TABLE "Session" ADD COLUMN "rememberMe" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MfaChallenge" ADD COLUMN "rememberMe" BOOLEAN NOT NULL DEFAULT false;

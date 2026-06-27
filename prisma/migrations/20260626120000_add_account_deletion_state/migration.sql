-- AlterEnum
ALTER TYPE "SessionRevocationReason" ADD VALUE 'ACCOUNT_DELETED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "anonymizedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Barber" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

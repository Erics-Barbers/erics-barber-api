-- CreateEnum
CREATE TYPE "OutboxEventType" AS ENUM (
    'BOOKING_CONFIRMATION_EMAIL',
    'BOOKING_UPDATED_EMAIL',
    'BOOKING_CANCELLED_EMAIL'
);

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PROCESSED',
    'FAILED'
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "type" "OutboxEventType" NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_type_status_idx" ON "OutboxEvent"("type", "status");

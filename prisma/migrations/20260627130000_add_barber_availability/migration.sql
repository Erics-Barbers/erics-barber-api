-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('UNAVAILABLE', 'AVAILABLE');

-- Normalize existing service durations to the current MVP rule.
UPDATE "Service" SET "durationMinutes" = 30;

-- CreateTable
CREATE TABLE "BarberAvailabilityRule" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarberAvailabilityException" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "type" "AvailabilityExceptionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarberAvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarberAvailabilityRule_barberId_dayOfWeek_idx" ON "BarberAvailabilityRule"("barberId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BarberAvailabilityRule_barberId_dayOfWeek_startMinute_endMinute_key" ON "BarberAvailabilityRule"("barberId", "dayOfWeek", "startMinute", "endMinute");

-- CreateIndex
CREATE INDEX "BarberAvailabilityException_barberId_date_idx" ON "BarberAvailabilityException"("barberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_barberId_startTime_key" ON "Booking"("barberId", "startTime") WHERE "barberId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "BarberAvailabilityRule" ADD CONSTRAINT "BarberAvailabilityRule_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarberAvailabilityException" ADD CONSTRAINT "BarberAvailabilityException_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "Service" ADD CONSTRAINT "Service_durationMinutes_30_check" CHECK ("durationMinutes" = 30);

-- AddCheckConstraint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_30_minute_duration_check" CHECK ("endTime" = "startTime" + INTERVAL '30 minutes');

-- AddCheckConstraint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_start_half_hour_check" CHECK (
    EXTRACT(MINUTE FROM "startTime") IN (0, 30)
    AND EXTRACT(SECOND FROM "startTime") = 0
);

-- AddCheckConstraint
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_end_half_hour_check" CHECK (
    EXTRACT(MINUTE FROM "endTime") IN (0, 30)
    AND EXTRACT(SECOND FROM "endTime") = 0
);

-- AddCheckConstraint
ALTER TABLE "BarberAvailabilityRule" ADD CONSTRAINT "BarberAvailabilityRule_minutes_check" CHECK (
    "startMinute" >= 0
    AND "startMinute" < 1440
    AND "endMinute" > 0
    AND "endMinute" <= 1440
    AND "startMinute" < "endMinute"
    AND "startMinute" % 30 = 0
    AND "endMinute" % 30 = 0
);

-- AddCheckConstraint
ALTER TABLE "BarberAvailabilityException" ADD CONSTRAINT "BarberAvailabilityException_minutes_check" CHECK (
    (
        "startMinute" IS NULL
        AND "endMinute" IS NULL
    )
    OR (
        "startMinute" IS NOT NULL
        AND "endMinute" IS NOT NULL
        AND "startMinute" >= 0
        AND "startMinute" < 1440
        AND "endMinute" > 0
        AND "endMinute" <= 1440
        AND "startMinute" < "endMinute"
        AND "startMinute" % 30 = 0
        AND "endMinute" % 30 = 0
    )
);

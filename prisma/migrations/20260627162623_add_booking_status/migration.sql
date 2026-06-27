-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED';

-- RenameIndex
ALTER INDEX "BarberAvailabilityRule_barberId_dayOfWeek_startMinute_endMinute" RENAME TO "BarberAvailabilityRule_barberId_dayOfWeek_startMinute_endMi_key";

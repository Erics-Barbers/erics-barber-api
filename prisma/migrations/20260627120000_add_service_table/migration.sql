-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePence" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData
INSERT INTO "Service" ("id", "name", "description", "pricePence", "durationMinutes", "updatedAt")
VALUES
  ('svc_haircut', 'Haircut', 'Classic haircut with consultation and finishing style.', 2500, 45, CURRENT_TIMESTAMP),
  ('svc_beard', 'Beard', 'Beard trim and shape-up with clean edges.', 1500, 30, CURRENT_TIMESTAMP),
  ('svc_full', 'Full Service', 'Haircut plus beard trim and shape-up.', 3500, 60, CURRENT_TIMESTAMP);

-- DropEnum
DROP TYPE IF EXISTS "Services";

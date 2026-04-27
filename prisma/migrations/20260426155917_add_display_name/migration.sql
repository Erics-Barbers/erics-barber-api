/*
  Warnings:

  - A unique constraint covering the columns `[displayName]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayName` to the `Barber` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Barber_displayName_key" ON "Barber"("displayName");

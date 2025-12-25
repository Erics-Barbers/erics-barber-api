/*
  Warnings:

  - You are about to drop the column `email` on the `Barber` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Barber` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Barber` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Barber` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Barber` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Barber_email_key";

-- AlterTable
ALTER TABLE "Barber" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "passwordHash",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Barber_userId_key" ON "Barber"("userId");

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

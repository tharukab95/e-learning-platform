/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AssessmentSubmission` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Made the column `pdfUrl` on table `Lesson` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AssessmentSubmission" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "pdfUrl" SET NOT NULL;

-- Set updatedAt for existing rows
UPDATE "Lesson" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- Make updatedAt NOT NULL
ALTER TABLE "Lesson" ALTER COLUMN "updatedAt" SET NOT NULL;

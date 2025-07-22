/*
  Warnings:

  - You are about to drop the column `classId` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Video` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lessonId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lessonId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_classId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_classId_fkey";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "classId",
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lessonId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "classId",
ADD COLUMN     "lessonId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

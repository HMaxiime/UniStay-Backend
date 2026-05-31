/*
  Warnings:

  - You are about to drop the column `materialId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `questionCount` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `skillId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProof` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentRef` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the `MaterialSkill` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `courseId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_skillId_fkey";

-- DropForeignKey
ALTER TABLE "MaterialSkill" DROP CONSTRAINT "MaterialSkill_materialId_fkey";

-- DropForeignKey
ALTER TABLE "MaterialSkill" DROP CONSTRAINT "MaterialSkill_skillId_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "materialId",
DROP COLUMN "questionCount",
DROP COLUMN "skillId",
ADD COLUMN     "courseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "paymentProof",
DROP COLUMN "paymentRef";

-- DropTable
DROP TABLE "MaterialSkill";

-- CreateTable
CREATE TABLE "CourseSkill" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CourseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentResultQuestion" (
    "id" TEXT NOT NULL,
    "assignmentResultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "AssignmentResultQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateSkill" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CertificateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseSkill_courseId_skillId_key" ON "CourseSkill"("courseId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentResultQuestion_assignmentResultId_questionId_key" ON "AssignmentResultQuestion"("assignmentResultId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateSkill_certificateId_skillId_key" ON "CertificateSkill"("certificateId", "skillId");

-- AddForeignKey
ALTER TABLE "CourseSkill" ADD CONSTRAINT "CourseSkill_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSkill" ADD CONSTRAINT "CourseSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentResultQuestion" ADD CONSTRAINT "AssignmentResultQuestion_assignmentResultId_fkey" FOREIGN KEY ("assignmentResultId") REFERENCES "AssignmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentResultQuestion" ADD CONSTRAINT "AssignmentResultQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateSkill" ADD CONSTRAINT "CertificateSkill_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateSkill" ADD CONSTRAINT "CertificateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

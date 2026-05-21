-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

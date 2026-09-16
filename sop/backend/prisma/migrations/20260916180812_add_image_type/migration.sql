-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('BEFORE', 'AFTER');

-- AlterTable
ALTER TABLE "ReportImage" ADD COLUMN     "type" "ImageType" NOT NULL DEFAULT 'BEFORE';

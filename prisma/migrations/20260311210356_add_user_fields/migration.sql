-- CreateEnum
CREATE TYPE "EnglishLevel" AS ENUM ('BUSINESS', 'DAILY', 'BASIC', 'NONE');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'HOURLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VisaType" ADD VALUE 'STUDENT';
ALTER TYPE "VisaType" ADD VALUE 'SPOUSE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio_en" TEXT,
ADD COLUMN     "bio_ja" TEXT,
ADD COLUMN     "desired_prefecture" TEXT,
ADD COLUMN     "desired_salary" INTEGER,
ADD COLUMN     "english_level" "EnglishLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "fb_profile_url" TEXT,
ADD COLUMN     "fb_score" DOUBLE PRECISION,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "height_cm" DOUBLE PRECISION,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "salary_type" "SalaryType",
ADD COLUMN     "weight_kg" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "User_english_level_idx" ON "User"("english_level");

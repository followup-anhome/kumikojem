-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('LOGISTICS', 'CONSTRUCTION', 'CARE', 'FACTORY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ManagementCompany" AS ENUM ('AN_HOME', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('SPECIFIED_SKILLED_1', 'SPECIFIED_SKILLED_2', 'TECHNICAL_INTERN', 'ENGINEER', 'PERMANENT_RESIDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "JapaneseLevel" AS ENUM ('N1', 'N2', 'N3', 'N4', 'N5', 'NONE');

-- CreateEnum
CREATE TYPE "IndustryType" AS ENUM ('LOGISTICS', 'CONSTRUCTION', 'CARE', 'FACTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "JobCategory" NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "location_name" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "housing_status" BOOLEAN NOT NULL DEFAULT false,
    "company_name" TEXT,
    "source_pdf_url" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_kana" TEXT,
    "gender" "Gender" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "nationality" TEXT NOT NULL DEFAULT 'Philippines',
    "fb_profile_url" TEXT,
    "certificates" TEXT[],
    "suitability_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "availability_date" TIMESTAMP(3),
    "desired_salary_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rent" INTEGER NOT NULL,
    "management_company" "ManagementCompany" NOT NULL DEFAULT 'AN_HOME',
    "floor_plan" TEXT,
    "max_occupancy" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "external_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "talent_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Philippines',
    "visa_type" "VisaType" NOT NULL DEFAULT 'OTHER',
    "skills" TEXT[],
    "japanese_level" "JapaneseLevel" NOT NULL DEFAULT 'NONE',
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "IndustryType" NOT NULL,
    "location" TEXT NOT NULL,
    "accepted_visas" "VisaType"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "location" TEXT NOT NULL,
    "required_skills" TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "interview_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyRecommendation" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_category_idx" ON "Job"("category");

-- CreateIndex
CREATE INDEX "Job_location_lat_location_lng_idx" ON "Job"("location_lat", "location_lng");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Talent_suitability_score_idx" ON "Talent"("suitability_score");

-- CreateIndex
CREATE INDEX "Talent_gender_idx" ON "Talent"("gender");

-- CreateIndex
CREATE INDEX "Property_lat_lng_idx" ON "Property"("lat", "lng");

-- CreateIndex
CREATE INDEX "Property_available_idx" ON "Property"("available");

-- CreateIndex
CREATE INDEX "Property_management_company_idx" ON "Property"("management_company");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_score_idx" ON "Match"("score");

-- CreateIndex
CREATE UNIQUE INDEX "Match_job_id_talent_id_key" ON "Match"("job_id", "talent_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_visa_type_idx" ON "User"("visa_type");

-- CreateIndex
CREATE INDEX "User_japanese_level_idx" ON "User"("japanese_level");

-- CreateIndex
CREATE INDEX "JobPosting_company_id_idx" ON "JobPosting"("company_id");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_interview_at_idx" ON "Application"("interview_at");

-- CreateIndex
CREATE UNIQUE INDEX "Application_user_id_job_posting_id_key" ON "Application"("user_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "PropertyRecommendation_distance_km_idx" ON "PropertyRecommendation"("distance_km");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyRecommendation_job_id_property_id_key" ON "PropertyRecommendation"("job_id", "property_id");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "Talent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRecommendation" ADD CONSTRAINT "PropertyRecommendation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRecommendation" ADD CONSTRAINT "PropertyRecommendation_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

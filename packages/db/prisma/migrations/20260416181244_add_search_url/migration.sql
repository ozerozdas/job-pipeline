-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyLinkedinUrl" TEXT,
    "companyLogo" TEXT,
    "location" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionHtml" TEXT,
    "source" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicantsCount" TEXT,
    "applyUrl" TEXT,
    "salary" TEXT,
    "seniorityLevel" TEXT,
    "employmentType" TEXT,
    "jobFunction" TEXT,
    "industries" TEXT,
    "applyMethod" TEXT,
    "expireAt" TIMESTAMP(3),
    "workplaceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workRemoteAllowed" BOOLEAN,
    "standardizedTitle" TEXT,
    "country" TEXT,
    "jobPosterName" TEXT,
    "jobPosterTitle" TEXT,
    "jobPosterPhoto" TEXT,
    "jobPosterProfileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeProfile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT,
    "rawText" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobScore" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");

-- CreateIndex
CREATE UNIQUE INDEX "SyncLog_date_key" ON "SyncLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "JobScore_jobId_resumeProfileId_key" ON "JobScore"("jobId", "resumeProfileId");

-- AddForeignKey
ALTER TABLE "JobScore" ADD CONSTRAINT "JobScore_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScore" ADD CONSTRAINT "JobScore_resumeProfileId_fkey" FOREIGN KEY ("resumeProfileId") REFERENCES "ResumeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

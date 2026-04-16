import { prisma } from "@job-pipeline/db";
import type { JobItem } from "@job-pipeline/shared";

type JobWithScores = Awaited<ReturnType<typeof prisma.job.findFirstOrThrow>> & {
  scores?: Array<{ score: number; reasoning: string }>;
};

const serializeJob = (job: JobWithScores): JobItem => {
  const latestScore = job.scores?.[0] ?? null;
  return {
    id: job.id,
    externalId: job.externalId,
    title: job.title,
    company: job.company,
    companyLinkedinUrl: job.companyLinkedinUrl,
    companyLogo: job.companyLogo,
    location: job.location,
    url: job.url,
    description: job.description,
    descriptionHtml: job.descriptionHtml,
    source: job.source,
    postedAt: job.postedAt?.toISOString() ?? null,
    benefits: job.benefits,
    applicantsCount: job.applicantsCount,
    applyUrl: job.applyUrl,
    salary: job.salary,
    seniorityLevel: job.seniorityLevel,
    employmentType: job.employmentType,
    jobFunction: job.jobFunction,
    industries: job.industries,
    applyMethod: job.applyMethod,
    expireAt: job.expireAt?.toISOString() ?? null,
    workplaceTypes: job.workplaceTypes,
    workRemoteAllowed: job.workRemoteAllowed,
    standardizedTitle: job.standardizedTitle,
    country: job.country,
    jobPosterName: job.jobPosterName,
    jobPosterTitle: job.jobPosterTitle,
    jobPosterPhoto: job.jobPosterPhoto,
    jobPosterProfileUrl: job.jobPosterProfileUrl,
    createdAt: job.createdAt.toISOString(),
    syncedAt: job.syncedAt?.toISOString() ?? null,
    score: latestScore?.score ?? null,
    scoreReasoning: latestScore?.reasoning ?? null
  };
};

export const getAllJobs = async (): Promise<JobItem[]> => {
  const jobs = await prisma.job.findMany({
    include: {
      scores: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const serialized = jobs.map(serializeJob);

  // Sort: scored jobs first (highest score), then unscored
  return serialized.sort((a, b) => {
    if (a.score !== null && b.score !== null) return b.score - a.score;
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return 0;
  });
};

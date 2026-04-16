import { prisma } from "@job-pipeline/db";
import type { JobItem } from "@job-pipeline/shared";

const serializeJob = (job: Awaited<ReturnType<typeof prisma.job.findFirstOrThrow>>): JobItem => ({
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
  syncedAt: job.syncedAt?.toISOString() ?? null
});

export const getAllJobs = async (): Promise<JobItem[]> => {
  const jobs = await prisma.job.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return jobs.map(serializeJob);
};

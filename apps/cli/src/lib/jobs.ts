import { prisma } from "@job-pipeline/db";
import type { JobItem } from "@job-pipeline/shared";

export const fetchJobs = async (limit?: number): Promise<JobItem[]> => {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  return jobs.map((job) => ({
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
  }));
};

export const fetchJobById = async (id: string): Promise<JobItem | null> => {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return null;

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
  };
};

export const jobToContext = (job: JobItem): string => {
  const parts = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location}`,
    job.salary ? `Salary: ${job.salary}` : null,
    job.seniorityLevel ? `Level: ${job.seniorityLevel}` : null,
    job.employmentType ? `Type: ${job.employmentType}` : null,
    job.workRemoteAllowed ? `Remote: Yes` : null,
    job.benefits.length ? `Benefits: ${job.benefits.join(", ")}` : null,
    `\nDescription:\n${job.description}`,
  ];
  return parts.filter(Boolean).join("\n");
};

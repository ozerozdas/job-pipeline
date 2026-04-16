import { prisma } from "@job-pipeline/db";
import type { JobItem } from "@job-pipeline/shared";

const serializeJob = (job: {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  createdAt: Date;
  syncedAt: Date | null;
}): JobItem => ({
  id: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  url: job.url,
  description: job.description,
  source: job.source,
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

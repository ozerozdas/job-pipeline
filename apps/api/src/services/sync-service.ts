import { prisma, SyncStatus } from "@job-pipeline/db";
import { dateKeyToDate, getDateKey, type SyncResponse } from "@job-pipeline/shared";

import { env } from "../lib/env";
import { fetchApifyJobs } from "./apify-job-source";
import { fetchMockJobs } from "./mock-job-source";

const DEFAULT_LINKEDIN_URLS = [
  "https://www.linkedin.com/jobs/search/?currentJobId=4400700367&distance=25.0&f_AL=true&geoId=103644278&keywords=AI%20Software%20Engineer&origin=JOBS_HOME_KEYWORD_HISTORY",
  "https://www.linkedin.com/jobs/search/?currentJobId=4335537265&f_AL=true&geoId=91000000&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
  "https://www.linkedin.com/jobs/search/?currentJobId=4400703330&f_AL=true&geoId=102105699&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
];

export const syncJobsForToday = async (): Promise<SyncResponse> => {
  const dateKey = getDateKey(new Date(), env.appTimeZone);
  const syncDate = dateKeyToDate(dateKey);

  const existingLog = await prisma.syncLog.findUnique({
    where: {
      date: syncDate
    }
  });

  if (existingLog) {
    return {
      status: "already_synced",
      insertedCount: 0,
      date: dateKey,
      message: "Already synced today"
    };
  }

  try {
    const externalJobs = env.apifyToken
      ? await fetchApifyJobs(DEFAULT_LINKEDIN_URLS)
      : await fetchMockJobs(dateKey);
    const syncedAt = new Date();

    const result = await prisma.job.createMany({
      data: externalJobs.map((job) => ({
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
        postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
        benefits: job.benefits ?? [],
        applicantsCount: job.applicantsCount,
        applyUrl: job.applyUrl,
        salary: job.salary,
        seniorityLevel: job.seniorityLevel,
        employmentType: job.employmentType,
        jobFunction: job.jobFunction,
        industries: job.industries,
        applyMethod: job.applyMethod,
        expireAt: job.expireAt ? new Date(job.expireAt) : undefined,
        workplaceTypes: job.workplaceTypes ?? [],
        workRemoteAllowed: job.workRemoteAllowed,
        standardizedTitle: job.standardizedTitle,
        country: job.country,
        jobPosterName: job.jobPosterName,
        jobPosterTitle: job.jobPosterTitle,
        jobPosterPhoto: job.jobPosterPhoto,
        jobPosterProfileUrl: job.jobPosterProfileUrl,
        syncedAt
      })),
      skipDuplicates: true
    });

    await prisma.syncLog.create({
      data: {
        date: syncDate,
        status: SyncStatus.SUCCESS
      }
    });

    return {
      status: "synced",
      insertedCount: result.count,
      date: dateKey,
      message: `Synced ${result.count} jobs`
    };
  } catch (error) {
    await prisma.syncLog
      .create({
        data: {
          date: syncDate,
          status: SyncStatus.FAILED
        }
      })
      .catch(() => null);

    throw error;
  }
};

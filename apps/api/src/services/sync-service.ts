import { prisma, SyncStatus } from "@job-pipeline/db";
import { dateKeyToDate, getDateKey, type SyncResponse } from "@job-pipeline/shared";

import { env } from "../lib/env";
import { fetchApifyJobs } from "./apify-job-source";
import { getJobIdentityTokens, selectPreferredJob } from "./job-identity";
import { fetchMockJobs } from "./mock-job-source";
import { fetchRssJobs } from "./rss-job-source";
import { getSearchUrls } from "./search-url-service";

const fetchExternalJobs = async (dateKey: string) => {
  const sources = await getSearchUrls();
  const linkedinUrls = sources
    .filter((source) => source.sourceType === "linkedin_apify")
    .map((source) => source.url);
  const rssSources = sources
    .filter((source) => source.sourceType === "rss_feed")
    .map((source) => ({
      url: source.url,
      provider: source.provider
    }));

  const [linkedinJobs, rssJobs] = await Promise.all([
    linkedinUrls.length > 0
      ? env.apifyToken
        ? fetchApifyJobs(linkedinUrls)
        : fetchMockJobs(dateKey)
      : Promise.resolve([]),
    rssSources.length > 0 ? fetchRssJobs(rssSources) : Promise.resolve([])
  ]);

  return [...linkedinJobs, ...rssJobs];
};

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
    const externalJobs = await fetchExternalJobs(dateKey);
    const syncedAt = new Date();

    const existingJobs = await prisma.job.findMany({
      select: {
        id: true,
        source: true,
        externalId: true,
        url: true,
        applied: true,
        createdAt: true,
        syncedAt: true,
        scores: {
          select: { id: true },
          take: 1
        }
      }
    });

    const jobsByToken = new Map<string, typeof existingJobs>();

    const addJobToIndexes = (job: (typeof existingJobs)[number]) => {
      for (const token of getJobIdentityTokens(job)) {
        const currentJobs = jobsByToken.get(token);

        if (currentJobs) {
          if (!currentJobs.some((currentJob) => currentJob.id === job.id)) {
            currentJobs.push(job);
          }
        } else {
          jobsByToken.set(token, [job]);
        }
      }
    };

    existingJobs.forEach(addJobToIndexes);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const job of externalJobs) {
      const matchingTokens = getJobIdentityTokens(job);
      const matchingJobs = matchingTokens.flatMap((token) => jobsByToken.get(token) ?? []);
      const uniqueMatchingJobs = [...new Map(matchingJobs.map((existingJob) => [existingJob.id, existingJob])).values()];
      const jobData = {
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
      };

      if (uniqueMatchingJobs.length > 0) {
        const targetJob = selectPreferredJob(uniqueMatchingJobs);

        const updatedJob = await prisma.job.update({
          where: { id: targetJob.id },
          data: jobData,
          select: {
            id: true,
            source: true,
            externalId: true,
            url: true,
            applied: true,
            createdAt: true,
            syncedAt: true,
            scores: {
              select: { id: true },
              take: 1
            }
          }
        });

        addJobToIndexes(updatedJob);
        updatedCount += 1;
        continue;
      }

      const createdJob = await prisma.job.create({
        data: jobData,
        select: {
          id: true,
          source: true,
          externalId: true,
          url: true,
          applied: true,
          createdAt: true,
          syncedAt: true,
          scores: {
            select: { id: true },
            take: 1
          }
        }
      });

      addJobToIndexes(createdJob);
      insertedCount += 1;
    }

    await prisma.syncLog.create({
      data: {
        date: syncDate,
        status: SyncStatus.SUCCESS
      }
    });

    return {
      status: "synced",
      insertedCount,
      date: dateKey,
      message: `Synced ${insertedCount} new jobs and refreshed ${updatedCount} existing jobs`
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

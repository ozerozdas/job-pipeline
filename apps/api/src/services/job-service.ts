import { Prisma, prisma } from "@job-pipeline/db";
import type { JobAppliedFilter, JobItem, JobMatchFilter, JobsQueryParams, JobsResponse, JobsSummary } from "@job-pipeline/shared";

import { getJobIdentityTokens, groupJobsByIdentity, matchesAppliedFilter, matchesJobSearch, matchesScoreFilter, selectPreferredJob } from "./job-identity";

const latestScoreInclude = {
  scores: {
    orderBy: { createdAt: "desc" as const },
    take: 1
  }
};

type JobWithScores = Prisma.JobGetPayload<{
  include: typeof latestScoreInclude;
}>;

type SerializedJob = JobItem & {
  latestScoreCreatedAt: string | null;
};

const serializeJob = (job: JobWithScores): SerializedJob => {
  const latestScore = job.scores[0] ?? null;

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
    applied: job.applied,
    createdAt: job.createdAt.toISOString(),
    syncedAt: job.syncedAt?.toISOString() ?? null,
    score: latestScore?.score ?? null,
    scoreReasoning: latestScore?.reasoning ?? null,
    latestScoreCreatedAt: latestScore?.createdAt.toISOString() ?? null
  };
};

const toTimestamp = (value: string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getActivityTimestamp = (job: Pick<JobItem, "createdAt" | "syncedAt">) => {
  return Math.max(toTimestamp(job.syncedAt), toTimestamp(job.createdAt));
};

const compareSerializableJobs = (left: SerializedJob, right: SerializedJob) => {
  if ((left.score !== null) !== (right.score !== null)) {
    return left.score !== null ? -1 : 1;
  }

  if (left.score !== null && right.score !== null && left.score !== right.score) {
    return right.score - left.score;
  }

  return getActivityTimestamp(right) - getActivityTimestamp(left);
};

const getLatestScoredJob = (jobs: SerializedJob[]) => {
  return [...jobs]
    .filter((job) => job.score !== null)
    .sort((left, right) => {
      const scoreTimestampDifference = toTimestamp(right.latestScoreCreatedAt) - toTimestamp(left.latestScoreCreatedAt);
      if (scoreTimestampDifference !== 0) return scoreTimestampDifference;
      return (right.score ?? 0) - (left.score ?? 0);
    })[0] ?? null;
};

const canonicalizeJobs = (jobs: JobWithScores[]) => {
  const serializedJobs = jobs.map(serializeJob);

  return groupJobsByIdentity(serializedJobs)
    .map((group) => {
      const canonicalJob = selectPreferredJob(group);
      const latestScoredJob = getLatestScoredJob(group);
      const latestSyncedAt = [...group]
        .map((job) => job.syncedAt)
        .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0] ?? null;

      return {
        ...canonicalJob,
        applied: group.some((job) => job.applied),
        syncedAt: latestSyncedAt,
        score: latestScoredJob?.score ?? null,
        scoreReasoning: latestScoredJob?.scoreReasoning ?? null
      } satisfies SerializedJob;
    })
    .sort(compareSerializableJobs)
    .map(({ latestScoreCreatedAt: _latestScoreCreatedAt, ...job }) => job);
};

const normalizePageSize = (value?: number) => {
  if (!value || Number.isNaN(value)) return 25;
  return Math.max(1, Math.min(100, Math.floor(value)));
};

const normalizePage = (value?: number) => {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, Math.floor(value));
};

const buildSummary = (jobs: JobItem[]): JobsSummary => {
  const today = new Date().toDateString();

  return {
    total: jobs.length,
    syncedToday: jobs.filter((job) => new Date(job.syncedAt ?? job.createdAt).toDateString() === today).length,
    highMatch: jobs.filter((job) => job.score !== null && job.score >= 75).length,
    appliedTotal: jobs.filter((job) => job.applied).length,
    recommendedNotApplied: jobs.filter((job) => !job.applied && job.score !== null && job.score >= 50).length,
    scoredTotal: jobs.filter((job) => job.score !== null).length
  };
};

const filterJobs = (
  jobs: JobItem[],
  query: string,
  appliedFilter: JobAppliedFilter,
  matchFilter: JobMatchFilter
) => {
  return jobs.filter((job) => {
    return (
      matchesJobSearch(job, query) &&
      matchesAppliedFilter(job, appliedFilter) &&
      matchesScoreFilter(job, matchFilter)
    );
  });
};

export const getAllJobs = async (options: JobsQueryParams = {}): Promise<JobsResponse> => {
  const pageSize = normalizePageSize(options.pageSize);
  const requestedPage = normalizePage(options.page);
  const query = options.query?.trim().toLowerCase() ?? "";
  const appliedFilter = options.applied ?? "all";
  const matchFilter = options.match ?? "all";

  const jobs = await prisma.job.findMany({
    include: latestScoreInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  const canonicalJobs = canonicalizeJobs(jobs);
  const filteredJobs = filterJobs(canonicalJobs, query, appliedFilter, matchFilter);
  const total = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  return {
    jobs: filteredJobs.slice(offset, offset + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    summary: buildSummary(canonicalJobs)
  };
};

export const toggleJobApplied = async (id: string, applied: boolean): Promise<JobItem> => {
  const [targetJob, allJobs] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.job.findMany({
      select: {
        id: true,
        source: true,
        externalId: true,
        url: true
      }
    })
  ]);

  if (!targetJob) {
    throw new Error(`Job ${id} not found`);
  }

  const targetTokens = new Set(getJobIdentityTokens(targetJob));
  const relatedIds = allJobs
    .filter((job) => getJobIdentityTokens(job).some((token) => targetTokens.has(token)))
    .map((job) => job.id);

  await prisma.job.updateMany({
    where: {
      id: {
        in: relatedIds.length > 0 ? relatedIds : [id]
      }
    },
    data: { applied }
  });

  const updatedJobs = await prisma.job.findMany({
    where: {
      id: {
        in: relatedIds.length > 0 ? relatedIds : [id]
      }
    },
    include: latestScoreInclude
  });

  return canonicalizeJobs(updatedJobs)[0];
};

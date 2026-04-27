import type { JobAppliedFilter, JobItem, JobMatchFilter } from "@job-pipeline/shared";

type IdentityInput = {
  source: string;
  externalId?: string | null;
  url: string;
};

type CandidateScore = {
  createdAt?: Date | string;
};

type CandidateJob = IdentityInput & {
  applied?: boolean;
  createdAt?: Date | string;
  syncedAt?: Date | string | null;
  score?: number | null;
  scores?: CandidateScore[];
};

const normalizeSource = (source: string) => source.trim().toLowerCase();

export const normalizeJobUrl = (rawUrl: string) => {
  const trimmedUrl = rawUrl.trim();

  try {
    const parsedUrl = new URL(trimmedUrl);
    parsedUrl.hash = "";
    parsedUrl.search = "";

    if (parsedUrl.pathname.length > 1) {
      parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
    }

    return parsedUrl.toString();
  } catch {
    return trimmedUrl.replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
};

export const getJobIdentityTokens = ({ source, externalId, url }: IdentityInput) => {
  const normalizedSource = normalizeSource(source);
  const normalizedUrl = normalizeJobUrl(url);
  const tokens = [`${normalizedSource}::url::${normalizedUrl}`, `url::${normalizedUrl}`];
  const normalizedExternalId = externalId?.trim();

  if (normalizedExternalId) {
    tokens.unshift(`${normalizedSource}::external::${normalizedExternalId}`);
  }

  return [...new Set(tokens)];
};

const toTimestamp = (value?: Date | string | null) => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const hasScore = (job: CandidateJob) =>
  job.score !== null && job.score !== undefined
    ? true
    : (job.scores?.length ?? 0) > 0;

export const selectPreferredJob = <T extends CandidateJob>(jobs: T[]) => {
  return [...jobs].sort((left, right) => {
    if (hasScore(left) !== hasScore(right)) {
      return hasScore(right) ? 1 : -1;
    }

    if (Boolean(left.applied) !== Boolean(right.applied)) {
      return left.applied ? -1 : 1;
    }

    if (Boolean(left.externalId?.trim()) !== Boolean(right.externalId?.trim())) {
      return left.externalId?.trim() ? -1 : 1;
    }

    const syncedDifference = toTimestamp(right.syncedAt) - toTimestamp(left.syncedAt);
    if (syncedDifference !== 0) return syncedDifference;

    return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
  })[0];
};

export const groupJobsByIdentity = <T extends IdentityInput>(jobs: T[]) => {
  const tokenToJobIndexes = new Map<string, number[]>();

  jobs.forEach((job, jobIndex) => {
    for (const token of getJobIdentityTokens(job)) {
      const existingIndexes = tokenToJobIndexes.get(token);
      if (existingIndexes) {
        existingIndexes.push(jobIndex);
      } else {
        tokenToJobIndexes.set(token, [jobIndex]);
      }
    }
  });

  const visitedIndexes = new Set<number>();
  const groups: T[][] = [];

  jobs.forEach((job, jobIndex) => {
    if (visitedIndexes.has(jobIndex)) return;

    const queue = [jobIndex];
    const group: T[] = [];
    visitedIndexes.add(jobIndex);

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      if (currentIndex === undefined) break;

      const currentJob = jobs[currentIndex];
      group.push(currentJob);

      for (const token of getJobIdentityTokens(currentJob)) {
        const neighborIndexes = tokenToJobIndexes.get(token) ?? [];

        for (const neighborIndex of neighborIndexes) {
          if (visitedIndexes.has(neighborIndex)) continue;
          visitedIndexes.add(neighborIndex);
          queue.push(neighborIndex);
        }
      }
    }

    groups.push(group);
  });

  return groups;
};

export const matchesJobSearch = (job: Pick<JobItem, "title" | "company" | "location" | "description" | "employmentType" | "seniorityLevel" | "jobFunction" | "industries" | "standardizedTitle">, query: string) => {
  if (!query) return true;

  const haystack = [
    job.title,
    job.company,
    job.location,
    job.description,
    job.employmentType,
    job.seniorityLevel,
    job.jobFunction,
    job.industries,
    job.standardizedTitle
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

export const matchesAppliedFilter = (job: Pick<JobItem, "applied">, filter: JobAppliedFilter) => {
  if (filter === "applied") return job.applied;
  if (filter === "not-applied") return !job.applied;
  return true;
};

export const matchesScoreFilter = (job: Pick<JobItem, "score">, filter: JobMatchFilter) => {
  if (filter === "all") return true;
  if (filter === "unscored") return job.score === null;
  if (job.score === null) return false;
  if (filter === "high") return job.score >= 75;
  if (filter === "good") return job.score >= 50 && job.score < 75;
  return job.score < 50;
};

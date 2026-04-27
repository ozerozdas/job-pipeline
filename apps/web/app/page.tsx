import type { JobAppliedFilter, JobMatchFilter, JobsResponse } from "@job-pipeline/shared";

import { AnalyzeJobsButton } from "../components/analyze-jobs-button";
import { JobsTable } from "../components/jobs-table";
import { ManageSearchUrlsButton } from "../components/manage-search-urls-button";
import { ResumeUploadButton } from "../components/resume-upload-button";
import { SyncButton } from "../components/sync-button";
import { getJobs, getResumeProfile } from "../lib/api";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 25;

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const readSearchParam = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const readPositiveNumber = (value?: string) => {
  if (!value) return undefined;
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) return undefined;
  return Math.floor(parsedValue);
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = readPositiveNumber(readSearchParam(resolvedSearchParams, "page")) ?? 1;
  const query = readSearchParam(resolvedSearchParams, "query") ?? "";
  const applied = (readSearchParam(resolvedSearchParams, "applied") as JobAppliedFilter | undefined) ?? "all";
  const match = (readSearchParam(resolvedSearchParams, "match") as JobMatchFilter | undefined) ?? "all";

  let jobsResponse: JobsResponse = {
    jobs: [],
    pagination: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 1
    },
    summary: {
      total: 0,
      syncedToday: 0,
      highMatch: 0,
      appliedTotal: 0,
      recommendedNotApplied: 0,
      scoredTotal: 0
    }
  };
  let loadError: string | null = null;
  let hasProfile = false;

  try {
    const [jobsData, profile] = await Promise.all([
      getJobs({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        query,
        applied,
        match
      }),
      getResumeProfile()
    ]);
    jobsResponse = jobsData;
    hasProfile = !!profile;
  } catch (_error) {
    loadError = "The dashboard could not reach the API. Start the API and refresh the page.";
  }

  const { jobs, pagination, summary } = jobsResponse;
  const hasJobs = summary.total > 0;
  const hasUnscored = summary.scoredTotal < summary.total;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="rounded-[28px] border border-white/70 bg-panel/90 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Job Aggregation Dashboard
            </h1>
            <p className="max-w-xl text-sm leading-6 text-stone-500">
              Sync jobs, upload your resume for AI scoring, and generate tailored cover letters.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-accent">
            Pipeline
          </span>
        </div>

        {hasJobs && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line/60 bg-surface/60 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-ink">{summary.syncedToday}</p>
              <p className="text-xs text-stone-500">Synced Today</p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-surface/60 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-emerald-600">{summary.highMatch}</p>
              <p className="text-xs text-stone-500">High Match</p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-surface/60 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-amber-600">{summary.recommendedNotApplied}</p>
              <p className="text-xs text-stone-500">Not Applied</p>
            </div>
            <div className="rounded-2xl border border-line/60 bg-surface/60 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-blue-600">{summary.appliedTotal}</p>
              <p className="text-xs text-stone-500">Applied</p>
            </div>
          </div>
        )}
      </section>

      {/* Action bar */}
      <section className="flex flex-wrap items-start gap-3">
        {/* Step 1: Always visible */}
        <SyncButton />

        {/* Manage job sources */}
        <ManageSearchUrlsButton />

        {/* Step 2: Always visible (can upload anytime) */}
        <ResumeUploadButton />

        {/* Step 3: Only when there are jobs AND a profile AND unscored jobs */}
        {hasJobs && hasProfile && hasUnscored ? <AnalyzeJobsButton /> : null}
      </section>

      {/* Status indicators */}
      {!hasProfile && hasJobs ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm text-amber-800 shadow-sm">
          Upload your resume to enable AI-powered job scoring and cover letter generation.
        </section>
      ) : null}

      {loadError ? (
        <section className="rounded-2xl border border-[#e9cbb9] bg-[#fff6f0] px-5 py-3 text-sm text-[#8a4b25] shadow-sm">
          {loadError}
        </section>
      ) : null}

      {/* Jobs table */}
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-panel/95 shadow-card">
        <div className="border-b border-line/80 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Jobs</h2>
              <p className="text-sm text-stone-500">
                {hasJobs
                  ? `${summary.total} canonical listings — sorted by match score, then recent sync activity.`
                  : "No jobs synced yet. Use the sync button above."}
              </p>
            </div>
            {hasJobs ? (
              <span className="hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 sm:inline-flex">
                {summary.scoredTotal} / {summary.total} scored
              </span>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <JobsTable
            appliedFilter={applied}
            hasProfile={hasProfile}
            jobs={jobs}
            matchFilter={match}
            pagination={pagination}
            query={query}
            summary={summary}
          />
        </div>
      </section>
    </main>
  );
}

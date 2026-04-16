import type { JobItem } from "@job-pipeline/shared";

import { AnalyzeJobsButton } from "../components/analyze-jobs-button";
import { JobsTable } from "../components/jobs-table";
import { ManageSearchUrlsButton } from "../components/manage-search-urls-button";
import { ResumeUploadButton } from "../components/resume-upload-button";
import { SyncButton } from "../components/sync-button";
import { getJobs, getResumeProfile } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let jobs: JobItem[] = [];
  let loadError: string | null = null;
  let hasProfile = false;

  try {
    const [jobsResponse, profile] = await Promise.all([getJobs(), getResumeProfile()]);
    jobs = jobsResponse.jobs;
    hasProfile = !!profile;
  } catch (_error) {
    loadError = "The dashboard could not reach the API. Start the API and refresh the page.";
  }

  const hasJobs = jobs.length > 0;
  const hasUnscored = jobs.some((j) => j.score === null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="rounded-[28px] border border-white/70 bg-panel/90 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-accent">
              Pipeline
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Job Aggregation Dashboard
            </h1>
            <p className="max-w-xl text-sm leading-6 text-stone-500">
              Sync jobs, upload your resume for AI scoring, and generate tailored cover letters.
            </p>
          </div>
        </div>
      </section>

      {/* Action bar */}
      <section className="flex flex-wrap items-start gap-3">
        {/* Step 1: Always visible */}
        <SyncButton />

        {/* Manage search URLs */}
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
                  ? `${jobs.length} listings — sorted by match score, then most recent.`
                  : "No jobs synced yet. Use the sync button above."}
              </p>
            </div>
            {hasJobs ? (
              <span className="hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 sm:inline-flex">
                {jobs.filter((j) => j.score !== null).length} / {jobs.length} scored
              </span>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <JobsTable jobs={jobs} hasProfile={hasProfile} />
        </div>
      </section>
    </main>
  );
}

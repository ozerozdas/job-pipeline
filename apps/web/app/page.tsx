import type { JobItem } from "@job-pipeline/shared";

import { SyncButton } from "../components/sync-button";
import { getJobs } from "../lib/api";
import { formatDateTime } from "../lib/date";

export const dynamic = "force-dynamic";

const renderJobs = (jobs: JobItem[]) => {
  if (jobs.length === 0) {
    return (
      <tr>
        <td className="px-4 py-8 text-center text-sm text-stone-500" colSpan={5}>
          No jobs synced yet. Use the button above to pull today&apos;s listings.
        </td>
      </tr>
    );
  }

  return jobs.map((job) => (
    <tr className="border-t border-line/70" key={job.id}>
      <td className="px-4 py-4 font-medium text-ink">{job.title}</td>
      <td className="px-4 py-4 text-stone-700">{job.company}</td>
      <td className="px-4 py-4 text-stone-700">{job.location}</td>
      <td className="px-4 py-4 text-stone-700">{job.source}</td>
      <td className="px-4 py-4 text-stone-700">{formatDateTime(job.createdAt)}</td>
    </tr>
  ));
};

export default async function DashboardPage() {
  let jobs: JobItem[] = [];
  let loadError: string | null = null;

  try {
    const response = await getJobs();
    jobs = response.jobs;
  } catch (_error) {
    loadError = "The dashboard could not reach the API. Start the API and refresh the page.";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-white/70 bg-panel/90 p-6 shadow-card backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-accent">
              MVP Dashboard
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Job aggregation pipeline
              </h1>
              <p className="max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
                Sync a mocked external source once per day, store unique jobs in PostgreSQL,
                and review the latest listings in one place.
              </p>
            </div>
          </div>
          <SyncButton />
        </div>
      </section>

      {loadError ? (
        <section className="rounded-[24px] border border-[#e9cbb9] bg-[#fff6f0] px-5 py-4 text-sm text-[#8a4b25] shadow-card">
          {loadError}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-panel/95 shadow-card">
        <div className="border-b border-line/80 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-ink">Jobs</h2>
          <p className="text-sm text-stone-500">
            Sorted by most recently created records in the database.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>{renderJobs(jobs)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

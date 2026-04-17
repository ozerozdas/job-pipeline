"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";
import { formatDateTime } from "../lib/date";
import { CoverLetterButton } from "./cover-letter-button";
import { JobDetailModal } from "./job-detail-modal";

export const JobsTable = ({
  jobs: initialJobs,
  hasProfile
}: {
  jobs: JobItem[];
  hasProfile: boolean;
}) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const hiddenCount = jobs.filter((j) => j.score !== null && j.score < 50).length;
  const visibleJobs = showHidden
    ? jobs
    : jobs.filter((j) => j.score === null || j.score >= 50);

  const handleToggleApplied = async (e: React.MouseEvent, jobId: string, applied: boolean) => {
    e.stopPropagation();
    const prev = jobs;
    setJobs((curr) => curr.map((j) => (j.id === jobId ? { ...j, applied } : j)));
    try {
      await fetch(`${getClientApiBaseUrl()}/jobs/${jobId}/applied`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applied })
      });
    } catch {
      setJobs(prev);
    }
  };

  if (jobs.length === 0) {
    return (
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Seniority</th>
            <th className="px-4 py-3 font-medium">Posted</th>
            <th className="px-4 py-3 font-medium">Applied</th>
            {hasProfile ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-4 py-12 text-center text-sm text-stone-400"
              colSpan={hasProfile ? 9 : 8}
            >
              No jobs synced yet. Use the sync button above to pull today&apos;s listings.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Seniority</th>
            <th className="px-4 py-3 font-medium">Posted</th>
            <th className="px-4 py-3 font-medium">Applied</th>
            {hasProfile ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {visibleJobs.map((job) => (
            <tr
              className="cursor-pointer border-t border-line/70 transition hover:bg-accent/5"
              key={job.id}
              onClick={() => setSelectedJob(job)}
            >
              <td className="px-4 py-3">
                {job.score !== null ? (
                  <span
                    className={`inline-flex min-w-[2.25rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      job.score >= 75
                        ? "bg-emerald-100 text-emerald-700"
                        : job.score >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                    title={job.scoreReasoning ?? undefined}
                  >
                    {Math.round(job.score)}
                  </span>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-ink">{job.title}</td>
              <td className="px-4 py-3 text-stone-700">{job.company}</td>
              <td className="max-w-[180px] truncate px-4 py-3 text-stone-600">{job.location}</td>
              <td className="px-4 py-3 text-stone-600">{job.employmentType ?? "—"}</td>
              <td className="px-4 py-3 text-stone-600">{job.seniorityLevel ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                {job.postedAt ? formatDateTime(job.postedAt) : "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1 ${
                    job.applied ? "bg-emerald-500" : "bg-stone-300"
                  }`}
                  onClick={(e) => handleToggleApplied(e, job.id, !job.applied)}
                  role="switch"
                  aria-checked={job.applied}
                  title={job.applied ? "Mark as not applied" : "Mark as applied"}
                  type="button"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                      job.applied ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </td>
              {hasProfile ? (
                <td className="px-4 py-3">
                  <CoverLetterButton jobId={job.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {hiddenCount > 0 && (
        <button
          className="mt-2 w-full py-2 text-center text-sm text-stone-400 hover:text-stone-600 transition-colors"
          onClick={() => setShowHidden((v) => !v)}
          type="button"
        >
          {showHidden
            ? `Hide ${hiddenCount} low-score job${hiddenCount === 1 ? "" : "s"}`
            : `Show ${hiddenCount} hidden job${hiddenCount === 1 ? "" : "s"} (score < 50)`}
        </button>
      )}

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useState } from "react";

import { formatDateTime } from "../lib/date";
import { CoverLetterButton } from "./cover-letter-button";
import { JobDetailModal } from "./job-detail-modal";

export const JobsTable = ({
  jobs,
  hasProfile
}: {
  jobs: JobItem[];
  hasProfile: boolean;
}) => {
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

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
            {hasProfile ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-4 py-12 text-center text-sm text-stone-400"
              colSpan={hasProfile ? 8 : 7}
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
            {hasProfile ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
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
              {hasProfile ? (
                <td className="px-4 py-3">
                  <CoverLetterButton jobId={job.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

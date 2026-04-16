"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useState } from "react";

import { formatDateTime } from "../lib/date";
import { JobDetailModal } from "./job-detail-modal";

export const JobsTable = ({ jobs }: { jobs: JobItem[] }) => {
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
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Posted</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-8 text-center text-sm text-stone-500" colSpan={8}>
              No jobs synced yet. Use the button above to pull today&apos;s listings.
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
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Posted</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              className="cursor-pointer border-t border-line/70 transition hover:bg-accent/5"
              key={job.id}
              onClick={() => setSelectedJob(job)}
            >
              <td className="px-4 py-4">
                {job.score !== null ? (
                  <span
                    className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
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
                  <span className="text-stone-400">—</span>
                )}
              </td>
              <td className="px-4 py-4 font-medium text-ink">{job.title}</td>
              <td className="px-4 py-4 text-stone-700">{job.company}</td>
              <td className="max-w-[200px] truncate px-4 py-4 text-stone-700">{job.location}</td>
              <td className="px-4 py-4 text-stone-700">{job.employmentType ?? "—"}</td>
              <td className="px-4 py-4 text-stone-700">{job.seniorityLevel ?? "—"}</td>
              <td className="px-4 py-4 text-stone-700">{job.country ?? "—"}</td>
              <td className="px-4 py-4 text-stone-700 whitespace-nowrap">
                {job.postedAt ? formatDateTime(job.postedAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
};

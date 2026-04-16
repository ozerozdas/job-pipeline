"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useEffect, useRef } from "react";

import { formatDateTime } from "../lib/date";

interface JobDetailModalProps {
  job: JobItem | null;
  onClose: () => void;
}

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex rounded-full border border-accent/25 bg-accent/8 px-2.5 py-0.5 text-xs font-medium text-accent">
    {children}
  </span>
);

export const JobDetailModal = ({ job, onClose }: JobDetailModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [job, onClose]);

  if (!job) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[5vh] sm:pt-[8vh]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/70 bg-panel shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line/80 px-6 py-5">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-semibold leading-snug text-ink">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
              <span className="font-medium">{job.company}</span>
              {job.location && (
                <>
                  <span className="text-stone-300">·</span>
                  <span>{job.location}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            type="button"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            {job.employmentType && <Badge>{job.employmentType}</Badge>}
            {job.seniorityLevel && <Badge>{job.seniorityLevel}</Badge>}
            {job.workplaceTypes?.map((wt) => (
              <Badge key={wt}>{wt}</Badge>
            ))}
            {job.country && <Badge>{job.country}</Badge>}
          </div>

          {/* Key details grid */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Detail label="Salary" value={job.salary || null} />
            <Detail label="Seniority" value={job.seniorityLevel} />
            <Detail label="Employment" value={job.employmentType} />
            <Detail label="Function" value={job.jobFunction} />
            <Detail label="Industries" value={job.industries} />
            <Detail label="Applicants" value={job.applicantsCount} />
            <Detail label="Posted" value={job.postedAt ? formatDateTime(job.postedAt) : null} />
            <Detail label="Expires" value={job.expireAt ? formatDateTime(job.expireAt) : null} />
            <Detail label="Source" value={job.source} />
          </dl>

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">Benefits</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b) => (
                  <span key={b} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.descriptionHtml ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">Description</h3>
              <div
                className="prose prose-sm prose-stone max-w-none text-sm leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
              />
            </div>
          ) : job.description ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">Description</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{job.description}</p>
            </div>
          ) : null}

          {/* Job poster */}
          {job.jobPosterName && (
            <div className="flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
              {job.jobPosterPhoto && (
                <img
                  src={job.jobPosterPhoto}
                  alt={job.jobPosterName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{job.jobPosterName}</p>
                {job.jobPosterTitle && (
                  <p className="truncate text-xs text-stone-500">{job.jobPosterTitle}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-line/80 px-6 py-4">
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              Apply
            </a>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            View on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};

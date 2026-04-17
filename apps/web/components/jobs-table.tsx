"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useEffect, useRef, useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";
import { formatDateTime } from "../lib/date";
import { AppliedToast } from "./applied-toast";
import { CoverLetterButton } from "./cover-letter-button";
import { JobActionsDropdown } from "./job-actions-dropdown";
import { JobChatModal } from "./job-chat-modal";
import { JobDetailModal } from "./job-detail-modal";

type ColumnKey = "score" | "title" | "company" | "location" | "type" | "seniority" | "posted" | "applied" | "actions";
type AppliedFilter = "all" | "applied" | "not-applied";
type MatchFilter = "all" | "high" | "good" | "low" | "unscored";

const ALL_COLUMNS: { key: ColumnKey; label: string; requiresProfile?: boolean }[] = [
  { key: "score", label: "Score" },
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "type", label: "Type" },
  { key: "seniority", label: "Seniority" },
  { key: "posted", label: "Posted" },
  { key: "applied", label: "Applied" },
  { key: "actions", label: "Actions", requiresProfile: true },
];

const DEFAULT_VISIBLE: ColumnKey[] = ["score", "title", "company", "location", "type", "seniority", "posted", "applied", "actions"];
type ModalView = "detail" | "chat" | "cover-letter" | null;

const QUICK_FILTERS: Array<{
  key: "all" | AppliedFilter | "high-match";
  label: string;
  matches: (job: JobItem) => boolean;
}> = [
  {
    key: "all",
    label: "General Search",
    matches: () => true,
  },
  {
    key: "applied",
    label: "Applied",
    matches: (job) => job.applied,
  },
  {
    key: "not-applied",
    label: "Not Applied",
    matches: (job) => !job.applied,
  },
  {
    key: "high-match",
    label: "Only High Match",
    matches: (job) => job.score !== null && job.score >= 75,
  },
];

const matchesTextSearch = (job: JobItem, query: string) => {
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
    job.standardizedTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

const matchesAppliedFilter = (job: JobItem, filter: AppliedFilter) => {
  if (filter === "applied") return job.applied;
  if (filter === "not-applied") return !job.applied;
  return true;
};

const matchesScoreFilter = (job: JobItem, filter: MatchFilter) => {
  if (filter === "all") return true;
  if (filter === "unscored") return job.score === null;
  if (job.score === null) return false;
  if (filter === "high") return job.score >= 75;
  if (filter === "good") return job.score >= 50 && job.score < 75;
  return job.score < 50;
};

export const JobsTable = ({
  jobs: initialJobs,
  hasProfile
}: {
  jobs: JobItem[];
  hasProfile: boolean;
}) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [activeJob, setActiveJob] = useState<JobItem | null>(null);
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [toastJob, setToastJob] = useState<JobItem | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE));
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<(typeof QUICK_FILTERS)[number]["key"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<AppliedFilter>("all");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setColumnMenuOpen(false);
      }
    };
    if (columnMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnMenuOpen]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const show = (key: ColumnKey) => visibleColumns.has(key);
  const colCount =
    ALL_COLUMNS.filter((c) => show(c.key) && (!c.requiresProfile || hasProfile)).length;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    const activeQuickFilter = QUICK_FILTERS.find((filter) => filter.key === quickFilter);
    return (
      (activeQuickFilter?.matches(job) ?? true) &&
      matchesTextSearch(job, normalizedQuery) &&
      matchesAppliedFilter(job, appliedFilter) &&
      matchesScoreFilter(job, matchFilter)
    );
  });

  const updateModalJob = (job: JobItem | null, jobId: string, applied: boolean) =>
    job && job.id === jobId ? { ...job, applied } : job;

  const persistAppliedState = async (jobId: string, applied: boolean) => {
    const previousJobs = jobs;
    const previousActiveJob = activeJob;
    const previousToastJob = toastJob;

    setJobs((currentJobs) => currentJobs.map((job) => (job.id === jobId ? { ...job, applied } : job)));
    setActiveJob((currentJob) => updateModalJob(currentJob, jobId, applied));
    setToastJob((currentJob) => updateModalJob(currentJob, jobId, applied));

    try {
      const response = await fetch(`${getClientApiBaseUrl()}/jobs/${jobId}/applied`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applied })
      });

      if (!response.ok) {
        throw new Error("Failed to update applied status");
      }
    } catch {
      setJobs(previousJobs);
      setActiveJob(previousActiveJob);
      setToastJob(previousToastJob);
    }
  };

  const openJobModal = (job: JobItem, view: Exclude<ModalView, null>) => {
    setToastJob(null);
    setActiveJob(job);
    setActiveModal(view);
  };

  const handleCloseModal = (job: JobItem | null) => {
    if (!job) {
      setActiveModal(null);
      setActiveJob(null);
      return;
    }

    setActiveModal(null);
    setActiveJob(null);
    setToastJob(job.applied ? null : job);
  };

  const handleToggleApplied = async (e: React.MouseEvent, jobId: string, applied: boolean) => {
    e.stopPropagation();
    await persistAppliedState(jobId, applied);
  };

  const columnPicker = (
    <div className="relative inline-block" ref={menuRef}>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-surface/80 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        onClick={() => setColumnMenuOpen((v) => !v)}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
        Columns
      </button>
      {columnMenuOpen && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-line/70 bg-white py-1 shadow-lg">
          {ALL_COLUMNS.filter((c) => !c.requiresProfile || hasProfile).map((col) => (
            <label
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              key={col.key}
            >
              <input
                checked={visibleColumns.has(col.key)}
                className="h-3.5 w-3.5 rounded border-stone-300 text-accent focus:ring-accent/50"
                onChange={() => toggleColumn(col.key)}
                type="checkbox"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const hasActiveFilters =
    quickFilter !== "all" || searchQuery.trim().length > 0 || appliedFilter !== "all" || matchFilter !== "all";

  const resetFilters = () => {
    setQuickFilter("all");
    setSearchQuery("");
    setAppliedFilter("all");
    setMatchFilter("all");
  };

  const filterBar = (
    <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => {
            const count = jobs.filter(filter.matches).length;
            const active = quickFilter === filter.key;
            return (
              <button
                key={filter.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent/30 bg-accent text-white"
                    : "border-line/70 bg-surface/75 text-stone-600 hover:bg-stone-100"
                }`}
                onClick={() => setQuickFilter(filter.key)}
                type="button"
              >
                <span>{filter.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {hasActiveFilters ? (
            <button
              className="rounded-full border border-line/70 px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100"
              onClick={resetFilters}
              type="button"
            >
              Clear Filters
            </button>
          ) : null}
          {columnPicker}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-line/70 bg-white/80 px-3 py-2 text-sm text-stone-600 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-stone-400">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 103.473 9.766l2.63 2.63a.75.75 0 101.06-1.06l-2.629-2.63A5.5 5.5 0 009 3.5zM5 9a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
          </svg>
          <input
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-stone-400"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, company, location, or keywords"
            type="search"
            value={searchQuery}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
          Applied State
          <select
            className="rounded-2xl border border-line/70 bg-white/80 px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition focus:border-accent/50"
            onChange={(event) => setAppliedFilter(event.target.value as AppliedFilter)}
            value={appliedFilter}
          >
            <option value="all">All jobs</option>
            <option value="applied">Applied only</option>
            <option value="not-applied">Not applied only</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
          Match Quality
          <select
            className="rounded-2xl border border-line/70 bg-white/80 px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-700 outline-none transition focus:border-accent/50"
            onChange={(event) => setMatchFilter(event.target.value as MatchFilter)}
            value={matchFilter}
          >
            <option value="all">All scores</option>
            <option value="high">Only high match (75+)</option>
            <option value="good">Good match (50-74)</option>
            <option value="low">Low match (&lt; 50)</option>
            <option value="unscored">Unscored</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-stone-500">
        Showing {visibleJobs.length} of {jobs.length} listing{jobs.length === 1 ? "" : "s"}.
      </p>
    </div>
  );

  if (jobs.length === 0) {
    return (
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
          <tr>
            {show("score") && <th className="px-4 py-3 font-medium">Score</th>}
            {show("title") && <th className="px-4 py-3 font-medium">Title</th>}
            {show("company") && <th className="px-4 py-3 font-medium">Company</th>}
            {show("location") && <th className="px-4 py-3 font-medium">Location</th>}
            {show("type") && <th className="px-4 py-3 font-medium">Type</th>}
            {show("seniority") && <th className="px-4 py-3 font-medium">Seniority</th>}
            {show("posted") && <th className="px-4 py-3 font-medium">Posted</th>}
            {show("applied") && <th className="px-4 py-3 font-medium">Applied</th>}
            {hasProfile && show("actions") ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-4 py-12 text-center text-sm text-stone-400"
              colSpan={colCount}
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
      {filterBar}

      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
          <tr>
            {show("score") && <th className="px-4 py-3 font-medium">Score</th>}
            {show("title") && <th className="px-4 py-3 font-medium">Title</th>}
            {show("company") && <th className="px-4 py-3 font-medium">Company</th>}
            {show("location") && <th className="px-4 py-3 font-medium">Location</th>}
            {show("type") && <th className="px-4 py-3 font-medium">Type</th>}
            {show("seniority") && <th className="px-4 py-3 font-medium">Seniority</th>}
            {show("posted") && <th className="px-4 py-3 font-medium">Posted</th>}
            {show("applied") && <th className="px-4 py-3 font-medium">Applied</th>}
            {hasProfile && show("actions") ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {visibleJobs.length > 0 ? (
            visibleJobs.map((job) => (
              <tr
                className="cursor-pointer border-t border-line/70 transition hover:bg-accent/5"
                key={job.id}
                onClick={() => openJobModal(job, "detail")}
              >
                {show("score") && (
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
                )}
                {show("title") && <td className="px-4 py-3 font-medium text-ink">{job.title}</td>}
                {show("company") && <td className="px-4 py-3 text-stone-700">{job.company}</td>}
                {show("location") && <td className="max-w-[180px] truncate px-4 py-3 text-stone-600">{job.location}</td>}
                {show("type") && <td className="px-4 py-3 text-stone-600">{job.employmentType ?? "—"}</td>}
                {show("seniority") && <td className="px-4 py-3 text-stone-600">{job.seniorityLevel ?? "—"}</td>}
                {show("posted") && (
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                    {job.postedAt ? formatDateTime(job.postedAt) : "—"}
                  </td>
                )}
                {show("applied") && (
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
                )}
                {hasProfile && show("actions") ? (
                  <td className="px-4 py-3">
                    <JobActionsDropdown
                      onCoverLetter={() => openJobModal(job, "cover-letter")}
                      onChat={() => openJobModal(job, "chat")}
                    />
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-12 text-center text-sm text-stone-400" colSpan={colCount}>
                No jobs match the current filters. Clear filters or broaden your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <JobDetailModal
        job={activeModal === "detail" ? activeJob : null}
        onChat={hasProfile && activeJob ? () => openJobModal(activeJob, "chat") : undefined}
        onClose={() => handleCloseModal(activeJob)}
        onCoverLetter={hasProfile && activeJob ? () => openJobModal(activeJob, "cover-letter") : undefined}
      />
      <JobChatModal
        job={activeModal === "chat" ? activeJob : null}
        onBack={activeJob ? () => setActiveModal("detail") : undefined}
        onClose={() => handleCloseModal(activeJob)}
      />
      {activeModal === "cover-letter" && activeJob && (
        <CoverLetterButton
          jobId={activeJob.id}
          onBack={() => setActiveModal("detail")}
          onClose={() => handleCloseModal(activeJob)}
        />
      )}
      <AppliedToast
        job={toastJob}
        onConfirm={() => {
          if (!toastJob) return;
          void persistAppliedState(toastJob.id, true);
          setToastJob(null);
        }}
        onDismiss={() => setToastJob(null)}
      />
    </>
  );
};

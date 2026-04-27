"use client";

import type { JobAppliedFilter, JobItem, JobMatchFilter, JobsPagination, JobsSummary } from "@job-pipeline/shared";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getClientApiBaseUrl } from "../lib/api";
import { formatDateTime } from "../lib/date";
import { AppliedToast } from "./applied-toast";
import { CoverLetterButton } from "./cover-letter-button";
import { JobActionsDropdown } from "./job-actions-dropdown";
import { JobChatModal } from "./job-chat-modal";
import { JobDetailModal } from "./job-detail-modal";

type ColumnKey = "score" | "provider" | "title" | "company" | "location" | "type" | "seniority" | "posted" | "applied" | "actions";

const ALL_COLUMNS: { key: ColumnKey; label: string; requiresProfile?: boolean }[] = [
  { key: "score", label: "Score" },
  { key: "provider", label: "Provider" },
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "type", label: "Type" },
  { key: "seniority", label: "Seniority" },
  { key: "posted", label: "Posted" },
  { key: "applied", label: "Applied" },
  { key: "actions", label: "Actions", requiresProfile: true },
];

const DEFAULT_VISIBLE: ColumnKey[] = ["score", "provider", "title", "company", "location", "type", "seniority", "posted", "applied", "actions"];
type ModalView = "detail" | "chat" | "cover-letter" | null;

const QUICK_FILTERS = [
  { key: "all", label: "General Search" },
  { key: "applied", label: "Applied" },
  { key: "not-applied", label: "Not Applied" },
  { key: "high-match", label: "Only High Match" }
] as const;

const getVisiblePages = (currentPage: number, totalPages: number) => {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const adjustedStartPage = Math.max(1, endPage - 4);

  return Array.from({ length: endPage - adjustedStartPage + 1 }, (_, index) => adjustedStartPage + index);
};

const formatProvider = (provider: string) =>
  provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const JobsTable = ({
  jobs: initialJobs,
  hasProfile,
  query,
  appliedFilter,
  matchFilter,
  pagination,
  summary
}: {
  jobs: JobItem[];
  hasProfile: boolean;
  query: string;
  appliedFilter: JobAppliedFilter;
  matchFilter: JobMatchFilter;
  pagination: JobsPagination;
  summary: JobsSummary;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState(initialJobs);
  const [activeJob, setActiveJob] = useState<JobItem | null>(null);
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [toastJob, setToastJob] = useState<JobItem | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE));
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

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

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    const nextQueryString = nextParams.toString();
    startTransition(() => {
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname);
    });
  };

  useEffect(() => {
    const normalizedSearchQuery = deferredSearchQuery.trim();

    if (normalizedSearchQuery === query) return;

    updateQueryParams({
      page: null,
      query: normalizedSearchQuery ? normalizedSearchQuery : null
    });
  }, [deferredSearchQuery, query]);

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

      startTransition(() => {
        router.refresh();
      });
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

  const hasActiveFilters =
    query.trim().length > 0 || appliedFilter !== "all" || matchFilter !== "all";

  const setShortcutFilter = (filterKey: (typeof QUICK_FILTERS)[number]["key"]) => {
    if (filterKey === "all") {
      updateQueryParams({ applied: null, match: null, page: null });
      return;
    }

    if (filterKey === "high-match") {
      updateQueryParams({ applied: null, match: "high", page: null });
      return;
    }

    updateQueryParams({ applied: filterKey, match: null, page: null });
  };

  const isQuickFilterActive = (filterKey: (typeof QUICK_FILTERS)[number]["key"]) => {
    if (filterKey === "all") return appliedFilter === "all" && matchFilter === "all";
    if (filterKey === "high-match") return matchFilter === "high";
    return appliedFilter === filterKey;
  };

  const getQuickFilterCount = (filterKey: (typeof QUICK_FILTERS)[number]["key"]) => {
    if (filterKey === "all") return summary.total;
    if (filterKey === "applied") return summary.appliedTotal;
    if (filterKey === "not-applied") return summary.total - summary.appliedTotal;
    return summary.highMatch;
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

  const resetFilters = () => {
    setSearchQuery("");
    updateQueryParams({ applied: null, match: null, page: null, query: null });
  };

  const currentRangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const currentRangeEnd = pagination.total === 0 ? 0 : Math.min(pagination.total, pagination.page * pagination.pageSize);

  const paginationControls = pagination.totalPages > 1 ? (
    <div className="flex flex-col gap-3 border-t border-line/80 px-5 py-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-line/70 px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pagination.page === 1 || isPending}
          onClick={() => updateQueryParams({ page: String(pagination.page - 1) })}
          type="button"
        >
          Previous
        </button>
        {getVisiblePages(pagination.page, pagination.totalPages).map((pageNumber) => (
          <button
            key={pageNumber}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              pageNumber === pagination.page
                ? "bg-accent text-white"
                : "border border-line/70 text-stone-600 hover:bg-stone-100"
            }`}
            disabled={isPending}
            onClick={() => updateQueryParams({ page: String(pageNumber) })}
            type="button"
          >
            {pageNumber}
          </button>
        ))}
        <button
          className="rounded-full border border-line/70 px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pagination.page === pagination.totalPages || isPending}
          onClick={() => updateQueryParams({ page: String(pagination.page + 1) })}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  ) : null;

  const filterBar = (
    <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => {
            const count = getQuickFilterCount(filter.key);
            const active = isQuickFilterActive(filter.key);
            return (
              <button
                key={filter.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent/30 bg-accent text-white"
                    : "border-line/70 bg-surface/75 text-stone-600 hover:bg-stone-100"
                }`}
                disabled={isPending}
                onClick={() => setShortcutFilter(filter.key)}
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
            disabled={isPending}
            onChange={(event) =>
              updateQueryParams({
                applied: event.target.value === "all" ? null : event.target.value,
                page: null
              })
            }
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
            disabled={isPending}
            onChange={(event) =>
              updateQueryParams({
                match: event.target.value === "all" ? null : event.target.value,
                page: null
              })
            }
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
        Showing {currentRangeStart}-{currentRangeEnd} of {pagination.total} matching listing{pagination.total === 1 ? "" : "s"}.
      </p>
    </div>
  );

  if (summary.total === 0) {
    return (
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-stone-500">
          <tr>
            {show("score") && <th className="px-4 py-3 font-medium">Score</th>}
            {show("provider") && <th className="px-4 py-3 font-medium">Provider</th>}
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
            {show("provider") && <th className="px-4 py-3 font-medium">Provider</th>}
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
          {jobs.length > 0 ? (
            jobs.map((job) => (
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
                {show("provider") && (
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                      {formatProvider(job.source)}
                    </span>
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
      {paginationControls}

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

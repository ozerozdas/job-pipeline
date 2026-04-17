"use client";

import type { JobItem } from "@job-pipeline/shared";
import { useEffect } from "react";

interface AppliedToastProps {
  job: JobItem | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const AppliedToast = ({ job, onConfirm, onDismiss }: AppliedToastProps) => {
  useEffect(() => {
    if (!job) return;

    const timeoutId = window.setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [job, onDismiss]);

  if (!job) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] max-w-sm sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto overflow-hidden rounded-[22px] border border-white/70 bg-panel/95 shadow-card backdrop-blur">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-ink">Did you apply?</p>
          <p className="mt-1 text-sm text-stone-500">
            {job.title} at {job.company}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line/80 px-4 py-3">
          <button
            className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
            onClick={onDismiss}
            type="button"
          >
            Not yet
          </button>
          <button
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
            onClick={onConfirm}
            type="button"
          >
            Mark applied
          </button>
        </div>
      </div>
    </div>
  );
};
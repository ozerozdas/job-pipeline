"use client";

import type { SearchUrlItem } from "@job-pipeline/shared";
import { useEffect, useRef, useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";

interface SearchUrlsModalProps {
  initialUrls: SearchUrlItem[];
  onClose: () => void;
}

export const SearchUrlsModal = ({ initialUrls, onClose }: SearchUrlsModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [urls, setUrls] = useState(initialUrls.map((u) => ({ id: u.id, url: u.url, label: u.label ?? "" })));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAdd = () => {
    setUrls((prev) => [...prev, { id: crypto.randomUUID(), url: "", label: "" }]);
  };

  const handleRemove = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: "url" | "label", value: string) => {
    setUrls((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    const validUrls = urls.filter((u) => u.url.trim().length > 0);
    if (validUrls.length === 0) {
      setMessage("At least one URL is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${getClientApiBaseUrl()}/search-urls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: validUrls.map((u) => ({ url: u.url, label: u.label || undefined })),
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      setMessage("Saved successfully.");
    } catch {
      setMessage("Failed to save. Check the API.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <h2 className="text-lg font-semibold leading-snug text-ink">Search URLs</h2>
            <p className="text-sm text-stone-500">
              Manage LinkedIn search URLs used for job syncing.
            </p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {urls.map((item, index) => (
            <div key={item.id} className="group flex flex-col gap-2 rounded-xl border border-line/60 bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  URL #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleChange(index, "label", e.target.value)}
                placeholder="Label (optional)"
                className="w-full rounded-lg border border-line/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <textarea
                value={item.url}
                onChange={(e) => handleChange(index, "url", e.target.value)}
                placeholder="https://www.linkedin.com/jobs/search/?..."
                rows={2}
                className="w-full rounded-lg border border-line/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none font-mono text-xs"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 py-3 text-sm font-medium text-stone-500 transition hover:border-accent hover:text-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add URL
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line/80 px-6 py-4">
          <div className="min-w-0">
            {message ? (
              <p className={`text-xs ${message.includes("Failed") || message.includes("required") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:bg-[#2d2b27] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

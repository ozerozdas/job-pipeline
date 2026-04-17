"use client";

import type { CoverLetterResponse } from "@job-pipeline/shared";
import { useEffect, useRef, useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";

const LANGUAGES = [
  { code: "English", label: "EN" },
  { code: "Turkish", label: "TR" },
  { code: "German", label: "DE" },
  { code: "French", label: "FR" },
  { code: "Spanish", label: "ES" },
  { code: "Dutch", label: "NL" }
];

interface CoverLetterButtonProps {
  jobId: string;
  onBack?: () => void;
  onClose: () => void;
}

export const CoverLetterButton = ({ jobId, onBack, onClose }: CoverLetterButtonProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerate = async (language: string) => {
    setIsGenerating(true);
    setError(null);
    setCoverLetter(null);

    try {
      const response = await fetch(`${getClientApiBaseUrl()}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, language })
      });

      if (!response.ok) throw new Error("Request failed");

      const result = (await response.json()) as CoverLetterResponse;

      if (result.status !== "success" || !result.coverLetter) {
        setError(result.message);
        return;
      }

      setCoverLetter(result.coverLetter);
    } catch {
      setError("Failed to generate cover letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (coverLetter) {
      await navigator.clipboard.writeText(coverLetter);
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
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[24px] border border-white/70 bg-panel shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/80 px-6 py-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                onClick={onBack}
                type="button"
                aria-label="Back to job details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="text-base font-semibold text-ink">Cover Letter</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            type="button"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!coverLetter && !isGenerating && !error && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">Select a language to generate the cover letter:</p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-700 transition hover:border-accent hover:bg-accent/5 hover:text-accent"
                    key={lang.code}
                    onClick={() => void handleGenerate(lang.code)}
                    type="button"
                  >
                    <span className="font-mono text-xs text-stone-400">{lang.label}</span>
                    {lang.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-6 w-6 animate-spin text-accent mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-stone-500">Generating cover letter...</p>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
              <button
                className="text-sm text-accent hover:underline"
                onClick={() => setError(null)}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          {coverLetter && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Result</span>
                <button
                  className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
                  onClick={() => void handleCopy()}
                  type="button"
                >
                  Copy
                </button>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {coverLetter}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

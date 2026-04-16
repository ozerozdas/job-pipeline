"use client";

import type { CoverLetterResponse } from "@job-pipeline/shared";
import { useRef, useState } from "react";

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
}

export const CoverLetterButton = ({ jobId }: CoverLetterButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (language: string) => {
    setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isGenerating}
        onClick={(e) => {
          e.stopPropagation();
          if (coverLetter) {
            setCoverLetter(null);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        type="button"
      >
        {isGenerating ? (
          <>
            <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Generating...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Cover Letter
          </>
        )}
      </button>

      {/* Language dropdown */}
      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Language
          </div>
          {LANGUAGES.map((lang) => (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-stone-700 transition hover:bg-stone-50"
              key={lang.code}
              onClick={(e) => {
                e.stopPropagation();
                void handleGenerate(lang.code);
              }}
              type="button"
            >
              <span className="w-5 font-mono text-[10px] text-stone-400">{lang.label}</span>
              {lang.code}
            </button>
          ))}
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg">
          {error}
          <button
            className="ml-2 text-red-500 underline"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            type="button"
          >
            dismiss
          </button>
        </div>
      ) : null}

      {/* Cover letter result */}
      {coverLetter ? (
        <div
          className="absolute right-0 top-full z-20 mt-1 w-[28rem] max-h-[400px] overflow-y-auto rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Cover Letter
            </span>
            <div className="flex gap-1.5">
              <button
                className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600 transition hover:bg-stone-200"
                onClick={handleCopy}
                type="button"
              >
                Copy
              </button>
              <button
                className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600 transition hover:bg-stone-200"
                onClick={() => setCoverLetter(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
            {coverLetter}
          </p>
        </div>
      ) : null}
    </div>
  );
};

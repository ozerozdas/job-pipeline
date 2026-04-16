"use client";

import type { AnalyzeJobsResponse } from "@job-pipeline/shared";
import { useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";

export const AnalyzeJobsButton = () => {
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setMessage("Analyzing jobs against your resume...");

    try {
      const response = await fetch(`${getClientApiBaseUrl()}/analyze`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const result = (await response.json()) as AnalyzeJobsResponse;
      setMessage(result.message);
    } catch (_error) {
      setMessage("Analysis failed. Check the API logs and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isAnalyzing}
        onClick={handleAnalyze}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        {isAnalyzing ? "Analyzing..." : "Analyze Unscored Jobs"}
      </button>
      {message ? (
        <p className="max-w-[220px] text-xs text-stone-500">{message}</p>
      ) : null}
    </div>
  );
};

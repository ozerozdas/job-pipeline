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
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className="rounded-full border border-emerald-600 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isAnalyzing}
        onClick={handleAnalyze}
        type="button"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze Unprocessed Jobs"}
      </button>
      {message ? (
        <p className="max-w-xs text-right text-xs text-stone-600">{message}</p>
      ) : null}
    </div>
  );
};

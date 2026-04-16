"use client";

import type { ResumeUploadResponse } from "@job-pipeline/shared";
import { useRef, useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";

export const ResumeUploadButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setMessage("Uploading and analyzing resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${getClientApiBaseUrl()}/resume`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(
          (error as { message?: string } | null)?.message ?? "Upload failed"
        );
      }

      const result = (await response.json()) as ResumeUploadResponse;
      setMessage(
        `${result.message} Skills: ${result.profile.analysis.skills.slice(0, 5).join(", ")}${result.profile.analysis.skills.length > 5 ? "..." : ""}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload resume."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={fileInputRef}
        accept=".txt,.md,.pdf"
        className="hidden"
        onChange={handleFileChange}
        type="file"
      />
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent shadow-sm transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isUploading}
        onClick={handleClick}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        {isUploading ? "Analyzing..." : "Upload Resume"}
      </button>
      {message ? (
        <p className="max-w-[220px] text-xs text-stone-500">{message}</p>
      ) : null}
    </div>
  );
};

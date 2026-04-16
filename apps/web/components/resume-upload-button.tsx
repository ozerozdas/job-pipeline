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
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <input
        ref={fileInputRef}
        accept=".txt,.md,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
        type="file"
      />
      <button
        className="rounded-full border border-accent bg-accent/10 px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isUploading}
        onClick={handleClick}
        type="button"
      >
        {isUploading ? "Analyzing..." : "Upload Resume & Save My Profile"}
      </button>
      {message ? (
        <p className="max-w-xs text-right text-xs text-stone-600">{message}</p>
      ) : null}
    </div>
  );
};

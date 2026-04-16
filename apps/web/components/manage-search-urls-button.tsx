"use client";

import type { SearchUrlItem } from "@job-pipeline/shared";
import { useState } from "react";

import { getClientApiBaseUrl } from "../lib/api";
import { SearchUrlsModal } from "./search-urls-modal";

export const ManageSearchUrlsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [urls, setUrls] = useState<SearchUrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getClientApiBaseUrl()}/search-urls`);
      if (!response.ok) throw new Error("Failed to load");
      const data = (await response.json()) as { urls: SearchUrlItem[] };
      setUrls(data.urls);
      setIsOpen(true);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        onClick={handleOpen}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {isLoading ? "Loading..." : "Search URLs"}
      </button>
      {isOpen ? <SearchUrlsModal initialUrls={urls} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
};

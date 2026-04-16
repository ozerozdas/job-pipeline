"use client";

import type { SyncResponse } from "@job-pipeline/shared";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getClientApiBaseUrl } from "../lib/api";

export const SyncButton = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSync = async () => {
    try {
      const response = await fetch(`${getClientApiBaseUrl()}/sync`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Sync request failed");
      }

      const result = (await response.json()) as SyncResponse;
      setMessage(result.message);
      startTransition(() => {
        router.refresh();
      });
    } catch (_error) {
      setMessage("Sync failed. Check the API logs.");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface shadow-sm transition hover:bg-[#2d2b27] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        onClick={handleSync}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        {isPending ? "Syncing..." : "Sync Today's Jobs"}
      </button>
      {message ? <p className="text-xs text-stone-500">{message}</p> : null}
    </div>
  );
};

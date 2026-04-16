"use client";

import type { SyncResponse } from "@job-pipeline/shared";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getClientApiBaseUrl } from "../lib/api";

export const SyncButton = () => {
  const router = useRouter();
  const [message, setMessage] = useState("Sync is limited to once per server day.");
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
      setMessage("Sync failed. Check the API logs and try again.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <button
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-[#2d2b27] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        onClick={handleSync}
        type="button"
      >
        {isPending ? "Syncing..." : "Sync Today's Jobs"}
      </button>
      <p className="text-sm text-stone-600">{message}</p>
    </div>
  );
};

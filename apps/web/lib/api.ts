import type { JobsResponse, ResumeProfileResponse } from "@job-pipeline/shared";

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const getJobs = async (): Promise<JobsResponse> => {
  const response = await fetch(`${apiBaseUrl}/jobs`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs from the API");
  }

  return (await response.json()) as JobsResponse;
};

export const getResumeProfile = async (): Promise<ResumeProfileResponse | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/resume`, {
      cache: "no-store"
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { profile: ResumeProfileResponse };
    return data.profile;
  } catch {
    return null;
  }
};

export const getClientApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

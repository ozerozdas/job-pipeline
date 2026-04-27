import type { JobsQueryParams, JobsResponse, ResumeProfileResponse, SearchUrlsResponse } from "@job-pipeline/shared";

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const getJobs = async (params: JobsQueryParams = {}): Promise<JobsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.query?.trim()) searchParams.set("query", params.query.trim());
  if (params.applied && params.applied !== "all") searchParams.set("applied", params.applied);
  if (params.match && params.match !== "all") searchParams.set("match", params.match);

  const response = await fetch(`${apiBaseUrl}/jobs${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`, {
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
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const getSearchUrls = async (): Promise<SearchUrlsResponse> => {
  const response = await fetch(`${apiBaseUrl}/search-urls`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load search URLs");
  }

  return (await response.json()) as SearchUrlsResponse;
};

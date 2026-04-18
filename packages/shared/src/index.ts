export type JobSource = "linkedin" | "greenhouse" | "lever" | "indeed" | string;

export interface JobItem {
  id: string;
  externalId: string | null;
  title: string;
  company: string;
  companyLinkedinUrl: string | null;
  companyLogo: string | null;
  location: string;
  url: string;
  description: string;
  descriptionHtml: string | null;
  source: JobSource;
  postedAt: string | null;
  benefits: string[];
  applicantsCount: string | null;
  applyUrl: string | null;
  salary: string | null;
  seniorityLevel: string | null;
  employmentType: string | null;
  jobFunction: string | null;
  industries: string | null;
  applyMethod: string | null;
  expireAt: string | null;
  workplaceTypes: string[];
  workRemoteAllowed: boolean | null;
  standardizedTitle: string | null;
  country: string | null;
  jobPosterName: string | null;
  jobPosterTitle: string | null;
  jobPosterPhoto: string | null;
  jobPosterProfileUrl: string | null;
  applied: boolean;
  createdAt: string;
  syncedAt: string | null;
  score: number | null;
  scoreReasoning: string | null;
}

export type JobAppliedFilter = "all" | "applied" | "not-applied";

export type JobMatchFilter = "all" | "high" | "good" | "low" | "unscored";

export interface JobsQueryParams {
  page?: number;
  pageSize?: number;
  query?: string;
  applied?: JobAppliedFilter;
  match?: JobMatchFilter;
}

export interface JobsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface JobsSummary {
  total: number;
  syncedToday: number;
  highMatch: number;
  appliedTotal: number;
  recommendedNotApplied: number;
  scoredTotal: number;
}

export interface JobsResponse {
  jobs: JobItem[];
  pagination: JobsPagination;
  summary: JobsSummary;
}

export interface ExternalJobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: JobSource;
  externalId?: string;
  companyLinkedinUrl?: string;
  companyLogo?: string;
  descriptionHtml?: string;
  postedAt?: string;
  benefits?: string[];
  applicantsCount?: string;
  applyUrl?: string;
  salary?: string;
  seniorityLevel?: string;
  employmentType?: string;
  jobFunction?: string;
  industries?: string;
  applyMethod?: string;
  expireAt?: string;
  workplaceTypes?: string[];
  workRemoteAllowed?: boolean;
  standardizedTitle?: string;
  country?: string;
  jobPosterName?: string;
  jobPosterTitle?: string;
  jobPosterPhoto?: string;
  jobPosterProfileUrl?: string;
}

export type SyncResultStatus = "already_synced" | "synced";

export interface SyncResponse {
  status: SyncResultStatus;
  message: string;
  insertedCount: number;
  date: string;
}

export interface ResumeAnalysis {
  summary: string;
  skills: string[];
  experienceYears: number;
  seniorityLevel: string;
  preferredRoles: string[];
  industries: string[];
  education: string[];
}

export interface ResumeProfileResponse {
  id: string;
  fileName: string | null;
  analysis: ResumeAnalysis;
  createdAt: string;
}

export interface SearchUrlItem {
  id: string;
  url: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchUrlsResponse {
  urls: SearchUrlItem[];
}

export interface ResumeUploadResponse {
  status: "success";
  message: string;
  profile: ResumeProfileResponse;
}

export interface AnalyzeJobsResponse {
  status: "success" | "no_profile" | "no_jobs";
  message: string;
  processedCount: number;
}

export interface JobScoreItem {
  jobId: string;
  score: number;
  reasoning: string;
}

export interface CoverLetterRequest {
  jobId: string;
  language: string;
}

export interface CoverLetterResponse {
  status: "success" | "no_profile" | "error";
  message: string;
  coverLetter?: string;
}

export interface JobChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface JobChatRequest {
  jobId: string;
  messages: JobChatMessage[];
}

export interface JobChatResponse {
  status: "success" | "no_profile" | "error";
  message: string;
  reply?: string;
}

export const getDateKey = (date = new Date(), timeZone = "UTC") =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

export const dateKeyToDate = (dateKey: string) => new Date(`${dateKey}T00:00:00.000Z`);

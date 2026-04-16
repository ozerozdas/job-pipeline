export type JobSource = "linkedin" | "greenhouse" | "lever" | "indeed" | string;

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: JobSource;
  createdAt: string;
  syncedAt: string | null;
}

export interface JobsResponse {
  jobs: JobItem[];
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

export const getDateKey = (date = new Date(), timeZone = "UTC") =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

export const dateKeyToDate = (dateKey: string) => new Date(`${dateKey}T00:00:00.000Z`);

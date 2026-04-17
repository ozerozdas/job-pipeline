import { ApifyClient } from "apify-client";
import type { ExternalJobListing } from "@job-pipeline/shared";

import { env } from "../lib/env";

/** Raw shape returned by the LinkedIn Jobs Scraper actor (hKByXkMQaC5Qt9UMN). */
interface LinkedInScraperItem {
  id: string;
  link: string;
  title: string;
  companyName: string;
  companyLinkedinUrl?: string;
  companyLogo?: string;
  location: string;
  postedAt?: string;
  benefits?: string[];
  descriptionText: string;
  descriptionHtml: string;
  applicantsCount?: string;
  applyUrl?: string;
  salary?: string;
  seniorityLevel?: string;
  employmentType?: string;
  jobFunction?: string;
  industries?: string;
  applyMethod?: string;
  expireAt?: number;
  workplaceTypes?: string[];
  workRemoteAllowed?: boolean;
  standardizedTitle?: string;
  country?: string;
  jobPosterName?: string;
  jobPosterTitle?: string;
  jobPosterPhoto?: string;
  jobPosterProfileUrl?: string;
  [key: string]: unknown;
}

const client = new ApifyClient({ token: env.apifyToken });

export const fetchApifyJobs = async (
  urls: string[],
  count = 100
): Promise<ExternalJobListing[]> => {
  const run = await client.actor(env.apifyActorId).call({
    urls: urls.map((url) => url),
    scrapeCompany: true,
    count,
    splitByLocation: false,
  });

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  return (items as LinkedInScraperItem[])
    .filter((item) => item.link && item.title)
    .map((item) => ({
      externalId: item.id,
      title: item.title,
      company: item.companyName ?? "Unknown",
      companyLinkedinUrl: item.companyLinkedinUrl,
      companyLogo: item.companyLogo,
      location: item.location ?? "",
      url: item.link,
      description: item.descriptionText ?? "",
      descriptionHtml: item.descriptionHtml,
      source: "linkedin" as const,
      postedAt: item.postedAt,
      benefits: item.benefits,
      applicantsCount: item.applicantsCount,
      applyUrl: item.applyUrl,
      salary: item.salary || undefined,
      seniorityLevel: item.seniorityLevel,
      employmentType: item.employmentType,
      jobFunction: item.jobFunction,
      industries: item.industries,
      applyMethod: item.applyMethod,
      expireAt: item.expireAt
        ? new Date(item.expireAt).toISOString()
        : undefined,
      workplaceTypes: item.workplaceTypes,
      workRemoteAllowed: item.workRemoteAllowed,
      standardizedTitle: item.standardizedTitle,
      country: item.country,
      jobPosterName: item.jobPosterName,
      jobPosterTitle: item.jobPosterTitle,
      jobPosterPhoto: item.jobPosterPhoto,
      jobPosterProfileUrl: item.jobPosterProfileUrl,
    }));
};

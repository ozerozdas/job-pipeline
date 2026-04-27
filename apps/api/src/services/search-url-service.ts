import { prisma } from "@job-pipeline/db";
import type { JobSourceType } from "@job-pipeline/shared";

export type JobSourceInput = {
  url: string;
  label?: string;
  provider?: string;
  sourceType?: JobSourceType;
};

const DEFAULT_JOB_SOURCES = [
  {
    url: "https://www.linkedin.com/jobs/search/?currentJobId=4400700367&distance=25.0&f_AL=true&geoId=103644278&keywords=AI%20Software%20Engineer&origin=JOBS_HOME_KEYWORD_HISTORY",
    provider: "linkedin",
    sourceType: "linkedin_apify",
  },
  {
    url: "https://www.linkedin.com/jobs/search/?currentJobId=4335537265&f_AL=true&geoId=91000000&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
    provider: "linkedin",
    sourceType: "linkedin_apify",
  },
  {
    url: "https://www.linkedin.com/jobs/search/?currentJobId=4400703330&f_AL=true&geoId=102105699&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
    provider: "linkedin",
    sourceType: "linkedin_apify",
  },
  {
    url: "https://larajobs.com/feed",
    label: "LaraJobs RSS",
    provider: "larajobs",
    sourceType: "rss_feed",
  },
];

const normalizeSourceInput = ({ url, label, provider, sourceType }: JobSourceInput) => ({
  url,
  label,
  provider: provider?.trim().toLowerCase() || "linkedin",
  sourceType: sourceType?.trim() || "linkedin_apify",
});

export const getSearchUrls = async () => {
  const urls = await prisma.searchUrl.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Seed defaults if table is empty
  if (urls.length === 0) {
    await prisma.searchUrl.createMany({
      data: DEFAULT_JOB_SOURCES,
    });
    return prisma.searchUrl.findMany({ orderBy: { createdAt: "asc" } });
  }

  return urls;
};

export const getSearchUrlStrings = async (): Promise<string[]> => {
  const urls = await getSearchUrls();
  return urls.map((u) => u.url);
};

export const addSearchUrl = async (input: JobSourceInput) => {
  return prisma.searchUrl.create({
    data: normalizeSourceInput(input),
  });
};

export const updateSearchUrl = async (id: string, input: JobSourceInput) => {
  return prisma.searchUrl.update({
    where: { id },
    data: normalizeSourceInput(input),
  });
};

export const deleteSearchUrl = async (id: string) => {
  return prisma.searchUrl.delete({ where: { id } });
};

export const replaceAllSearchUrls = async (urls: JobSourceInput[]) => {
  await prisma.$transaction([
    prisma.searchUrl.deleteMany(),
    prisma.searchUrl.createMany({ data: urls.map(normalizeSourceInput) }),
  ]);
  return prisma.searchUrl.findMany({ orderBy: { createdAt: "asc" } });
};

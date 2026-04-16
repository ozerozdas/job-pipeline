import { prisma } from "@job-pipeline/db";

const DEFAULT_LINKEDIN_URLS = [
  "https://www.linkedin.com/jobs/search/?currentJobId=4400700367&distance=25.0&f_AL=true&geoId=103644278&keywords=AI%20Software%20Engineer&origin=JOBS_HOME_KEYWORD_HISTORY",
  "https://www.linkedin.com/jobs/search/?currentJobId=4335537265&f_AL=true&geoId=91000000&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
  "https://www.linkedin.com/jobs/search/?currentJobId=4400703330&f_AL=true&geoId=102105699&keywords=AI%20Software%20Engineer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
];

export const getSearchUrls = async () => {
  const urls = await prisma.searchUrl.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Seed defaults if table is empty
  if (urls.length === 0) {
    await prisma.searchUrl.createMany({
      data: DEFAULT_LINKEDIN_URLS.map((url) => ({ url })),
    });
    return prisma.searchUrl.findMany({ orderBy: { createdAt: "asc" } });
  }

  return urls;
};

export const getSearchUrlStrings = async (): Promise<string[]> => {
  const urls = await getSearchUrls();
  return urls.map((u) => u.url);
};

export const addSearchUrl = async (url: string, label?: string) => {
  return prisma.searchUrl.create({
    data: { url, label },
  });
};

export const updateSearchUrl = async (id: string, url: string, label?: string) => {
  return prisma.searchUrl.update({
    where: { id },
    data: { url, label },
  });
};

export const deleteSearchUrl = async (id: string) => {
  return prisma.searchUrl.delete({ where: { id } });
};

export const replaceAllSearchUrls = async (urls: { url: string; label?: string }[]) => {
  await prisma.$transaction([
    prisma.searchUrl.deleteMany(),
    prisma.searchUrl.createMany({ data: urls }),
  ]);
  return prisma.searchUrl.findMany({ orderBy: { createdAt: "asc" } });
};

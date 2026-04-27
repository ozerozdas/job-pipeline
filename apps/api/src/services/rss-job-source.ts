import { XMLParser } from "fast-xml-parser";
import type { ExternalJobListing } from "@job-pipeline/shared";

type RssFeedSource = {
  url: string;
  provider: string;
};

type ParsedRssItem = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
});

const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const textValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();

  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const text = (value as { "#text"?: unknown })["#text"];
    return textValue(text);
  }

  return "";
};

const stripHtml = (value: string) =>
  value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const splitTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatEmploymentType = (value: string) => {
  if (!value) return undefined;

  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildFallbackDescription = ({
  title,
  company,
  location,
  employmentType,
  salary,
  tags,
}: {
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  salary?: string;
  tags: string[];
}) => {
  const parts = [
    `${title} at ${company}`,
    location ? `Location: ${location}` : "",
    employmentType ? `Type: ${employmentType}` : "",
    salary ? `Salary: ${salary}` : "",
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : "",
  ].filter(Boolean);

  return parts.join(". ");
};

const getRssItems = (feed: unknown): ParsedRssItem[] => {
  const rssItems = (feed as { rss?: { channel?: { item?: ParsedRssItem | ParsedRssItem[] } } })?.rss?.channel?.item;
  const atomEntries = (feed as { feed?: { entry?: ParsedRssItem | ParsedRssItem[] } })?.feed?.entry;
  return [...asArray(rssItems), ...asArray(atomEntries)];
};

const itemToJob = (item: ParsedRssItem, provider: string): ExternalJobListing | null => {
  const title = textValue(item.title);
  const url = textValue(item.link) || textValue(item.id);

  if (!title || !url) return null;

  const company = textValue(item.company) || textValue(item.creator) || "Unknown";
  const location = textValue(item.location);
  const rawEmploymentType = textValue(item.job_type);
  const employmentType = formatEmploymentType(rawEmploymentType);
  const salary = textValue(item.salary) || undefined;
  const companyLogo = textValue(item.company_logo) || undefined;
  const tags = splitTags(textValue(item.tags));
  const rawDescriptionHtml = textValue(item.encoded) || textValue(item.description);
  const description = stripHtml(rawDescriptionHtml) || buildFallbackDescription({
    title,
    company,
    location,
    employmentType,
    salary,
    tags,
  });
  const postedAt = textValue(item.pubDate) || textValue(item.published) || textValue(item.updated);
  const externalId = textValue(item.guid) || url;

  return {
    externalId,
    title,
    company,
    companyLogo,
    location,
    url,
    description,
    descriptionHtml: rawDescriptionHtml || undefined,
    source: provider,
    postedAt: postedAt || undefined,
    salary,
    employmentType,
    jobFunction: tags.length > 0 ? tags.join(", ") : undefined,
  };
};

const fetchRssFeed = async ({ url, provider }: RssFeedSource): Promise<ExternalJobListing[]> => {
  const response = await fetch(url, {
    headers: {
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "user-agent": "job-pipeline-rss-sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`RSS feed request failed for ${provider} (${response.status})`);
  }

  const xml = await response.text();
  const parsedFeed = parser.parse(xml);

  return getRssItems(parsedFeed)
    .map((item) => itemToJob(item, provider))
    .filter((job): job is ExternalJobListing => Boolean(job));
};

export const fetchRssJobs = async (sources: RssFeedSource[]): Promise<ExternalJobListing[]> => {
  const jobsByFeed = await Promise.all(sources.map(fetchRssFeed));
  return jobsByFeed.flat();
};

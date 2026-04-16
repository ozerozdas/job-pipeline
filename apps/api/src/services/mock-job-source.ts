import type { ExternalJobListing } from "@job-pipeline/shared";

const baseListings = [
  {
    slug: "senior-full-stack-engineer",
    title: "Senior Full-Stack Engineer",
    company: "Northstar Labs",
    location: "Remote - EMEA",
    source: "linkedin",
    description:
      "Build internal platform tools across React, Node.js, and PostgreSQL with a focus on shipping product-facing features quickly."
  },
  {
    slug: "staff-data-platform-engineer",
    title: "Staff Data Platform Engineer",
    company: "Helio Analytics",
    location: "Berlin, Germany",
    source: "linkedin",
    description:
      "Own ingestion pipelines, warehouse modeling, and observability for a rapidly growing analytics product."
  },
  {
    slug: "product-engineer-jobs-marketplace",
    title: "Product Engineer, Jobs Marketplace",
    company: "Aster Digital",
    location: "London, UK",
    source: "linkedin",
    description:
      "Ship search, ranking, and employer workflow improvements for a two-sided jobs marketplace."
  },
  {
    slug: "backend-engineer-integrations",
    title: "Backend Engineer, Integrations",
    company: "Waveform",
    location: "Amsterdam, Netherlands",
    source: "linkedin",
    description:
      "Design external API integrations and event-driven services used by customer onboarding and reporting workflows."
  },
  {
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    company: "Pilot Grid",
    location: "Remote - US",
    source: "linkedin",
    description:
      "Lead dashboard UX for an operations product with Next.js, TypeScript, Tailwind, and data-heavy interfaces."
  },
  {
    slug: "ml-platform-engineer",
    title: "ML Platform Engineer",
    company: "Orbital Systems",
    location: "Istanbul, Turkey",
    source: "linkedin",
    description:
      "Improve model training infrastructure, evaluation pipelines, and experiment tracking used by applied AI teams."
  }
] as const;

export const fetchMockJobs = async (dateKey: string): Promise<ExternalJobListing[]> => {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return baseListings.map((listing) => ({
    title: listing.title,
    company: listing.company,
    location: listing.location,
    source: listing.source,
    description: listing.description,
    url: `https://jobs.example.com/${dateKey}/${listing.slug}`
  }));
};

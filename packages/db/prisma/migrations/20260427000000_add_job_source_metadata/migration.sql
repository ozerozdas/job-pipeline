-- Extend existing search URLs into generic job sources.
ALTER TABLE "SearchUrl" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'linkedin';
ALTER TABLE "SearchUrl" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'linkedin_apify';

-- Seed the first RSS provider source without disturbing user-managed rows.
INSERT INTO "SearchUrl" ("id", "url", "label", "provider", "sourceType", "createdAt", "updatedAt")
SELECT
  'larajobs-rss-feed',
  'https://larajobs.com/feed',
  'LaraJobs RSS',
  'larajobs',
  'rss_feed',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "SearchUrl" WHERE "url" = 'https://larajobs.com/feed'
);

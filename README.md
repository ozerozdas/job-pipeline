# Job Pipeline Monorepo

Minimal MVP for a daily job aggregation pipeline built with `pnpm` and `Turborepo`.

## Stack

- `apps/api`: Fastify + TypeScript
- `apps/web`: Next.js App Router + Tailwind CSS
- `packages/db`: Prisma + PostgreSQL
- `packages/shared`: shared types and date helpers

## Project Structure

```text
apps/
  api/
  web/
packages/
  db/
  shared/
```

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start PostgreSQL:

   ```bash
   pnpm docker:up
   ```

3. Push the Prisma schema:

   ```bash
   pnpm db:push
   ```

4. Start both apps:

   ```bash
   pnpm dev
   ```

## Commands

- `pnpm dev`: run API and web in parallel via Turborepo
- `pnpm docker:up`: start PostgreSQL in Docker
- `pnpm docker:down`: stop the Docker stack
- `pnpm db:generate`: generate Prisma client
- `pnpm db:push`: push Prisma schema to PostgreSQL
- `pnpm db:studio`: open Prisma Studio
- `pnpm build`: production build for the monorepo

## Environment Variables

The repo includes a ready-to-run `.env` for local development and an `.env.example` template.

```env
POSTGRES_DB=jobs_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobs_db?schema=public
API_PORT=3001
WEB_PORT=3000
API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
WEB_ORIGIN=http://localhost:3000
APP_TIMEZONE=UTC
```

## API

### `GET /jobs`

Returns all jobs ordered by `createdAt DESC`.

### `POST /sync`

- checks whether today already has a `SyncLog`
- returns `"Already synced today"` if the current server day was already processed
- otherwise fetches mocked external jobs, inserts only unique URLs, writes a `SyncLog`, and returns the inserted count

## Database

Prisma models:

- `Job`
  - `id` UUID
  - `title`
  - `company`
  - `location`
  - `url` unique
  - `description`
  - `source`
  - `createdAt`
  - `syncedAt`
- `SyncLog`
  - `id`
  - `date` unique per day
  - `status` success or failed
  - `createdAt`

## Web Dashboard

The Next.js app shows:

- a `Sync Today's Jobs` button wired to `POST /sync`
- sync feedback for the current action
- a jobs table with title, company, location, source, and created date

## Apify Integration

The API uses the [LinkedIn Jobs Scraper](https://apify.com/curious_coder/linkedin-jobs-scraper) Apify actor to fetch real job listings.

Set `APIFY_TOKEN` in `.env` to enable it. When the token is empty the sync endpoint falls back to the mock source.

```env
APIFY_TOKEN=your_apify_api_token
APIFY_ACTOR_ID=hKByXkMQaC5Qt9UMN
```

The actor input defaults to:

```json
{
  "urls": ["https://www.linkedin.com/jobs/search/?position=1&pageNum=0"],
  "scrapeCompany": true,
  "count": 100,
  "splitByLocation": false
}
```

Each scraped item is normalized into the shared `ExternalJobListing` shape before being inserted via `createMany` with `skipDuplicates`.

## Where To Extend Scoring And AI Logic

The clean place to extend this is inside the API service layer after raw jobs are fetched and before `createMany` runs.

Typical additions:

- enrichment step: normalize seniority, remote policy, salary, or tags
- scoring step: rank jobs against user preferences or embeddings
- AI summary step: generate concise role summaries or fit explanations

That logic belongs in a dedicated service under `apps/api/src/services/`, not inside the route handlers or the Prisma package.

## Suggested Next Steps

1. Replace the mock source with Apify and persist raw source payloads if debugging imports matters.
2. Add pagination and filters to `GET /jobs`.
3. Add a background scheduler or queue if sync should run automatically instead of manually.
4. Add tests for sync idempotency, duplicate handling, and API contract responses.

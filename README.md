# Job Pipeline

A daily job aggregation and AI-powered matching pipeline. Scrapes LinkedIn job listings via Apify, lets you upload your resume, and uses AI (Anthropic Claude / OpenAI GPT-4o) to score each job against your profile.

## How It Works

1. You add LinkedIn job search URLs as data sources.
2. The app scrapes those listings daily through Apify and stores them in PostgreSQL.
3. You upload your resume — AI extracts your skills, experience, and seniority.
4. The analyzer scores every unscored job (0–100) against your resume and explains why.
5. The dashboard shows all jobs sorted by match score so you can focus on the best fits.

**Stack:** Next.js · Fastify · Prisma · PostgreSQL · Anthropic · OpenAI · Apify · pnpm + Turborepo

## Screenshots

<img src="./screenshots/listing.png" alt="Job Listing Screenshot" width="600" /><br />
<img src="./screenshots/details.png" alt="Job Details Screenshot" width="600" /><br />
<img src="./screenshots/cover-letter.png" alt="Cover Letter Screenshot" width="600" />

## Setup

```bash
pnpm install          # install dependencies
pnpm docker:up        # start PostgreSQL
pnpm db:push          # push Prisma schema
pnpm dev              # start API + web
```

The app runs at `http://localhost:3000` (web) and `http://localhost:3001` (API).

## Docker Image

Published image: `ozerozdas/job-pipeline:latest`.

```bash
docker run --rm \
  -p 3000:3000 \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/jobs_db?schema=public" \
  -e APIFY_TOKEN="..." \
  -e OPENAI_API_KEY="..." \
  ozerozdas/job-pipeline:latest
```

The container runs `prisma db push` on start by default. Use `DB_SETUP_MODE=none` if the database is managed elsewhere.

## API Keys

Add the following keys to your `.env` file:

| Variable | How to get it |
|---|---|
| `APIFY_TOKEN` | Sign up at [apify.com](https://apify.com), go to **Settings → Integrations → API Tokens** and create a token. |
| `OPENAI_API_KEY` | Sign up at [platform.openai.com](https://platform.openai.com), go to **API Keys** and create a new secret key. |
| `ANTHROPIC_API_KEY` | Sign up at [console.anthropic.com](https://console.anthropic.com), go to **API Keys** and generate a key. |

At least one AI key (OpenAI or Anthropic) is required for resume analysis and job scoring. Apify is required for real job scraping — without it the sync falls back to mock data.

## Usage

### Search URLs

Click **Manage Search URLs** on the dashboard. Paste LinkedIn job search URLs here — these are the queries Apify will scrape. To get a URL, go to [linkedin.com/jobs](https://www.linkedin.com/jobs/), set your filters (title, location, remote, etc.), and copy the URL from your browser's address bar.

### Sync Today's Jobs

Click **Sync Today's Jobs** to scrape all configured search URLs and import new listings into the database. The sync runs once per day — pressing it again on the same day is a no-op.

### Upload Resume

Click **Upload Resume** and select a `.pdf`, `.txt`, or `.md` file (max 5 MB). The AI parses your resume and extracts a profile: summary, skills, experience years, seniority level, preferred roles, industries, and education.

### Analyze Unscored Jobs

Click **Analyze Unscored Jobs** to score every job that hasn't been scored yet against your latest resume profile. Each job gets a 0–100 match score with a short reasoning. Jobs are then sorted by score on the dashboard.

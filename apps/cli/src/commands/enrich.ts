import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { getResponse } from "../lib/anthropic.js";
import { fetchJobs, jobToContext } from "../lib/jobs.js";
import { prisma } from "@job-pipeline/db";

const SYSTEM_PROMPT = `You are a job data enrichment specialist. Extract structured data from job descriptions.
Return ONLY valid JSON, no markdown fences, no explanation.`;

interface EnrichmentResult {
  jobId: string;
  extractedSkills: string[];
  experienceYears: number | null;
  educationLevel: string | null;
  remotePolicy: string | null;
  teamSize: string | null;
}

export const enrichCommand = new Command("enrich")
  .description("Enrich job records with AI-extracted structured data")
  .option("-l, --limit <number>", "Number of jobs to enrich", "5")
  .option("--dry-run", "Preview enrichment without saving to DB")
  .option("--model <model>", "Anthropic model to use")
  .action(async (opts) => {
    const spinner = ora("Fetching jobs…").start();
    const jobs = await fetchJobs(parseInt(opts.limit, 10));

    if (jobs.length === 0) {
      spinner.fail("No jobs found. Run a sync first.");
      return;
    }

    spinner.succeed(`Loaded ${jobs.length} jobs to enrich`);

    if (opts.dryRun) {
      console.log(chalk.yellow("\n[DRY RUN] No database writes will occur.\n"));
    }

    for (const job of jobs) {
      const jobSpinner = ora(`Enriching: ${job.title} @ ${job.company}`).start();

      try {
        const raw = await getResponse(
          `Extract structured data from this job listing. Return a JSON object with these fields:
{
  "extractedSkills": ["skill1", "skill2", ...],
  "experienceYears": <number or null>,
  "educationLevel": "<Bachelor's|Master's|PhD|null>",
  "remotePolicy": "<remote|hybrid|onsite|null>",
  "teamSize": "<description or null>"
}

Job:\n${jobToContext(job)}`,
          { system: SYSTEM_PROMPT, model: opts.model, maxTokens: 1024 }
        );

        const parsed: Omit<EnrichmentResult, "jobId"> = JSON.parse(raw);

        if (opts.dryRun) {
          jobSpinner.succeed(`${job.title} @ ${job.company}`);
          console.log(chalk.gray(JSON.stringify(parsed, null, 2)));
          console.log();
        } else {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              standardizedTitle: parsed.educationLevel
                ? `${job.title} [${parsed.educationLevel}]`
                : job.title,
              workRemoteAllowed:
                parsed.remotePolicy === "remote"
                  ? true
                  : parsed.remotePolicy === "onsite"
                    ? false
                    : job.workRemoteAllowed,
            },
          });
          jobSpinner.succeed(`${job.title} @ ${job.company} — enriched`);
        }
      } catch (err) {
        jobSpinner.fail(`${job.title} @ ${job.company} — failed`);
        console.error(chalk.red(`  ${err instanceof Error ? err.message : err}`));
      }
    }

    console.log(chalk.green("\nEnrichment complete."));
  });

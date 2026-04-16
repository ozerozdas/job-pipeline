import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { streamResponse } from "../lib/anthropic.js";
import { fetchJobs, fetchJobById, jobToContext } from "../lib/jobs.js";

const SYSTEM_PROMPT = `You are a concise technical writer. Summarize job listings clearly.
Output markdown. For each job, include: title, company, key requirements, and a 2-sentence summary.`;

export const summarizeCommand = new Command("summarize")
  .description("Generate AI summaries of job listings")
  .option("-l, --limit <number>", "Number of jobs to summarize", "5")
  .option("-i, --id <jobId>", "Summarize a specific job by ID")
  .option("--model <model>", "Anthropic model to use")
  .action(async (opts) => {
    const spinner = ora("Fetching jobs…").start();

    if (opts.id) {
      const job = await fetchJobById(opts.id);
      if (!job) {
        spinner.fail(`Job not found: ${opts.id}`);
        return;
      }
      spinner.succeed(`Loaded job: ${job.title} @ ${job.company}`);
      console.log(chalk.cyan("\nGenerating summary…\n"));

      await streamResponse(
        `Provide a detailed summary of this job listing. Include:
1. Role overview (2-3 sentences)
2. Key responsibilities
3. Required skills and qualifications
4. Nice-to-haves
5. Company/team info (if mentioned)
6. Compensation and benefits (if mentioned)

Job:\n${jobToContext(job)}`,
        { system: SYSTEM_PROMPT, model: opts.model }
      );
      return;
    }

    const jobs = await fetchJobs(parseInt(opts.limit, 10));
    if (jobs.length === 0) {
      spinner.fail("No jobs found. Run a sync first.");
      return;
    }

    spinner.succeed(`Loaded ${jobs.length} jobs`);
    console.log(chalk.cyan("\nGenerating summaries…\n"));

    const jobContext = jobs.map((j, i) => `--- Job ${i + 1} ---\n${jobToContext(j)}`).join("\n\n");

    await streamResponse(
      `Summarize each of these ${jobs.length} job listings in a table format:
| # | Title | Company | Location | Key Skills | Summary |

Then provide a brief overall market snapshot (3-4 sentences).

Jobs:\n${jobContext}`,
      { system: SYSTEM_PROMPT, model: opts.model }
    );
  });

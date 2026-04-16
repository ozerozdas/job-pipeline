import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { streamResponse } from "../lib/anthropic.js";
import { fetchJobs, fetchJobById, jobToContext } from "../lib/jobs.js";

const SYSTEM_PROMPT = `You are a knowledgeable career advisor with deep expertise in the tech job market.
Answer questions about job listings accurately and helpfully. Use markdown formatting.`;

export const askCommand = new Command("ask")
  .description("Ask a free-form question about your job listings using AI")
  .argument("<question>", "Your question about the jobs")
  .option("-l, --limit <number>", "Number of jobs to include as context", "20")
  .option("-i, --id <jobId>", "Ask about a specific job by ID")
  .option("--model <model>", "Anthropic model to use")
  .action(async (question, opts) => {
    const spinner = ora("Fetching jobs…").start();

    let jobContext: string;

    if (opts.id) {
      const job = await fetchJobById(opts.id);
      if (!job) {
        spinner.fail(`Job not found: ${opts.id}`);
        return;
      }
      spinner.succeed(`Loaded job: ${job.title} @ ${job.company}`);
      jobContext = jobToContext(job);
    } else {
      const jobs = await fetchJobs(parseInt(opts.limit, 10));
      if (jobs.length === 0) {
        spinner.fail("No jobs found. Run a sync first.");
        return;
      }
      spinner.succeed(`Loaded ${jobs.length} jobs as context`);
      jobContext = jobs.map((j, i) => `--- Job ${i + 1} ---\n${jobToContext(j)}`).join("\n\n");
    }

    console.log(chalk.cyan(`\nQuestion: ${question}\n`));

    await streamResponse(
      `Based on the following job listings, answer this question:

Question: ${question}

Job listings:\n${jobContext}`,
      { system: SYSTEM_PROMPT, model: opts.model }
    );
  });

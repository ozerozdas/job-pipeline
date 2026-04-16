import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { streamResponse } from "../lib/anthropic.js";
import { fetchJobs, jobToContext } from "../lib/jobs.js";

const SYSTEM_PROMPT = `You are an expert career matchmaker. Score and rank job listings 
against a candidate profile. Be specific and actionable. Use markdown formatting.`;

export const matchCommand = new Command("match")
  .description("Match jobs against your profile/criteria using AI")
  .requiredOption("-p, --profile <description>", "Your profile or criteria (e.g. '5 years React, TypeScript, remote preferred')")
  .option("-l, --limit <number>", "Number of jobs to evaluate", "20")
  .option("-t, --top <number>", "Show top N matches", "5")
  .option("--model <model>", "Anthropic model to use")
  .action(async (opts) => {
    const spinner = ora("Fetching jobs…").start();
    const jobs = await fetchJobs(parseInt(opts.limit, 10));

    if (jobs.length === 0) {
      spinner.fail("No jobs found. Run a sync first.");
      return;
    }

    spinner.succeed(`Loaded ${jobs.length} jobs`);
    console.log(chalk.cyan(`\nMatching against profile: "${opts.profile}"\n`));

    const jobContext = jobs
      .map((j, i) => `--- Job ${i + 1} (ID: ${j.id}) ---\n${jobToContext(j)}`)
      .join("\n\n");

    await streamResponse(
      `Candidate profile: ${opts.profile}

Evaluate each job listing against this profile and return the top ${opts.top} matches.

For each match, provide:
1. **Match Score**: 0-100%
2. **Title** @ **Company** (Location)
3. **Why it matches**: 2-3 bullet points
4. **Gaps**: Skills or requirements the candidate may need to address
5. **Application tip**: One specific suggestion

Rank from best to worst match.

Job listings:\n${jobContext}`,
      { system: SYSTEM_PROMPT, model: opts.model }
    );
  });

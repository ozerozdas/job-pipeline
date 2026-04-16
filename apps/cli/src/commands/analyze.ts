import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { streamResponse } from "../lib/anthropic.js";
import { fetchJobs, jobToContext } from "../lib/jobs.js";

const SYSTEM_PROMPT = `You are a senior career advisor and job market analyst. 
Analyze job listings and provide actionable insights. Be concise and structured.
Use markdown formatting for readability.`;

export const analyzeCommand = new Command("analyze")
  .description("Analyze job listings with AI — extract skills, score relevance, identify trends")
  .option("-l, --limit <number>", "Number of jobs to analyze", "10")
  .option("-f, --focus <area>", "Focus area: skills | trends | requirements | compensation", "skills")
  .option("--model <model>", "Anthropic model to use")
  .action(async (opts) => {
    const spinner = ora("Fetching jobs from database…").start();
    const jobs = await fetchJobs(parseInt(opts.limit, 10));

    if (jobs.length === 0) {
      spinner.fail("No jobs found in the database. Run a sync first.");
      return;
    }

    spinner.succeed(`Loaded ${jobs.length} jobs`);
    console.log(chalk.cyan(`\nAnalyzing with focus: ${opts.focus}\n`));

    const jobContext = jobs.map((j, i) => `--- Job ${i + 1} ---\n${jobToContext(j)}`).join("\n\n");

    const promptMap: Record<string, string> = {
      skills: `Analyze these ${jobs.length} job listings and extract:
1. Most in-demand technical skills (ranked by frequency)
2. Most in-demand soft skills
3. Common tech stacks / frameworks
4. Emerging skills that appear as differentiators

Job listings:\n${jobContext}`,

      trends: `Analyze these ${jobs.length} job listings and identify:
1. Market trends (remote vs hybrid vs onsite, seniority distribution)
2. Industry sectors hiring most
3. Common job title patterns
4. Geographic distribution trends

Job listings:\n${jobContext}`,

      requirements: `Analyze these ${jobs.length} job listings and extract:
1. Minimum years of experience required
2. Education requirements
3. Certification/credential patterns
4. Must-have vs nice-to-have requirements

Job listings:\n${jobContext}`,

      compensation: `Analyze these ${jobs.length} job listings for compensation insights:
1. Salary ranges mentioned (if any)
2. Benefits patterns
3. Equity/stock mentions
4. Compensation competitiveness assessment

Job listings:\n${jobContext}`,
    };

    const prompt = promptMap[opts.focus] ?? promptMap.skills;
    await streamResponse(prompt, { system: SYSTEM_PROMPT, model: opts.model });
  });

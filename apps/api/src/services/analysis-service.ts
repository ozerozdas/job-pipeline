import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@job-pipeline/db";
import type { AnalyzeJobsResponse, JobScoreItem, ResumeAnalysis } from "@job-pipeline/shared";

import { env } from "../lib/env";

const stripMarkdownFences = (text: string): string =>
  text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

const MODEL = "claude-sonnet-4-20250514";

let anthropic: Anthropic | null = null;

const getClient = () => {
  if (!anthropic) {
    if (!env.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return anthropic;
};

const scoreJob = async (
  jobTitle: string,
  jobDescription: string,
  company: string,
  analysis: ResumeAnalysis
): Promise<{ score: number; reasoning: string }> => {
  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Score the following job posting against a candidate profile. Return a JSON object with:
- score: a number from 0 to 100 representing how well the candidate matches the job
- reasoning: a brief 2-3 sentence explanation of the score

Candidate Profile:
- Summary: ${analysis.summary}
- Skills: ${analysis.skills.join(", ")}
- Experience: ${analysis.experienceYears} years
- Seniority: ${analysis.seniorityLevel}
- Preferred Roles: ${analysis.preferredRoles.join(", ")}
- Industries: ${analysis.industries.join(", ")}

Job Posting:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${jobDescription.slice(0, 3000)}

Return ONLY valid JSON, no markdown fences or extra text.`
      }
    ]
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response from AI");
  }

  return JSON.parse(stripMarkdownFences(block.text)) as { score: number; reasoning: string };
};

export const analyzeUnprocessedJobs = async (): Promise<AnalyzeJobsResponse> => {
  const latestProfile = await prisma.resumeProfile.findFirst({
    orderBy: { createdAt: "desc" }
  });

  if (!latestProfile) {
    return {
      status: "no_profile",
      message: "No resume profile found. Please upload your resume first.",
      processedCount: 0
    };
  }

  const analysis = JSON.parse(latestProfile.analysis) as ResumeAnalysis;

  const unprocessedJobs = await prisma.job.findMany({
    where: {
      scores: {
        none: {
          resumeProfileId: latestProfile.id
        }
      }
    }
  });

  if (unprocessedJobs.length === 0) {
    return {
      status: "no_jobs",
      message: "All jobs have already been analyzed against your resume.",
      processedCount: 0
    };
  }

  const scores: JobScoreItem[] = [];

  for (const job of unprocessedJobs) {
    try {
      const result = await scoreJob(job.title, job.description, job.company, analysis);

      await prisma.jobScore.create({
        data: {
          jobId: job.id,
          resumeProfileId: latestProfile.id,
          score: result.score,
          reasoning: result.reasoning
        }
      });

      scores.push({
        jobId: job.id,
        score: result.score,
        reasoning: result.reasoning
      });
    } catch (error) {
      console.error(`Failed to score job ${job.id}:`, error);
    }
  }

  return {
    status: "success",
    message: `Analyzed ${scores.length} of ${unprocessedJobs.length} jobs against your resume.`,
    processedCount: scores.length
  };
};

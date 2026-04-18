import { prisma } from "@job-pipeline/db";
import type { AnalyzeJobsResponse, JobScoreItem, ResumeAnalysis } from "@job-pipeline/shared";

import { getJsonResponse } from "../lib/ai";
import { groupJobsByIdentity, selectPreferredJob } from "./job-identity";

const scoreJob = async (
  jobTitle: string,
  jobDescription: string,
  company: string,
  analysis: ResumeAnalysis
): Promise<{ score: number; reasoning: string }> => {
  return getJsonResponse<{ score: number; reasoning: string }>(`Score the following job posting against a candidate profile. Return a JSON object with:
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

Return ONLY valid JSON, no markdown fences or extra text.`, 1024);
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

  const jobs = await prisma.job.findMany({
    include: {
      scores: {
        where: {
          resumeProfileId: latestProfile.id
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const unprocessedJobs = groupJobsByIdentity(jobs)
    .filter((group) => group.every((job) => job.scores.length === 0))
    .map((group) => selectPreferredJob(group));

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

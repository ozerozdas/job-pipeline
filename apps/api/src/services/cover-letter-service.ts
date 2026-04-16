import { prisma } from "@job-pipeline/db";
import type { CoverLetterResponse, ResumeAnalysis } from "@job-pipeline/shared";

import { getJsonResponse } from "../lib/ai";

export const generateCoverLetter = async (
  jobId: string,
  language: string
): Promise<CoverLetterResponse> => {
  const latestProfile = await prisma.resumeProfile.findFirst({
    orderBy: { createdAt: "desc" }
  });

  if (!latestProfile) {
    return {
      status: "no_profile",
      message: "No resume profile found. Please upload your resume first."
    };
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    return {
      status: "error",
      message: "Job not found."
    };
  }

  const analysis = JSON.parse(latestProfile.analysis) as ResumeAnalysis;

  const coverLetter = await getJsonResponse<{ coverLetter: string }>(
    `Write a professional cover letter for the following job posting based on the candidate's profile.

The cover letter should be written in ${language}.
It should be concise (3-4 paragraphs), professional, and tailored to the specific job.
Highlight relevant skills and experience that match the job requirements.

Candidate Profile:
- Summary: ${analysis.summary}
- Skills: ${analysis.skills.join(", ")}
- Experience: ${analysis.experienceYears} years
- Seniority: ${analysis.seniorityLevel}
- Preferred Roles: ${analysis.preferredRoles.join(", ")}
- Industries: ${analysis.industries.join(", ")}
- Education: ${analysis.education.join(", ")}

Job Posting:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Description: ${job.description.slice(0, 3000)}

Return a JSON object with a single field:
- coverLetter: the full cover letter text

Return ONLY valid JSON, no markdown fences or extra text.`,
    2048
  );

  return {
    status: "success",
    message: "Cover letter generated successfully.",
    coverLetter: coverLetter.coverLetter
  };
};

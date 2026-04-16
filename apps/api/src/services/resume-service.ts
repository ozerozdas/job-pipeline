import { prisma } from "@job-pipeline/db";
import type { ResumeAnalysis, ResumeProfileResponse } from "@job-pipeline/shared";

import { getJsonResponse } from "../lib/ai";

const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  return getJsonResponse<ResumeAnalysis>(`Analyze the following resume and return a JSON object with these exact fields:
- summary: a 2-3 sentence professional summary
- skills: array of technical and soft skills
- experienceYears: estimated total years of experience (number)
- seniorityLevel: one of "intern", "junior", "mid", "senior", "lead", "principal", "executive"
- preferredRoles: array of job titles this person would be a good fit for
- industries: array of industries the person has experience in
- education: array of degrees/certifications

Return ONLY valid JSON, no markdown fences or extra text.

Resume:
${resumeText}`);
};

const serializeProfile = (
  profile: Awaited<ReturnType<typeof prisma.resumeProfile.findFirstOrThrow>>
): ResumeProfileResponse => ({
  id: profile.id,
  fileName: profile.fileName,
  analysis: JSON.parse(profile.analysis) as ResumeAnalysis,
  createdAt: profile.createdAt.toISOString()
});

export const uploadAndAnalyzeResume = async (
  resumeText: string,
  fileName?: string
): Promise<ResumeProfileResponse> => {
  const sanitized = resumeText.replace(/\0/g, "");
  // Truncate to ~15k chars (~4k tokens) — more than enough for any resume
  const truncated = sanitized.slice(0, 15000);
  const analysis = await analyzeResume(truncated);

  const profile = await prisma.resumeProfile.create({
    data: {
      fileName: fileName ?? null,
      rawText: sanitized,
      analysis: JSON.stringify(analysis)
    }
  });

  return serializeProfile(profile);
};

export const getLatestProfile = async (): Promise<ResumeProfileResponse | null> => {
  const profile = await prisma.resumeProfile.findFirst({
    orderBy: { createdAt: "desc" }
  });

  return profile ? serializeProfile(profile) : null;
};

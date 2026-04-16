import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@job-pipeline/db";
import type { ResumeAnalysis, ResumeProfileResponse } from "@job-pipeline/shared";

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

const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze the following resume and return a JSON object with these exact fields:
- summary: a 2-3 sentence professional summary
- skills: array of technical and soft skills
- experienceYears: estimated total years of experience (number)
- seniorityLevel: one of "intern", "junior", "mid", "senior", "lead", "principal", "executive"
- preferredRoles: array of job titles this person would be a good fit for
- industries: array of industries the person has experience in
- education: array of degrees/certifications

Return ONLY valid JSON, no markdown fences or extra text.

Resume:
${resumeText}`
      }
    ]
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response from AI");
  }

  return JSON.parse(stripMarkdownFences(block.text)) as ResumeAnalysis;
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
  const analysis = await analyzeResume(resumeText);

  const profile = await prisma.resumeProfile.create({
    data: {
      fileName: fileName ?? null,
      rawText: resumeText,
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

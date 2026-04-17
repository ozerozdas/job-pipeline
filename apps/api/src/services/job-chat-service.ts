import { prisma } from "@job-pipeline/db";
import type { JobChatMessage, JobChatResponse, ResumeAnalysis } from "@job-pipeline/shared";

import { getTextResponse } from "../lib/ai";

export const chatAboutJob = async (
  jobId: string,
  messages: JobChatMessage[]
): Promise<JobChatResponse> => {
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

  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are a helpful career assistant. You have access to the candidate's resume profile and a specific job posting. Answer the user's questions based on this context. Provide concise, helpful answers that can be used in job application forms.

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

Conversation:
${conversationHistory}

Respond to the latest user message. Be direct and concise. If the user asks you to draft an answer for an application question, provide a ready-to-use response they can paste directly.`;

  const reply = await getTextResponse(prompt, 2048);

  return {
    status: "success",
    message: "Response generated successfully.",
    reply
  };
};

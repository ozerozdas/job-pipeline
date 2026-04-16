import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { extractText as extractPdfText } from "unpdf";

import { getLatestProfile, uploadAndAnalyzeResume } from "../services/resume-service";

const extractText = async (buffer: Buffer, filename?: string): Promise<string> => {
  const ext = (filename ?? "").split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const { text } = await extractPdfText(new Uint8Array(buffer), { mergePages: true });
    return text;
  }

  // For .txt, .md and other text files
  return buffer.toString("utf-8");
};

export const registerResumeRoutes = async (app: FastifyInstance) => {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024 // 5 MB
    }
  });

  app.post("/resume", async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          status: "error",
          message: "No file uploaded"
        });
      }

      const buffer = await data.toBuffer();
      const resumeText = await extractText(buffer, data.filename);

      if (!resumeText.trim()) {
        return reply.status(400).send({
          status: "error",
          message: "Resume file is empty or could not be parsed"
        });
      }

      const profile = await uploadAndAnalyzeResume(resumeText, data.filename);

      return reply.send({
        status: "success",
        message: "Resume uploaded and analyzed successfully.",
        profile
      });
    } catch (error) {
      app.log.error(error, "resume upload failed");
      return reply.status(500).send({
        status: "error",
        message: "Failed to process resume"
      });
    }
  });

  app.get("/resume", async (_request, reply) => {
    try {
      const profile = await getLatestProfile();

      if (!profile) {
        return reply.status(404).send({
          status: "not_found",
          message: "No resume profile found"
        });
      }

      return reply.send({ profile });
    } catch (error) {
      app.log.error(error, "failed to get resume profile");
      return reply.status(500).send({
        status: "error",
        message: "Failed to retrieve resume profile"
      });
    }
  });
};

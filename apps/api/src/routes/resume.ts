import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";

import { getLatestProfile, uploadAndAnalyzeResume } from "../services/resume-service";

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
      const resumeText = buffer.toString("utf-8");

      if (!resumeText.trim()) {
        return reply.status(400).send({
          status: "error",
          message: "Resume file is empty"
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

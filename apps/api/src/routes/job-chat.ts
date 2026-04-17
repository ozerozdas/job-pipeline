import type { FastifyInstance } from "fastify";
import type { JobChatMessage } from "@job-pipeline/shared";

import { chatAboutJob } from "../services/job-chat-service";

export const registerJobChatRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: { jobId: string; messages: JobChatMessage[] } }>(
    "/job-chat",
    async (request, reply) => {
      try {
        const { jobId, messages } = request.body;

        if (!jobId || !Array.isArray(messages) || messages.length === 0) {
          return reply.status(400).send({
            status: "error",
            message: "jobId and messages are required"
          });
        }

        const result = await chatAboutJob(jobId, messages);
        return reply.send(result);
      } catch (error) {
        app.log.error(error, "job chat failed");
        return reply.status(500).send({
          status: "error",
          message: "Failed to generate response"
        });
      }
    }
  );
};

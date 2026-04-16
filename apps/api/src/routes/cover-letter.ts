import type { FastifyInstance } from "fastify";

import { generateCoverLetter } from "../services/cover-letter-service";

export const registerCoverLetterRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: { jobId: string; language: string } }>(
    "/cover-letter",
    async (request, reply) => {
      try {
        const { jobId, language } = request.body;

        if (!jobId || !language) {
          return reply.status(400).send({
            status: "error",
            message: "jobId and language are required"
          });
        }

        const result = await generateCoverLetter(jobId, language);
        return reply.send(result);
      } catch (error) {
        app.log.error(error, "cover letter generation failed");
        return reply.status(500).send({
          status: "error",
          message: "Failed to generate cover letter"
        });
      }
    }
  );
};

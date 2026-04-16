import type { FastifyInstance } from "fastify";

import { analyzeUnprocessedJobs } from "../services/analysis-service";

export const registerAnalyzeRoutes = async (app: FastifyInstance) => {
  app.post("/analyze", async (_request, reply) => {
    try {
      const result = await analyzeUnprocessedJobs();
      return reply.send(result);
    } catch (error) {
      app.log.error(error, "job analysis failed");
      return reply.status(500).send({
        status: "error",
        message: "Job analysis failed"
      });
    }
  });
};

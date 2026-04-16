import type { FastifyInstance } from "fastify";

import { syncJobsForToday } from "../services/sync-service";

export const registerSyncRoutes = async (app: FastifyInstance) => {
  app.post("/sync", async (_request, reply) => {
    try {
      const result = await syncJobsForToday();
      return reply.send(result);
    } catch (error) {
      app.log.error(error, "sync failed");
      return reply.status(500).send({
        status: "failed",
        message: "Job sync failed"
      });
    }
  });
};

import type { FastifyInstance } from "fastify";

import { getAllJobs } from "../services/job-service";

export const registerJobRoutes = async (app: FastifyInstance) => {
  app.get("/jobs", async () => {
    const jobs = await getAllJobs();

    return {
      jobs
    };
  });
};

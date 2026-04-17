import type { FastifyInstance } from "fastify";

import { getAllJobs, toggleJobApplied } from "../services/job-service";

export const registerJobRoutes = async (app: FastifyInstance) => {
  app.get("/jobs", async () => {
    const jobs = await getAllJobs();

    return {
      jobs
    };
  });

  app.patch<{
    Params: { id: string };
    Body: { applied: boolean };
  }>("/jobs/:id/applied", async (request) => {
    const { id } = request.params;
    const { applied } = request.body;
    const job = await toggleJobApplied(id, applied);
    return { job };
  });
};

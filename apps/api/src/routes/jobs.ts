import type { FastifyInstance } from "fastify";

import { getAllJobs, toggleJobApplied } from "../services/job-service";

export const registerJobRoutes = async (app: FastifyInstance) => {
  app.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
      query?: string;
      applied?: "all" | "applied" | "not-applied";
      match?: "all" | "high" | "good" | "low" | "unscored";
    };
  }>("/jobs", async (request) => {
    const jobs = await getAllJobs({
      page: request.query.page ? Number(request.query.page) : undefined,
      pageSize: request.query.pageSize ? Number(request.query.pageSize) : undefined,
      query: request.query.query,
      applied: request.query.applied,
      match: request.query.match
    });

    return jobs;
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

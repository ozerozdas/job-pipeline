import type { FastifyInstance } from "fastify";
import type { JobSourceType } from "@job-pipeline/shared";

import {
  addSearchUrl,
  deleteSearchUrl,
  getSearchUrls,
  replaceAllSearchUrls,
  updateSearchUrl,
} from "../services/search-url-service";

type SearchUrlRequestBody = {
  url: string;
  label?: string;
  provider?: string;
  sourceType?: JobSourceType;
};

export const registerSearchUrlRoutes = async (app: FastifyInstance) => {
  // List all search URLs
  app.get("/search-urls", async (_request, reply) => {
    const urls = await getSearchUrls();
    return reply.send({ urls });
  });

  // Add a single search URL
  app.post<{ Body: SearchUrlRequestBody }>("/search-urls", async (request, reply) => {
    const { url, label, provider, sourceType } = request.body;
    if (!url || typeof url !== "string") {
      return reply.status(400).send({ message: "url is required" });
    }
    const created = await addSearchUrl({
      url: url.trim(),
      label: label?.trim(),
      provider,
      sourceType,
    });
    return reply.status(201).send(created);
  });

  // Update a search URL
  app.put<{ Params: { id: string }; Body: SearchUrlRequestBody }>(
    "/search-urls/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { url, label, provider, sourceType } = request.body;
      if (!url || typeof url !== "string") {
        return reply.status(400).send({ message: "url is required" });
      }
      try {
        const updated = await updateSearchUrl(id, {
          url: url.trim(),
          label: label?.trim(),
          provider,
          sourceType,
        });
        return reply.send(updated);
      } catch {
        return reply.status(404).send({ message: "Search URL not found" });
      }
    },
  );

  // Delete a search URL
  app.delete<{ Params: { id: string } }>("/search-urls/:id", async (request, reply) => {
    const { id } = request.params;
    try {
      await deleteSearchUrl(id);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Search URL not found" });
    }
  });

  // Replace all search URLs at once
  app.put<{ Body: { urls: SearchUrlRequestBody[] } }>(
    "/search-urls",
    async (request, reply) => {
      const { urls } = request.body;
      if (!Array.isArray(urls)) {
        return reply.status(400).send({ message: "urls array is required" });
      }
      const result = await replaceAllSearchUrls(
        urls
          .filter((u) => typeof u.url === "string" && u.url.trim().length > 0)
          .map((u) => ({
            url: u.url.trim(),
            label: u.label?.trim(),
            provider: u.provider,
            sourceType: u.sourceType,
          })),
      );
      return reply.send({ urls: result });
    },
  );
};

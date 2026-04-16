import type { FastifyInstance } from "fastify";

import {
  addSearchUrl,
  deleteSearchUrl,
  getSearchUrls,
  replaceAllSearchUrls,
  updateSearchUrl,
} from "../services/search-url-service";

export const registerSearchUrlRoutes = async (app: FastifyInstance) => {
  // List all search URLs
  app.get("/search-urls", async (_request, reply) => {
    const urls = await getSearchUrls();
    return reply.send({ urls });
  });

  // Add a single search URL
  app.post<{ Body: { url: string; label?: string } }>("/search-urls", async (request, reply) => {
    const { url, label } = request.body;
    if (!url || typeof url !== "string") {
      return reply.status(400).send({ message: "url is required" });
    }
    const created = await addSearchUrl(url.trim(), label?.trim());
    return reply.status(201).send(created);
  });

  // Update a search URL
  app.put<{ Params: { id: string }; Body: { url: string; label?: string } }>(
    "/search-urls/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { url, label } = request.body;
      if (!url || typeof url !== "string") {
        return reply.status(400).send({ message: "url is required" });
      }
      try {
        const updated = await updateSearchUrl(id, url.trim(), label?.trim());
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
  app.put<{ Body: { urls: { url: string; label?: string }[] } }>(
    "/search-urls",
    async (request, reply) => {
      const { urls } = request.body;
      if (!Array.isArray(urls)) {
        return reply.status(400).send({ message: "urls array is required" });
      }
      const result = await replaceAllSearchUrls(
        urls.map((u) => ({ url: u.url.trim(), label: u.label?.trim() })),
      );
      return reply.send({ urls: result });
    },
  );
};

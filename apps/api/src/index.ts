import cors from "@fastify/cors";
import Fastify from "fastify";

import { env } from "./lib/env";
import { registerAnalyzeRoutes } from "./routes/analyze";
import { registerCoverLetterRoutes } from "./routes/cover-letter";
import { registerJobRoutes } from "./routes/jobs";
import { registerResumeRoutes } from "./routes/resume";
import { registerSyncRoutes } from "./routes/sync";

const buildApp = async () => {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: [env.webOrigin]
  });

  app.get("/health", async () => ({
    status: "ok"
  }));

  await app.register(registerJobRoutes);
  await app.register(registerSyncRoutes);
  await app.register(registerResumeRoutes);
  await app.register(registerAnalyzeRoutes);
  await app.register(registerCoverLetterRoutes);

  return app;
};

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.apiPort
    });
  } catch (error) {
    app.log.error(error, "failed to start api");
    process.exit(1);
  }
};

void start();

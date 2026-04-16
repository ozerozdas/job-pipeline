const fallbackNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  apiPort: fallbackNumber(process.env.API_PORT, 3001),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  appTimeZone: process.env.APP_TIMEZONE ?? "UTC",
  apifyToken: process.env.APIFY_TOKEN ?? "",
  apifyActorId: process.env.APIFY_ACTOR_ID ?? "hKByXkMQaC5Qt9UMN",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? ""
};

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build

COPY . .

ENV NODE_ENV=production
ENV API_BASE_URL=http://127.0.0.1:3001
ENV NEXT_PUBLIC_API_BASE_URL=/api

RUN pnpm --filter @job-pipeline/db db:generate
RUN pnpm exec turbo build

FROM base AS runner

ENV NODE_ENV=production
ENV API_PORT=3001
ENV WEB_PORT=3000
ENV API_BASE_URL=http://127.0.0.1:3001
ENV NEXT_PUBLIC_API_BASE_URL=/api
ENV DB_SETUP_MODE=push

COPY --from=build /app /app

RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 3000 3001

CMD ["docker/entrypoint.sh"]

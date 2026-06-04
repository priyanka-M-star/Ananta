# Next.js 14 — multi-stage build with standalone output.
# Requires next.config.mjs to set `output: 'standalone'` for slim runtime.
ARG NODE_VERSION=20.10.0

# ---------- deps ----------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY turbo.json tsconfig.base.json ./
COPY packages/types/package.json   ./packages/types/
COPY packages/config/package.json  ./packages/config/
COPY apps/web/package.json         ./apps/web/

RUN pnpm install --frozen-lockfile=false

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ananta/web build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# standalone output bundles only what's needed
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=build /app/apps/web/public            ./apps/web/public

HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3000
USER node
CMD ["node", "apps/web/server.js"]

# NestJS API — multi-stage build.
# Final image: ~180 MB on linux/arm64 (Oracle Ampere).
ARG NODE_VERSION=20.10.0

# ---------- deps ----------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy everything needed to install workspace deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY turbo.json tsconfig.base.json ./
COPY packages/db/package.json   ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json      ./apps/api/

RUN pnpm install --frozen-lockfile=false

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY packages ./packages
COPY apps/api ./apps/api

# Generate Prisma client, build TS
RUN pnpm --filter @ananta/db prisma generate
RUN pnpm --filter @ananta/api build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

ENV NODE_ENV=production
ENV PORT=4000

# install prod deps only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/
COPY packages/db/prisma ./packages/db/prisma

# health check at the docker layer
HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:4000/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 4000
USER node
CMD ["node", "apps/api/dist/main.js"]

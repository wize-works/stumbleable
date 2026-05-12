# Workspace-aware multi-stage build for Fastify TypeScript service.
# Build context: repo root. Installs only this workspace via npm ci -w.

# Stage 1: Shared package.json snapshot (lets deps + prod-deps share COPY layers)
FROM node:20-alpine AS pkg-files
WORKDIR /app
COPY package.json package-lock.json ./
COPY apis/content-service/package.json ./apis/content-service/
COPY apis/crawler-service/package.json ./apis/crawler-service/
COPY apis/discovery-service/package.json ./apis/discovery-service/
COPY apis/email-service/package.json ./apis/email-service/
COPY apis/interaction-service/package.json ./apis/interaction-service/
COPY apis/moderation-service/package.json ./apis/moderation-service/
COPY apis/og-service/package.json ./apis/og-service/
COPY apis/scheduler-service/package.json ./apis/scheduler-service/
COPY apis/user-service/package.json ./apis/user-service/
COPY ui/portal/package.json ./ui/portal/

# Stage 2: Node base with npm pinned to match local (lockfile compat)
FROM node:20-alpine AS node-base
RUN apk add --no-cache libc6-compat && npm install -g npm@11.6.4
WORKDIR /app

# Stage 3: All deps (incl. dev) for building
FROM node-base AS deps
COPY --from=pkg-files /app /app
RUN npm ci -w apis/moderation-service

# Stage 3: Build
FROM deps AS builder
COPY apis/moderation-service/src ./apis/moderation-service/src
COPY apis/moderation-service/tsconfig.json ./apis/moderation-service/
RUN npm run build -w apis/moderation-service

# Stage 5: Production deps only
FROM node-base AS prod-deps
COPY --from=pkg-files /app /app
RUN npm ci --omit=dev -w apis/moderation-service

# Stage 5: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 apiuser

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apis/moderation-service ./apis/moderation-service
COPY --from=builder /app/apis/moderation-service/dist ./apis/moderation-service/dist

RUN chown -R apiuser:nodejs /app

USER apiuser
WORKDIR /app/apis/moderation-service

EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]

# Workspace-aware multi-stage build for the Next.js 15 portal.
# Build context: repo root. Installs only this workspace via npm ci -w.

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

FROM node:20-alpine AS node-base
RUN apk add --no-cache libc6-compat && npm install -g npm@11.6.4
WORKDIR /app

FROM node-base AS deps
COPY --from=pkg-files /app /app
RUN npm ci -w ui/portal

FROM deps AS builder
WORKDIR /app

# Build-time NEXT_PUBLIC_* args (Next inlines these into the client bundle)
ARG NEXT_PUBLIC_DISCOVERY_API_URL
ARG NEXT_PUBLIC_INTERACTION_API_URL
ARG NEXT_PUBLIC_USER_API_URL
ARG NEXT_PUBLIC_CRAWLER_API_URL
ARG NEXT_PUBLIC_MODERATION_API_URL
ARG NEXT_PUBLIC_EMAIL_API_URL
ARG NEXT_PUBLIC_SCHEDULER_API_URL
ARG NEXT_PUBLIC_CONTENT_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_FONTAWESOME_KIT_URL
ARG SENTRY_AUTH_TOKEN

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_DISCOVERY_API_URL=$NEXT_PUBLIC_DISCOVERY_API_URL
ENV NEXT_PUBLIC_INTERACTION_API_URL=$NEXT_PUBLIC_INTERACTION_API_URL
ENV NEXT_PUBLIC_USER_API_URL=$NEXT_PUBLIC_USER_API_URL
ENV NEXT_PUBLIC_CRAWLER_API_URL=$NEXT_PUBLIC_CRAWLER_API_URL
ENV NEXT_PUBLIC_MODERATION_API_URL=$NEXT_PUBLIC_MODERATION_API_URL
ENV NEXT_PUBLIC_EMAIL_API_URL=$NEXT_PUBLIC_EMAIL_API_URL
ENV NEXT_PUBLIC_SCHEDULER_API_URL=$NEXT_PUBLIC_SCHEDULER_API_URL
ENV NEXT_PUBLIC_CONTENT_API_URL=$NEXT_PUBLIC_CONTENT_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_FONTAWESOME_KIT_URL=$NEXT_PUBLIC_FONTAWESOME_KIT_URL
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Copy this workspace's source
COPY ui/portal ./ui/portal

RUN npm run build -w ui/portal

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output for workspace projects mirrors the workspace layout.
# Entry point ends up at /app/ui/portal/server.js after these copies.
COPY --from=builder /app/ui/portal/.next/standalone ./
COPY --from=builder /app/ui/portal/.next/static ./ui/portal/.next/static
COPY --from=builder /app/ui/portal/public ./ui/portal/public

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "ui/portal/server.js"]

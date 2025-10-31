# Multi-stage build for Next.js 15 application
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept optional build arguments for environment configuration
# Note: With dynamic rendering, these are not required during build
# They will be provided at runtime via environment variables
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

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Only set build-time env vars if provided (optional for API URLs)
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

# Build the application
RUN npm run build

# Stage 3: Production dependencies
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

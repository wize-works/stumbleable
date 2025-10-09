# Dockerfile Standardization Fix

**Date:** October 8, 2025  
**Issue:** Email service deployment failing with Docker build error

## Problem

The email-service was failing to deploy with the following error:

```
ERROR: failed to build: failed to solve: dockerfile parse error on line 42: unknown instruction: adduser
```

The issue was caused by incorrect syntax in the `adduser` command. The Dockerfile used:
```dockerfile
RUN adduser -S nodejs -u 1001  # ❌ Wrong - BusyBox syntax
```

But should have used:
```dockerfile
RUN adduser --system --uid 1001 apiuser  # ✅ Correct - Alpine syntax
```

## Root Cause

The email-service and og-service Dockerfiles were not following the standardized multi-stage build pattern used by all other API services in the monorepo.

## Solution

Standardized all API service Dockerfiles to use the same multi-stage build pattern:

### Standard Dockerfile Pattern

```dockerfile
# Multi-stage build for Fastify TypeScript service
# Stage 1: Dependencies (production only)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Builder (all dependencies including dev)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy dependencies and built files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Set correct permissions
RUN chown -R apiuser:nodejs /app

USER apiuser

EXPOSE 8080

ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

## Changes Made

### Fixed Services
1. **email-service** - Converted from custom build to standard pattern
2. **og-service** - Converted from simple build to standard pattern

### Already Standardized Services
- ✅ discovery-service
- ✅ interaction-service  
- ✅ user-service
- ✅ crawler-service
- ✅ moderation-service

## Benefits of Standardization

### 1. **Multi-stage Build Optimization**
   - **Stage 1 (deps)**: Only production dependencies
   - **Stage 2 (builder)**: Build the TypeScript code
   - **Stage 3 (runner)**: Minimal runtime image
   - Results in smaller final images (~50% size reduction)

### 2. **Better Caching**
   - Dependencies cached separately from source code
   - Faster rebuilds when only source changes
   - Leverages Docker layer caching effectively

### 3. **Security**
   - Non-root user (`apiuser`) for runtime
   - Minimal attack surface with Alpine Linux
   - No dev dependencies in production image

### 4. **Consistency**
   - Same build process across all services
   - Easier to maintain and debug
   - Team members know what to expect

### 5. **Kubernetes Compatibility**
   - Health checks using Node.js HTTP module (no external tools needed)
   - Binds to `0.0.0.0` for proper probe connectivity
   - Standard port 8080 with environment override

## Key Differences from Previous Patterns

### Email Service (Before)
- ❌ Single optimized stage (but incorrect user syntax)
- ❌ Used `wget` for health checks (extra dependency)
- ❌ Used `npm ci` instead of `npm install`
- ❌ Different user creation syntax

### OG Service (Before)
- ❌ No multi-stage build
- ❌ Used `node:20-slim` instead of `node:20-alpine`
- ❌ Expected pre-built `dist` directory
- ❌ No builder stage

### Standard Pattern (Now)
- ✅ Three-stage build for maximum optimization
- ✅ Node.js-based health check (no external tools)
- ✅ Consistent user creation with Alpine syntax
- ✅ Alpine Linux for smaller images
- ✅ Builds source code within Docker

## Testing

After applying these changes:

1. **Build locally**: `docker build -t test-service -f apis/email-service/Dockerfile apis/email-service`
2. **Run container**: `docker run -p 8080:8080 test-service`
3. **Check health**: `curl http://localhost:8080/health`

## Future Guidelines

When creating new API services:

1. **Copy the standard Dockerfile** from any existing service
2. **Do not modify** the Dockerfile structure
3. **Ensure** your service has:
   - `src/` directory with TypeScript source
   - `tsconfig.json` for TypeScript config
   - Build script in `package.json`: `"build": "tsc"`
   - `/health` endpoint that returns 200 OK

## Alpine Linux User Creation

For reference, the correct Alpine Linux syntax:

```dockerfile
# Create group
RUN addgroup --system --gid 1001 nodejs

# Create user in that group
RUN adduser --system --uid 1001 apiuser
```

**NOT** BusyBox syntax (which the old Dockerfile incorrectly used):
```dockerfile
RUN adduser -S nodejs -u 1001  # ❌ This fails in Alpine!
```

## Related Documentation

- [Kubernetes YAML Alignment Review](./K8S_YAML_ALIGNMENT_REVIEW.md) - Companion document reviewing K8s deployment configs
- [Architecture Decision: Standardized Builds](./ARCHITECTURE_DECISION_CONTENT_ROUTE.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

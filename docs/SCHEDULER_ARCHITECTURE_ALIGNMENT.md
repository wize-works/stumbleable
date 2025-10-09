# Scheduler-Service Architecture Alignment

## Overview
This document tracks the architectural improvements made to align the scheduler-service with our other API services.

## Issues Identified

### Missing Dependencies
The scheduler-service was missing several critical npm packages that all our other API services use:
- ❌ `@clerk/fastify` - Clerk authentication plugin
- ❌ `@fastify/env` - Environment validation
- ❌ `@fastify/helmet` - Security headers
- ❌ `@fastify/rate-limit` - Rate limiting protection
- ❌ `fastify-plugin` - For plugin composition
- ❌ `pino-pretty` - Pretty logging in development

### Missing Architectural Patterns
1. **No authentication** - All endpoints were unprotected
2. **No rate limiting** - Vulnerable to abuse
3. **No security headers** - Missing helmet middleware
4. **No environment validation** - No schema for required env vars
5. **Basic error handling** - No global error handler or 404 handler
6. **Simple CORS** - No proper origin validation
7. **No middleware layer** - No auth/role checking infrastructure

## Changes Made

### 1. Updated package.json
**File**: `apis/scheduler-service/package.json`

Added all missing dependencies to match user-service and discovery-service:
```json
{
  "dependencies": {
    "@clerk/fastify": "^2.4.34",
    "@fastify/cors": "^10.1.0",
    "@fastify/env": "^5.0.3",
    "@fastify/helmet": "^12.0.1",
    "@fastify/rate-limit": "^10.3.0",
    "@supabase/supabase-js": "^2.58.0",
    "dotenv": "^16.6.1",
    "fastify": "^5.6.1",
    "fastify-plugin": "^5.1.0",
    "node-cron": "^3.0.3",
    "pino-pretty": "^11.2.2",
    "zod": "^3.23.8"
  }
}
```

### 2. Created Authentication Middleware
**File**: `apis/scheduler-service/src/middleware/auth.ts`

Implemented three authentication strategies:

#### a) `requireAuth()`
- Verifies Clerk authentication token
- Extracts userId from request.auth
- Returns 401 if not authenticated

#### b) `requireAdmin()`
- Checks Clerk sessionClaims for admin role
- Validates role === 'admin' || role === 'super_admin'
- Returns 403 if not admin

#### c) `allowServiceToService()`
- Allows internal service calls without user authentication
- Validates optional SERVICE_TOKEN from environment
- Permits registration endpoint for services to auto-register jobs

### 3. Refactored server.ts
**File**: `apis/scheduler-service/src/server.ts`

Implemented complete Fastify setup matching our other services:

**Environment Schema** - Validates required environment variables:
```typescript
const envSchema = {
    type: 'object',
    required: ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
    properties: {
        NODE_ENV, PORT, HOST, ALLOWED_ORIGINS,
        SUPABASE_URL, SUPABASE_SERVICE_KEY,
        EMAIL_SERVICE_URL, CRAWLER_SERVICE_URL, etc.
        CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
        RATE_LIMIT_MAX, RATE_LIMIT_WINDOW,
        SERVICE_TOKEN
    }
};
```

**Plugin Registration Order** (critical for proper functionality):
1. ✅ Environment validation (`@fastify/env`)
2. ✅ JSON body parser (handle empty bodies)
3. ✅ Rate limiting (`@fastify/rate-limit`)
4. ✅ Health check (BEFORE Clerk to bypass auth)
5. ✅ Clerk authentication (`@clerk/fastify`)
6. ✅ Security headers (`@fastify/helmet`)
7. ✅ CORS (`@fastify/cors`)
8. ✅ API routes (with /api prefix)
9. ✅ Global error handler
10. ✅ 404 handler

**Rate Limiting Configuration**:
- 100 requests per minute (configurable)
- Uses Clerk userId when authenticated, IP otherwise
- Whitelist localhost for development
- Custom error response with retry-after
- Health check exempted from rate limiting

**Clerk Authentication**:
- Conditional registration (only if keys provided)
- Logs warning if not configured
- Registered AFTER health check to avoid auth on probes

### 4. Updated Routes with Authentication
**File**: `apis/scheduler-service/src/routes/jobs.ts`

Applied authentication to all endpoints:

| Endpoint | Method | Authentication | Rationale |
|----------|--------|----------------|-----------|
| `/api/jobs/register` | POST | Service-to-Service | Services auto-register jobs on startup |
| `/api/jobs` | GET | Admin Only | Sensitive job configuration data |
| `/api/jobs/:jobName` | GET | Admin Only | Job details and statistics |
| `/api/jobs/:jobName/trigger` | POST | Admin Only | Manual job execution |
| `/api/jobs/:jobName/enable` | POST | Admin Only | Job control |
| `/api/jobs/:jobName/disable` | POST | Admin Only | Job control |
| `/api/jobs/:jobName` | DELETE | Admin Only | Job deletion |
| `/api/jobs/:jobName/history` | GET | Admin Only | Execution history |
| `/api/jobs/:jobName/stats` | GET | Admin Only | Job statistics |
| `/api/jobs/:jobName/cron` | PUT | Admin Only | Schedule modification |

**Implementation Pattern**:
```typescript
fastify.post('/jobs/:jobName/trigger', {
    preHandler: requireAdmin  // ✅ Admin authentication
}, async (request, reply) => {
    // Handler logic
});
```

### 5. Updated Kubernetes Deployment
**File**: `k8s/base/scheduler-service.yaml`

Added Clerk environment variables:
```yaml
env:
- name: CLERK_PUBLISHABLE_KEY
  valueFrom:
    secretKeyRef:
      name: stumbleable-secrets
      key: CLERK_PUBLISHABLE_KEY
- name: CLERK_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: stumbleable-secrets
      key: CLERK_SECRET_KEY
- name: ALLOWED_ORIGINS
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: ALLOWED_ORIGINS
```

## Security Improvements

### Before
- ❌ No authentication on any endpoints
- ❌ Anyone could list/trigger/delete jobs
- ❌ No rate limiting
- ❌ No security headers
- ❌ Basic CORS with single origin

### After
- ✅ Admin-only access to all management endpoints
- ✅ Service-to-service auth for job registration
- ✅ Rate limiting (100 req/min per user/IP)
- ✅ Helmet security headers
- ✅ Multi-origin CORS support
- ✅ Environment variable validation
- ✅ Proper error handling

## Architecture Alignment Checklist

Comparing with user-service and discovery-service:

| Feature | User Service | Discovery Service | Scheduler Service | Status |
|---------|--------------|-------------------|-------------------|--------|
| `@clerk/fastify` | ✅ | ✅ | ✅ | ✅ Aligned |
| `@fastify/env` | ✅ | ✅ | ✅ | ✅ Aligned |
| `@fastify/helmet` | ✅ | ✅ | ✅ | ✅ Aligned |
| `@fastify/rate-limit` | ✅ | ✅ | ✅ | ✅ Aligned |
| `pino-pretty` | ✅ | ✅ | ✅ | ✅ Aligned |
| Environment schema | ✅ | ✅ | ✅ | ✅ Aligned |
| Health check (no auth) | ✅ | ✅ | ✅ | ✅ Aligned |
| Clerk conditional setup | ✅ | ✅ | ✅ | ✅ Aligned |
| Global error handler | ✅ | ✅ | ✅ | ✅ Aligned |
| 404 handler | ✅ | ✅ | ✅ | ✅ Aligned |
| Rate limiting config | ✅ | ✅ | ✅ | ✅ Aligned |
| CORS multi-origin | ✅ | ✅ | ✅ | ✅ Aligned |
| Graceful shutdown | ✅ | ✅ | ✅ | ✅ Aligned |

## Service-Specific Considerations

### Why Service-to-Service Auth for Registration?
The `/api/jobs/register` endpoint needs to accept calls from other services (email-service, crawler-service, etc.) that don't have user authentication. These services register their jobs on startup.

**Options considered**:
1. ❌ **No auth** - Too insecure, anyone could register jobs
2. ✅ **SERVICE_TOKEN** - Shared secret for service-to-service calls
3. ❌ **mTLS** - Too complex for current setup

**Implementation**:
- Optional SERVICE_TOKEN environment variable
- If not set, logs warning but allows all calls (development)
- In production, set SERVICE_TOKEN and validate on every registration

### Why Admin-Only for Management?
Job management is sensitive:
- Can trigger resource-intensive operations
- Can disable critical scheduled tasks
- Provides visibility into system internals
- Should only be accessible to administrators

**Admin detection**:
```typescript
const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
if (role !== 'admin' && role !== 'super_admin') {
    return reply.status(403).send({ error: 'Forbidden' });
}
```

## Testing Checklist

### Local Development
- [ ] Run `npm run install:scheduler` to install new dependencies
- [ ] Create `.env` file with Clerk credentials
- [ ] Run `npm run dev` to start all services
- [ ] Verify scheduler starts without errors
- [ ] Check health endpoint: `http://localhost:7007/health`
- [ ] Test job registration from email-service logs
- [ ] Verify admin UI loads at `http://localhost:3000/admin/scheduler`
- [ ] Test authentication rejection for non-admin users

### Production
- [ ] Deploy to AKS cluster
- [ ] Verify Clerk secrets are in `stumbleable-secrets`
- [ ] Check pod logs for authentication setup
- [ ] Test admin UI requires login
- [ ] Test job registration from services
- [ ] Verify rate limiting with repeated requests
- [ ] Check security headers in responses
- [ ] Monitor for authentication errors

## Environment Variables Required

### Development (.env file)
```env
NODE_ENV=development
PORT=7007
HOST=0.0.0.0
LOG_LEVEL=info

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Service URLs (for job execution)
EMAIL_SERVICE_URL=http://localhost:7006
CRAWLER_SERVICE_URL=http://localhost:7004
DISCOVERY_SERVICE_URL=http://localhost:7001
INTERACTION_SERVICE_URL=http://localhost:7002
USER_SERVICE_URL=http://localhost:7003

# Optional: Service-to-Service Auth
SERVICE_TOKEN=your_shared_secret
```

### Kubernetes (from secrets/configmap)
All environment variables sourced from:
- `stumbleable-secrets` (Clerk, Supabase)
- `stumbleable-config` (NODE_ENV, LOG_LEVEL, ALLOWED_ORIGINS)
- Deployment YAML (service URLs)

## Migration Notes

### Breaking Changes
1. **Authentication now required** - Admin endpoints will reject unauthenticated requests
2. **Rate limiting active** - May affect automated testing
3. **Environment validation** - Server won't start without required env vars

### Backward Compatibility
- Health check remains public (for K8s probes)
- Job registration still accepts service calls (with optional token)
- Existing jobs in database continue to work

## Future Improvements

1. **Service token rotation** - Implement token rotation mechanism
2. **mTLS** - Consider mutual TLS for service-to-service auth
3. **Audit logging** - Log all admin actions to database
4. **IP whitelisting** - Restrict ingress to known IPs
5. **Request signing** - Sign service-to-service requests with HMAC
6. **Metrics** - Expose Prometheus metrics for monitoring
7. **Distributed locking** - If scaling to multiple instances

---

**Status**: ✅ **Architecture Fully Aligned**  
**Last Updated**: October 8, 2025  
**Reviewed By**: AI Assistant  
**Next Action**: Install dependencies and test locally

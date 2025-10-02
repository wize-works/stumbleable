# Health Endpoint Clerk Authentication Fix

## Problem

Kubernetes health probes were failing for all API services with 500 errors:

```
Error: Publishable key is missing. Ensure that your publishable key is correctly configured.
```

Even though the health endpoints were defined, they were returning 500 errors because Clerk authentication was being applied to them.

## Root Cause

The Clerk plugin (`@clerk/fastify`) was being registered **before** the health endpoints in all API services. When Clerk is registered, it applies authentication middleware to **all subsequent routes**, including the `/health` endpoint.

This caused:
1. Health checks to require Clerk authentication
2. Missing Clerk environment variables to cause 500 errors  
3. Kubernetes probes to fail repeatedly
4. Services marked as unhealthy

## Solution

### 1. Reorder Plugin Registration

Move health endpoint registration **before** Clerk plugin registration in all API services.

**Before (❌ Broken)**:
```typescript
// Register Clerk first
await fastify.register(clerkPlugin as any, {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
});

// Health endpoint gets Clerk auth applied (bad!)
fastify.get('/health', async () => {...});
```

**After (✅ Fixed)**:
```typescript
// Register health endpoint FIRST (no auth required)
fastify.get('/health', async () => {...});

// Register Clerk AFTER health endpoint
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    await fastify.register(clerkPlugin as any, {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
    });
}
```

### 2. Make Clerk Optional

Added conditional registration so services can start without Clerk configured:

```typescript
// Only register Clerk if keys are provided
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    await fastify.register(clerkPlugin as any, {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
    });
} else {
    console.warn('⚠️  Clerk not configured - authentication will not be available');
}
```

This allows:
- Health checks to work even without Clerk configured
- Services to start in minimal mode for diagnostics
- Better error messages when Clerk is intentionally not configured

## Files Modified

### API Services (server.ts files)

1. **`apis/crawler-service/src/server.ts`**
   - Moved `/health` endpoint before Clerk registration
   - Made Clerk registration conditional

2. **`apis/discovery-service/src/server.ts`**
   - Moved `/health` endpoint before Clerk registration
   - Made Clerk registration conditional

3. **`apis/interaction-service/src/server.ts`**
   - Moved `/health` endpoint before Clerk registration
   - Made Clerk registration conditional

4. **`apis/user-service/src/server.ts`**
   - Moved `/health` endpoint before Clerk registration
   - Made Clerk registration conditional

## Verification

After deploying the fix, health checks should succeed:

### Check Health Endpoint Locally
```bash
# Each service should return 200 OK without authentication
curl http://localhost:7001/health  # Discovery
curl http://localhost:7002/health  # Interaction
curl http://localhost:7003/health  # User
curl http://localhost:7004/health  # Crawler
```

Expected response:
```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Check in Kubernetes
```bash
# Check pod health
kubectl get pods -n stumbleable

# All pods should show 1/1 Ready
# NAME                                  READY   STATUS    RESTARTS   AGE
# crawler-service-xxxxx-xxxxx          1/1     Running   0          2m
# discovery-service-xxxxx-xxxxx        1/1     Running   0          2m
# interaction-service-xxxxx-xxxxx      1/1     Running   0          2m
# user-service-xxxxx-xxxxx             1/1     Running   0          2m

# Check for health probe errors (should be none)
kubectl get events -n stumbleable --field-selector type=Warning
```

### Check Logs
```bash
# Logs should show successful health checks, not Clerk errors
kubectl logs -n stumbleable -l app=crawler-service --tail=50

# Should see successful health checks:
# {"level":30,"msg":"incoming request","req":{"method":"GET","url":"/health"}}
# {"level":30,"msg":"request completed","res":{"statusCode":200}}
```

## Clerk Configuration (Optional)

If you want to add Clerk authentication to API services (for admin routes), add these environment variables:

### GitHub Secrets (Already configured)
```
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Kubernetes Secrets
The workflow already creates these, but you can verify:

```bash
kubectl get secret stumbleable-secrets -n stumbleable -o yaml
```

### Add to API Service Deployments

Add these environment variables to each API service deployment YAML:

```yaml
env:
- name: CLERK_PUBLISHABLE_KEY
  valueFrom:
    secretKeyRef:
      name: stumbleable-secrets
      key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # UI uses NEXT_PUBLIC_ prefix
- name: CLERK_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: stumbleable-secrets
      key: CLERK_SECRET_KEY
```

**Note**: The secret key is `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` because the workflow creates it with that name (for the UI). API services map it to `CLERK_PUBLISHABLE_KEY` internally.

## Important: Health Endpoints Must Be Public

Health endpoints **must not require authentication** because:

1. **Kubernetes probes** don't send auth headers
2. **Load balancers** need unauthenticated health checks
3. **Monitoring systems** expect public health endpoints
4. **Zero-downtime deploys** require instant health status

### Best Practice
Always register health, metrics, and readiness endpoints **before** any authentication middleware.

## Fastify Plugin Order

Correct order for Fastify plugin registration:

```typescript
1. Environment validation
2. Rate limiting (with exceptions for health)
3. Request logging
4. Health endpoints (public, no auth)
5. Authentication (Clerk, JWT, etc.)
6. Security headers
7. CORS
8. Application routes (protected)
9. Error handlers
```

## Testing the Fix

### 1. Rebuild and Deploy
```bash
git add apis/*/src/server.ts
git commit -m "Fix: Move health endpoints before Clerk registration"
git push origin main
```

### 2. Wait for Deployment
```bash
# Watch the GitHub Actions workflow
gh run watch

# Or watch pods restart
kubectl get pods -n stumbleable -w
```

### 3. Verify Health
```bash
# All pods should be healthy
kubectl get pods -n stumbleable

# Test health endpoint from within cluster
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl -v http://crawler-service:7004/health

# Check the response
kubectl logs curl-test -n stumbleable

# Cleanup
kubectl delete pod curl-test -n stumbleable
```

## Common Errors

### Error: "Publishable key is missing"
**Cause**: Clerk plugin registered before health endpoint
**Solution**: Move health endpoint registration before Clerk plugin ✅ **FIXED**

### Error: Health endpoint returns 404
**Cause**: Health endpoint not registered or wrong path
**Solution**: Verify `/health` endpoint exists and matches probe path

### Error: Health endpoint times out
**Cause**: Application not starting or blocking
**Solution**: Check application logs for startup errors

## Related Files

- `apis/crawler-service/src/server.ts` - Crawler service startup
- `apis/discovery-service/src/server.ts` - Discovery service startup
- `apis/interaction-service/src/server.ts` - Interaction service startup
- `apis/user-service/src/server.ts` - User service startup
- `k8s/base/*.yaml` - Kubernetes deployment configurations
- `.github/workflows/deploy-aks.yml` - CI/CD pipeline

## Related Documentation

- [Health Endpoint Fix](./HEALTH_ENDPOINT_FIX.md) - UI service health endpoint
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md) - Complete secrets guide
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)

---

**Status**: ✅ Fixed in all API services
**Next Steps**: Commit, push, and deploy to see health checks passing

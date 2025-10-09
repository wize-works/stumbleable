# Admin Dashboard Service Status Fix - Browser Environment Variables

**Date**: 2025-01-09  
**Status**: ✅ Fixed  
**Related**: ADMIN_DASHBOARD_SERVICE_STATUS_FIX.md

## Problem

The admin dashboard was showing Email Service and Scheduler Service as "Offline" even though the pods were running and healthy in Kubernetes. The browser console showed:

```
GET http://localhost:7007/health net::ERR_CONNECTION_REFUSED (Scheduler)
GET http://localhost:7006/health net::ERR_CONNECTION_REFUSED (Email)
GET https://api.stumbleable.com/user/api/admin/users/recent?days=7 404 (User)
```

### Root Causes

1. **Missing Dockerfile Build Arguments**: The UI Portal Dockerfile was not accepting `NEXT_PUBLIC_EMAIL_API_URL` and `NEXT_PUBLIC_SCHEDULER_API_URL` as build arguments
2. **Next.js Client-Side Variables**: `NEXT_PUBLIC_*` environment variables must be set at **BUILD TIME**, not just runtime
3. **Fallback to localhost**: When build-time variables are missing, the api-client.ts falls back to `localhost:7006` and `localhost:7007`

## Investigation

### Confirmed Services Are Running

```bash
kubectl get pods -n stumbleable
kubectl logs -l app=email-service -n stumbleable --tail=50
kubectl logs -l app=scheduler-service -n stumbleable --tail=50
```

Both services were healthy and responding to `/health` checks from within the cluster.

### Dockerfile Analysis

**Before** (`ui/portal/Dockerfile`):
```dockerfile
ARG NEXT_PUBLIC_DISCOVERY_API_URL
ARG NEXT_PUBLIC_INTERACTION_API_URL
ARG NEXT_PUBLIC_USER_API_URL
ARG NEXT_PUBLIC_CRAWLER_API_URL
ARG NEXT_PUBLIC_MODERATION_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_FONTAWESOME_KIT_URL
```

❌ Missing: `NEXT_PUBLIC_EMAIL_API_URL` and `NEXT_PUBLIC_SCHEDULER_API_URL`

### GitHub Actions Build Process

The `.github/workflows/deploy-aks.yml` **was already passing** the correct build args:

```yaml
build-args: |
    NEXT_PUBLIC_EMAIL_API_URL=https://api.stumbleable.com/email
    NEXT_PUBLIC_SCHEDULER_API_URL=https://api.stumbleable.com/scheduler
```

But the Dockerfile wasn't accepting them!

## Solution

### 1. Update Dockerfile Build Arguments

**File**: `ui/portal/Dockerfile`

Added missing build arguments:

```dockerfile
ARG NEXT_PUBLIC_EMAIL_API_URL
ARG NEXT_PUBLIC_SCHEDULER_API_URL

ENV NEXT_PUBLIC_EMAIL_API_URL=$NEXT_PUBLIC_EMAIL_API_URL
ENV NEXT_PUBLIC_SCHEDULER_API_URL=$NEXT_PUBLIC_SCHEDULER_API_URL
```

### 2. Verify ConfigMap Configuration

**File**: `k8s/base/configmap.yaml`

```yaml
NEXT_PUBLIC_EMAIL_API_URL: "https://api.stumbleable.com/email"
NEXT_PUBLIC_SCHEDULER_API_URL: "https://api.stumbleable.com/scheduler"
```

✅ ConfigMap is correct

### 3. Verify Deployment Configuration

**File**: `k8s/base/ui-portal.yaml`

```yaml
env:
  - name: NEXT_PUBLIC_EMAIL_API_URL
    valueFrom:
      configMapKeyRef:
        name: stumbleable-config
        key: NEXT_PUBLIC_EMAIL_API_URL
  - name: NEXT_PUBLIC_SCHEDULER_API_URL
    valueFrom:
      configMapKeyRef:
        name: stumbleable-config
        key: NEXT_PUBLIC_SCHEDULER_API_URL
```

✅ Deployment is correct (from previous fix)

## How Next.js Environment Variables Work

### Client-Side (`NEXT_PUBLIC_*` variables)

1. **Build Time**: Variables are embedded into the JavaScript bundle during `npm run build`
2. **Runtime**: Variables are NOT read from process.env in the browser
3. **Fallback**: If not set at build time, code falls back to defaults (localhost in our case)

### Example from `lib/api-client.ts`:

```typescript
const EMAIL_API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:7006';
const SCHEDULER_API_URL = process.env.NEXT_PUBLIC_SCHEDULER_API_URL || 'http://localhost:7007';
```

If `process.env.NEXT_PUBLIC_EMAIL_API_URL` is undefined at build time, it becomes:
```typescript
const EMAIL_API_URL = undefined || 'http://localhost:7006';
// Result: 'http://localhost:7006'
```

This is why runtime environment variables in Kubernetes don't help for client-side code.

## Deployment Process

To apply this fix:

1. **Commit changes** to Dockerfile
2. **Push to main branch** (triggers GitHub Actions)
3. **GitHub Actions will**:
   - Build new Docker image with proper build args
   - Push to Azure Container Registry
   - Deploy to AKS
   - New pods will have environment variables baked into the JavaScript bundle

## Verification

After deployment completes:

1. **Check service status**: Navigate to https://stumbleable.com/admin
2. **All services should show "Online"** with response times
3. **No browser console errors** about localhost connections
4. **API calls should use** `https://api.stumbleable.com/*` URLs

## Prevention

### Checklist for Adding New Services:

1. ✅ Add to `k8s/base/configmap.yaml`:
   ```yaml
   NEXT_PUBLIC_NEWSERVICE_API_URL: "https://api.stumbleable.com/newservice"
   ```

2. ✅ Add to `k8s/base/ui-portal.yaml` env section:
   ```yaml
   - name: NEXT_PUBLIC_NEWSERVICE_API_URL
     valueFrom:
       configMapKeyRef:
         name: stumbleable-config
         key: NEXT_PUBLIC_NEWSERVICE_API_URL
   ```

3. ✅ Add to `ui/portal/Dockerfile` ARG section:
   ```dockerfile
   ARG NEXT_PUBLIC_NEWSERVICE_API_URL
   ENV NEXT_PUBLIC_NEWSERVICE_API_URL=$NEXT_PUBLIC_NEWSERVICE_API_URL
   ```

4. ✅ Add to `.github/workflows/deploy-aks.yml` build-args:
   ```yaml
   NEXT_PUBLIC_NEWSERVICE_API_URL=https://api.stumbleable.com/newservice
   ```

5. ✅ Add to `lib/api-client.ts`:
   ```typescript
   const NEWSERVICE_API_URL = process.env.NEXT_PUBLIC_NEWSERVICE_API_URL || 'http://localhost:XXXX';
   ```

### Testing Locally

```bash
# Build with environment variables
docker build \
  --build-arg NEXT_PUBLIC_EMAIL_API_URL=https://api.stumbleable.com/email \
  --build-arg NEXT_PUBLIC_SCHEDULER_API_URL=https://api.stumbleable.com/scheduler \
  -t test-ui:latest \
  -f ui/portal/Dockerfile \
  ui/portal

# Verify environment variables are embedded
docker run --rm test-ui:latest node -e "console.log(process.env.NEXT_PUBLIC_EMAIL_API_URL)"
```

## Related Issues

- Previously fixed: Environment variables missing from deployment YAML (ADMIN_DASHBOARD_SERVICE_STATUS_FIX.md)
- This fix: Environment variables missing from Dockerfile build arguments

## Architecture Notes

### URL Structure

- **Frontend**: https://stumbleable.com
- **API Gateway**: https://api.stumbleable.com
- **Service Paths**: `/discovery`, `/user`, `/interaction`, `/email`, `/scheduler`, etc.
- **Full URL Example**: `https://api.stumbleable.com/email/api/health`

### Ingress Rewrite Rules

The ingress at `api.stumbleable.com` uses path rewrites:

```yaml
nginx.ingress.kubernetes.io/rewrite-target: /$2
path: /email(/|$)(.*)
```

So: `https://api.stumbleable.com/email/api/health` → forwards `/api/health` to email-service

### API Client Logic

```typescript
const EMAIL_API_URL = 'https://api.stumbleable.com/email';  // From env var
const EMAIL_API = `${EMAIL_API_URL}/api`;                    // api-client adds /api
// Result: https://api.stumbleable.com/email/api
```

Then when calling endpoints:
```typescript
fetch(`${EMAIL_API}/health`);  
// Result: https://api.stumbleable.com/email/api/health ✅
```

## Lessons Learned

1. **Always check all four places** when adding NEXT_PUBLIC variables:
   - ConfigMap
   - Deployment YAML
   - Dockerfile (ARG + ENV)
   - GitHub Actions workflow

2. **Docker build args != Runtime environment variables** for Next.js client code

3. **Test the build locally** before assuming CI/CD will work

4. **Document the full chain** so future developers understand the flow

---

**Fixed by**: GitHub Copilot  
**Verified by**: Pending deployment

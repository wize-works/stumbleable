# Health Endpoint Fix for UI Service

## Problem
Kubernetes readiness probe was failing with HTTP 404:
```
Warning  Unhealthy  kubelet  Readiness probe failed: HTTP probe failed with statuscode: 404
```

## Root Cause
The UI Portal deployment configuration (`k8s/base/ui-portal.yaml`) was configured to check `/api/health`, but this endpoint didn't exist in the Next.js application.

## Solution
Created the missing health endpoint at `ui/portal/app/api/health/route.ts`.

### Health Endpoint Implementation

**File**: `ui/portal/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'ui-portal',
        },
        { status: 200 }
    );
}
```

## Deployment Configuration

### Kubernetes Probes
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 40
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 20
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Probe Settings Explained

**Liveness Probe**:
- Checks if the container is alive
- `initialDelaySeconds: 40` - Wait 40s before first check (Next.js startup)
- `periodSeconds: 30` - Check every 30 seconds
- `failureThreshold: 3` - Restart after 3 failures

**Readiness Probe**:
- Checks if the container is ready to receive traffic
- `initialDelaySeconds: 20` - Wait 20s before first check
- `periodSeconds: 10` - Check every 10 seconds
- `failureThreshold: 3` - Mark unready after 3 failures

## Health Endpoint Status for All Services

### ✅ Services with Health Endpoints

1. **UI Portal** - `/api/health` ⬅️ **JUST ADDED**
2. **Discovery Service** - `/health`
3. **Interaction Service** - `/health`
4. **User Service** - `/health`
5. **Crawler Service** - `/health`

All API services return structured health responses:
```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Testing the Health Endpoint

### Local Development
```bash
# Start the UI server
cd ui/portal
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "service": "ui-portal"
}
```

### In Kubernetes
```bash
# Check pod health
kubectl get pods -n stumbleable

# Describe pod to see probe results
kubectl describe pod -n stumbleable -l app=ui-portal

# Test health endpoint from within cluster
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl -f http://ui-portal:3000/api/health

# Check the result
kubectl logs curl-test -n stumbleable

# Cleanup
kubectl delete pod curl-test -n stumbleable
```

## Deployment Steps

To deploy the fix:

### Option 1: Rebuild and Deploy via GitHub Actions
```bash
# Commit the new health endpoint
git add ui/portal/app/api/health/route.ts
git commit -m "Add health endpoint for UI service"
git push origin main
```

The GitHub Actions workflow will:
1. Build new Docker image with health endpoint
2. Push to ACR
3. Deploy to AKS
4. Kubernetes will detect healthy pods

### Option 2: Manual Docker Build and Deploy
```bash
# Build locally
cd ui/portal
docker build -t your-acr.azurecr.io/stumbleable-ui:latest .

# Push to ACR
az acr login --name your-acr
docker push your-acr.azurecr.io/stumbleable-ui:latest

# Restart deployment
kubectl rollout restart deployment/ui-portal -n stumbleable

# Watch rollout
kubectl rollout status deployment/ui-portal -n stumbleable
```

## Verification

After deployment, verify the health checks are passing:

```bash
# Check pod status
kubectl get pods -n stumbleable -l app=ui-portal

# Should show:
# NAME                         READY   STATUS    RESTARTS   AGE
# ui-portal-xxxxx-xxxxx       1/1     Running   0          1m

# Check events for probe failures
kubectl get events -n stumbleable --field-selector involvedObject.name=ui-portal-xxxxx-xxxxx

# No "Unhealthy" warnings should appear
```

## Common Issues

### Issue: Still Getting 404
**Cause**: Old Docker image still deployed
**Solution**: Force rebuild and restart
```bash
kubectl rollout restart deployment/ui-portal -n stumbleable
kubectl delete pod -n stumbleable -l app=ui-portal
```

### Issue: Probe Timeout
**Cause**: Next.js taking too long to start
**Solution**: Increase `initialDelaySeconds` in deployment YAML
```yaml
readinessProbe:
  initialDelaySeconds: 30  # Increase from 20
```

### Issue: Container Restarting
**Cause**: Liveness probe failing
**Solution**: Check application logs
```bash
kubectl logs -n stumbleable -l app=ui-portal --previous
```

## Related Files

- `ui/portal/app/api/health/route.ts` - Health endpoint implementation
- `k8s/base/ui-portal.yaml` - Kubernetes deployment with probes
- `.github/workflows/deploy-aks.yml` - CI/CD pipeline

## Related Documentation

- [Kubernetes Liveness/Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Docker Build Guide](./DOCKER_BUILD_GUIDE.md)

---

**Status**: ✅ Health endpoint added, ready for deployment
**Next Steps**: Commit and push to trigger CI/CD, or manually build and deploy

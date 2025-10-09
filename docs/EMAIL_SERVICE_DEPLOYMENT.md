# Email Service Deployment Guide

## Overview
This document describes the deployment configuration for the email service to Kubernetes (AKS).

## Issue
The email service was running locally but not deployed to production, causing CORS errors:
```
Access to fetch at 'http://localhost:7006/api/preferences/...' from origin 'https://stumbleable.com' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to 
the supplied origin.
```

## Solution
Deploy the email service to Kubernetes with proper CORS configuration.

## Files Created/Modified

### 1. Kubernetes Deployment: `k8s/base/email-service.yaml`
- **Created**: Complete Kubernetes deployment configuration for email service
- **Service Port**: 7006 (external) → 8080 (internal container)
- **Image**: `${ACR_NAME}.azurecr.io/stumbleable-email:${IMAGE_TAG}`
- **Replicas**: 2 (for high availability)
- **Health Checks**: Liveness and readiness probes on `/health`
- **Environment Variables**:
  - `NODE_ENV` (from ConfigMap)
  - `LOG_LEVEL` (from ConfigMap)
  - `SUPABASE_URL` (from Secret)
  - `SUPABASE_SERVICE_KEY` (from Secret)
  - `RESEND_API_KEY` (from Secret)
  - `FRONTEND_URL` (from ConfigMap) - **Critical for CORS**
  - `EMAIL_FROM_ADDRESS`: `noreply@updates.stumbleable.com`
  - `EMAIL_FROM_NAME`: `Stumbleable`

### 2. ConfigMap Update: `k8s/base/configmap.yaml`
- **Added**: `EMAIL_PORT: "7006"`
- **Added**: `EMAIL_API_URL: "http://email-service:8080"` (internal)
- **Added**: `NEXT_PUBLIC_EMAIL_API_URL: "https://api.stumbleable.com/email"` (public)
- **Added**: `FRONTEND_URL: "https://stumbleable.com"` - **Fixes CORS issue**

### 3. Ingress Update: `k8s/base/ingress.yaml`
- **Added**: Email service routing rule:
  ```yaml
  - path: /email(/|$)(.*)
    pathType: ImplementationSpecific
    backend:
      service:
        name: email-service
        port:
          number: 8080
  ```
- **Route**: `https://api.stumbleable.com/email/*` → email-service:8080

### 4. GitHub Actions Workflow: `.github/workflows/deploy-aks.yml`
- **Added**: Email service to build matrix:
  ```yaml
  - name: email
    context: ./apis/email-service
    dockerfile: ./apis/email-service/Dockerfile
  ```
- **Added**: `NEXT_PUBLIC_EMAIL_API_URL` build argument
- **Added**: `RESEND_API_KEY` to secrets creation
- **Added**: Email service deployment wait step
- **Added**: Email service smoke test

### 5. Code Fix: `apis/email-service/src/lib/queue.ts`
- **Fixed**: User preference checking to handle Clerk user IDs
- **Added**: `getUserUUID()` helper function to convert Clerk IDs to internal UUIDs
- **Changed**: Opted-out emails now marked as `'failed'` instead of `'sent'`

## Required GitHub Secrets

The following secret must be added to the GitHub repository:

1. **`RESEND_API_KEY`** - API key for Resend email service
   - Get from: https://resend.com/api-keys
   - Format: `re_...`

All other required secrets should already exist:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `CLERK_PUBLISHABLE_KEY`
- ✅ `CLERK_SECRET_KEY`
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Deployment Steps

### Option 1: Automatic (Recommended)
1. **Add `RESEND_API_KEY` to GitHub Secrets**:
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key

2. **Commit and push** all changes to `main` branch:
   ```bash
   git add .
   git commit -m "Deploy email service to Kubernetes"
   git push origin main
   ```

3. **Monitor deployment**:
   - Go to: Repository → Actions
   - Watch the "Build and Deploy to AKS" workflow
   - Should build all 7 services (ui, discovery, interaction, user, crawler, moderation, email)
   - Should deploy to AKS and run health checks

### Option 2: Manual Deployment
If you need to deploy manually (for testing):

```bash
# Login to Azure
az login

# Set cluster context
az aks get-credentials --resource-group <resource-group> --name <cluster-name>

# Update ConfigMap
envsubst < k8s/base/configmap.yaml | kubectl apply -f -

# Deploy email service
envsubst < k8s/base/email-service.yaml | kubectl apply -f -

# Update ingress
envsubst < k8s/base/ingress.yaml | kubectl apply -f -

# Check deployment
kubectl rollout status deployment/email-service -n stumbleable
kubectl get pods -n stumbleable | grep email-service
```

## Verification

### 1. Check Pod Status
```bash
kubectl get pods -n stumbleable -l app=email-service
```
Expected output:
```
NAME                             READY   STATUS    RESTARTS   AGE
email-service-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
email-service-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

### 2. Check Service
```bash
kubectl get svc -n stumbleable email-service
```
Expected output:
```
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
email-service   ClusterIP   10.x.x.x        <none>        7006/TCP   2m
```

### 3. Test Health Endpoint (Internal)
```bash
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl -f http://email-service:8080/health

kubectl logs curl-test -n stumbleable
kubectl delete pod curl-test -n stumbleable
```

Expected response:
```json
{
  "status": "healthy",
  "service": "email-service",
  "timestamp": "2025-10-09T01:30:00.000Z",
  "version": "1.0.0"
}
```

### 4. Test Health Endpoint (Public)
```bash
curl https://api.stumbleable.com/email/health
```

### 5. Test Email Preferences (Frontend)
1. Go to: https://stumbleable.com/email/preferences
2. Should load without CORS errors
3. Should display current email preferences
4. Should be able to toggle preferences and save

### 6. Check Logs
```bash
# Get pod name
POD_NAME=$(kubectl get pods -n stumbleable -l app=email-service -o jsonpath='{.items[0].metadata.name}')

# View logs
kubectl logs -n stumbleable $POD_NAME -f
```

## CORS Configuration

The email service now properly handles CORS:

### Development (Local)
```typescript
// src/server.ts
await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
});
```

### Production (Kubernetes)
- `FRONTEND_URL` environment variable set to `https://stumbleable.com`
- CORS origin will be `https://stumbleable.com`
- Ingress also has CORS annotations for additional protection

## Architecture

```
Browser (https://stumbleable.com)
  ↓
Ingress (api.stumbleable.com/email)
  ↓
Kubernetes Service (email-service:7006)
  ↓
Pod (container:8080)
  ↓
Email Service App
  ↓
Resend API (send emails)
```

## Troubleshooting

### Issue: Pods not starting
```bash
kubectl describe pod <pod-name> -n stumbleable
kubectl logs <pod-name> -n stumbleable
```

Common causes:
- Missing `RESEND_API_KEY` secret
- Image pull errors
- Health check failures

### Issue: Still getting CORS errors
1. **Check ConfigMap**: Verify `FRONTEND_URL` is set correctly
   ```bash
   kubectl get configmap stumbleable-config -n stumbleable -o yaml
   ```

2. **Check pod environment**: Verify env vars are loaded
   ```bash
   kubectl exec -n stumbleable <pod-name> -- env | grep FRONTEND_URL
   ```

3. **Restart pods** to pick up new config:
   ```bash
   kubectl rollout restart deployment/email-service -n stumbleable
   ```

### Issue: 502 Bad Gateway
- Health check may be failing
- Check pod logs for errors
- Verify service is listening on port 8080
- Verify health endpoint responds

### Issue: Email service not receiving requests
1. **Check ingress**: 
   ```bash
   kubectl get ingress -n stumbleable
   kubectl describe ingress stumbleable-api-ingress -n stumbleable
   ```

2. **Test service directly**:
   ```bash
   kubectl port-forward -n stumbleable svc/email-service 7006:7006
   curl http://localhost:7006/health
   ```

## Email Queue Processing

The email service runs a background queue processor:
- **Interval**: Every 60 seconds
- **Batch size**: 10 emails per cycle
- **Retry logic**: Up to 3 attempts for failed emails
- **Preference checking**: Now properly handles Clerk user IDs

## Monitoring

### Queue Status
```bash
# From inside cluster
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl http://email-service:8080/api/queue/status
```

### Recent Queue Items
```bash
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl 'http://email-service:8080/api/queue/items?limit=10'
```

## Next Steps

After deployment:

1. ✅ Verify CORS errors are resolved
2. ✅ Test email preference loading
3. ✅ Test email preference updates
4. ✅ Send a test email to verify Resend integration
5. ✅ Monitor queue processing
6. ✅ Check email logs in Supabase

## References

- [Email Queue Management](./EMAIL_QUEUE_MANAGEMENT.md)
- [Kubernetes Architecture](../README.md#kubernetes--docker-standards)
- [Service Development Standards](../.github/copilot-instructions.md#service-development-standards)

# SERVICE_TOKEN Configuration Guide

## Overview

SERVICE_TOKEN is a shared secret used for service-to-service authentication when services communicate with the scheduler-service. This prevents unauthorized external services from registering or triggering scheduled jobs.

## Security Implementation

### How It Works

1. **Scheduler Service** (validator):
   - Reads `SERVICE_TOKEN` from environment
   - Validates incoming requests have matching `X-Service-Token` header
   - Rejects requests with invalid/missing tokens (when configured)

2. **Client Services** (senders):
   - User Service: Registers deletion-cleanup job with scheduler
   - Email Service: Registers email jobs (weekly-digest, re-engagement, queue-cleanup) with scheduler
   - Include `X-Service-Token: <token>` header when calling scheduler endpoints

### Development Mode

In development (when `SERVICE_TOKEN` is not set):
- ⚠️ Warning logged: "SERVICE_TOKEN not configured - allowing all service-to-service calls"
- All requests are allowed (convenient for local development)
- No authentication required

### Production Mode

In production (when `SERVICE_TOKEN` is set):
- ✅ Authentication required
- Requests without valid token are rejected with 401 Unauthorized
- All service-to-service calls are authenticated

## Setup Instructions

### 1. Generate SERVICE_TOKEN

Generate a secure random GUID/token:

**PowerShell:**
```powershell
[guid]::NewGuid().ToString()
```

**Linux/Mac:**
```bash
uuidgen
```

**Node.js:**
```javascript
require('crypto').randomUUID()
```

**OpenSSL (more secure):**
```bash
openssl rand -hex 32
```

### 2. Add to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SERVICE_TOKEN`
5. Value: Your generated GUID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
6. Click **Add secret**

### 3. Deployment Configuration

The following files have been configured to use SERVICE_TOKEN:

#### GitHub Actions Workflow
`.github/workflows/deploy-aks.yml`:
- Adds `SERVICE_TOKEN` to Kubernetes secrets
- Secret is automatically deployed to AKS cluster

#### Kubernetes Deployments

**Scheduler Service** (`k8s/base/scheduler-service.yaml`):
```yaml
env:
  - name: SERVICE_TOKEN
    valueFrom:
      secretKeyRef:
        name: stumbleable-secrets
        key: SERVICE_TOKEN
```

**User Service** (`k8s/base/user-service.yaml`):
```yaml
env:
  - name: SERVICE_TOKEN
    valueFrom:
      secretKeyRef:
        name: stumbleable-secrets
        key: SERVICE_TOKEN
  - name: SCHEDULER_API_URL
    value: "http://scheduler-service:7007"
```

**Email Service** (`k8s/base/email-service.yaml`):
```yaml
env:
  - name: SERVICE_TOKEN
    valueFrom:
      secretKeyRef:
        name: stumbleable-secrets
        key: SERVICE_TOKEN
  - name: SCHEDULER_API_URL
    value: "http://scheduler-service:7007"
```

#### Application Code

**User Service** (`apis/user-service/src/server.ts`):
```typescript
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (process.env.SERVICE_TOKEN) {
    headers['X-Service-Token'] = process.env.SERVICE_TOKEN;
}

const response = await fetch(`${SCHEDULER_API_URL}/api/jobs/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(job),
});
```

**Email Service** (`apis/email-service/src/server.ts`):
```typescript
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (process.env.SERVICE_TOKEN) {
    headers['X-Service-Token'] = process.env.SERVICE_TOKEN;
}

const response = await fetch(`${SCHEDULER_API_URL}/api/jobs/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(job),
});
```

## Verification

### Check Deployment
```bash
kubectl get secret stumbleable-secrets -n stumbleable -o jsonpath='{.data.SERVICE_TOKEN}' | base64 -d
```

### Check Service Logs
After deployment, check logs for authentication:

```bash
# Should NOT see warning in production
kubectl logs -n stumbleable -l app=scheduler-service --tail=50 | grep SERVICE_TOKEN

# Should see successful job registration
kubectl logs -n stumbleable -l app=user-service --tail=50 | grep "Registered job"
kubectl logs -n stumbleable -l app=email-service --tail=50 | grep "Registered job"
```

## Troubleshooting

### Warning: "SERVICE_TOKEN not configured"
**Cause**: Environment variable not set  
**Solution**: 
- Development: This is expected and safe
- Production: Add SERVICE_TOKEN to GitHub Secrets and redeploy

### Error: "Invalid service token" (401)
**Cause**: Token mismatch between services  
**Solution**: 
1. Verify same token in all service environments
2. Check Kubernetes secret: `kubectl describe secret stumbleable-secrets -n stumbleable`
3. Redeploy services to pick up updated secret

### Jobs not registering
**Cause**: Missing SERVICE_TOKEN header or wrong URL  
**Solution**:
1. Check service logs for registration errors
2. Verify SCHEDULER_API_URL environment variable
3. Ensure SERVICE_TOKEN is set in calling service

## Security Best Practices

1. ✅ **Use strong random tokens**: UUID/GUID or 32+ character hex string
2. ✅ **Rotate regularly**: Update token periodically (every 90 days recommended)
3. ✅ **Never commit to git**: Always use secrets management
4. ✅ **Different per environment**: Use different tokens for dev/staging/prod
5. ✅ **Limit access**: Only GitHub admins should access the secret value

## Future Enhancements

Consider implementing:
- Token rotation mechanism
- Per-service tokens (instead of shared)
- JWT-based service authentication
- mTLS for service-to-service communication
- Rate limiting on scheduler endpoints

## Related Files

- `.github/workflows/deploy-aks.yml` - GitHub Actions deployment
- `k8s/base/scheduler-service.yaml` - Scheduler Kubernetes config
- `k8s/base/user-service.yaml` - User service Kubernetes config
- `k8s/base/email-service.yaml` - Email service Kubernetes config
- `apis/scheduler-service/src/middleware/auth.ts` - Authentication middleware
- `apis/user-service/src/server.ts` - User service job registration
- `apis/email-service/src/server.ts` - Email service job registration

---

**Last Updated**: October 9, 2025  
**Status**: ✅ Configured and ready for deployment

# Scheduler-Service Deployment Configuration

## Overview
Complete deployment configuration for the scheduler-service following Stumbleable's microservices deployment patterns.

## Files Created/Updated

### ✅ Kubernetes Deployment Files

**Created: `k8s/base/scheduler-service.yaml`**
- **Replicas**: 1 (single instance to avoid duplicate cron executions)
- **Strategy**: `Recreate` (ensures only one scheduler instance at a time)
- **Container Port**: 8080 (internal)
- **Service Port**: 7007 (external)
- **Resource Limits**: 
  - Memory: 128Mi (request) / 256Mi (limit)
  - CPU: 100m (request) / 200m (limit)
- **Health Probes**: 
  - Liveness: `/health` endpoint
  - Readiness: `/health` endpoint
- **Environment Variables**:
  - `SUPABASE_URL` (from secrets)
  - `SUPABASE_SERVICE_KEY` (from secrets)
  - `EMAIL_SERVICE_URL` (http://email-service:7006)
  - `CRAWLER_SERVICE_URL` (http://crawler-service:7004)
  - `DISCOVERY_SERVICE_URL` (http://discovery-service:7001)
  - `INTERACTION_SERVICE_URL` (http://interaction-service:7002)

### ✅ ConfigMap Updates

**Updated: `k8s/base/configmap.yaml`**
- Added `SCHEDULER_PORT: "7007"`
- Added `SCHEDULER_API_URL: "http://scheduler-service:8080"` (internal)
- Added `NEXT_PUBLIC_SCHEDULER_API_URL: "https://api.stumbleable.com/scheduler"` (public)

### ✅ Ingress Updates

**Updated: `k8s/base/ingress.yaml`**
- Added scheduler route: `/scheduler(/|$)(.*)`
- Maps to: `scheduler-service:8080`
- Public URL: `https://api.stumbleable.com/scheduler/*`
- Note: Marked as admin-only in comments (consider IP whitelist for production)

### ✅ GitHub Actions Workflow

**Updated: `.github/workflows/deploy-aks.yml`**

**Build Matrix Addition:**
```yaml
- name: scheduler
  context: ./apis/scheduler-service
  dockerfile: ./apis/scheduler-service/Dockerfile
```

**Build Args Addition:**
```yaml
NEXT_PUBLIC_SCHEDULER_API_URL=https://api.stumbleable.com/scheduler
```

**Deployment Rollout Check:**
```bash
kubectl rollout status deployment/scheduler-service -n ${{ env.NAMESPACE }} --timeout=5m
```

**Smoke Test:**
```bash
kubectl run curl-test-scheduler --image=curlimages/curl:latest --restart=Never -n ${{ env.NAMESPACE }} -- \
  curl -f http://scheduler-service:7007/health || true
```

## Service Architecture

### Port Mapping
- **Container Internal**: 8080 (all services use this internally)
- **Kubernetes Service**: 7007 (logical port for service-to-service communication)
- **Public Ingress**: `https://api.stumbleable.com/scheduler` (external access)

### Network Flow
```
External Request → Ingress (HTTPS) → Service (7007) → Pod (8080) → App
                   api.stumbleable.com/scheduler
```

Internal Service-to-Service:
```
email-service → http://scheduler-service:7007/api/jobs/register
scheduler-service → http://email-service:7006/api/jobs/weekly-digest
```

## Deployment Strategy

### Single Instance Design
The scheduler uses `replicas: 1` with `strategy: Recreate` to ensure:
1. **No duplicate job executions** - Only one scheduler runs cron jobs
2. **Clean transitions** - Old pod shuts down before new one starts
3. **Consistent state** - Database-backed job tracking survives restarts

### Zero-Downtime Considerations
Since the scheduler triggers jobs on a schedule (not serving real-time requests):
- Brief downtime during deployments is acceptable
- Job registration happens on service startup
- Missed cron triggers will execute on next schedule

## Environment Variables Required

### In Kubernetes Secrets (`stumbleable-secrets`)
- `SUPABASE_URL` - Already exists ✅
- `SUPABASE_SERVICE_KEY` - Already exists ✅

### In ConfigMap (`stumbleable-config`)
- `SCHEDULER_PORT: "7007"` - Added ✅
- `SCHEDULER_API_URL` - Added ✅
- `NEXT_PUBLIC_SCHEDULER_API_URL` - Added ✅

### Service-to-Service URLs (hardcoded in deployment)
- `EMAIL_SERVICE_URL=http://email-service:7006`
- `CRAWLER_SERVICE_URL=http://crawler-service:7004`
- `DISCOVERY_SERVICE_URL=http://discovery-service:7001`
- `INTERACTION_SERVICE_URL=http://interaction-service:7002`

## Deployment Commands

### First-Time Deployment
```bash
# Apply ConfigMap changes
kubectl apply -f k8s/base/configmap.yaml

# Deploy scheduler service
kubectl apply -f k8s/base/scheduler-service.yaml

# Verify deployment
kubectl get pods -n stumbleable | grep scheduler
kubectl logs -f deployment/scheduler-service -n stumbleable

# Check health
kubectl run curl-test --rm -it --image=curlimages/curl -- \
  curl http://scheduler-service:7007/health
```

### CI/CD Deployment
Automatic deployment via GitHub Actions when pushing to `main` or `develop` branches:
1. Builds Docker image: `stumbleable-scheduler:latest`
2. Pushes to Azure Container Registry
3. Applies Kubernetes manifests
4. Waits for rollout completion
5. Runs smoke tests

## Monitoring & Verification

### Health Check
```bash
# Internal (from within cluster)
curl http://scheduler-service:7007/health

# External (via ingress)
curl https://api.stumbleable.com/scheduler/health
```

### Check Registered Jobs
```bash
# From within cluster
curl http://scheduler-service:7007/api/jobs

# From portal admin UI
https://stumbleable.com/admin/scheduler
```

### View Logs
```bash
# Real-time logs
kubectl logs -f deployment/scheduler-service -n stumbleable

# Last 100 lines
kubectl logs deployment/scheduler-service -n stumbleable --tail=100

# Filter for job execution
kubectl logs deployment/scheduler-service -n stumbleable | grep "execution"
```

### Database Verification
```sql
-- Check registered jobs
SELECT * FROM job_schedules;

-- Check recent executions
SELECT * FROM scheduled_jobs 
ORDER BY started_at DESC 
LIMIT 10;

-- Check job statistics
SELECT job_name, total_runs, successful_runs, failed_runs 
FROM job_schedules 
WHERE enabled = true;
```

## Security Considerations

### Admin-Only Access
The scheduler service should be restricted to admin users:
1. **Ingress**: Consider adding IP whitelist or authentication
2. **Frontend**: Admin UI checks user roles via Clerk
3. **Service Mesh**: Consider mTLS for service-to-service communication

### Job Registration Security
Services register jobs on startup without authentication (internal traffic):
- Services can only register their own jobs
- Job execution is controlled by scheduler
- Database tracks who triggered manual executions

## Scaling Considerations

### Current: Single Instance
- **Pros**: No duplicate cron executions, simple state management
- **Cons**: Single point of failure (mitigated by Kubernetes restart policies)

### Future: Multi-Instance (if needed)
Would require:
1. **Leader election** - One instance runs cron, others standby
2. **Distributed locks** - Prevent duplicate job triggers
3. **State synchronization** - Share job registration across instances

For now, single instance is appropriate given:
- Low resource usage (128Mi RAM, 100m CPU)
- Fast startup (< 10 seconds)
- Database-backed job tracking (survives restarts)
- Non-critical workload (missed cron triggers recover on next schedule)

## Rollback Procedure

If scheduler deployment fails:
```bash
# Rollback to previous version
kubectl rollout undo deployment/scheduler-service -n stumbleable

# Check rollout status
kubectl rollout status deployment/scheduler-service -n stumbleable

# View rollout history
kubectl rollout history deployment/scheduler-service -n stumbleable
```

## Integration Testing

After deployment, verify:
1. ✅ Service health endpoint responds
2. ✅ Email service registers 3 jobs (weekly-digest, re-engagement, queue-cleanup)
3. ✅ Jobs appear in admin UI
4. ✅ Manual job trigger works
5. ✅ Cron execution triggers jobs at scheduled time
6. ✅ Execution history recorded in database

## Next Steps

1. **Deploy to staging** - Test full deployment flow
2. **Verify job registration** - Check all services register correctly
3. **Monitor first cron execution** - Ensure jobs run at scheduled time
4. **Add more jobs** - Register crawler jobs, analytics jobs, etc.
5. **Set up alerting** - Monitor job failures and execution times
6. **Document runbooks** - Create troubleshooting guides for common issues

---

**Status**: ✅ Ready for deployment  
**Last Updated**: October 8, 2025  
**Author**: AI Assistant

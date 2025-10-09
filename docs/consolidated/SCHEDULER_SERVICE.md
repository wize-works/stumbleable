# Scheduler Service - Complete Documentation

**Last Updated:** October 9, 2025  
**Service Port:** 7005  
**Status:** ✅ Production Ready

> **Purpose:** The Scheduler Service manages background jobs for content crawling, metadata enhancement, email notifications, and system maintenance. It provides a hybrid approach with both manual triggering via admin UI and automatic scheduling capabilities.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Job Types](#job-types)
- [Deployment](#deployment)
- [Admin UI Integration](#admin-ui-integration)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Testing & Monitoring](#testing--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Design Philosophy

The Scheduler Service follows a **hybrid approach**:
- **Manual Triggering:** Admins can start jobs on-demand via the dashboard
- **Automatic Scheduling:** Jobs can run on configurable schedules (future enhancement)
- **Service Independence:** Each job calls other services (crawler, email, user) via HTTP
- **State Tracking:** All job executions tracked in `scheduled_jobs` table

### Architecture Alignment

The service follows Stumbleable's microservices patterns:
- **Container Port:** 8080 (internal)
- **Service Port:** 7005 (external K8s)
- **Host Binding:** `0.0.0.0` for K8s health probes
- **API Prefix:** `/api` for all endpoints
- **Health Endpoint:** `/health` (no prefix)
- **Database:** Supabase PostgreSQL
- **Authentication:** Clerk integration via service key

### Service Communication

```typescript
Scheduler Service (7005)
  ├─> Crawler Service (7004) - POST /api/crawl/batch
  ├─> Email Service (7006) - POST /api/send
  ├─> User Service (7003) - GET /api/users/:clerkId
  └─> Discovery Service (7001) - Various endpoints
```

---

## Database Schema

### `scheduled_jobs` Table

Tracks all job executions with detailed status and results:

```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,              -- e.g., 'crawl_pending', 'weekly_digest'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_by TEXT,                      -- Clerk user ID who triggered the job
  error TEXT,                          -- Error message if failed
  result JSONB,                        -- Job-specific results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX idx_scheduled_jobs_job_type ON scheduled_jobs(job_type);
CREATE INDEX idx_scheduled_jobs_started_by ON scheduled_jobs(started_by);
CREATE INDEX idx_scheduled_jobs_created_at ON scheduled_jobs(created_at DESC);
```

### Job Result Structure

The `result` JSONB field stores job-specific outcomes:

```typescript
interface JobResult {
  success: boolean;
  itemsProcessed?: number;
  errors?: string[];
  details?: Record<string, any>;
}

// Example for crawl job:
{
  "success": true,
  "itemsProcessed": 150,
  "errors": [],
  "details": {
    "successfulCrawls": 145,
    "failedCrawls": 5,
    "duration": "45s"
  }
}
```

---

## Job Types

### 1. Content Crawling Jobs

**Job Type:** `crawl_pending`

Crawls URLs in the `discoveries` table that have `crawl_status = 'pending'`:

```typescript
// Workflow:
1. Query discoveries WHERE crawl_status = 'pending' LIMIT 100
2. Send batch to Crawler Service: POST /api/crawl/batch
3. Crawler updates each discovery with metadata
4. Return result with success count
```

**Typical Use Cases:**
- Process newly submitted content
- Re-crawl stale content
- Refresh metadata for existing content

**Admin Trigger:** "Crawl Pending Content" button in Admin Dashboard

---

### 2. Email Notification Jobs

**Job Type:** `weekly_digest`, `submission_notifications`, `moderation_updates`

Sends bulk emails via the Email Service:

```typescript
// Weekly Digest Workflow:
1. Query active users with email preferences enabled
2. For each user:
   - Get personalized content recommendations
   - Format email template with user's name and content
3. Send batch to Email Service: POST /api/send
4. Track delivery status and failures
```

**Admin Trigger:** "Send Weekly Digest" button (future)

---

### 3. Maintenance Jobs

**Job Type:** `cleanup_old_data`, `update_metrics`, `recalculate_trending`

System maintenance and optimization tasks:

```typescript
// Cleanup Job Example:
1. Delete user_interactions older than 2 years
2. Archive completed scheduled_jobs older than 90 days
3. Update discovery view counts
4. Recalculate trending scores
```

**Admin Trigger:** Manual or automatic (nightly)

---

## Deployment

### Multi-Stage Dockerfile

The service uses a standardized multi-stage build:

```dockerfile
# Stage 1: Dependencies (production only)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Builder (compile TypeScript)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner (final image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

**Key Points:**
- ✅ Builds `dist/` folder during image creation (not in repo)
- ✅ Production dependencies only in final image
- ✅ Matches pattern of all other services
- ✅ Exposes port 8080 for K8s compatibility

### Kubernetes Deployment

**File:** `k8s/base/scheduler-service.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scheduler-service
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: scheduler-service
        image: stumbleable.azurecr.io/scheduler-service:latest
        ports:
        - containerPort: 8080  # Internal container port
        env:
        - name: PORT
          value: "8080"
        - name: HOST
          value: "0.0.0.0"  # Critical for K8s health probes
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: CLERK_SECRET_KEY
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: SUPABASE_URL
        - name: SUPABASE_SERVICE_KEY
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: SUPABASE_SERVICE_KEY
        - name: CRAWLER_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: stumbleable-config
              key: CRAWLER_SERVICE_URL
        - name: EMAIL_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: stumbleable-config
              key: EMAIL_SERVICE_URL
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: scheduler-service
spec:
  type: ClusterIP
  ports:
  - port: 7005        # External service port
    targetPort: 8080  # Maps to container port
    protocol: TCP
  selector:
    app: scheduler-service
```

**Port Mapping:**
- External requests: `scheduler-service:7005`
- K8s routes to: Container port `8080`
- App listens on: `0.0.0.0:8080`

### GitHub Actions Deployment

The service deploys automatically via `.github/workflows/deploy-aks.yml`:

```yaml
- name: Build and push scheduler-service
  run: |
    cd apis/scheduler-service
    docker build -t ${{ env.ACR_NAME }}.azurecr.io/scheduler-service:${{ github.sha }} .
    docker tag ${{ env.ACR_NAME }}.azurecr.io/scheduler-service:${{ github.sha }} \
               ${{ env.ACR_NAME }}.azurecr.io/scheduler-service:latest
    docker push ${{ env.ACR_NAME }}.azurecr.io/scheduler-service:${{ github.sha }}
    docker push ${{ env.ACR_NAME }}.azurecr.io/scheduler-service:latest
```

---

## Admin UI Integration

### Dashboard Integration

The Scheduler Service is integrated into the Admin Dashboard at `/admin`:

**UI Components:**
- **Job Status Panel:** Shows recent jobs, current running jobs, and success/failure rates
- **Manual Triggers:** Buttons to start specific jobs on-demand
- **Job History:** Table of past executions with filters by type/status/date
- **Real-time Updates:** WebSocket or polling for live job status

### Manual Job Triggering

**Frontend Code:**
```typescript
// app/admin/components/SchedulerPanel.tsx
const triggerCrawlJob = async () => {
  const response = await fetch(`${SCHEDULER_API}/api/jobs/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getToken()}`
    },
    body: JSON.stringify({
      jobType: 'crawl_pending',
      triggeredBy: user.id
    })
  });
  
  const job = await response.json();
  // Poll for job completion
  monitorJob(job.id);
};
```

**Backend Endpoint:**
```typescript
// POST /api/jobs/trigger
app.post('/jobs/trigger', async (request, reply) => {
  const { jobType, triggeredBy } = request.body;
  
  // Create job record
  const job = await createJob({ jobType, startedBy: triggeredBy });
  
  // Execute job asynchronously
  executeJob(job.id, jobType).catch(handleError);
  
  return { jobId: job.id, status: 'running' };
});
```

### UI Enhancements

**Recent Additions:**
- ✅ Visual status indicators (running = spinner, success = green checkmark, failed = red X)
- ✅ Estimated completion time based on historical data
- ✅ Job cancellation button (for long-running jobs)
- ✅ Detailed error messages with retry button
- ✅ Job logs viewer with real-time streaming

---

## Authentication

### Clerk Integration

The Scheduler Service authenticates admin requests via Clerk:

```typescript
// src/lib/auth.ts
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function verifyAdmin(clerkUserId: string): Promise<boolean> {
  const user = await clerkClient.users.getUser(clerkUserId);
  return user.publicMetadata.role === 'admin';
}

// Middleware
app.addHook('preHandler', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({ error: 'Missing authorization' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const session = await clerkClient.sessions.verifySession(token);
  
  if (!await verifyAdmin(session.userId)) {
    return reply.code(403).send({ error: 'Admin access required' });
  }
  
  request.userId = session.userId;
});
```

### User ID Resolution Fix

**Issue:** Scheduler jobs were triggered with Clerk IDs, but needed internal UUIDs.

**Solution:**
```typescript
// Convert Clerk ID to internal UUID
const resolveUserId = async (clerkId: string): Promise<string> => {
  const response = await fetch(`${USER_SERVICE_URL}/api/users/${clerkId}`);
  const user = await response.json();
  return user.id; // Internal UUID
};

// Use in job creation
const job = await createJob({
  jobType: 'crawl_pending',
  startedBy: await resolveUserId(request.userId)
});
```

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "scheduler-service",
  "timestamp": "2025-10-09T12:34:56Z"
}
```

### Trigger Job

```http
POST /api/jobs/trigger
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  "jobType": "crawl_pending",
  "triggeredBy": "user_2abc123"
}
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "startedAt": "2025-10-09T12:34:56Z"
}
```

### Get Job Status

```http
GET /api/jobs/:jobId
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "crawl_pending",
  "status": "completed",
  "startedAt": "2025-10-09T12:34:56Z",
  "completedAt": "2025-10-09T12:35:42Z",
  "result": {
    "success": true,
    "itemsProcessed": 150,
    "errors": []
  }
}
```

### List Jobs

```http
GET /api/jobs?type=crawl_pending&status=completed&limit=50
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "...",
      "jobType": "crawl_pending",
      "status": "completed",
      "startedAt": "...",
      "completedAt": "...",
      "result": { ... }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

## Testing & Monitoring

### Local Testing

```bash
# Start the service locally
cd apis/scheduler-service
npm run dev

# Trigger a test job
curl -X POST http://localhost:7005/api/jobs/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"jobType":"crawl_pending","triggeredBy":"test_user"}'

# Check job status
curl http://localhost:7005/api/jobs/<job-id> \
  -H "Authorization: Bearer <test-token>"
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:7005/health

# Expected response:
# {"status":"healthy","service":"scheduler-service","timestamp":"..."}
```

### Production Monitoring

**Key Metrics to Track:**
- Job success/failure rate
- Average job execution time
- Queue depth (pending jobs)
- Error rate by job type
- Service uptime

**Recommended Tools:**
- **Logs:** Kubernetes logs via `kubectl logs`
- **Metrics:** Prometheus + Grafana
- **Alerts:** Alert on job failures, long execution times, service downtime

---

## Troubleshooting

### Common Issues

#### 1. Docker Build Fails: `/dist: not found`

**Problem:** Old Dockerfile tried to COPY dist folder that doesn't exist in repo.

**Solution:** Use multi-stage build that runs `npm run build` in builder stage.

**Fix Applied:** Updated Dockerfile (see Deployment section)

---

#### 2. TypeScript Compilation Error: `Type 'unknown' not assignable to 'JobResult'`

**Problem:** `response.json()` returns `unknown`, can't assign to `JobResult` type.

**Solution:** Use type assertion syntax:

```typescript
// ❌ WRONG
const result: JobResult = await response.json();

// ✅ CORRECT
const result = await response.json() as JobResult;
```

**Fixed In:** `src/lib/scheduler.ts` line 238

---

#### 3. Kubernetes Health Probes Fail

**Problem:** Service bound to `127.0.0.1`, K8s probes can't connect.

**Solution:** Bind to `0.0.0.0`:

```typescript
const host = process.env.HOST || '0.0.0.0';
await app.listen({ port: 8080, host });
```

**Verification:**
```bash
kubectl logs scheduler-service-xxx | grep "listening"
# Should show: Server listening on 0.0.0.0:8080
```

---

#### 4. Jobs Stuck in "Running" Status

**Symptoms:** Job starts but never completes or fails.

**Debugging:**
```bash
# Check service logs
kubectl logs -f deployment/scheduler-service

# Check job record in database
psql -c "SELECT * FROM scheduled_jobs WHERE status = 'running' ORDER BY started_at DESC LIMIT 10;"
```

**Common Causes:**
- Target service (crawler, email) is down
- Network timeout not configured
- Job logic has infinite loop

**Solutions:**
- Add timeout to HTTP requests (30-60 seconds)
- Implement job heartbeat mechanism
- Add max execution time check

---

#### 5. Authentication Failures

**Symptoms:** 401 Unauthorized or 403 Forbidden errors.

**Debugging:**
```bash
# Verify Clerk secret is set
kubectl get secret stumbleable-secrets -o json | jq '.data.CLERK_SECRET_KEY' | base64 -d

# Check if user has admin role
curl https://api.clerk.dev/v1/users/<user-id> \
  -H "Authorization: Bearer <clerk-secret>"
```

**Solutions:**
- Ensure `CLERK_SECRET_KEY` is correct
- Verify user has `role: admin` in publicMetadata
- Check token is not expired

---

## Future Enhancements

### Automatic Scheduling

Add cron-like scheduling for recurring jobs:

```typescript
// Future implementation
const schedule = {
  'crawl_pending': '*/15 * * * *',    // Every 15 minutes
  'weekly_digest': '0 9 * * MON',     // Mondays at 9am
  'cleanup_old_data': '0 2 * * *'     // Daily at 2am
};
```

### Job Prioritization

Implement priority queue for urgent jobs:

```typescript
interface JobPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

// Process HIGH priority jobs first
```

### Distributed Job Execution

Scale to multiple scheduler instances with job locking:

```sql
-- Add lock column
ALTER TABLE scheduled_jobs ADD COLUMN locked_by TEXT;
ALTER TABLE scheduled_jobs ADD COLUMN locked_at TIMESTAMPTZ;

-- Acquire lock before processing
UPDATE scheduled_jobs 
SET locked_by = 'instance-123', locked_at = NOW()
WHERE id = '...' AND locked_by IS NULL;
```

---

## Related Documentation

- **Admin Dashboard:** [ADMIN_DASHBOARD_IMPLEMENTATION.md](../ADMIN_DASHBOARD_IMPLEMENTATION.md)
- **Crawler Service:** [ADMIN_CRAWLER_UI_COMPLETE.md](../ADMIN_CRAWLER_UI_COMPLETE.md)
- **Email Service:** [consolidated/EMAIL_SERVICE.md](./EMAIL_SERVICE.md)
- **Architecture:** [ARCHITECTURE_DECISION_CONTENT_ROUTE.md](../ARCHITECTURE_DECISION_CONTENT_ROUTE.md)

---

**Maintenance:** This document consolidates 9+ separate scheduler-related docs. For historical details, see `docs/archive/scheduler/`.

**Last Updated:** October 9, 2025  
**Maintainer:** Development Team

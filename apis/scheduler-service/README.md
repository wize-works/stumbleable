# Scheduler Service

Centralized cron scheduler for managing scheduled jobs across all Stumbleable services.

## Overview

The scheduler service manages scheduled tasks for the entire Stumbleable platform. Instead of each service implementing its own cron logic, they register jobs with the scheduler service, which handles:

- ⏰ **Cron-based scheduling** with flexible expressions
- 📊 **Execution tracking** with detailed metrics
- 🎛️ **Admin UI** for managing all jobs
- 🔄 **Job triggering** via HTTP endpoints
- 📈 **Statistics & history** for monitoring

## Architecture

```
┌─────────────────────────────────────────┐
│         Scheduler Service               │
│  - Job Registry                         │
│  - Cron Management (node-cron)          │
│  - Execution Tracking                   │
│  - Admin API                            │
└──────────────┬──────────────────────────┘
               │
               │ HTTP Triggers
               │
    ┌──────────┼──────────┬──────────────┐
    │          │          │              │
    ▼          ▼          ▼              ▼
┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
│ Email  │ │Crawler │ │Analytics│ │  Other   │
│Service │ │Service │ │Service  │ │ Services │
└────────┘ └────────┘ └─────────┘ └──────────┘
```

## How It Works

1. **Services register jobs** on startup via `POST /api/jobs/register`
2. **Scheduler stores** job config in `job_schedules` table
3. **Cron triggers** execute jobs on schedule
4. **HTTP calls** to service endpoints perform actual work
5. **Execution tracking** records results in `scheduled_jobs` table
6. **Admin UI** provides visibility and manual controls

## Environment Variables

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Service URLs for job triggering
EMAIL_SERVICE_URL=http://localhost:7006
CRAWLER_SERVICE_URL=http://localhost:7004
# ... add URLs for other services

# Optional
PORT=8080
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

## API Endpoints

### Job Management
- `POST /api/jobs/register` - Register a new job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:jobName` - Get job details
- `POST /api/jobs/:jobName/trigger` - Manually trigger job
- `POST /api/jobs/:jobName/enable` - Enable job
- `POST /api/jobs/:jobName/disable` - Disable job
- `DELETE /api/jobs/:jobName` - Delete job
- `PUT /api/jobs/:jobName/cron` - Update cron expression

### Monitoring
- `GET /api/jobs/:jobName/history` - Execution history (paginated)
- `GET /api/jobs/:jobName/stats` - Execution statistics
- `GET /health` - Service health check

## Job Registration Example

Services register jobs on startup:

```typescript
// email-service registration
await fetch('http://scheduler-service:7007/api/jobs/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'weekly-digest',
    displayName: 'Weekly Digest',
    description: 'Send weekly trending content to users',
    cronExpression: '0 9 * * 1', // Monday 9 AM
    enabled: true,
    jobType: 'email',
    service: 'email-service',
    endpoint: '/api/jobs/weekly-digest',
    config: {
      batchSize: 100,
      maxUsers: 10000,
    },
  }),
});
```

## Job Endpoint Contract

Services must implement job endpoints that:

1. Accept `POST` requests
2. Receive `JobContext` in body:
```typescript
{
  jobName: string;
  config: Record<string, any>;
  executionId: string;
  triggeredBy: 'scheduler' | 'manual' | 'admin';
  triggeredByUser?: string;
}
```

3. Return `JobResult`:
```typescript
{
  success: boolean;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  error?: string;
  metadata?: Record<string, any>;
}
```

## Database Schema

### `job_schedules`
Stores job configuration:
- `job_name` (PK) - Unique job identifier
- `display_name` - Human-readable name
- `description` - Job purpose
- `cron_expression` - Schedule
- `enabled` - Active status
- `job_type` - Category
- `service` - Owning service
- `endpoint` - HTTP endpoint to trigger
- `config` - JSON configuration
- `last_run_at`, `next_run_at` - Schedule tracking
- `total_runs`, `successful_runs`, `failed_runs` - Statistics

### `scheduled_jobs`
Tracks execution history:
- `id` (UUID) - Execution ID
- `job_name` - Reference to schedule
- `status` - running, completed, failed
- `started_at`, `completed_at` - Timestamps
- `duration_ms` - Execution time
- `items_processed`, `items_succeeded`, `items_failed` - Metrics
- `error_message` - Failure details
- `metadata` - JSON execution data
- `triggered_by` - scheduler, manual, admin
- `triggered_by_user` - User ID if manual

## Development

```bash
# Install dependencies
npm install

# Start in dev mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Port Assignment

- **Container port**: `8080` (internal)
- **Logical port**: `7007` (external)
- Kubernetes maps `7007` → `8080` via `targetPort`

## Docker

```bash
# Build image
docker build -t stumbleable-scheduler-service .

# Run container
docker run -p 7007:8080 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_KEY=your_key \
  stumbleable-scheduler-service
```

## Admin UI

Access at: `/admin/scheduler` in the main portal

Features:
- View all jobs with status
- Enable/disable jobs
- Trigger jobs manually
- View execution history
- See statistics (success rate, duration, etc.)
- Update cron schedules

## Benefits

✅ **Centralized management** - One place for all scheduled tasks  
✅ **No duplication** - Single cron implementation  
✅ **Unified monitoring** - All job metrics in one dashboard  
✅ **Service autonomy** - Services own their job logic  
✅ **Easy debugging** - Complete execution history  
✅ **Flexible scheduling** - Update crons without redeploying services  
✅ **Cross-service orchestration** - Coordinate related jobs  

## Future Enhancements

- Job dependencies (run job B after job A completes)
- Job retries with backoff
- Job prioritization
- Webhook notifications for failures
- Grafana/Prometheus metrics export
- Job health checks (detect stuck jobs)

# Admin Dashboard Integration - Scheduler Service

## Changes Made

### 1. Added Scheduler Navigation to Admin Dashboard

**File**: `ui/portal/components/admin-dashboard.tsx`

#### Admin Tools Section
Added new button in the Admin Tools grid:
```tsx
<Link
    href="/admin/scheduler"
    className="btn btn-block btn-outline justify-start"
>
    <i className="fa-solid fa-duotone fa-clock text-primary"></i>
    Scheduled Jobs
</Link>
```

**Location**: Between "Email Queue" and "User Management" buttons

**Icon**: Clock icon (fa-clock) with primary color
**Label**: "Scheduled Jobs"
**Route**: `/admin/scheduler`

#### System Status Section
Added Scheduler Service to health check monitoring:
```tsx
{ name: 'Scheduler Service', url: process.env.NEXT_PUBLIC_SCHEDULER_API_URL || 'http://localhost:7007' }
```

**Features**:
- Health check endpoint monitoring
- Response time tracking
- Online/Offline status indicator
- Auto-refresh every 30 seconds

## UI Layout

### Admin Tools Grid (7 items)
```
┌─────────────────────┬─────────────────────┐
│ Content Moderation  │ Batch Upload        │
├─────────────────────┼─────────────────────┤
│ Crawler Sources     │ Deletion Requests   │
├─────────────────────┼─────────────────────┤
│ Analytics Dashboard │ Email Queue         │
├─────────────────────┼─────────────────────┤
│ Scheduled Jobs      │ User Management     │
│     (NEW!)          │   (Coming Soon)     │
└─────────────────────┴─────────────────────┘
```

### System Status (7 services)
```
┌─────────────────────┬─────────────────────┐
│ Discovery Service   │ User Service        │
│ ✓ Online (45ms)     │ ✓ Online (32ms)     │
├─────────────────────┼─────────────────────┤
│ Interaction Service │ Moderation Service  │
│ ✓ Online (28ms)     │ ✓ Online (56ms)     │
├─────────────────────┼─────────────────────┤
│ Crawler Service     │ Email Service       │
│ ✓ Online (89ms)     │ ✓ Online (41ms)     │
├─────────────────────┼─────────────────────┤
│ Scheduler Service   │                     │
│ ✓ Online (23ms)     │                     │
│     (NEW!)          │                     │
└─────────────────────┴─────────────────────┘
```

## Scheduler Page

**Route**: `/admin/scheduler`
**File**: `ui/portal/app/admin/scheduler/page.tsx`

**Features** (Already implemented):
- ✅ List all scheduled jobs with status
- ✅ View job execution history
- ✅ Manually trigger jobs
- ✅ Enable/disable jobs
- ✅ View job statistics
- ✅ Update cron expressions
- ✅ Real-time job status updates

**Authentication**: Admin-only (Clerk + role check)

## Environment Variables

**Required in portal `.env.local`**:
```env
NEXT_PUBLIC_SCHEDULER_API_URL=http://localhost:7007
```

**Production**:
```env
NEXT_PUBLIC_SCHEDULER_API_URL=https://api.stumbleable.com/scheduler
```

## Testing Checklist

### Local Development
- [ ] Navigate to `/admin` dashboard
- [ ] Verify "Scheduled Jobs" button appears in Admin Tools
- [ ] Click "Scheduled Jobs" button → Should navigate to `/admin/scheduler`
- [ ] Verify Scheduler Service appears in System Status
- [ ] Check Scheduler Service shows "Online" status
- [ ] Click refresh button → Status should update
- [ ] Wait 30 seconds → Status should auto-refresh

### Scheduler Page
- [ ] Page loads without errors
- [ ] Job list appears with email service jobs
- [ ] Can view job details (execution history, stats)
- [ ] Can manually trigger a job
- [ ] Can enable/disable jobs
- [ ] Can update cron expression

### Error Handling
- [ ] Stop scheduler service → Status should show "Offline"
- [ ] Try to access scheduler page → Should show appropriate error
- [ ] Restart scheduler → Status should return to "Online"

## Visual Design

### Button Style
- **Outline**: Transparent with border
- **Icon**: Clock with duotone effect (primary color)
- **Text**: "Scheduled Jobs"
- **Hover**: Slight background color change
- **Alignment**: Left-aligned with icon

### Status Badge
- **Online**: Green badge with checkmark
- **Offline**: Red badge with X mark
- **Unknown**: Yellow badge with question mark
- **Response time**: Displayed in parentheses (e.g., "(45ms)")

## Integration Points

### API Client
**File**: `ui/portal/lib/api-client.ts`

**SchedulerAPI class** (Already implemented):
- `getScheduledJobs(token)` - List all jobs
- `getJobDetails(jobName, token)` - Get specific job
- `getJobHistory(jobName, token, limit, offset)` - Execution history
- `getJobStats(jobName, token, days)` - Job statistics
- `triggerJob(jobName, token)` - Manual execution
- `enableJob(jobName, token)` - Enable job
- `disableJob(jobName, token)` - Disable job
- `updateCronExpression(jobName, cronExpression, token)` - Update schedule

### Backend Services
**Scheduler Service** (Port 7007):
- Health endpoint: `/health` (public)
- Job management: `/api/jobs/*` (admin-only)
- Job registration: `/api/jobs/register` (service-to-service)

## Security

### Admin Dashboard
- ✅ Requires Clerk authentication
- ✅ Checks user role (admin only)
- ✅ Shows access denied for non-admins

### Scheduler Service
- ✅ Clerk authentication on admin endpoints
- ✅ Role validation (admin required)
- ✅ Service-to-service auth for job registration
- ✅ Rate limiting (100 req/min)
- ✅ Security headers (helmet)

## Known Issues / Limitations

### Current State
- ⚠️ Scheduler service must be running for navigation to work properly
- ⚠️ No job registration from UI (services auto-register on startup)
- ⚠️ No job creation UI (jobs defined in code)

### Future Improvements
1. Add job creation UI for admins
2. Add job execution logs viewer
3. Add job failure notifications
4. Add job performance metrics charts
5. Add job dependency visualization
6. Add bulk job operations (enable/disable multiple)
7. Add job templates library

## Related Files

### Frontend
- `ui/portal/components/admin-dashboard.tsx` - Main dashboard with navigation
- `ui/portal/app/admin/scheduler/page.tsx` - Scheduler management page
- `ui/portal/lib/api-client.ts` - SchedulerAPI class

### Backend
- `apis/scheduler-service/src/server.ts` - Service entry point
- `apis/scheduler-service/src/routes/jobs.ts` - Job management endpoints
- `apis/scheduler-service/src/middleware/auth.ts` - Authentication middleware

### Deployment
- `k8s/base/scheduler-service.yaml` - Kubernetes deployment
- `.github/workflows/deploy-aks.yml` - CI/CD pipeline
- `k8s/base/configmap.yaml` - Environment configuration
- `k8s/base/ingress.yaml` - API routing

---

**Status**: ✅ **Complete**  
**Last Updated**: October 8, 2025  
**Next Steps**: Test local development, verify health checks, test job management

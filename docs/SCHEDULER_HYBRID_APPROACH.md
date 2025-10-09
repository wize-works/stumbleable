# Scheduler Service: Hybrid Job Management Approach

## Overview

The scheduler service uses a **hybrid approach** that combines the benefits of code-based job definitions with admin operational controls. This provides the best balance between developer control, type safety, and operational flexibility.

## Philosophy

### Code-Based Job Definitions (What)
**Jobs are defined in code** by developers and deployed through version control:
- ✅ **Type-safe**: Jobs are TypeScript classes with full IntelliSense support
- ✅ **Version controlled**: All changes tracked in Git
- ✅ **Testable**: Jobs can be unit tested before deployment
- ✅ **Documented**: Code comments and JSDoc explain job behavior
- ✅ **Validated**: Compilation catches errors before deployment

### Admin Operational Controls (When & How)
**Administrators control job execution** through the UI without code changes:
- ✅ **Enable/Disable**: Turn jobs on or off instantly
- ✅ **Cron Editing**: Adjust schedules without redeployment
- ✅ **Manual Triggers**: Run jobs on-demand for testing
- ✅ **Monitoring**: View execution history and statistics
- ✅ **Troubleshooting**: Check logs and error messages

## What Admins CAN Do

### ✅ Enable/Disable Jobs
```typescript
// Toggle jobs on/off without deployment
await SchedulerAPI.enableJob('weekly-trending-digest', token);
await SchedulerAPI.disableJob('re-engagement-email', token);
```

**Use Cases:**
- Emergency disable during incidents
- Temporarily pause low-priority jobs
- Enable new jobs after validation
- Seasonal adjustments (e.g., holiday schedules)

### ✅ Edit Cron Expressions
```typescript
// Change schedule without redeployment
await SchedulerAPI.updateJobCron(
  'weekly-trending-digest',
  '0 9 * * TUE', // Change from Monday to Tuesday
  token
);
```

**Use Cases:**
- Optimize send times based on analytics
- Shift schedules to avoid peak load
- Test different delivery windows
- Coordinate with external systems

### ✅ Manual Triggers
```typescript
// Run job immediately for testing
await SchedulerAPI.triggerJob('weekly-trending-digest', userId, token);
```

**Use Cases:**
- Test job execution before enabling
- Re-run failed jobs manually
- Generate reports on-demand
- Recover from missed executions

### ✅ Monitor Execution
```typescript
// View history and statistics
const history = await SchedulerAPI.getJobHistory('job-name', token);
const stats = await SchedulerAPI.getJobStats('job-name', token, 30);
```

**Use Cases:**
- Identify failing jobs
- Track performance metrics
- Audit job executions
- Plan capacity and scaling

## What Admins CANNOT Do

### ❌ Create New Jobs
**Jobs must be created by developers in code.**

**Why?**
- Requires understanding of service architecture
- Needs proper error handling and logging
- Must integrate with existing systems
- Requires validation and testing
- Benefits from code review process

**To add a new job:**
1. Developer writes job class in appropriate service
2. Job registers itself on service startup
3. Pull request reviewed and merged
4. Deployment makes job available
5. Admin enables job in UI

### ❌ Delete Jobs (Easily)
**Jobs can only be removed through code changes.**

**Why?**
- Prevents accidental deletion of critical jobs
- Ensures proper cleanup of associated data
- Maintains audit trail through Git history
- Allows team review before removal

**To remove a job:**
1. Developer removes job class from code
2. Pull request reviewed and merged
3. Deployment removes job from registry
4. Database records retained for audit

### ❌ Modify Job Logic
**Job behavior can only be changed through code.**

**Why?**
- Logic requires understanding of data models
- Changes need type checking and compilation
- Must maintain backwards compatibility
- Requires thorough testing
- Benefits from peer review

## Architecture

### Service Auto-Registration
Each service that needs scheduled jobs:

1. **Defines job classes** implementing the `ScheduledJob` interface:
```typescript
class WeeklyTrendingDigestJob implements ScheduledJob {
  name = 'weekly-trending-digest';
  displayName = 'Weekly Trending Digest';
  description = 'Send weekly email with trending content';
  cronExpression = '0 9 * * MON'; // Every Monday at 9am
  jobType = 'email';

  async execute(context: JobContext): Promise<JobResult> {
    // Job implementation
  }
}
```

2. **Registers jobs on startup** by calling scheduler-service:
```typescript
await fetch('http://scheduler-service:7007/api/jobs/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'weekly-trending-digest',
    serviceName: 'email-service',
    serviceUrl: 'http://email-service:7006',
    displayName: 'Weekly Trending Digest',
    description: 'Send weekly email with trending content',
    cronExpression: '0 9 * * MON',
    jobType: 'email',
    enabled: false, // Defaults to disabled
    config: { ... }
  })
});
```

3. **Scheduler-service manages execution**:
   - Maintains cron schedule
   - Triggers jobs at specified times
   - Calls back to service's `/api/jobs/:name/execute` endpoint
   - Records execution history and statistics

### Database Schema
```sql
-- Job schedules (managed by services + admin UI)
CREATE TABLE job_schedules (
  name VARCHAR(255) PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  service_url VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  job_type VARCHAR(50),
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execution history (audit trail)
CREATE TABLE job_executions (
  id UUID PRIMARY KEY,
  job_name VARCHAR(255) REFERENCES job_schedules(name),
  status VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  triggered_by VARCHAR(50), -- 'cron', 'admin', 'api'
  triggered_by_user VARCHAR(255)
);
```

## Admin UI Features

### Job List View
- **Visual status**: Enabled/disabled badge, next run time
- **Quick actions**: Enable/disable toggle, manual trigger button
- **Schedule display**: Cron expression + human-readable description
- **Performance metrics**: Success rate, average duration

### Cron Editor Modal
- **Live validation**: Ensures cron expression is valid
- **Preview**: Shows human-readable schedule description
- **Format guide**: Examples of common cron patterns
- **Visual feedback**: Errors highlighted, success confirmed

### Confirmation Dialogs
- **Enable/Disable**: Confirms state changes
- **Manual Trigger**: Confirms immediate execution
- **Cron Updates**: Shows old vs new schedule

### Execution History
- **Detailed logs**: Status, duration, items processed
- **Error messages**: Full error details for debugging
- **Triggered by**: Shows who/what triggered execution
- **Statistics**: Aggregated metrics over time periods

## Example Workflow

### Adding a New Email Job (Developer)

1. **Create job class** in `email-service`:
```typescript
// apis/email-service/src/jobs/monthly-recap.ts
export class MonthlyRecapJob implements ScheduledJob {
  name = 'monthly-recap';
  displayName = 'Monthly Recap Email';
  description = 'Send monthly summary of user activity';
  cronExpression = '0 10 1 * *'; // 1st of month at 10am
  jobType = 'email';

  async execute(context: JobContext): Promise<JobResult> {
    const users = await getActiveUsers();
    let succeeded = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendMonthlyRecap(user);
        succeeded++;
      } catch (error) {
        failed++;
        console.error(`Failed for user ${user.id}:`, error);
      }
    }

    return {
      success: failed === 0,
      itemsProcessed: users.length,
      itemsSucceeded: succeeded,
      itemsFailed: failed,
      metadata: { usersCount: users.length }
    };
  }
}
```

2. **Register on startup** in `email-service/src/server.ts`:
```typescript
await registerScheduledJobs([
  new WeeklyTrendingDigestJob(),
  new ReEngagementJob(),
  new MonthlyRecapJob(), // Add new job
]);
```

3. **Test locally**:
```bash
# Start all services
npm run dev

# Check job appears in scheduler
curl http://localhost:7007/api/jobs

# Trigger manually for testing
curl -X POST http://localhost:7007/api/jobs/monthly-recap/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"admin-user-id"}'
```

4. **Deploy through CI/CD**:
```bash
git add .
git commit -m "feat(email): add monthly recap job"
git push origin main
# GitHub Actions deploys to AKS
```

### Tuning Job Schedule (Admin)

1. **Navigate to Admin → Scheduler**
2. **Click on "Weekly Trending Digest" job card**
3. **Click edit icon next to cron expression**
4. **Change** `0 9 * * MON` → `0 10 * * MON` (shift 1 hour later)
5. **Preview** shows "Every Monday at 10:00 AM"
6. **Save** - schedule updated immediately
7. **No deployment needed** - change takes effect instantly

### Emergency Disable (Admin)

1. **Navigate to Admin → Scheduler**
2. **Find problematic job** (e.g., "Re-engagement Email")
3. **Toggle off** the enable switch
4. **Confirm** in dialog
5. **Job immediately stops** running on schedule
6. **Fix issue** in code if needed
7. **Toggle back on** when ready
8. **Optionally trigger manually** to test before re-enabling schedule

## Benefits of Hybrid Approach

### For Developers
- ✅ Full control over job logic and implementation
- ✅ Type safety and compile-time validation
- ✅ Unit testing and integration testing
- ✅ Code review process ensures quality
- ✅ Version control provides audit trail

### For Admins
- ✅ Instant operational control without deployment
- ✅ Can tune schedules based on analytics
- ✅ Emergency disable during incidents
- ✅ Test jobs manually before enabling
- ✅ Monitor execution and troubleshoot issues

### For System
- ✅ Centralized scheduling in scheduler-service
- ✅ Single source of truth for job state
- ✅ Detailed execution history and audit logs
- ✅ Consistent error handling and retry logic
- ✅ Scalable architecture (single scheduler replica)

## Safety Boundaries

### What Could Go Wrong?

**Scenario:** Admin accidentally changes cron to invalid expression
- **Prevention:** UI validates cron syntax before saving
- **Recovery:** Backend validates again, returns error if invalid
- **Fallback:** Job continues with old schedule if update fails

**Scenario:** Admin triggers job that's already running
- **Prevention:** UI shows running state, disables trigger button
- **Recovery:** Backend checks if job is running before starting
- **Fallback:** Returns error "Job already running"

**Scenario:** Admin disables critical job
- **Prevention:** Confirmation dialog requires explicit confirmation
- **Recovery:** Admin can re-enable immediately
- **Fallback:** Execution history shows who disabled and when

**Scenario:** Service goes down while job is scheduled
- **Prevention:** Health checks detect service unavailability
- **Recovery:** Scheduler retries with exponential backoff
- **Fallback:** Logs error, continues with other jobs

## Future Enhancements

### Potential Additions (If Needed)
- **Job dependencies**: Define execution order (Job A before Job B)
- **Conditional execution**: Run only if certain conditions met
- **Retry policies**: Configurable retry behavior per job
- **Rate limiting**: Prevent job from running too frequently
- **Notification rules**: Alert on job failures via email/Slack
- **Job groups**: Organize related jobs together
- **Bulk operations**: Enable/disable multiple jobs at once
- **Job templates**: Pre-configured job patterns for common tasks

### Not Planned
- ❌ UI-based job creation (requires code for safety)
- ❌ JavaScript/Python execution (too dangerous)
- ❌ Custom job logic editor (can't validate safely)
- ❌ Dynamic job registration (must go through services)

## Comparison with Alternatives

### Pure Code-Based (No Admin UI)
**Pros:**
- ✅ Maximum safety and control
- ✅ All changes version controlled

**Cons:**
- ❌ Every schedule change requires deployment
- ❌ Can't quickly respond to incidents
- ❌ No runtime visibility without logs

### Pure UI-Based (Admin Creates Jobs)
**Pros:**
- ✅ Maximum flexibility
- ✅ No deployment for new jobs

**Cons:**
- ❌ No type safety or validation
- ❌ Hard to test before production
- ❌ Easy to create broken jobs
- ❌ No code review process
- ❌ Difficult to maintain consistency

### Hybrid Approach (Our Choice)
**Pros:**
- ✅ Combines benefits of both approaches
- ✅ Developers control logic, admins control execution
- ✅ Safe by default with operational flexibility
- ✅ Clear separation of concerns

**Cons:**
- ⚠️ Requires coordination between dev and ops
- ⚠️ Initial setup more complex (worth it!)

## Conclusion

The hybrid approach provides the **best balance** for production systems:

1. **Developers own the "what"**: What jobs exist and what they do
2. **Admins own the "when"**: When jobs run and if they're enabled
3. **System owns the "how"**: How jobs are scheduled and executed

This separation ensures:
- **Safety**: Can't accidentally create invalid jobs
- **Flexibility**: Can tune schedules without deployment
- **Auditability**: All changes tracked in DB and Git
- **Maintainability**: Clear ownership and responsibilities

The scheduler service acts as a **reliable middleman** that:
- Accepts job registrations from services (code-based)
- Allows admins to control execution (UI-based)
- Manages scheduling and execution (system-handled)
- Provides monitoring and audit trails (observable)

**Result:** A production-ready job scheduling system that is both safe and flexible.

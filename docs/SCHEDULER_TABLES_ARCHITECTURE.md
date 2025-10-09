# Scheduler Tables: Architecture & Security

## Table Distinction: Why Two Tables?

### `job_schedules` - Job Configuration (The "What")
**Purpose:** Stores the **definition and configuration** of scheduled jobs.

**Think of it as:** The machine specification sheet

**Contains:**
- Job metadata (name, description, display name)
- Scheduling information (cron expression, enabled/disabled)
- Service integration (which service, which endpoint to call)
- Configuration (JSONB for job-specific settings)
- **Aggregated statistics** (total runs, success/fail counts, last run info)

**Updates:** Infrequently - when jobs are registered, enabled/disabled, or stats are updated via triggers

**Row Count:** Small - one row per job type (typically 5-20 rows)

**Example:**
```sql
job_name: 'weekly-digest'
display_name: 'Weekly Digest Email'
cron_expression: '0 9 * * 1'  -- Every Monday at 9am
enabled: true
service: 'email-service'
endpoint: '/api/jobs/weekly-digest'
total_runs: 42
successful_runs: 40
failed_runs: 2
config: {"batchSize": 100, "maxEmails": 10000}
```

### `scheduled_jobs` - Execution History (The "When & How")
**Purpose:** Tracks **individual executions** of jobs - the audit trail.

**Think of it as:** The production log / event log

**Contains:**
- Execution ID (unique per run)
- Job identification (job_name, job_type)
- Execution status (running, completed, failed)
- Timing (started_at, completed_at, duration_ms)
- Performance metrics (items_processed, items_succeeded, items_failed)
- Error details (error_message)
- Trigger information (triggered_by, triggered_by_user)
- Job-specific metadata (JSONB)

**Updates:** Constantly - new row created on every job execution, updated when job completes

**Row Count:** Large and growing - one row per execution (grows by 5-50 rows per day)

**Example:**
```sql
-- Execution 1
id: '123e4567-...'
job_name: 'weekly-digest'
status: 'completed'
started_at: '2025-10-07 09:00:00'
completed_at: '2025-10-07 09:02:20'
duration_ms: 2340
items_processed: 150
items_succeeded: 148
items_failed: 2
triggered_by: 'scheduler'

-- Execution 2
id: '223e4567-...'
job_name: 'weekly-digest'
status: 'completed'
started_at: '2025-10-14 09:00:00'
completed_at: '2025-10-14 09:01:58'
duration_ms: 2180
items_processed: 165
items_succeeded: 165
items_failed: 0
triggered_by: 'manual'
triggered_by_user: '550e8400-...' -- UUID reference to users table
```

## Relationship Between Tables

```
job_schedules (1) ←→ (many) scheduled_jobs
    ↓                        ↓
One definition         Many executions
Updates stats          Creates history
```

### Automatic Stat Updates

When a job execution completes, a trigger automatically updates the `job_schedules` table:

```sql
CREATE TRIGGER trigger_update_job_stats
    AFTER INSERT OR UPDATE ON scheduled_jobs
    FOR EACH ROW
    WHEN (NEW.status IN ('completed', 'failed'))
    EXECUTE FUNCTION update_job_schedule_stats();
```

**What it does:**
1. Job execution completes in `scheduled_jobs`
2. Trigger fires and updates `job_schedules`:
   - `last_run_at` = execution completed time
   - `last_run_status` = 'completed' or 'failed'
   - `last_run_duration_ms` = how long it took
   - `total_runs` += 1
   - `successful_runs` or `failed_runs` += 1

This keeps `job_schedules` as a **single source of truth** for job stats without complex aggregation queries.

## Comparison with Other Patterns

### Alternative 1: Single Table (Not Used)
```sql
CREATE TABLE jobs (
    id UUID,
    name TEXT,
    cron_expression TEXT,
    config JSONB,
    -- Execution fields
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT,
    ...
);
```

**Problems:**
- ❌ Duplicate job definition data on every execution
- ❌ Hard to query "what jobs exist" vs "what happened"
- ❌ Config changes apply retroactively or not at all
- ❌ Stats require complex aggregations

### Alternative 2: Three Tables (Overkill)
```sql
jobs (definitions)
job_config (versioned configs)
job_executions (history)
```

**Problems:**
- ⚠️ Over-engineered for this use case
- ⚠️ More complex queries
- ⚠️ Config versioning not needed (jobs are code-based)

### Our Approach: Two Tables (Just Right)
```sql
job_schedules (definitions + current stats)
scheduled_jobs (execution history)
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Efficient queries for both use cases
- ✅ Stats pre-calculated via trigger
- ✅ Simple to understand and maintain

## Row Level Security (RLS) Policies

### Security Requirements

**Goals:**
1. ✅ Only admins can view job configurations and execution history
2. ✅ Regular users cannot see scheduled jobs (security by obscurity)
3. ✅ Only scheduler service can create/update execution records
4. ✅ Only services can register new jobs
5. ✅ Admins can enable/disable jobs via UI

### `job_schedules` Policies

| Operation | Who Can Do It | Policy Name |
|-----------|---------------|-------------|
| **SELECT** | Admins + service_role | `job_schedules_select_admin_service` |
| **INSERT** | service_role only | `job_schedules_insert_service` |
| **UPDATE** | Admins + service_role | `job_schedules_update_admin_service` |
| **DELETE** | service_role only | `job_schedules_delete_service` |

**SELECT Policy (Read):**
```sql
-- Admins can view all job schedules
EXISTS (
    SELECT 1 FROM users
    WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
    AND users.role = 'admin'
)
```

**UPDATE Policy (Admin Controls):**
```sql
-- Admins can enable/disable jobs, update cron schedules
EXISTS (
    SELECT 1 FROM users
    WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
    AND users.role = 'admin'
)
```

**Why service_role for INSERT/DELETE?**
- Job registration happens via service-to-service API calls
- Uses `SERVICE_TOKEN` environment variable (not user auth)
- Prevents unauthorized job creation from frontend

### `scheduled_jobs` Policies

| Operation | Who Can Do It | Policy Name |
|-----------|---------------|-------------|
| **SELECT** | Admins + service_role | `scheduled_jobs_select_admin_service` |
| **INSERT** | service_role only | `scheduled_jobs_insert_service` |
| **UPDATE** | service_role only | `scheduled_jobs_update_service` |
| **DELETE** | service_role only | `scheduled_jobs_delete_service` |

**SELECT Policy (Read):**
```sql
-- Admins can view execution history for monitoring
EXISTS (
    SELECT 1 FROM users
    WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
    AND users.role = 'admin'
)
```

**Why service_role only for INSERT/UPDATE/DELETE?**
- Maintains **audit trail integrity**
- Prevents tampering with execution records
- Only scheduler service should write to this table
- DELETE for cleanup jobs (remove old records)

## Access Patterns

### Frontend (Admin UI) - Via Clerk JWT
```typescript
// User authenticated with Clerk
const token = await getToken();

// Frontend calls scheduler API
fetch('http://scheduler-service:7007/api/jobs', {
    headers: { 'Authorization': `Bearer ${token}` }
});

// Scheduler service calls Supabase with Clerk token
const { data } = await supabase
    .from('job_schedules')
    .select('*');

// RLS policy checks:
// 1. Extract Clerk user ID from JWT
// 2. Query users table for role
// 3. Allow if role = 'admin'
```

### Backend (Scheduler Service) - Via Service Role
```typescript
// Scheduler service uses service role key
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Bypasses RLS
);

// Create execution record
const { data } = await supabase
    .from('scheduled_jobs')
    .insert({
        job_name: 'weekly-digest',
        status: 'running',
        ...
    });

// RLS policy: service_role bypasses all policies ✅
```

### Service Registration - Via Service Token
```typescript
// Email service registers its jobs on startup
fetch('http://scheduler-service:7007/api/jobs/register', {
    headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': process.env.SERVICE_TOKEN
    },
    body: JSON.stringify({
        name: 'weekly-digest',
        service: 'email-service',
        ...
    })
});

// Scheduler validates SERVICE_TOKEN
// Then uses service_role to insert
```

## Security Benefits

### What's Protected

1. **Job Configuration Cannot Be Tampered With**
   - Only services can register jobs (code-based)
   - Only admins can enable/disable
   - Regular users have no access

2. **Execution History Is Read-Only**
   - Only scheduler service can write
   - Admins can read for monitoring
   - Audit trail cannot be altered

3. **No Information Leakage**
   - Regular users don't know what jobs exist
   - Job names, schedules, and configs are hidden
   - Execution history is private

### What Admins Can Do

✅ **View all jobs** - See configurations and schedules
✅ **Enable/disable jobs** - Control execution without code changes
✅ **Update cron schedules** - Adjust timing
✅ **Trigger manually** - Run jobs on-demand
✅ **View execution history** - Monitor performance and errors
✅ **View statistics** - Aggregate metrics over time

### What Admins CANNOT Do

❌ **Register new jobs** - Must be done via service code
❌ **Delete jobs** - Prevents accidental removal
❌ **Modify execution records** - Preserves audit trail
❌ **Bypass service authentication** - Can't impersonate services

## Database Functions & Permissions

### Functions Available to Admins

```sql
-- Get paginated execution history
GRANT EXECUTE ON FUNCTION get_job_execution_history TO authenticated;

-- Get execution statistics
GRANT EXECUTE ON FUNCTION get_job_execution_stats TO authenticated;
```

**RLS Protection:**
- Functions return all data (no built-in filtering)
- RLS policies on `scheduled_jobs` enforce admin-only access
- Functions check caller's role via RLS policies

### Example Admin Query

```sql
-- As admin user (with Clerk JWT)
SELECT * FROM get_job_execution_history('weekly-digest', 20, 0);

-- RLS allows because:
-- 1. Function called by authenticated user
-- 2. Function queries scheduled_jobs table
-- 3. RLS policy on scheduled_jobs checks admin role
-- 4. User is admin → data returned ✅

-- As regular user (with Clerk JWT)
SELECT * FROM get_job_execution_history('weekly-digest', 20, 0);

-- RLS blocks because:
-- 1. Function called by authenticated user
-- 2. Function queries scheduled_jobs table
-- 3. RLS policy checks admin role
-- 4. User is NOT admin → empty result ❌
```

## Migration Applied: 035_add_rls_to_scheduler_tables.sql

**What Changed:**
1. ✅ Enabled RLS on both tables
2. ✅ Created 8 policies total (4 per table)
3. ✅ Granted appropriate permissions to roles
4. ✅ Added policy comments for documentation
5. ✅ Verified RLS is enabled

**Policies Created:**
- `job_schedules_select_admin_service` - Admins can view configs
- `job_schedules_insert_service` - Services can register jobs
- `job_schedules_update_admin_service` - Admins can enable/disable
- `job_schedules_delete_service` - Services can delete (rare)
- `scheduled_jobs_select_admin_service` - Admins can view history
- `scheduled_jobs_insert_service` - Services can create records
- `scheduled_jobs_update_service` - Services can update records
- `scheduled_jobs_delete_service` - Services can cleanup old records

## Verification

### Check RLS Status
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('job_schedules', 'scheduled_jobs');

-- Expected:
-- job_schedules   | true
-- scheduled_jobs  | true
```

### Check Policies
```sql
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('job_schedules', 'scheduled_jobs')
ORDER BY tablename, policyname;

-- Expected: 8 policies total
```

### Test Access (as Admin)
```sql
-- Should return all jobs
SELECT * FROM job_schedules;

-- Should return all executions
SELECT * FROM scheduled_jobs;
```

### Test Access (as Regular User)
```sql
-- Should return 0 rows
SELECT * FROM job_schedules;

-- Should return 0 rows
SELECT * FROM scheduled_jobs;
```

## Conclusion

The two-table design provides:
- ✅ **Clear separation** of configuration vs execution
- ✅ **Efficient queries** for both use cases
- ✅ **Automatic stat updates** via triggers
- ✅ **Strong security** via RLS policies
- ✅ **Admin controls** without code changes
- ✅ **Audit trail** for compliance

The RLS policies ensure:
- ✅ **Admin-only access** to sensitive job data
- ✅ **Service-only writes** to maintain integrity
- ✅ **Protection against** unauthorized changes
- ✅ **Clear access boundaries** between roles

This architecture is **production-ready** and secure! 🎉

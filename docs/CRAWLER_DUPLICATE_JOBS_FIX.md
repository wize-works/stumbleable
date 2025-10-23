# Crawler Duplicate Jobs Fix

## Problem
When the crawler service restarted, it would continuously create new `crawler_jobs` for large sites that were already being crawled. This resulted in:
- Multiple duplicate jobs in the database for the same source
- Wasted resources processing the same content multiple times
- Inability to track actual crawl progress

## Root Cause
The crawler service only checked an in-memory `activeCrawls` Set to prevent duplicate jobs. When the service restarted:
1. The in-memory Set was empty
2. No database check for existing running jobs
3. A new job was created regardless of existing running jobs
4. Large sites would trigger new jobs on every restart

## Solution Implemented

### 1. Database Check Before Job Creation
**File**: `apis/crawler-service/src/lib/crawler.ts`

Added logic to check the database for existing running jobs before creating a new one:

```typescript
// Check for existing running jobs in database (critical for service restarts)
const { data: existingJobs, error: checkError } = await supabase
    .from('crawler_jobs')
    .select('*')
    .eq('source_id', source.id)
    .eq('status', 'running')
    .order('created_at', { ascending: false });

if (existingJobs && existingJobs.length > 0) {
    // Mark stale jobs as failed (they can't actually be running if we're here)
    for (const staleJob of existingJobs) {
        await supabase
            .from('crawler_jobs')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: 'Job interrupted by service restart'
            })
            .eq('id', staleJob.id);
    }
}
```

### 2. Orphaned Job Cleanup on Startup
**File**: `apis/crawler-service/src/lib/scheduler.ts`

Added a cleanup method that runs when the scheduler starts to handle any orphaned running jobs:

```typescript
private async cleanupOrphanedJobs() {
    const { data: orphanedJobs } = await supabase
        .from('crawler_jobs')
        .select('id, source_id, started_at')
        .eq('status', 'running');

    if (orphanedJobs && orphanedJobs.length > 0) {
        await supabase
            .from('crawler_jobs')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: 'Job interrupted by service restart'
            })
            .eq('status', 'running');
    }
}
```

## Benefits

1. **No More Duplicate Jobs**: Prevents creation of new jobs when one is already running
2. **Clean Restart**: Properly handles service restarts by marking interrupted jobs as failed
3. **Accurate Job History**: Orphaned jobs are marked with clear error messages
4. **Resource Efficiency**: Prevents wasted processing on duplicate crawls
5. **Better Monitoring**: Easier to track actual crawl progress and failures

## Implementation Details

### Two-Level Protection
1. **Startup Cleanup**: Bulk cleanup of all orphaned jobs when service starts
2. **Per-Source Check**: Individual check before creating each new job

### Job Status Flow
- **Before Fix**: Service restart → New job created → Multiple running jobs exist
- **After Fix**: Service restart → Orphaned jobs marked as failed → New job created only if none running

### Error Messages
All orphaned/interrupted jobs now have the error message:
```
"Job interrupted by service restart"
```

This makes it clear in the admin UI that these jobs failed due to service interruption, not content issues.

## Testing Recommendations

1. Start a crawl for a large site
2. Restart the crawler service mid-crawl
3. Verify:
   - Old job is marked as failed
   - New job is created cleanly
   - No duplicate running jobs exist

## Related Files
- `apis/crawler-service/src/lib/crawler.ts` - Main crawl logic
- `apis/crawler-service/src/lib/scheduler.ts` - Scheduler with cleanup
- `database/migrations/005_create_crawler_service_tables.sql` - Job schema

## Date
October 22, 2025

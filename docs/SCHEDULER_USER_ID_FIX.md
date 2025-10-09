# Scheduler Service: User ID Resolution Fix

## Issue

When manually triggering a scheduled job from the admin UI, the scheduler-service was attempting to insert a Clerk user ID (e.g., `user_33Y570gkACu4Qe3WDnlZ23edbeB`) into the `triggered_by_user` column of the `scheduled_jobs` table, which is defined as a UUID foreign key referencing `users(id)`.

### Error Message
```
Failed to create execution record: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "user_33Y570gkACu4Qe3WDnlZ23edbeB"'
}
```

### Root Cause

**Database Schema:**
```sql
CREATE TABLE scheduled_jobs (
    ...
    triggered_by_user UUID REFERENCES users(id) ON DELETE SET NULL,
    ...
);
```

**Previous Code:**
```typescript
// WRONG: Directly inserting Clerk user ID
const { data, error } = await supabase
    .from('scheduled_jobs')
    .insert({
        triggered_by_user: triggeredByUser || null, // Clerk ID like "user_xxx"
    })
```

The database expects a UUID (internal user ID), but was receiving a Clerk user ID string.

## Solution

Modified `createExecutionRecord()` to resolve Clerk user IDs to internal UUIDs before insertion:

```typescript
private async createExecutionRecord(
    jobName: string,
    jobType: string,
    triggeredBy: string,
    triggeredByUser?: string
): Promise<string> {
    // If triggered by user, resolve Clerk user ID to internal UUID
    let userUuid: string | null = null;
    if (triggeredByUser) {
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('clerk_user_id', triggeredByUser)
                .single();

            if (userError) {
                console.warn(`Could not resolve user ID ${triggeredByUser}:`, userError.message);
            } else if (userData) {
                userUuid = userData.id;
            }
        } catch (error) {
            console.warn(`Error resolving user ID ${triggeredByUser}:`, error);
        }
    }

    const { data, error } = await supabase
        .from('scheduled_jobs')
        .insert({
            job_name: jobName,
            job_type: jobType,
            status: 'running',
            triggered_by: triggeredBy,
            triggered_by_user: userUuid, // Now a UUID, not Clerk ID
        })
        .select('id')
        .single();

    if (error || !data) {
        console.error('Failed to create execution record:', error);
        throw new Error('Failed to create execution record');
    }

    return data.id;
}
```

## Behavior

### Success Path
1. Admin clicks "Trigger Now" in UI
2. Frontend sends Clerk user ID (e.g., `user_33Y570gkACu4Qe3WDnlZ23edbeB`)
3. Scheduler queries `users` table: `SELECT id FROM users WHERE clerk_user_id = 'user_33Y...'`
4. Receives internal UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
5. Inserts into `scheduled_jobs` with UUID reference
6. Job executes successfully

### Failure Path (Graceful)
1. Admin clicks "Trigger Now" but user lookup fails
2. Scheduler logs warning: `Could not resolve user ID user_xxx: ...`
3. Inserts `triggered_by_user` as `NULL` (valid per schema: `ON DELETE SET NULL`)
4. Job still executes successfully
5. Admin functionality not blocked by user lookup failures

### Automated Execution
1. Cron scheduler triggers job
2. No `triggeredByUser` provided
3. `triggered_by_user` set to `NULL`
4. `triggered_by` set to `'scheduler'`
5. Execution tracked without user attribution

## Data Flow

### Manual Trigger
```
Frontend (Clerk ID)
  → POST /api/jobs/:name/trigger
  → { userId: "user_33Y570gkACu4Qe3WDnlZ23edbeB" }
  ↓
Scheduler Service
  → Look up in users table
  → SELECT id FROM users WHERE clerk_user_id = 'user_...'
  → Returns: '550e8400-e29b-41d4-a716-446655440000'
  ↓
Database Insert
  → INSERT INTO scheduled_jobs (triggered_by_user)
  → VALUES ('550e8400-e29b-41d4-a716-446655440000')
  → ✅ Success (valid UUID reference)
```

### Scheduled Trigger
```
Cron Scheduler
  → Time to run job
  → executeJob(jobName, 'scheduler', undefined)
  ↓
Scheduler Service
  → No user lookup needed
  → triggered_by_user = NULL
  ↓
Database Insert
  → INSERT INTO scheduled_jobs (triggered_by_user)
  → VALUES (NULL)
  → ✅ Success (NULL allowed)
```

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,              -- Internal UUID
    clerk_user_id TEXT UNIQUE,        -- Clerk ID like "user_xxx"
    email TEXT,
    ...
);
```

### Scheduled Jobs Table
```sql
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY,
    job_name TEXT NOT NULL,
    triggered_by TEXT DEFAULT 'scheduler',  -- 'scheduler', 'manual', 'admin'
    triggered_by_user UUID REFERENCES users(id) ON DELETE SET NULL,
    ...
);
```

### Relationships
- `triggered_by_user` → Foreign key to `users.id` (UUID)
- `ON DELETE SET NULL` → If user deleted, set to NULL (don't fail)
- `clerk_user_id` → Unique index on `users` table for fast lookups

## Testing

### Test Manual Trigger
```bash
# Get Clerk token
TOKEN="eyJhbGc..."

# Get your Clerk user ID
CLERK_USER_ID="user_33Y570gkACu4Qe3WDnlZ23edbeB"

# Trigger job manually
curl -X POST http://localhost:7007/api/jobs/weekly-digest/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$CLERK_USER_ID\"}"

# Check execution record
SELECT 
    job_name, 
    triggered_by, 
    triggered_by_user,
    u.email as triggered_by_email
FROM scheduled_jobs sj
LEFT JOIN users u ON sj.triggered_by_user = u.id
WHERE job_name = 'weekly-digest'
ORDER BY started_at DESC
LIMIT 5;
```

**Expected Result:**
```
job_name         | triggered_by | triggered_by_user                    | triggered_by_email
weekly-digest    | manual       | 550e8400-e29b-41d4-a716-446655440000 | admin@example.com
```

### Test Automated Trigger
```bash
# Let cron scheduler trigger job naturally
# OR restart scheduler service to trigger on startup

# Check execution record
SELECT 
    job_name, 
    triggered_by, 
    triggered_by_user
FROM scheduled_jobs
WHERE triggered_by = 'scheduler'
ORDER BY started_at DESC
LIMIT 5;
```

**Expected Result:**
```
job_name         | triggered_by | triggered_by_user
weekly-digest    | scheduler    | NULL
re-engagement    | scheduler    | NULL
```

## Error Handling

### Scenario 1: User Not Found
```typescript
// User deleted but Clerk ID still sent
triggeredByUser = "user_DELETED123"

// Query returns no results
const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', 'user_DELETED123')
    .single();
// userData = null

// Warning logged
console.warn(`Could not resolve user ID user_DELETED123`);

// Execution continues with NULL
triggered_by_user = null;
```

### Scenario 2: Database Connection Error
```typescript
// Network issue or DB down
try {
    const { data: userData } = await supabase.from('users')...
} catch (error) {
    console.warn(`Error resolving user ID:`, error);
}

// Execution continues with NULL
triggered_by_user = null;
```

### Scenario 3: Invalid Clerk ID Format
```typescript
// Malformed or unexpected format
triggeredByUser = "not-a-real-clerk-id"

// Query returns empty result
// Warning logged
// Execution continues with NULL
```

## Impact Analysis

### ✅ Fixed
- Manual job triggers from admin UI now work correctly
- User attribution properly recorded for manual triggers
- Database foreign key constraints satisfied

### ✅ Preserved
- Automated cron triggers still work (NULL user)
- Graceful degradation if user lookup fails
- No breaking changes to API contracts

### ✅ Improved
- Better error logging for debugging
- Clear separation of Clerk IDs vs internal UUIDs
- Consistent handling across all job types

## Related Files

**Modified:**
- `apis/scheduler-service/src/lib/scheduler.ts` - Added user ID resolution

**Referenced:**
- `database/migrations/034_create_scheduled_jobs_table.sql` - Schema definition
- `apis/scheduler-service/src/routes/jobs.ts` - API endpoint
- `ui/portal/lib/api-client.ts` - Frontend API client

## Future Considerations

### Potential Improvements
1. **Cache user lookups**: Store Clerk ID → UUID mapping in memory
2. **Batch resolution**: Resolve multiple users at once for bulk operations
3. **Strict mode**: Option to fail execution if user not found (for audit requirements)
4. **User context**: Pass full user object to job execution for personalization

### Migration Path
If you need to update existing records:
```sql
-- Update existing records to resolve Clerk IDs (if any stored incorrectly)
UPDATE scheduled_jobs sj
SET triggered_by_user = u.id
FROM users u
WHERE sj.triggered_by_user::text = u.clerk_user_id
AND sj.triggered_by_user IS NOT NULL;
```

## Conclusion

The fix ensures that the scheduler-service correctly translates Clerk user IDs (external identity) to internal UUIDs (database identity) when recording job executions. This maintains referential integrity while keeping the API interface simple for frontend consumers.

**Key Principle:** Services should accept whatever ID format is convenient for clients (Clerk IDs), then translate internally to the format required by the database (UUIDs).

# Moderation Service Authentication & Database Fixes

## Issues Fixed

### 1. User ID Conversion (Clerk ID → Database UUID)
**Problem:** Moderation endpoints were receiving Clerk user IDs (e.g., `user_33Y570gkACu4Qe3WDnlZ23edbeB`) but database columns expect UUIDs.

**Fixed Endpoints:**
- ✅ `/api/moderation/queue/:queueId/review` - Review content (approve/reject)
- ✅ `/api/moderation/queue/bulk-approve` - Bulk approve
- ✅ `/api/moderation/queue/bulk-reject` - Bulk reject  
- ✅ `/api/moderation/reports/:reportId/resolve` - Resolve content reports

**Solution:** Added `getDatabaseUserId()` helper calls before passing user ID to repository methods.

### 2. Database Schema Issues

#### Domain Reputation Table
**Problem:** Old trigger `update_domain_reputation_on_flag()` referenced dropped `score` column.

**Migrations Applied:**
- `014_fix_domain_reputation_trigger.sql` - Initial trigger fix attempt
- `015_complete_domain_reputation_schema.sql` - Complete schema update

**Changes:**
- ✅ Added missing columns: `total_approved`, `total_rejected`, `is_blacklisted`, `blacklist_reason`, `notes`, `last_reviewed`, `updated_at`
- ✅ Migrated `flagged_count` → `total_rejected`
- ✅ Dropped old columns: `flagged_count`, `submission_count`
- ✅ Fixed trigger to use `trust_score` instead of `score`
- ✅ Added auto-update trigger for `updated_at`
- ✅ Added indexes for performance

#### Moderation Queue Table
**Problem:** Column name mismatch between code and database.

**Fixed:**
- ✅ Updated code to use correct column names: `moderated_by`, `moderated_at`, `moderator_notes`
- ✅ Migration 012 had already renamed columns in database

### 3. Error Logging Improvements
**Problem:** Empty error objects in logs made debugging difficult.

**Fixed:** All moderation endpoints now log:
- `error.message` - Human-readable error message
- `errorDetails` - Full error object for debugging
- Contextual information (reportId, queueId, etc.)

## Authentication Configuration

The moderation service requires Clerk environment variables:

```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

These are already configured in `apis/moderation-service/.env`.

## Testing Checklist

After restarting the moderation service, test:

1. **Review Content:**
   - [ ] Approve content in moderation queue
   - [ ] Reject content in moderation queue
   - [ ] Bulk approve multiple items
   - [ ] Bulk reject multiple items

2. **Content Reports:**
   - [ ] Resolve content report as "resolved"
   - [ ] Dismiss content report as "dismissed"
   - [ ] Verify reporter sees updated status

3. **Domain Reputation:**
   - [ ] Verify trust_score updates when content approved
   - [ ] Verify trust_score decreases when content rejected
   - [ ] Check total_approved and total_rejected counters

4. **Error Handling:**
   - [ ] Try operations without authentication → expect 401
   - [ ] Try operations as non-moderator user → expect 403
   - [ ] Verify error messages are helpful in logs

## Restart Instructions

```powershell
# Navigate to root directory
cd G:\code\@wizeworks\stumbleable

# Stop all services (Ctrl+C if running)

# Restart all services
npm run dev
```

Or restart just the moderation service:

```powershell
cd G:\code\@wizeworks\stumbleable\apis\moderation-service
npm run dev
```

## Files Modified

### Code Changes:
- `apis/moderation-service/src/routes/moderation.ts` - Added user ID conversion for all review/resolve endpoints
- `apis/moderation-service/src/lib/repository.ts` - Already had correct column names

### Database Migrations:
- `database/migrations/014_fix_domain_reputation_trigger.sql` - Fixed trigger column references
- `database/migrations/015_complete_domain_reputation_schema.sql` - Completed schema migration

### Environment:
- `apis/moderation-service/.env` - Already has Clerk configuration

## Next Steps

1. **Restart the moderation service** to ensure Clerk plugin is loaded
2. **Test the moderation queue** - approve/reject content
3. **Test content reports** - resolve/dismiss reports
4. **Verify domain reputation** updates correctly

The 401 Unauthorized error should be resolved once the service restarts with proper Clerk initialization.

# Content Moderation Review Error Fix

## Problem

When attempting to reject (or approve) content in the moderation queue, the server threw an error:

```
moderation [07:24:32 UTC] ERROR: Failed to review content
moderation     reqId: "req-g"
moderation     queueId: "22d958fe-c822-47bd-816f-67c604d4b23d"
moderation     error: {}
```

The error object was empty because the Supabase error was being swallowed, making it difficult to diagnose.

## Root Cause

The `reviewContent` method in `apis/moderation-service/src/lib/repository.ts` was trying to update columns that **don't exist** in the `moderation_queue` table.

### Database Schema
The actual `moderation_queue` table has these columns:
```
- moderated_by      (uuid)
- moderated_at      (timestamp)
- moderator_notes   (text)
```

### Incorrect Code
The code was trying to update:
```typescript
{
    reviewed_by: moderatorId,     // ❌ Column doesn't exist
    reviewed_at: now,             // ❌ Column doesn't exist
    review_notes: notes,          // ❌ Column doesn't exist
    updated_at: now,              // ❌ Column doesn't exist
}
```

This caused the Supabase update to fail silently (or with an empty error object).

## Solution

Updated the column names to match the actual database schema:

```typescript
{
    moderated_by: moderatorId,    // ✅ Correct column name
    moderated_at: now,            // ✅ Correct column name
    moderator_notes: notes,       // ✅ Correct column name
    // Removed updated_at (doesn't exist)
}
```

## File Changed

**File:** `apis/moderation-service/src/lib/repository.ts`

**Method:** `reviewContent()`

**Lines:** ~86-108

## Testing

After this fix, you should be able to:

1. ✅ Approve content in moderation queue
2. ✅ Reject content in moderation queue
3. ✅ Add moderator notes
4. ✅ See proper timestamps for moderation actions

### Test Steps

1. Navigate to `/admin/moderation` 
2. Find a pending item in the queue
3. Click "Approve" or "Reject"
4. Optionally add notes
5. Verify the action completes without errors
6. Check that the item status updates correctly

### Verification Query

```sql
SELECT 
    id,
    title,
    domain,
    status,
    moderated_by,
    moderated_at,
    moderator_notes,
    created_at
FROM moderation_queue
WHERE id = '22d958fe-c822-47bd-816f-67c604d4b23d';
```

## Similar Issues to Watch For

This was a schema mismatch issue. Here are the correct column names for related tables:

### moderation_queue
```
✅ moderated_by (not reviewed_by)
✅ moderated_at (not reviewed_at)
✅ moderator_notes (not review_notes)
❌ No updated_at column
```

### content_reports
```
✅ resolved_by
✅ resolved_at
✅ resolution_notes
✅ updated_at (this table HAS it)
```

The naming is inconsistent between tables, which caused the confusion.

## Recommendation

Consider creating a migration to standardize column names:

**Option 1: Rename to match content_reports style**
```sql
ALTER TABLE moderation_queue 
  RENAME COLUMN moderated_by TO reviewed_by;
ALTER TABLE moderation_queue 
  RENAME COLUMN moderated_at TO reviewed_at;
ALTER TABLE moderation_queue 
  RENAME COLUMN moderator_notes TO review_notes;
ALTER TABLE moderation_queue 
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

**Option 2: Rename content_reports to match moderation_queue style**
```sql
ALTER TABLE content_reports 
  RENAME COLUMN resolved_by TO moderated_by;
ALTER TABLE content_reports 
  RENAME COLUMN resolved_at TO moderated_at;
ALTER TABLE content_reports 
  RENAME COLUMN resolution_notes TO moderator_notes;
```

**Recommended: Option 1** - Use "reviewed" terminology for moderation queue since it's the more common pattern.

## Summary

✅ **Fixed:** Column names now match database schema  
✅ **Status:** Moderation review actions will work correctly  
✅ **Impact:** Moderators can now approve/reject content  
✅ **Future:** Consider standardizing naming across moderation tables  

The moderation system is now functional! 🎉

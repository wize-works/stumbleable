# Submitted By Tracking Implementation

**Date:** October 8, 2025  
**Status:** ✅ Implemented  
**Services Modified:** discovery-service, crawler-service

---

## Overview

This document describes the implementation of user submission tracking in the `content` table. Previously, when users submitted content, the `submitted_by` field in the `content` table was not being populated, making it impossible to:

1. Track which user submitted which content
2. Notify users about TOS violations on their submissions
3. Build user reputation based on submission quality
4. Display "My Submissions" to users

---

## Problem

The `content` table has a `submitted_by` column (added in migration `016_add_submitted_by_to_content.sql`) that references `users.id` (UUID). However, the submission endpoints were:

1. **Not passing the `submittedBy` field at all** (discovery-service had a comment saying it was removed)
2. **OR passing the Clerk user ID directly** (crawler-service), which is a string like `user_2abc...` and not a valid UUID reference

This caused:
- ❌ All content submissions to have `submitted_by = NULL`
- ❌ No way to track user contribution history
- ❌ No way to notify users about content issues
- ❌ Database foreign key errors when Clerk IDs were passed directly

---

## Solution

### Database Schema

The database already has the necessary structure (from migration 016):

```sql
-- content table has:
submitted_by UUID REFERENCES users(id) ON DELETE SET NULL

-- users table has:
id UUID PRIMARY KEY              -- Internal database ID
clerk_user_id TEXT UNIQUE        -- Clerk authentication ID
```

### Implementation Changes

Both `discovery-service` and `crawler-service` submit routes now:

1. **Convert Clerk ID to internal UUID** before creating content
2. **Pass the internal UUID** to `repository.createDiscovery()`
3. **Handle lookup errors gracefully** (content still gets created, just without user tracking)

#### Code Pattern

```typescript
// 1. Import supabase client
import { supabase } from '../lib/supabase';

// 2. Before creating content, convert Clerk ID to internal UUID
let internalUserId: string | undefined;
if (validationResult.data.userId) {
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', validationResult.data.userId)
            .single();

        if (userData && !userError) {
            internalUserId = userData.id;
            fastify.log.info({
                clerkUserId: validationResult.data.userId,
                internalUserId
            }, 'Resolved internal user ID for submission tracking');
        } else {
            fastify.log.warn({
                clerkUserId: validationResult.data.userId,
                error: userError
            }, 'Could not resolve internal user ID - submission will not be tracked to user');
        }
    } catch (lookupError) {
        fastify.log.warn({
            error: lookupError,
            clerkUserId: validationResult.data.userId
        }, 'Error looking up internal user ID');
    }
}

// 3. Pass internal UUID to both moderation queue and discovery creation
await moderationService.addToModerationQueue({
    // ... other fields ...
    submittedBy: internalUserId  // Internal UUID
});

await repository.createDiscovery({
    // ... other fields ...
    submittedBy: internalUserId  // Internal UUID
});
```

---

## Files Modified

### 1. `apis/discovery-service/src/routes/submit.ts`

**Changes:**
- ✅ Added `import { supabase } from '../lib/supabase';`
- ✅ Added Clerk ID → UUID lookup before content creation
- ✅ Updated `addToModerationQueue()` call to pass `internalUserId`
- ✅ Updated `createDiscovery()` call to pass `internalUserId`
- ✅ Added logging for successful/failed user lookups

**Location:** Lines 328-385 (user lookup + moderation queue + discovery creation)

### 2. `apis/crawler-service/src/routes/submit.ts`

**Changes:** Identical to discovery-service
- ✅ Added `import { supabase } from '../lib/supabase';`
- ✅ Added Clerk ID → UUID lookup before content creation
- ✅ Updated `addToModerationQueue()` call to pass `internalUserId`
- ✅ Updated `createDiscovery()` call to pass `internalUserId`
- ✅ Added logging for successful/failed user lookups

**Location:** Lines 328-394 (user lookup + moderation queue + discovery creation)

### 3. `apis/discovery-service/src/lib/repository.ts`

**No changes needed** - Already accepts and uses `submittedBy` parameter:

```typescript
async createDiscovery(content: {
    // ... other fields ...
    submittedBy?: string;  // ✅ Already defined
}): Promise<Discovery> {
    const { data, error } = await supabase
        .from('content')
        .insert({
            // ... other fields ...
            submitted_by: content.submittedBy || null  // ✅ Already used
        })
        // ...
}
```

---

## Testing

### Manual Testing Steps

1. **Submit content as authenticated user:**
   ```bash
   curl -X POST http://localhost:7001/api/submit \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://example.com/article",
       "userId": "user_2abc123xyz"
     }'
   ```

2. **Verify `submitted_by` is populated:**
   ```sql
   SELECT 
     c.id,
     c.url,
     c.submitted_by,
     u.clerk_user_id,
     u.username
   FROM content c
   LEFT JOIN users u ON c.submitted_by = u.id
   ORDER BY c.created_at DESC
   LIMIT 10;
   ```

3. **Check logs for user lookup:**
   ```
   ✅ Success: "Resolved internal user ID for submission tracking"
   ⚠️  Warning: "Could not resolve internal user ID - submission will not be tracked to user"
   ```

### Automated Testing

```typescript
// Test case: Submit with valid user ID
const response = await fetch('http://localhost:7001/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/test',
    userId: 'user_2abc123'  // Valid Clerk ID
  })
});

// Verify content.submitted_by is set in database
const { data } = await supabase
  .from('content')
  .select('submitted_by, users(clerk_user_id)')
  .eq('url', 'https://example.com/test')
  .single();

expect(data.submitted_by).toBeTruthy();
expect(data.users.clerk_user_id).toBe('user_2abc123');
```

---

## Benefits

### Immediate
✅ **User attribution**: Every submission is linked to the submitting user  
✅ **Moderation tracking**: Moderators can see who submitted flagged content  
✅ **Trust calculation**: User trust scores now update based on their submissions  

### Future Capabilities
🔮 **User dashboards**: "My Submissions" page showing user's content history  
🔮 **TOS notifications**: Email users when their content is rejected/flagged  
🔮 **Quality metrics**: Track which users submit the best content  
🔮 **Reputation system**: Reward high-quality contributors  
🔮 **Submission limits**: Prevent spam by rate-limiting per user  

---

## Error Handling

The implementation is **graceful** and **non-blocking**:

- ✅ If user lookup fails, content is still created (just without user tracking)
- ✅ Errors are logged but don't stop the submission flow
- ✅ Invalid Clerk IDs result in `submitted_by = NULL` instead of crashes

### Example Error Scenarios

| Scenario | Result | Impact |
|----------|--------|--------|
| Valid Clerk ID, user exists | ✅ `submitted_by` populated | Tracked to user |
| Invalid Clerk ID | ⚠️ `submitted_by = NULL` | Content created, not tracked |
| User deleted after submission | ✅ `submitted_by` set to NULL (ON DELETE SET NULL) | Historical content preserved |
| Database connection error during lookup | ⚠️ `submitted_by = NULL` | Content still created |

---

## Migration Status

- ✅ Database column exists: `content.submitted_by UUID REFERENCES users(id)`
- ✅ Index exists: `idx_content_submitted_by ON content(submitted_by)`
- ✅ RLS policy exists: Users can view content they submitted
- ✅ Code updated: Both services now populate the field

**No new migrations required** - all database changes were already applied in migration 016.

---

## Related Documentation

- **Database Schema**: `database/migrations/016_add_submitted_by_to_content.sql`
- **Trust System**: `docs/TRUST_MODERATION_IMPLEMENTATION_SUMMARY.md`
- **User Service**: `apis/user-service/src/routes/users.ts`
- **Content Moderation**: `docs/CONTENT_MODERATION_ANALYSIS.md`

---

## Next Steps

1. ✅ **Deploy changes** - Restart discovery-service and crawler-service
2. 📋 **Test end-to-end** - Submit content and verify database population
3. 🔍 **Monitor logs** - Watch for user lookup warnings/errors
4. 🚀 **Build features** - Implement "My Submissions" dashboard
5. 📧 **Notifications** - Email users about their content status

---

**Status**: Implementation complete. Ready for testing and deployment.

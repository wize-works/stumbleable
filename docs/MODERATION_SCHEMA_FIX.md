# Moderation Service Schema & Content Quarantine Fix

## Issue 1: Database Schema Error
Moderation service was returning 500 errors when users tried to report content:
```
Could not find the 'content_type' column of 'content_reports' in the schema cache
Error code: PGRST204
```

### Root Cause
The `content_reports` table was missing the `content_type` column that the moderation service code expected. The TypeScript types and code were using `content_type`, but the database schema hadn't been updated.

### Solution Applied
Applied migration to add missing columns to `content_reports` table:

```sql
-- Add content_type column to content_reports table
ALTER TABLE content_reports
    ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'discovery' 
    CHECK (content_type IN ('discovery', 'submission'));

-- Add resolution_notes column if missing
ALTER TABLE content_reports
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Add updated_at column if missing
ALTER TABLE content_reports
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on content_id and content_type
CREATE INDEX IF NOT EXISTS idx_content_reports_content 
    ON content_reports(content_id, content_type);

-- Add trigger for updated_at
CREATE TRIGGER update_content_reports_updated_at
    BEFORE UPDATE ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Verification
Confirmed schema after migration:
- ✅ `content_type` column added (TEXT, default 'discovery')
- ✅ `resolution_notes` column added
- ✅ `updated_at` column added with auto-update trigger
- ✅ Index created for efficient queries

---

## Issue 2: Content Quarantine (CRITICAL SECURITY FIX)

### Problem Identified
❌ **CRITICAL**: Reported content (including porn, offensive material) was continuing to circulate to users while waiting for moderator review. When someone reported inappropriate content, it would keep appearing in the discovery feed until a moderator manually reviewed it.

### Root Cause
The `reportContent()` method only created a database record but didn't disable the content. The discovery service queries only filtered by `is_active = true` and excluded seen IDs, but didn't check for pending reports.

### Solution Implemented
✅ **Automatic Content Quarantine System**:

#### 1. When a Report is Created:
```typescript
// apis/moderation-service/src/lib/repository.ts - reportContent()
// Immediately quarantine the content to prevent further circulation
await supabase
    .from('content')
    .update({ is_active: false })
    .eq('id', contentId);
```

#### 2. When a Moderator Reviews:
```typescript
// apis/moderation-service/src/lib/repository.ts - resolveContentReport()

// If DISMISSED (false alarm):
//   - Check for other pending reports
//   - If no other pending reports, reactivate content (is_active = true)
//   - Content goes back into circulation

// If RESOLVED (confirmed issue):
//   - Content stays quarantined (is_active = false)
//   - Content will not appear in discovery feed
```

### How It Works
1. **User reports content** → Content immediately set to `is_active = false`
2. **Discovery service** continues to filter by `is_active = true` (existing behavior)
3. **Moderator reviews**:
   - **Dismisses report** → Content reactivates (if no other pending reports)
   - **Resolves report** → Content stays quarantined permanently

### Benefits
- ✅ **Immediate protection** - Harmful content removed from circulation instantly
- ✅ **No false positives** - Dismissed reports reactivate content
- ✅ **Multi-report safety** - Content stays quarantined if multiple pending reports exist
- ✅ **No discovery service changes needed** - Uses existing `is_active` filter
- ✅ **Performance** - No additional joins or queries in discovery algorithm

---

## Issue 3: Clerk ID to UUID Conversion

### Problem Identified
Moderation service was receiving Clerk user IDs (`user_33Y570gkACu4Qe3WDnlZ23edbeB`) but trying to use them directly as UUIDs in the database, causing:
```
ERROR: invalid input syntax for type uuid: "user_33Y570gkACu4Qe3WDnlZ23edbeB"
code: "22P02"
```

### Root Cause
The `reported_by` field in `content_reports` table is a UUID foreign key to `users.id`, but the frontend was passing Clerk user IDs (which are strings like `user_xxx`, not UUIDs).

### Solution Implemented
Added automatic Clerk ID to database UUID conversion:

```typescript
// Helper function to convert Clerk user ID to database UUID
async function getDatabaseUserId(clerkUserId: string): Promise<string | null> {
    const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();
    
    if (error || !user) return null;
    return user.id;
}

// In the POST /moderation/report route:
let dbUserId = clerkUserId;
if (clerkUserId.startsWith('user_')) {
    const convertedId = await getDatabaseUserId(clerkUserId);
    if (!convertedId) {
        return reply.code(404).send({ error: 'User not found' });
    }
    dbUserId = convertedId;
}
```

This pattern matches the established pattern used in:
- User Service (`apis/user-service/src/routes/lists.ts`)
- Email Service (`apis/email-service/src/routes/preferences.ts`)
- Interaction Service (`apis/interaction-service/src/store.ts`)

---

---

## Issue 4: User Experience - Stay on Inappropriate Content

### Problem Identified
When a user reported inappropriate content (e.g., porn, offensive material), they remained viewing that content. The report modal closed and they had to manually click "Stumble" to see the next discovery, forcing them to continue looking at the problematic content.

### Solution Implemented
✅ **Automatic Navigation After Report**:

```typescript
// ReportContentButton.tsx - Added callback prop
interface ReportContentButtonProps {
    discoveryId: string;
    className?: string;
    onReportSuccess?: () => void; // Callback to trigger after successful report
}

// After successful report submission:
showToast('Content reported and removed from circulation. Loading next discovery...', 'success');

if (onReportSuccess) {
    setTimeout(() => {
        onReportSuccess(); // Automatically navigate to next discovery
    }, 500);
}
```

### How It Works
1. **User reports content** → Report submitted successfully
2. **Toast shows**: "Content reported and removed from circulation. Loading next discovery..."
3. **Auto-navigation**: After 500ms delay, `onReportSuccess()` callback triggers
4. **Next discovery loads**: User automatically sees new content, doesn't have to stare at inappropriate material

### UI/UX Flow
- **Component chain**: StumblePage → DiscoveryCard → ReportContentButton
- **Callback propagation**: `handleStumble` passed as `onReportSuccess` prop through component tree
- **Seamless experience**: Report → Toast → Auto-load next → No manual action needed

---

## Status
🟢 **RESOLVED** - All four issues fixed on October 3, 2025
- ✅ Database migration applied via Supabase MCP
- ✅ Automatic content quarantine implemented
- ✅ Clerk ID to UUID conversion added
- ✅ Auto-navigation after reporting content

## Related Files
- Migration: `database/migrations/012_update_moderation_tables_for_service.sql`
- Repository: `apis/moderation-service/src/lib/repository.ts` ⭐ (quarantine logic)
- Types: `apis/moderation-service/src/types.ts`
- Routes: `apis/moderation-service/src/routes/moderation.ts`
- Discovery: `apis/discovery-service/src/lib/repository.ts` (filters by is_active)

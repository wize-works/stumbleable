# Content Metrics View Tracking Fix

## Problem Identified

The `content_metrics` table was not being properly updated with view counts. Analysis showed:

- **1999 total content items** in the database
- **Only 11 records in content_metrics** (should be 362+ for viewed content)
- **All views_count were 0** despite having 549 discovery events
- Other metrics (likes, saves, shares) were working correctly

## Root Cause

The system was tracking **when** content was shown (via `discovery_events`) but not recording it as a **view interaction** in `user_interactions`. The `update_content_scores()` trigger only fires on INSERT to `user_interactions` and specifically checks for `type = 'view'` to increment `views_count`.

### Why Views Weren't Being Counted

1. Discovery events recorded when content was served (549 events)
2. User interactions recorded for likes/saves/shares (13 events)
3. **BUT: No 'view' type interactions were being created**
4. Trigger looked for 'view' type → found none → `views_count` stayed at 0

## Solution Implemented

### 1. Backend Changes

**File: `apis/interaction-service/src/routes/feedback.ts`**
- Added `'view'` to the allowed actions in the Zod validation schema

**File: `apis/interaction-service/src/store.ts`**
- Added `'view': 'view'` to the type mapping

**File: `apis/interaction-service/src/types.ts`**
- Updated `Interaction` type to include `'view'` action

### 2. Frontend Changes

**File: `ui/portal/data/types.ts`**
- Updated `Interaction` type to include `'view'` action

**File: `ui/portal/app/stumble/page.tsx`**
- Added automatic view tracking when discovery is loaded
- Records a 'view' interaction immediately after fetching next discovery
- Added 'view' to the toast messages record (though not typically shown to users)

```typescript
// Record view interaction for metrics tracking
try {
    await InteractionAPI.recordFeedback(response.discovery.id, 'view', token);
} catch (error) {
    console.error('Error recording view:', error);
    // Non-critical, don't block the flow
}
```

### 3. Data Backfill

**File: `database/scripts/backfill_view_interactions.sql`**

Created and executed a backfill script that:
- Analyzed existing `discovery_events` (549 events)
- Created unique `user_interactions` records with `type='view'` (462 unique views)
- Respected the unique constraint `(user_id, content_id, type)` - one view per user-content pair
- Triggered the `update_content_scores()` function to update metrics

**Note:** The constraint means we count **unique views** (one per user per content), not total page loads. This is intentional and prevents inflating metrics.

## Results After Fix

### Before
```
Total Content: 1999
Total Metrics: 11
Metrics with Views: 0
All views_count: 0
```

### After Backfill
```
Total Content: 1999
Total Metrics: 362 (all content that has been viewed)
Metrics with Views: 362 (100% of metrics now have view data)
Total Views: 462 unique views
Average Views per Content: 1.28
Max Views: 4
```

### Top Viewed Content
1. **Abhishek Jha — Freelance Designer** - 4 views
2. **Cycle.js** - 4 views
3. **Enterpret** - 3 views
4. **Digital library - Wikipedia** - 3 views
5. **Golang Tutorial** - 3 views

### Metrics Breakdown
- **Views:** 362 content items with view data ✅
- **Likes:** 4 items with likes
- **Saves:** 5 items with saves  
- **Shares:** 3 items with shares
- **Skips:** 1 item with skips

## Database Architecture

### Key Tables
- `discovery_events` - Analytics: when/how content was shown (algorithm data)
- `user_interactions` - User actions: view, like, skip, save, share
- `content_metrics` - Aggregated metrics updated by trigger

### Trigger Flow
```
INSERT user_interaction (type='view')
  → trigger: update_content_scores()
    → UPSERT content_metrics
      → INCREMENT views_count
      → RECALCULATE engagement_rate
      → UPDATE content.popularity_score
```

### Unique Constraint
`user_interactions` has a unique constraint on `(user_id, content_id, type)`, meaning:
- ✅ Each user can view a piece of content once (unique view)
- ✅ Each user can like, save, share separately
- ✅ Prevents duplicate counting
- ❌ Multiple views by same user = still counted as 1

## Going Forward

### New Discoveries
- When user loads `/stumble` page
- Discovery is fetched from discovery-service
- **Frontend automatically records 'view' interaction** ✅
- Trigger updates metrics in real-time ✅

### Monitoring
To verify view tracking is working:

```sql
-- Check recent view interactions
SELECT COUNT(*) as recent_views
FROM user_interactions
WHERE type = 'view'
AND created_at > NOW() - INTERVAL '1 hour';

-- Compare discovery events to view interactions
SELECT 
    (SELECT COUNT(*) FROM discovery_events WHERE shown_at > NOW() - INTERVAL '1 hour') as discoveries,
    (SELECT COUNT(*) FROM user_interactions WHERE type = 'view' AND created_at > NOW() - INTERVAL '1 hour') as views;
```

### Expected Behavior
- Views count should grow as users stumble
- `content_metrics` should automatically expand as new content is viewed
- Engagement rates should calculate correctly (interactions / views)

## Technical Notes

### Why 549 discovery_events → 462 view interactions?
The unique constraint `(user_id, content_id, type)` means:
- If a user views the same content multiple times → only 1 view interaction
- 549 total discovery events (including repeat views)
- 462 unique user-content combinations
- This is correct and intentional behavior

### Why 362 content with metrics instead of 1999?
- Only content that has been **viewed** gets a metrics row
- 362 unique content pieces have been shown to users
- 1637 content pieces exist but haven't been discovered yet
- Metrics rows are created on first interaction (via trigger)

## Files Modified

1. `apis/interaction-service/src/routes/feedback.ts` - Added 'view' to validation
2. `apis/interaction-service/src/store.ts` - Added 'view' type mapping
3. `apis/interaction-service/src/types.ts` - Updated Interaction type
4. `ui/portal/data/types.ts` - Updated Interaction type
5. `ui/portal/app/stumble/page.tsx` - Added automatic view tracking
6. `database/scripts/backfill_view_interactions.sql` - Created backfill script (executed)

## Verification Commands

```sql
-- Quick health check
SELECT 
    (SELECT COUNT(*) FROM content) as total_content,
    (SELECT COUNT(*) FROM content_metrics) as content_with_metrics,
    (SELECT SUM(views_count) FROM content_metrics) as total_views,
    (SELECT SUM(likes_count) FROM content_metrics) as total_likes,
    (SELECT SUM(saves_count) FROM content_metrics) as total_saves;

-- Check if views are being tracked in real-time
SELECT 
    c.title,
    cm.views_count,
    cm.likes_count,
    cm.saves_count,
    cm.last_updated
FROM content_metrics cm
JOIN content c ON c.id = cm.content_id
ORDER BY cm.last_updated DESC
LIMIT 10;
```

## Summary

✅ **Problem Solved:** View counts are now being tracked correctly  
✅ **Backend Updated:** Interaction service accepts 'view' actions  
✅ **Frontend Updated:** Automatically records views when discoveries load  
✅ **Data Fixed:** Backfilled 462 historical views from discovery events  
✅ **Metrics Accurate:** 362 content items now have complete view data  
✅ **Real-time Tracking:** New views will be automatically recorded going forward  

The content metrics system is now fully operational and will accurately track all user interactions including views! 🎉

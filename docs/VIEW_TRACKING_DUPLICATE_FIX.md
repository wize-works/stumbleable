# View Tracking: Duplicate Key Error Fix & Total Views

## Problem #1: Duplicate Key Error

### Error Message
```
duplicate key value violates unique constraint "user_interactions_user_id_content_id_type_key"
Key (user_id, content_id, type)=(015c2892-e282-409c-b221-d308be5420c0, 4796567a-993d-4b0b-afa9-f67c76ca3691, view) already exists.
```

### Root Cause
- Frontend records a `'view'` interaction **every time** a discovery loads
- Database has unique constraint: `(user_id, content_id, type)`
- When a user views the same content twice → constraint violation

### Solution Implemented
Updated `apis/interaction-service/src/store.ts` to:

1. **Check for existing view first** (for view type only)
   - Query database for existing view record
   - If found, return existing record instead of inserting

2. **Graceful error handling**
   - If duplicate key error occurs for views, return synthetic response
   - Log the occurrence but don't throw error
   - Other interaction types still throw errors on conflicts

```typescript
// Check if view already exists
if (dbType === 'view' && userId) {
    const { data: existingView } = await supabase
        .from('user_interactions')
        .select('id, created_at')
        .match({ user_id: userId, content_id: discoveryId, type: 'view' })
        .single();

    if (existingView) {
        return existingView; // Already recorded
    }
}

// If insert fails with duplicate for views, handle gracefully
if (interactionError.code === '23505' && dbType === 'view') {
    return synthetic response; // Don't crash
}
```

## Problem #2: Unique Views vs Total Views

### Current Behavior
- `views_count` = **Unique viewers** (one per user per content)
- With unique constraint, we can't track total page views

### Business Question
**"How many times was this page viewed overall?"**

Current answer: "We don't know, we only know how many unique users viewed it"

### Solution: Track Both Metrics

Created migration: `database/migrations/add_total_views_tracking.sql`

#### New Schema
```sql
content_metrics:
  - views_count          -- Unique viewers (existing)
  - total_views_count    -- Total page views (NEW)
```

#### How It Works

**Unique Views** (`views_count`)
- Source: `user_interactions` with type='view'
- Constraint: One per user per content
- Updated by: `update_content_scores()` trigger
- Metric: "How many users saw this?"

**Total Views** (`total_views_count`)
- Source: `discovery_events` (every time content is shown)
- Constraint: None - counts all views
- Updated by: `update_total_views_on_discovery()` trigger (NEW)
- Metric: "How many times was this viewed?"

#### New Trigger
```sql
CREATE TRIGGER trigger_update_total_views
    AFTER INSERT ON discovery_events
    FOR EACH ROW
    EXECUTE FUNCTION update_total_views_on_discovery();
```

Every time a discovery_event is created → increment total_views_count

## Comparison: Before vs After

### Before (Issue)
```
Content: "Example Article"
views_count: 3 (unique users who viewed it)
total_views: ??? (unknown - can't track repeat views)

Problem: If User A views it 10 times, still shows as 1 view
```

### After (Fixed)
```
Content: "Example Article"
views_count: 3 (unique users who viewed it)
total_views_count: 15 (actual page loads)
views_per_user: 5 (average engagement depth)

Insight: 3 users generated 15 total views (5 views each on average)
```

## Migration Steps

### 1. Apply Migration
```bash
# Run the migration
psql -f database/migrations/add_total_views_tracking.sql
```

Or use Supabase MCP tool:
```typescript
await mcp_supabase_apply_migration({
    name: "add_total_views_tracking",
    query: "..." // SQL from file
});
```

### 2. Verify Results
```sql
-- Check both metrics
SELECT 
    c.title,
    cm.views_count as unique_viewers,
    cm.total_views_count as total_page_views,
    ROUND((cm.total_views_count::numeric / NULLIF(cm.views_count, 0)), 2) as views_per_user
FROM content_metrics cm
JOIN content c ON c.id = cm.content_id
WHERE cm.total_views_count > 0
ORDER BY cm.total_views_count DESC
LIMIT 10;
```

### 3. Update Frontend Types (Optional)
```typescript
// data/types.ts
export type ContentMetrics = {
    views_count: number;        // Unique viewers
    total_views_count: number;  // Total page views
    likes_count: number;
    saves_count: number;
    shares_count: number;
    skip_count: number;
    engagement_rate: number;
};
```

## Analytics Benefits

### New Metrics Available

1. **Views per User** = total_views / views_count
   - Measures engagement depth
   - Higher = users return to content multiple times

2. **Repeat View Rate** = (total_views - views_count) / total_views
   - Percentage of views that are repeat visits
   - Higher = sticky content

3. **Engagement Score** = (likes + saves) / views_count
   - Conversion rate from view to action
   - Uses unique viewers (not inflated by repeats)

### Example Dashboard Queries

```sql
-- Top content by total views
SELECT title, total_views_count, views_count, 
       ROUND(total_views_count::numeric / views_count, 2) as avg_views_per_user
FROM content_metrics cm
JOIN content c ON c.id = cm.content_id
ORDER BY total_views_count DESC
LIMIT 20;

-- Most "sticky" content (highest repeat views)
SELECT title, 
       views_count as unique_viewers,
       total_views_count as total_views,
       total_views_count - views_count as repeat_views,
       ROUND((total_views_count - views_count)::numeric / total_views_count * 100, 1) as repeat_rate
FROM content_metrics cm
JOIN content c ON c.id = cm.content_id
WHERE total_views_count > 5
ORDER BY repeat_rate DESC
LIMIT 20;

-- Engagement rate (not inflated by repeat views)
SELECT title,
       views_count as unique_viewers,
       likes_count + saves_count as engaged_users,
       ROUND((likes_count + saves_count)::numeric / NULLIF(views_count, 0) * 100, 1) as engagement_rate
FROM content_metrics cm
JOIN content c ON c.id = cm.content_id
WHERE views_count > 10
ORDER BY engagement_rate DESC
LIMIT 20;
```

## Testing the Fix

### 1. Test Duplicate View Handling
```bash
# View same content twice as same user
# Should succeed both times without error
curl -X POST http://localhost:7002/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"discoveryId": "abc123", "action": "view"}'

# Second request (should succeed, not error)
curl -X POST http://localhost:7002/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"discoveryId": "abc123", "action": "view"}'
```

### 2. Verify Metrics
```sql
-- Check that views_count = 1 (unique)
-- But total_views_count = 2 (total)
SELECT views_count, total_views_count
FROM content_metrics
WHERE content_id = 'abc123';
```

## Files Modified

1. **Backend Fix**
   - `apis/interaction-service/src/store.ts` - Handle duplicate views gracefully

2. **Database Migration**
   - `database/migrations/add_total_views_tracking.sql` - Add total_views_count column and trigger

3. **Documentation**
   - `docs/VIEW_TRACKING_DUPLICATE_FIX.md` - This file
   - `docs/CONTENT_METRICS_VIEW_TRACKING_FIX.md` - Original view tracking doc (update needed)

## Summary

✅ **Error Fixed:** Duplicate key constraint no longer crashes the app  
✅ **Graceful Handling:** Repeat views silently succeed without inserting duplicates  
✅ **Better Metrics:** Now tracking both unique viewers AND total page views  
✅ **New Insights:** Can calculate views-per-user and repeat view rates  
✅ **Backward Compatible:** Existing queries still work, new column optional  

## Recommendations

1. **Apply the migration** to start tracking total views
2. **Update admin dashboard** to show both metrics
3. **Use unique views** for engagement rate calculations
4. **Use total views** for popularity rankings
5. **Calculate views-per-user** to find sticky content

The system now handles repeat views gracefully and provides richer analytics! 🎉

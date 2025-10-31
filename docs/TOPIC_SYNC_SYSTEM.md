# Topic Synchronization System - Complete Guide

## Problem Statement

Content topics in Stumbleable are stored in **two places**:
1. `content.topics` (TEXT[] array) - Denormalized storage for fast reads
2. `content_topics` (junction table) - Relational storage for filtering and discovery queries

These two storage locations can become **out of sync**, causing:
- **Discovery queries to miss content** (missing junction entries)
- **Orphaned junction entries** (topics removed from TEXT[] but not from junction)
- **Data integrity issues** visible in the Topics Analytics dashboard

## Root Cause Analysis

### When Content is Created ✅
The `createDiscovery()` method in all services (discovery-service, crawler-service) properly syncs both:
```typescript
// 1. Insert content with topics TEXT[] array
await supabase.from('content').insert({ topics: ['technology', 'ai'] });

// 2. Sync to junction table
await supabase.from('content_topics').insert([
  { content_id, topic_id: 'tech_uuid', confidence_score: 0.8 },
  { content_id, topic_id: 'ai_uuid', confidence_score: 0.8 }
]);
```

### When Content is Updated ❌ (Previous Implementation)
The enhance endpoint in crawler-service updated only the TEXT[] array:
```typescript
// PROBLEM: Only updates denormalized storage
await supabase.from('content').update({
  topics: [...existingTopics, ...newTopics]
});
// Junction table NOT updated - causes mismatches!
```

This caused bidirectional sync issues:
- **Positive diffs** (TEXT[] > junction): Topics added via enhance but not synced
- **Negative diffs** (junction > TEXT[]): Orphaned entries when TEXT[] was overwritten

## Solution: Multi-Layer Sync System

We implemented **three layers of protection** to prevent future mismatches:

### Layer 1: Application-Level Sync Function ✅

**File**: `apis/crawler-service/src/lib/sync-topics.ts`

**Purpose**: Reusable utility function that syncs TEXT[] to junction table

**Features**:
- Compares TEXT[] array to junction table entries
- Adds missing junction entries
- Removes orphaned junction entries
- Validates topic names against `topics` table
- Handles errors gracefully without failing the main operation

**Usage**:
```typescript
import { syncTopicsToJunction } from '../lib/sync-topics';

// After updating content.topics
await supabase.from('content').update({ topics: newTopics }).eq('id', contentId);

// Immediately sync to junction table
await syncTopicsToJunction(contentId, newTopics);
```

**Code Flow**:
```typescript
async function syncTopicsToJunction(contentId: string, topicNames: string[]) {
  // 1. Look up topic IDs from topic names
  const topicRecords = await supabase.from('topics')
    .select('id, name')
    .in('name', topicNames);
  
  // 2. Get existing junction entries
  const existingJunction = await supabase.from('content_topics')
    .select('topic_id')
    .eq('content_id', contentId);
  
  // 3. Calculate diffs
  const toAdd = validTopicIds.filter(id => !existingTopicIds.includes(id));
  const toRemove = existingTopicIds.filter(id => !validTopicIds.includes(id));
  
  // 4. Remove orphaned entries
  if (toRemove.length > 0) {
    await supabase.from('content_topics')
      .delete()
      .eq('content_id', contentId)
      .in('topic_id', toRemove);
  }
  
  // 5. Add missing entries
  if (toAdd.length > 0) {
    await supabase.from('content_topics')
      .insert(toAdd.map(id => ({ content_id: contentId, topic_id: id })));
  }
}
```

### Layer 2: Enhance Endpoint Integration ✅

**File**: `apis/crawler-service/src/routes/enhance.ts`

**Changes**: Added sync calls after EVERY topics update (2 locations)

**Location 1** (Line ~164):
```typescript
if (Object.keys(fieldsToUpdate).length > 1) {
  await supabase.from('content').update(fieldsToUpdate).eq('id', record.id);
  
  // CRITICAL: Sync topics to junction table if topics were updated
  if (fieldsToUpdate.topics) {
    await syncTopicsToJunction(record.id, fieldsToUpdate.topics);
  }
  
  enhanced++;
}
```

**Location 2** (Line ~364):
```typescript
if (Object.keys(fieldsToUpdate).length > 1) {
  await supabase.from('content').update(fieldsToUpdate).eq('id', record.id);
  
  // CRITICAL: Sync topics to junction table if topics were updated
  if (fieldsToUpdate.topics) {
    await syncTopicsToJunction(record.id, fieldsToUpdate.topics);
  }
  
  succeeded++;
}
```

### Layer 3: Database Trigger (Safety Net) ✅

**File**: `database/migrations/004_add_topic_sync_trigger.sql`

**Purpose**: Automatic sync at the database level - catches ANY topics update

**How It Works**:
1. Trigger fires on `UPDATE OF topics` to content table
2. Only executes when `OLD.topics IS DISTINCT FROM NEW.topics`
3. Calculates differences between new TEXT[] and existing junction entries
4. Removes orphaned junction entries
5. Adds missing junction entries

**Advantages**:
- **Works for ALL updates** (even manual SQL, admin tools, other services)
- **No code changes required** to existing update queries
- **Transparent** - developers don't need to remember to sync
- **Atomic** - runs in same transaction as the UPDATE

**SQL Implementation**:
```sql
CREATE OR REPLACE FUNCTION sync_content_topics_on_update()
RETURNS TRIGGER AS $$
DECLARE
    new_topic_ids UUID[];
    existing_topic_ids UUID[];
    topics_to_add UUID[];
    topics_to_remove UUID[];
    topic_name TEXT;
BEGIN
    IF OLD.topics IS DISTINCT FROM NEW.topics THEN
        -- Get topic IDs from names
        FOREACH topic_name IN ARRAY NEW.topics LOOP
            SELECT id INTO topic_record FROM topics WHERE name = topic_name;
            IF FOUND THEN
                new_topic_ids := array_append(new_topic_ids, topic_record.id);
            END IF;
        END LOOP;
        
        -- Get existing junction entries
        SELECT ARRAY_AGG(topic_id) INTO existing_topic_ids
        FROM content_topics WHERE content_id = NEW.id;
        
        -- Calculate and apply differences
        -- ... (removes orphaned, adds missing)
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_content_topics_trigger
    AFTER UPDATE OF topics ON content
    FOR EACH ROW
    WHEN (OLD.topics IS DISTINCT FROM NEW.topics)
    EXECUTE FUNCTION sync_content_topics_on_update();
```

## Data Quality & Invalid Topics

### Invalid Topic Handling

The sync system **automatically filters out invalid topic names**:

```typescript
// Example: content.topics = ['design', 'technology', 'random-garbage']
// Only 'technology' exists in topics table
// Result: Junction table will only have 'technology' entry
```

This is **correct behavior** - it prevents garbage data in the junction table.

### Common Invalid Topics Found

From analysis of existing data:
- URLs (e.g., `https://example.com`)
- Dates (e.g., `2024-01-15`)
- HTML files (e.g., `index.html`)
- Typos (e.g., `design` instead of `design-typography`)

These come from:
1. **Broken topic classifier** (historical)
2. **Manual data entry errors**
3. **Metadata scraping bugs**

### Cleaning Invalid Topics

Run the sync script to fix existing data:
```bash
cd scripts
node sync-topics-to-junction.cjs --yes
```

This will:
- Scan all content items
- Extract valid topics from TEXT[] arrays
- Add missing junction entries
- Report invalid topics found

## Testing

### Automated Test Script

**File**: `scripts/test-topic-sync.cjs`

**What It Tests**:
1. Finds a content item with topics
2. Records current junction table state
3. Updates the topics TEXT[] array
4. Waits for database trigger
5. Verifies junction table was synced
6. Restores original state

**Run**:
```bash
cd scripts
node test-topic-sync.cjs
```

**Expected Output**:
```
✅ SUCCESS! Database trigger is working correctly!
   - JSONB and junction table are in sync
   - All topics from TEXT[] are in junction table
   - No orphaned entries detected
```

### Manual Testing

Test the enhance endpoint:
```bash
# 1. Start crawler service
npm run dev:crawler

# 2. Trigger enhancement
curl -X POST http://localhost:7004/api/enhance \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'

# 3. Check logs for sync messages
# Should see: "🔄 Synced topics for content {id}: +X, -Y"
```

## Monitoring Data Quality

### Topics Analytics Dashboard

**URL**: http://localhost:3000/admin/topics

**Shows**:
- Content count per topic
- Data quality mismatches
- Empty topics
- Invalid topic warnings

**Mismatch Detection**:
```typescript
// Compares junction table count to TEXT[] count
const mismatch = junctionCount !== textArrayCount;
if (mismatch) {
  // Shows warning in dashboard with specific counts
}
```

### Count Topics Script

**File**: `scripts/count-topics.js`

**Shows**:
- Detailed breakdown per topic
- Data quality issues
- Top topics by content count

**Run**:
```bash
cd scripts
node count-topics.js
```

## Architecture Decisions

### Why Dual Storage?

**TEXT[] Array** (Denormalized):
- ✅ Fast reads (no JOIN required)
- ✅ Simple queries (`WHERE topics @> ARRAY['technology']`)
- ✅ Works with array operators
- ❌ Harder to maintain integrity
- ❌ No foreign key constraints

**Junction Table** (Relational):
- ✅ Proper foreign keys
- ✅ Enables complex discovery queries
- ✅ Supports confidence scores
- ✅ Better data integrity
- ❌ Requires JOINs for reads
- ❌ More complex to maintain

**Decision**: Keep both, ensure they stay in sync via triggers + application code.

### Sync Direction

We sync **TEXT[] → Junction Table** (one-way):

**Why?**
- TEXT[] is the source of truth (set by classifiers, scrapers)
- Junction table is derived data (for querying)
- Makes updates simpler (update TEXT[], sync follows)

**Not Junction → TEXT[]** because:
- Junction entries can have invalid topic IDs
- TEXT[] drives the content classification
- Simpler mental model for developers

## Migration Guide

### For New Services

When creating a new service that updates content topics:

1. **Import the sync utility**:
```typescript
import { syncTopicsToJunction } from './lib/sync-topics';
```

2. **Call after every topics update**:
```typescript
await supabase.from('content').update({ topics: newTopics });
await syncTopicsToJunction(contentId, newTopics);
```

3. **No need to manually sync** - database trigger handles it as backup

### For Existing Code

Search for topics updates:
```bash
grep -r "update.*topics" apis/
```

Add sync calls after each update.

## Troubleshooting

### Mismatches Still Appearing

**Check**:
1. Is the database trigger installed? Run migration 004
2. Are enhance endpoints calling `syncTopicsToJunction()`?
3. Run `test-topic-sync.cjs` to verify trigger works
4. Check for direct SQL updates bypassing trigger

### Sync Function Not Working

**Debug**:
```typescript
const result = await syncTopicsToJunction(contentId, topics);
console.log('Sync result:', result);
// { success: true, added: 2, removed: 1 }
```

**Common Issues**:
- Invalid topic names (not in `topics` table)
- Database connection errors
- Missing Supabase env vars

### Performance Concerns

The sync function is **lightweight**:
- 2 SELECT queries (topic IDs, existing junction)
- 1 DELETE query (if orphaned entries exist)
- 1 INSERT query (if missing entries exist)

Total: ~4 queries per sync, minimal overhead.

The database trigger runs **in same transaction** as UPDATE, no extra round trip.

## Future Improvements

### Possible Enhancements

1. **Batch sync utility** - Sync multiple content items at once
2. **Sync validation** - Periodic job to find and fix mismatches
3. **Metrics tracking** - Count sync operations, measure drift
4. **Confidence score sync** - Also sync confidence scores from TEXT[] metadata
5. **Bidirectional sync** - Allow junction table updates to flow back to TEXT[]

### Migration to Single Source

If we want to eliminate dual storage:

**Option A**: Keep only TEXT[]
- Remove junction table
- Update discovery queries to use `topics @> ARRAY['...']`
- Simpler, but slower queries

**Option B**: Keep only junction table
- Remove TEXT[] column
- Update all reads to JOIN
- Better integrity, but more complex queries

**Decision**: Keep both for now, revisit if sync issues persist.

## Summary

✅ **Multi-layer sync system implemented**:
1. Application-level sync function
2. Enhance endpoint integration
3. Database trigger safety net

✅ **Prevents future mismatches** by syncing on every update

✅ **Data quality monitoring** via Topics Analytics dashboard

✅ **Comprehensive testing** with automated test script

✅ **Documentation** for future developers

🎯 **Result**: Topics will stay in sync, discovery queries will work correctly, data integrity maintained.

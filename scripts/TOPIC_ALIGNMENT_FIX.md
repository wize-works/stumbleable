# Content-to-Topic Alignment Fix

## Current Situation

**Analysis Date:** October 26, 2025

### Database Statistics
- **Total Content Items:** 41,478
- **Content with ANY Topics:** ~1,601 (3.86%)
- **Content WITHOUT Topics:** ~39,877 (96.14%)

### Topic Assignment Breakdown
| Location | Count | Percentage |
|----------|-------|------------|
| JSONB Column Only | 906 | 2.18% |
| Junction Table Only | 629 | 1.52% |
| Both JSONB & Junction | 66 | 0.16% |
| No Topics At All | 28 | 0.07% |
| **Content Missing Topics** | **39,877** | **96.14%** |

### The Problem
You mentioned having 10,000 items with topics, but the actual count is **only 1,601 items with topics** (906 + 629 + 66). This means:

1. **96% of your content has NO topic assignments** - making discovery nearly impossible
2. **906 items** have topics in JSONB but not in the junction table (discovery queries won't find them)
3. **629 items** have topics in junction table but not in JSONB (inconsistent data)
4. **Only 66 items** (0.16%) are properly aligned with topics in both places

### Why This Happened
- The `content_topics` junction table was added later in development
- Early content was assigned topics only to the JSONB column
- Some content was imported via crawlers that only populated the junction table
- The backfill scripts weren't run after the schema changes
- No automatic sync mechanism between JSONB and junction table

## Solution: 3-Step Process

### Step 1: Sync Existing Topics (Quick Fix)
**Target:** 1,535 items (906 JSONB-only + 629 junction-only)  
**Time:** ~2-5 minutes  
**Risk:** Low

This ensures all existing topic assignments are consistent across both storage locations.

```powershell
# Sync JSONB topics to junction table (906 items)
npx tsx sync-jsonb-to-junction.ts

# Sync junction topics back to JSONB (629 items)  
npx tsx sync-junction-to-jsonb.ts

# Verify alignment improved
npx tsx analyze-topic-alignment.ts
```

**Expected Result:** ~1,601 items with topics in BOTH locations

### Step 2: Classify Remaining Content (Main Fix)
**Target:** ~39,877 items without topics  
**Time:** ~30-60 minutes (depending on server)  
**Risk:** Medium (bulk operation)

This uses keyword-based classification to assign topics to all unclassified content.

```powershell
# Run backfill script (processes all content without topics)
npx tsx backfill-topics.ts
```

**Expected Result:** All 41,478 items have at least 1 topic assigned

### Step 3: Verify & Validate
**Target:** All content  
**Time:** ~1 minute  
**Risk:** None (read-only)

```powershell
# Run analysis again to verify success
npx tsx analyze-topic-alignment.ts
```

**Expected Result:**
- Total content with topics: ~41,478 (100%)
- Content with BOTH JSONB & Junction: ~41,478 (100%)
- Content with NO topics: 0 (0%)

## Topic Classification Logic

### Domain-Based Classification
The backfill script recognizes these domain patterns:

- **Technology:** github.com, stackoverflow.com, codepen.io
- **Science:** arxiv.org, nature.com, sciencedirect.com
- **Business:** bloomberg.com, wsj.com, forbes.com
- **Digital Art:** behance.net, dribbble.com, artstation.com
- **Games:** itch.io, newgrounds.com, kongregate.com
- **Weird Web:** neocities.org, glitch.com
- **Music:** soundcloud.com, bandcamp.com, spotify.com
- **Space:** nasa.gov, esa.int
- **Retro:** archive.org, oldgames.sk

### Keyword-Based Classification
Analyzes URL, title, and description for keywords across 44 topics:

**Core Topics:**
- technology, ai, science, business, culture, education, health, politics, sports, food, travel

**Creative:**
- digital-art, music-sound, literature-writing, design-typography

**Curiosity:**
- random-generators, weird-web, retro-internet, mysteries-conspiracies, quizzes-puzzles

**Play:**
- browser-games, simulations, vr-ar-experiments, interactive-storytelling

**And 20+ more specialized topics...**

### Fallback Strategy
If no topics match, assigns `weird-web` as default (embracing the quirky nature of unlabeled content)

## Implementation Scripts

### analyze-topic-alignment.ts
**Purpose:** Diagnose the current state of topic assignments  
**Output:** Detailed statistics and recommendations  
**Safety:** Read-only, no database changes  

### sync-jsonb-to-junction.ts
**Purpose:** Sync topics from JSONB → Junction Table  
**Target:** 906 items with JSONB-only topics  
**Safety:** Only inserts missing junction table entries  
**Batch Size:** 50 items per batch  
**Confidence Score:** 0.8 (high confidence - manually assigned)

### sync-junction-to-jsonb.ts
**Purpose:** Sync topics from Junction Table → JSONB  
**Target:** 629 items with junction-only topics  
**Safety:** Only updates JSONB column for items missing it  
**Batch Size:** 50 items per batch  

### backfill-topics.ts
**Purpose:** Classify and assign topics to all unclassified content  
**Target:** ~39,877 items without topics  
**Safety:** Skips items that already have topics  
**Batch Size:** Processes all items, updates in real-time  
**Confidence Score:** 0.7 (moderate confidence - automated classification)

## Execution Plan

### Recommended Order (Safe & Incremental)

```powershell
# Step 0: Baseline Analysis
npx tsx analyze-topic-alignment.ts
# Save this output for comparison

# Step 1A: Sync JSONB → Junction (906 items)
npx tsx sync-jsonb-to-junction.ts

# Step 1B: Verify Step 1A
npx tsx analyze-topic-alignment.ts
# Should show ~0 items with JSONB-only topics

# Step 1C: Sync Junction → JSONB (629 items)  
npx tsx sync-junction-to-jsonb.ts

# Step 1D: Verify Step 1C
npx tsx analyze-topic-alignment.ts
# Should show ~1,601 items fully aligned

# Step 2: Backfill Remaining Content (~39,877 items)
npx tsx backfill-topics.ts
# This will take 30-60 minutes

# Step 3: Final Verification
npx tsx analyze-topic-alignment.ts
# Should show ~41,478 items (100%) with topics in both places
```

### Quick Mode (All at Once)
```powershell
# Run all sync and backfill operations
npx tsx sync-jsonb-to-junction.ts && npx tsx sync-junction-to-jsonb.ts && npx tsx backfill-topics.ts && npx tsx analyze-topic-alignment.ts
```

## Post-Fix Validation Queries

### Check Total Alignment
```sql
-- Should return ~41,478 (all content has topics)
SELECT COUNT(*) as content_with_jsonb_topics
FROM content 
WHERE topics IS NOT NULL AND ARRAY_LENGTH(topics, 1) > 0;

-- Should return ~41,478 (all content has junction entries)
SELECT COUNT(DISTINCT content_id) as content_with_junction_topics
FROM content_topics;
```

### Check Topic Distribution
```sql
-- Top topics by content count
SELECT t.name, COUNT(*) as content_count
FROM content_topics ct
JOIN topics t ON ct.topic_id = t.id
GROUP BY t.name
ORDER BY content_count DESC
LIMIT 20;
```

### Find Misaligned Content (Should be 0)
```sql
-- Content with JSONB but no junction entries
SELECT COUNT(*) as jsonb_only
FROM content c
WHERE (topics IS NOT NULL AND ARRAY_LENGTH(topics, 1) > 0)
  AND NOT EXISTS (
    SELECT 1 FROM content_topics ct WHERE ct.content_id = c.id
  );

-- Content with junction but no JSONB
SELECT COUNT(*) as junction_only
FROM content c
WHERE EXISTS (
    SELECT 1 FROM content_topics ct WHERE ct.content_id = c.id
  )
  AND (topics IS NULL OR ARRAY_LENGTH(topics, 1) = 0);
```

## Expected Outcomes

### Before Fix
- Discovery system only finds ~1,601 items (3.86% of content)
- Topic filtering returns very few results
- Most content is invisible to users
- Inconsistent topic data between JSONB and junction table

### After Fix
- Discovery system can find all 41,478 items
- Topic filtering returns comprehensive results
- Content properly distributed across 44 topics
- 100% alignment between JSONB and junction table
- Better discovery experience with more diverse content

## Monitoring & Maintenance

### Add to Regular Health Checks
```powershell
# Add this to your health-check script
npx tsx analyze-topic-alignment.ts
```

### Prevent Future Misalignment
The existing database trigger `sync_content_topics_trigger` should automatically sync JSONB → junction table on INSERT/UPDATE, but you should verify it's working:

```sql
-- Check if trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'sync_content_topics_trigger';
```

If missing, review migration `004_add_topic_sync_trigger.sql`

## Troubleshooting

### Script Fails with "Missing environment variables"
**Solution:** Ensure `apis/discovery-service/.env` contains:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Script Times Out
**Solution:** The backfill processes in batches. If it fails mid-run, just run it again - it skips items that already have topics.

### Low Confidence Classifications
**Solution:** Manual review and refinement of the `topicKeywords` mapping in `backfill-topics.ts` to improve automated classification.

### Content Gets Wrong Topics
**Solution:** The classification is best-effort. For important content, use the admin dashboard to manually reassign topics. The scripts won't overwrite existing assignments.

## Success Metrics

After running all scripts, verify:
- ✅ All ~41,478 items have topics in JSONB column
- ✅ All ~41,478 items have entries in content_topics junction table  
- ✅ Topic distribution is reasonable (no single topic dominates)
- ✅ Discovery queries return results for all topics
- ✅ Zero items in "JSONB-only" or "Junction-only" categories

---

**Total Time Investment:** ~45-75 minutes  
**Risk Level:** Low (all scripts have safeguards)  
**Impact:** Massive improvement in content discoverability

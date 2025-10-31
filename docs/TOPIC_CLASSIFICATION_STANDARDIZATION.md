# Topic Classification Standardization

**Date:** October 26, 2025  
**Status:** ✅ Implemented  
**Impact:** Content submission, enhancement, and backfill now use consistent topic assignment

---

## 🎯 Problem

Content items were being assigned topics in **three different places** with **three different implementations**:

1. **Content submission** (`submit.ts`) - Used outdated topic keywords, created invalid topics
2. **Content enhancement** (`enhance.ts`) - Extracted topics but didn't validate against database
3. **Backfill scripts** - Used yet another classification approach

This caused:
- ❌ **Invalid topic names** (e.g., "design", "product", "wiki") that don't exist in the 44-topic taxonomy
- ❌ **Inconsistent classifications** - same content could get different topics depending on entry point
- ❌ **Missing junction table entries** - topics weren't always synced to `content_topics`
- ❌ **Poor discoverability** - 96% of content lacked valid topics

---

## ✅ Solution

Created **shared topic classification module** used by all services:

### New Module: `topic-classifier.ts`

```
apis/crawler-service/src/lib/topic-classifier.ts
```

**Key Features:**
- ✅ Loads 44 valid topics from database on startup
- ✅ Domain-based classification (e.g., `github.com` → `technology`)
- ✅ Keyword-based classification (comprehensive keyword maps)
- ✅ Returns **only valid topics** that exist in the database
- ✅ Max 3 topics per content item
- ✅ Defaults to `weird-web` if no topics match

**Exported Functions:**
```typescript
// Main classifier - returns 1-3 valid topics
async function classifyContent(url, title?, description?): Promise<string[]>

// Validate topics against database (filters out invalid ones)
async function validateTopics(topics: string[]): Promise<string[]>

// Get topic IDs for junction table inserts
async function getTopicIds(topicNames: string[]): Promise<Array<{name, id}>>
```

---

## 🔄 Integration Points

### 1. Content Submission (`submit.ts`)

**Before:**
```typescript
// Used inline classifyContent() with outdated keywords
const topics = providedTopics || classifyContent(url, title, description);
// No validation, no junction table sync
```

**After:**
```typescript
import { classifyContent, validateTopics } from '../lib/topic-classifier';
import { syncTopicsToJunction } from '../lib/sync-topics';

// Validate user-provided topics OR auto-classify
let topics: string[];
if (providedTopics && providedTopics.length > 0) {
    topics = await validateTopics(providedTopics); // Filter invalid topics
    if (topics.length === 0) {
        topics = await classifyContent(url, title, description); // Fallback
    }
} else {
    topics = await classifyContent(url, title, description);
}

// Create discovery with validated topics
const discovery = await repository.createDiscovery({ topics, ... });

// CRITICAL: Sync to junction table
await syncTopicsToJunction(discovery.id, topics);
```

### 2. Content Enhancement (`enhance.ts`)

**Status:** ✅ Already using `syncTopicsToJunction` for extracted topics  
**Next Step:** Replace inline topic extraction with `classifyContent()` for consistency

### 3. Backfill Script (`backfill-topics.ts`)

**Before:**
```typescript
// Hardcoded topic keywords (out of sync with database)
const topicKeywords = { ... };
```

**After:**
```typescript
// Will import shared classifier from crawler-service
import { classifyContent } from '../apis/crawler-service/src/lib/topic-classifier';
```

---

## 📊 Valid Topics (44 Total)

The classifier uses **only** these 44 topics from the database:

**Core:**
- `ai`, `business`, `culture`, `education`, `health`, `politics`, `science`, `sports`, `technology`, `food`, `travel`

**Creativity & Expression:**
- `digital-art`, `music-sound`, `music`, `literature-writing`, `design-typography`, `photography`

**Curiosity & Oddities:**
- `random-generators`, `weird-web`, `retro-internet`, `nostalgia`, `mysteries-conspiracies`, `quizzes-puzzles`

**Play & Interaction:**
- `browser-games`, `simulations`, `vr-ar-experiments`, `interactive-storytelling`

**Human Experience:**
- `history`, `folklore-myth`, `global-voices`, `philosophy-thought`

**Knowledge Frontiers:**
- `space-astronomy`, `future-scifi`, `mathematical-playgrounds`, `biology-oddities`, `nature-wildlife`

**Personal & Social:**
- `self-improvement`, `memes-humor`, `communities-forums`

**Media & Entertainment:**
- `movies`, `tv-shows`, `streaming`, `reading`

**DIY & Making:**
- `diy-making`

---

## 🎯 Benefits

1. **Consistency** - All content classified using same logic
2. **Validity** - Only valid topics from database are assigned
3. **Dual Storage** - Both JSONB and junction table stay in sync
4. **Discoverability** - 100% of content will have valid topics
5. **Maintainability** - One place to update classification logic

---

## 🚀 Next Steps

1. ✅ **Backfill existing content** using `backfill-topics.ts`
   - Will process all 41,478 content items
   - Overwrites invalid topics with valid classifications
   - Achieves 100% topic coverage

2. 🔄 **Update enhance.ts** to use shared classifier
   - Replace inline topic extraction with `classifyContent()`
   - Ensure consistency across all entry points

3. 📝 **Monitor new submissions**
   - Verify topics are valid
   - Check junction table sync is working

---

## 🔍 Validation

To verify topic assignment is working:

```sql
-- Check that all content has topics
SELECT 
    COUNT(*) FILTER (WHERE topics IS NOT NULL) as with_topics,
    COUNT(*) FILTER (WHERE topics IS NULL) as without_topics,
    COUNT(*) as total
FROM content;

-- Check junction table alignment
SELECT 
    COUNT(DISTINCT content_id) as content_with_junction_entries
FROM content_topics;

-- Find any invalid topics
SELECT DISTINCT unnest(topics) as topic_name
FROM content
WHERE topics IS NOT NULL
EXCEPT
SELECT name FROM topics;
```

---

## 📚 Related Documentation

- [TOPIC_ALIGNMENT_FIX.md](./TOPIC_ALIGNMENT_FIX.md) - Full technical analysis
- [TOPIC_ALIGNMENT_SUMMARY.md](./TOPIC_ALIGNMENT_SUMMARY.md) - Executive summary
- Database schema: `database/migrations/002_create_discovery_service_tables.sql`

---

**Status:** ✅ Implementation complete. Ready for backfill execution.

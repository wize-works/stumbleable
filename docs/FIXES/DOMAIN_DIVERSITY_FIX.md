# Domain Diversity Fix - Stumbleable Discovery Algorithm

## Problem Statement

Users were seeing only content from `odditiesforsale.com` (1400 pages) regardless of their topic preferences. This happened because:

1. **Large domain domination**: When one domain has many pages (1400 in this case) and they're all recent/high-quality, they flood the candidate pool
2. **Limited candidate pool**: The algorithm only fetched 200 candidates total from the database
3. **Weak topic filtering**: Topic matching happened AFTER fetching candidates, not during
4. **No domain diversity controls**: Nothing prevented one domain from dominating results

## Solution Overview

The fix implements a **multi-layered domain diversity system**:

### 1. Increased Candidate Pool (500 → 300 diverse)
- Fetch 500 candidates from database (up from 200)
- Apply domain diversity filtering to limit each domain to max 20 items
- Result: 300 diverse candidates from multiple domains

### 2. Topic-Aware Pre-Sorting
- When user has preferred topics, sort candidates by topic match count BEFORE applying domain limits
- This ensures topic-matching content from various domains gets priority
- Users see content matching their interests from diverse sources

### 3. Enhanced Topic Boost in Scoring
```typescript
// New: Significantly boost content matching user's preferred topics
const topicMatchCount = discovery.topics.filter(t => 
    userPrefs.preferredTopics.includes(t)
).length;
const topicBoost = topicMatchCount > 0 
    ? 1.0 + (topicMatchCount * 0.5)  // +50% per matching topic
    : 0.8;  // -20% penalty for no matches
```

**Impact**: Content with 2 matching topics gets 2.0x boost, making it much more likely to be selected.

## Code Changes

### File: `apis/discovery-service/src/lib/repository.ts`

**Method**: `getDiscoveriesExcluding()`

**Changes**:
1. Added `userPreferredTopics` parameter to enable topic-aware filtering
2. Increased candidate fetch from 200 → 500
3. Added domain diversity filtering (max 20 per domain)
4. Added topic-based pre-sorting when user has preferences
5. Returns 300 diverse candidates

### File: `apis/discovery-service/src/routes/next.ts`

**Changes**:
1. Pass user's preferred topics to `getDiscoveriesExcluding()`
2. Calculate `topicMatchCount` for each candidate
3. Apply `topicBoost` multiplier to final scores
4. Content with no topic matches gets 0.8x penalty
5. Content with matches gets 1.5x - 2.5x boost depending on match count

## Before vs After

### Before Fix
```
User selects topics: [technology, science]
Database returns: 200 most recent pages
→ 180 from odditiesforsale.com (most recent bulk import)
→ 20 from other domains
Result: User sees only odditiesforsale.com pages
```

### After Fix
```
User selects topics: [technology, science]
Database returns: 500 most recent pages
→ Pre-sorted by topic matches
→ Domain diversity: Max 20 per domain
→ Result: 300 candidates from 15+ domains
→ Topic boost: +50% per matching topic
→ Final scores heavily favor topic matches
Result: User sees diverse content matching their topics
```

## Testing

Run the test script to verify diversity:

```bash
node test-domain-diversity.js
```

**Expected results**:
- Diversity score: >70% (excellent)
- Multiple domains in top 10 results
- No single domain appearing >30% of the time

## Monitoring

Check discovery service logs for domain diversity metrics:
```
Domain diversity applied: 15 unique domains in 300 candidates
```

This log appears on every discovery request and shows:
- Number of unique domains in candidate pool
- Total candidates after diversity filtering

## Future Improvements

1. **Dynamic domain limits**: Adjust max-per-domain based on total content availability
2. **User-level domain diversity tracking**: Track recently seen domains per user
3. **Domain reputation integration**: Factor domain quality into diversity decisions
4. **A/B testing**: Compare diversity levels and user engagement

## Configuration

Current settings (can be adjusted in `repository.ts`):
- `maxPerDomain`: 20 (max items per domain in candidate pool)
- `candidateFetchLimit`: 500 (total candidates fetched from DB)
- `diverseCandidatesTarget`: 300 (target size of diverse candidate pool)
- `topicBoostMultiplier`: 0.5 (boost per matching topic)
- `noTopicMatchPenalty`: 0.8 (penalty for content with no matching topics)

## Impact Metrics to Track

1. **Domain diversity score**: % of unique domains in user's discoveries
2. **Topic match rate**: % of discoveries matching user's preferred topics  
3. **User engagement**: Like/save rates for diverse vs same-domain content
4. **Skip rate**: Should decrease if users see more relevant diverse content

---

**Implemented**: October 4, 2025  
**Status**: ✅ Active  
**Next Review**: After 1 week of user data collection

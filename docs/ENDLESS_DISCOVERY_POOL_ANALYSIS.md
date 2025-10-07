# Endless Discovery Pool Analysis & Solutions

**Date:** October 6, 2025  
**Issue:** Users feeling like they're browsing the same limited pool of content  
**Priority:** 🔴 CRITICAL - Core UX issue

## Problem Analysis

### Current Behavior

The discovery system has several limitations that can make the content pool feel finite:

#### 1. **Hard 500-Candidate Limit**
```typescript
// In repository.ts - getDiscoveriesExcluding()
.limit(500); // Increased from 200 to ensure diversity
```
- Each request fetches only 500 candidates from the database
- These are then filtered by domain diversity and scored
- Users stumbling through 20-30 items per session will exhaust this pool quickly

#### 2. **Exclusion Bypass at 200 Items**
```typescript
// OPTIMIZATION: Skip if too many excludes (increased limit)
if (excludeIds.length > 0 && excludeIds.length < 200) {
    query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
}
```
**CRITICAL BUG:** When `excludeIds.length >= 200`, the exclusion is **completely skipped**!
- User has seen/skipped 200+ items
- System stops excluding them from the query
- **Result: Content starts repeating!** 😱

#### 3. **Session-Based seenIds**
- Frontend tracks `seenIds` in a `useRef` Set that grows during the session
- Gets passed to backend on each `/next` request
- Problem: If user closes app and reopens, `seenIds` resets (though skipped content persists)

#### 4. **Static Pool Per Request**
- Each `/next` request fetches the same 500-candidate pool
- Pool only changes hourly (due to `useCreatedAtOrder` toggle)
- Scoring and randomization happen within this static pool

### User Experience Issues

**Scenario 1: Power User (200+ discoveries)**
```
User stumbles 1-50:    ✅ Fresh content from 500-candidate pool
User stumbles 51-100:  ✅ Still good, scoring provides variety
User stumbles 101-150: ⚠️  Starting to see similar domains/topics
User stumbles 151-200: ⚠️  Pool feels repetitive
User stumbles 201+:    ❌ EXCLUSION STOPS WORKING - content repeats!
```

**Scenario 2: Multi-Session User**
```
Session 1 (50 discoveries): ✅ Great experience
Close app, reopen
Session 2: seenIds resets but skipped content still excluded
  - May see some repeated content from Session 1 (if they liked/saved but didn't skip)
```

**Scenario 3: Topic-Focused User**
```
User prefers "Technology" + "Science"
Available tech/science content: Maybe 100-200 items
After 50-100 discoveries: Running out of matching content
System falls back to less relevant content or repeats
```

## Solutions

### Immediate Fixes (High Priority)

#### Fix 1: Remove the 200-Item Exclusion Bypass ⚠️ CRITICAL
```typescript
// BEFORE (BROKEN):
if (excludeIds.length > 0 && excludeIds.length < 200) {
    query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
}

// AFTER (FIXED):
if (excludeIds.length > 0) {
    // Batch exclusions in chunks for PostgreSQL performance
    if (excludeIds.length <= 500) {
        query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
    } else {
        // For very large exclusion lists, use a different approach
        // Option A: Pass to a stored procedure
        // Option B: Use multiple smaller queries
        // For now, exclude first 500 (most recent)
        const recentExcludes = excludeIds.slice(-500);
        query = query.not('id', 'in', `(${recentExcludes.map(id => `"${id}"`).join(',')})`);
    }
}
```

#### Fix 2: Track Viewed Content Permanently
Add a `viewed` interaction type to permanently track ALL viewed content, not just skipped:

```typescript
// In interaction-service
await InteractionAPI.recordFeedback(discovery.id, 'view', token);
```

Then in discovery-service:
```typescript
// Fetch both skipped AND viewed content
const [skippedIds, viewedIds] = await Promise.all([
    repository.getUserSkippedContentIds(userId),
    repository.getUserViewedContentIds(userId)
]);

// Exclude both (or make viewed content have lower priority)
const allExcludedIds = [...new Set([...seenIds, ...skippedIds, ...viewedIds])];
```

#### Fix 3: Increase Candidate Pool Dynamically
```typescript
// Calculate pool size based on exclusion count
const basePoolSize = 500;
const exclusionRatio = allExcludedIds.length / basePoolSize;
const dynamicPoolSize = exclusionRatio > 0.5 
    ? Math.min(2000, basePoolSize * 2)  // Double pool if user has seen >50% of base
    : basePoolSize;

query = query.limit(dynamicPoolSize);
```

#### Fix 4: Add "Freshness" Rotation
```typescript
// Vary the candidate pool more frequently
const rotationSeed = Math.floor(Date.now() / (1000 * 60 * 15)); // Every 15 minutes
const orderTypes = ['created_at', 'quality_score', 'popularity_score', 'base_score'];
const selectedOrder = orderTypes[rotationSeed % orderTypes.length];

query = query.order(selectedOrder, { ascending: false });
```

### Medium-Term Improvements

#### Improvement 1: Pagination-Style Discovery
Instead of fetching 500 items each time, implement pagination:

```typescript
// Track user's current "page" in their discovery journey
const userPage = Math.floor(allExcludedIds.length / 100); // Page per 100 seen items

query = query
    .range(userPage * 500, (userPage + 1) * 500 - 1) // Next 500 items
    .limit(500);
```

#### Improvement 2: Smart Content Resurfacing
Allow content to be shown again after certain conditions:

```typescript
// Content can reappear if:
// - User viewed it >30 days ago AND didn't skip it
// - User's interests have changed significantly
// - Content has been updated/improved
// - User specifically asks for "show me content I may have missed"

interface ContentResurfaceRules {
    viewedDaysAgo: number;
    wasSkipped: boolean;
    wasLiked: boolean;
    contentUpdatedSince: boolean;
    userInterestsChanged: boolean;
}

function canResurface(content: Discovery, rules: ContentResurfaceRules): boolean {
    if (rules.wasSkipped) return false; // NEVER resurface skipped content
    if (rules.wasLiked) return true; // Can show liked content again
    
    if (rules.viewedDaysAgo > 30 && rules.userInterestsChanged) {
        return true; // Old content, user evolved
    }
    
    if (rules.contentUpdatedSince) {
        return true; // Content improved, worth reshowing
    }
    
    return false;
}
```

#### Improvement 3: Expand Content Beyond User Preferences
When user has seen most matching content:

```typescript
// Calculate match exhaustion
const topicMatchedContent = await repository.getContentCountByTopics(userPrefs.preferredTopics);
const seenMatchedContent = allExcludedIds.length; // Approximation

if (seenMatchedContent / topicMatchedContent > 0.7) {
    // User has seen 70% of matching content
    // Start including adjacent topics and higher wildness
    
    const expandedTopics = await repository.getRelatedTopics(userPrefs.preferredTopics);
    const expandedCandidates = await repository.getDiscoveriesExcluding(
        allExcludedIds,
        [...userPrefs.preferredTopics, ...expandedTopics]
    );
}
```

### Long-Term Solutions

#### Solution 1: Database Optimization for Large Exclusions
```sql
-- Create a materialized view for user exclusions
CREATE MATERIALIZED VIEW user_excluded_content AS
SELECT 
    user_id,
    array_agg(content_id) as excluded_ids
FROM user_interactions
WHERE type IN ('view', 'skip')
GROUP BY user_id;

-- Refresh periodically
CREATE INDEX idx_user_excluded_content ON user_excluded_content(user_id);

-- Then in query:
SELECT * FROM content 
WHERE is_active = true
AND id NOT IN (
    SELECT unnest(excluded_ids) 
    FROM user_excluded_content 
    WHERE user_id = $1
)
LIMIT 500;
```

#### Solution 2: Content Recommendation System
Implement collaborative filtering:

```typescript
// Find users with similar interests
const similarUsers = await repository.findSimilarUsers(userId);

// Get content they liked that current user hasn't seen
const recommendations = await repository.getContentLikedBy(
    similarUsers,
    excludeIds: allExcludedIds
);

// Mix recommended content into the discovery pool
const mixedPool = [
    ...recommendations.slice(0, 100), // 20% recommendations
    ...candidates.slice(0, 400)       // 80% regular discovery
];
```

#### Solution 3: Content Health Monitoring
Track when users might be exhausting content:

```typescript
interface ContentHealthMetrics {
    totalActiveContent: number;
    userExcludedCount: number;
    exhaustionPercentage: number;
    estimatedDiscoveriesRemaining: number;
    suggestedActions: string[];
}

async function checkContentHealth(userId: string): Promise<ContentHealthMetrics> {
    const [totalContent, excludedIds] = await Promise.all([
        repository.getTotalActiveContentCount(),
        repository.getAllExcludedIds(userId)
    ]);
    
    const exhaustion = excludedIds.length / totalContent;
    
    return {
        totalActiveContent: totalContent,
        userExcludedCount: excludedIds.length,
        exhaustionPercentage: exhaustion * 100,
        estimatedDiscoveriesRemaining: totalContent - excludedIds.length,
        suggestedActions: exhaustion > 0.5 
            ? ['Expand topic preferences', 'Increase wildness', 'Enable content resurfacing']
            : []
    };
}
```

## Implementation Priority

### Phase 1: Critical Fixes (Deploy ASAP)
1. ✅ Remove 200-item exclusion bypass bug
2. ✅ Increase dynamic pool size based on exclusion count
3. ✅ Track viewed content permanently (already partially done)
4. ✅ Add better logging for debugging

### Phase 2: UX Improvements (This Week)
1. ⏳ Implement smart content rotation (15-min freshness)
2. ⏳ Add pagination-style discovery
3. ⏳ Expand topics when user nears exhaustion
4. ⏳ Add content health monitoring

### Phase 3: Advanced Features (Next Sprint)
1. 📋 Database optimization for large exclusions
2. 📋 Collaborative filtering recommendations
3. 📋 Smart content resurfacing rules
4. 📋 User feedback on discovery quality

## Metrics to Track

```typescript
// Add these to analytics
interface DiscoveryHealthMetrics {
    // Per-user metrics
    avgDiscoveriesPerSession: number;
    avgSessionDuration: number;
    contentExhaustionRate: number; // % of available content seen
    repeatContentRate: number; // How often users see repeats
    
    // System metrics
    totalActiveContent: number;
    avgUserExclusionCount: number;
    usersAbove100Exclusions: number;
    usersAbove200Exclusions: number;
    usersAbove500Exclusions: number;
    
    // Quality metrics
    skipRateByExclusionCount: Record<string, number>; // '0-50', '51-100', etc.
    likeRateByExclusionCount: Record<string, number>;
}
```

## Expected Outcomes

After implementing Phase 1 fixes:
- ✅ Users can discover 500+ items without repeats
- ✅ Content exclusion works indefinitely (no 200-item limit)
- ✅ Dynamic pool sizing provides more candidates as needed
- ✅ Better logging helps identify exhaustion issues

After Phase 2:
- ✅ Users feel like content is truly "endless"
- ✅ System adapts to user's discovery depth
- ✅ Proactive expansion prevents exhaustion
- ✅ Clear metrics on system health

After Phase 3:
- ✅ Sophisticated recommendation engine
- ✅ Efficient handling of power users (1000+ discoveries)
- ✅ Smart resurfacing of forgotten content
- ✅ Collaborative discovery features

---

**Next Steps:**
1. Review this analysis with team
2. Approve Phase 1 immediate fixes
3. Schedule Phase 2 for this week
4. Plan Phase 3 for next sprint

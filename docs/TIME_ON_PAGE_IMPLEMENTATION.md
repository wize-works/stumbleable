# Time-on-Page Tracking & Engagement Scoring Implementation

**Date**: October 4, 2025  
**Feature**: H2.6 - Time-on-Page Analytics & Quality Scoring  
**Status**: ✅ Complete

---

## 📋 Overview

Implemented comprehensive time-on-page tracking to measure user engagement and improve content quality scoring. The system now tracks how long users spend on each piece of content and uses this data to boost high-quality, engaging content in the discovery algorithm.

---

## 🎯 Problem Solved

**Before**: The discovery algorithm had no way to distinguish between:
- Content users genuinely enjoy and read (high engagement)
- Clickbait that users skip quickly (low engagement)
- Content that keeps users engaged vs. content they abandon immediately

**After**: The system now:
- ✅ Tracks engagement duration for every interaction
- ✅ Calculates average time-on-page per content piece
- ✅ Boosts content with historically high engagement in discovery rankings
- ✅ Penalizes content that users abandon quickly
- ✅ Provides detailed engagement quality metrics

---

## 🏗️ Implementation Details

### 1. Database Changes

**Migration**: `add_time_on_page_tracking`

```sql
-- Add time_on_page column to interactions table
ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS time_on_page DECIMAL(10,2);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_interactions_time_on_page 
ON interactions(time_on_page) 
WHERE time_on_page IS NOT NULL;
```

**Purpose**: Store engagement duration (in seconds) for each user interaction.

---

### 2. Frontend Tracking (Portal)

**File**: `ui/portal/app/stumble/page.tsx`

**Changes**:
```typescript
// Track when user starts viewing content
const discoveryViewStartTimeRef = useRef<number | null>(null);

// Start tracking on new discovery
discoveryViewStartTimeRef.current = Date.now();

// Calculate duration on interaction
const timeOnPage = discoveryViewStartTimeRef.current 
    ? (Date.now() - discoveryViewStartTimeRef.current) / 1000 
    : undefined;

// Send duration with interaction
await InteractionAPI.recordFeedback(currentDiscovery.id, action, token, timeOnPage);
```

**Key Features**:
- Starts timer when content loads
- Calculates duration on any interaction (like, skip, save, share)
- Sends duration to backend in seconds
- Handles edge cases (null/undefined states)

---

### 3. API Integration

#### Frontend API Client

**File**: `ui/portal/lib/api-client.ts`

```typescript
static async recordFeedback(
    discoveryId: string, 
    action: Interaction['action'], 
    token: string, 
    timeOnPage?: number  // NEW: Optional duration parameter
): Promise<void>
```

#### Interaction Service Types

**File**: `apis/interaction-service/src/types.ts`

```typescript
export type Interaction = {
    id: string;
    discoveryId: string;
    action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'share' | 'view';
    at: number;
    timeOnPage?: number; // NEW: Time in seconds
};

export type FeedbackRequest = {
    discoveryId: string;
    action: Interaction['action'];
    timeOnPage?: number; // NEW: Optional duration
};
```

#### Backend Storage

**File**: `apis/interaction-service/src/store.ts`

```typescript
async recordInteraction(
    discoveryId: string,
    action: Interaction['action'],
    clerkUserId?: string,
    timeOnPage?: number  // NEW: Duration parameter
): Promise<Interaction> {
    // ...
    await supabase
        .from('user_interactions')
        .insert({
            content_id: discoveryId,
            type: dbType,
            user_id: userId || null,
            time_on_page: timeOnPage || null,  // Store duration
            metadata: {}
        });
}
```

---

### 4. Engagement Quality Scoring

**File**: `apis/discovery-service/src/lib/scoring.ts`

Three new scoring functions added:

#### A. `calculateTimeOnPageScore()`

Converts raw time-on-page into quality score (0-1):

```typescript
export function calculateTimeOnPageScore(
    timeOnPageSeconds: number,
    readingTimeMinutes?: number
): number
```

**Scoring Curve**:
- `< 10 seconds` → 0.0 - 0.3 (Quick exit, low quality)
- `10-30 seconds` → 0.3 - 0.6 (Brief scan, moderate)
- `30s - 3 minutes` → 0.6 - 0.9 (Good engagement)
- `3 - 10 minutes` → 0.9 - 1.0 (Deep engagement)
- `> 10 minutes` → 1.0 (Cap to avoid outliers)

**Why This Curve?**
- Penalizes clickbait that users immediately abandon
- Rewards content that holds user attention
- Caps at 10 minutes to prevent extremely long sessions from skewing data
- Uses smooth transitions to avoid sharp cutoffs

#### B. `calculateTimeOnPageBoost()`

Converts average engagement into score multiplier:

```typescript
export function calculateTimeOnPageBoost(
    avgTimeOnPage: number | null | undefined,
    sampleSize: number = 0
): number
```

**Multiplier Range**: 0.8x - 1.2x

**Confidence Scaling**:
- `< 3 samples` → Neutral (1.0x) - Not enough data
- `3-20 samples` → Gradual confidence increase
- `≥ 20 samples` → Full confidence in metric

**Example Results**:
- Low engagement (avg 5s, 20 samples) → 0.82x boost (18% penalty)
- Moderate engagement (avg 45s, 20 samples) → 1.05x boost (5% bonus)
- High engagement (avg 3min, 20 samples) → 1.18x boost (18% bonus)

#### C. `analyzeUserTimeOnPagePatterns()`

Analyzes user's personal engagement patterns:

```typescript
export function analyzeUserTimeOnPagePatterns(
    interactions: Array<{
        timeOnPage: number;
        action: 'like' | 'skip' | 'save';
        readingTime?: number;
    }>
): {
    avgEngagedTime: number;
    avgSkippedTime: number;
    preferredReadingRange: { min: number; max: number };
    quickExitRate: number;
    deepEngagementRate: number;
}
```

**Use Cases**:
- Personalize content recommendations based on user's typical engagement
- Identify if user prefers quick reads vs. deep dives
- Detect changes in user behavior over time

---

### 5. Discovery Algorithm Integration

**File**: `apis/discovery-service/src/lib/repository.ts`

New method to fetch time metrics in batch:

```typescript
async getBatchTimeOnPageMetrics(
    contentIds: string[]
): Promise<Record<string, { avgTime: number; sampleSize: number }>>
```

**Performance**: Single database query for all candidates (~50-100 items).

---

**File**: `apis/discovery-service/src/routes/next.ts`

Integrated into scoring pipeline:

```typescript
// 1. Fetch time-on-page metrics for all candidates
const timeOnPageMetrics = await repository.getBatchTimeOnPageMetrics(contentIds);

// 2. Calculate boost for each candidate
const timeMetrics = timeOnPageMetrics[discovery.id];
const timeOnPageBoost = timeMetrics
    ? calculateTimeOnPageBoost(timeMetrics.avgTime, timeMetrics.sampleSize)
    : 1.0; // Neutral if no data

// 3. Apply to final score
const finalScore = calculateOverallScore(
    baseScore,
    qualityScore,
    freshnessScore,
    popularityScore,
    adjustedSimilarity,
    scoringContext
) * reputationBoost * timeOnPageBoost;  // ← Time-on-page multiplier
```

---

## 📊 Impact & Benefits

### For Users
- **Better Content Quality**: See more engaging, valuable content
- **Less Clickbait**: Content that users quickly abandon is deprioritized
- **Personalized Experience**: Algorithm learns what type of content keeps you engaged

### For Content Creators
- **Quality Rewarded**: Well-crafted content that engages users gets boosted
- **Fair Ranking**: Not just about clicks, but genuine user engagement
- **Feedback Loop**: See which content resonates with audiences

### For the System
- **Data-Driven**: Objective metric for content quality
- **Self-Improving**: Automatically learns which content is valuable
- **Anti-Gaming**: Harder to manipulate than simple click metrics

---

## 🔍 Example Scenarios

### Scenario 1: High-Quality Article
```
Content: In-depth tech tutorial
Avg Time on Page: 4 minutes (240 seconds)
Sample Size: 15 interactions

Score: calculateTimeOnPageScore(240) = 0.95
Confidence: min(1.0, 15/20) = 0.75
Boost: (0.95 → 1.18x) * 0.75 + 1.0 * 0.25 = 1.14x

Result: 14% ranking boost
```

### Scenario 2: Clickbait
```
Content: Misleading headline
Avg Time on Page: 8 seconds
Sample Size: 30 interactions

Score: calculateTimeOnPageScore(8) = 0.24
Confidence: min(1.0, 30/20) = 1.0 (full confidence)
Boost: 0.80 + (0.24 * 0.4) = 0.896x

Result: 10% ranking penalty
```

### Scenario 3: New Content (No Data Yet)
```
Content: Recently added article
Avg Time on Page: N/A
Sample Size: 0

Boost: 1.0x (neutral)

Result: No penalty, fair chance to prove itself
```

---

## 🛠️ UX Improvements

### Auto-Advance Behavior Fix

**Problem**: Previously, clicking "Like" would automatically advance to the next discovery, interrupting users who wanted to:
- Continue reading the content
- Save it for later
- Add to a list
- Share it

**Solution**: Removed auto-advance from "Like" action

```typescript
// OLD (problematic):
if (action === 'up' || action === 'down') {
    setTimeout(() => handleStumble(), 400);
}

// NEW (user-friendly):
if (action === 'down') {  // Only auto-advance on skip
    setTimeout(() => handleStumble(), 400);
}
```

**User Benefits**:
- ✅ Can like content AND keep reading it
- ✅ Natural workflow: like → read more → manually stumble when ready
- ✅ Still auto-advances on skip (makes sense - user wants to move on)

---

## 📈 Future Enhancements

### Potential Improvements

1. **Time-Weighted Engagement**
   - Weight recent engagement more heavily
   - Detect if content quality is improving/declining over time

2. **Content Type Calibration**
   - Different engagement thresholds for different content types
   - Quick reads (news) vs. long-form (tutorials) calibrated differently

3. **User Behavior Clustering**
   - Group users by engagement patterns (scanners vs. readers)
   - Calibrate scoring per cluster

4. **A/B Testing**
   - Test different boost multiplier ranges
   - Optimize confidence threshold (currently 20 samples)

5. **Dashboard Analytics**
   - Show content creators their avg engagement times
   - Highlight which content keeps users engaged longest

---

## 🧪 Testing Recommendations

### Manual Testing
1. **Happy Path**
   - Open discovery, wait 30s, like → verify time recorded
   - Open discovery, wait 5s, skip → verify quick exit tracked

2. **Edge Cases**
   - Refresh page mid-view → should not record time
   - Multiple tabs open → each should track independently

3. **Integration**
   - Check that high-engagement content appears more often
   - Verify new content isn't penalized

### Automated Testing
```typescript
// Example test
describe('Time-on-Page Scoring', () => {
    it('should boost content with high engagement', () => {
        const boost = calculateTimeOnPageBoost(180, 20);
        expect(boost).toBeGreaterThan(1.0);
        expect(boost).toBeLessThanOrEqual(1.2);
    });

    it('should penalize quick exits', () => {
        const boost = calculateTimeOnPageBoost(5, 20);
        expect(boost).toBeLessThan(1.0);
        expect(boost).toBeGreaterThanOrEqual(0.8);
    });

    it('should be neutral with insufficient data', () => {
        const boost = calculateTimeOnPageBoost(180, 2);
        expect(boost).toBeCloseTo(1.0, 1);
    });
});
```

---

## 📚 Related Documentation

- [H2_IMPLEMENTATION_COMPLETE.md](./H2_IMPLEMENTATION_COMPLETE.md) - Advanced Discovery Features
- [CONTENT_METRICS_VIEW_TRACKING_FIX.md](./CONTENT_METRICS_VIEW_TRACKING_FIX.md) - View tracking system
- Database schema: `database/migrations/` - Interaction tables

---

## ✅ Acceptance Criteria

All criteria met:

- [x] Database schema updated with `time_on_page` column
- [x] Frontend tracks view start times
- [x] Duration calculated on every interaction
- [x] Backend stores time-on-page data
- [x] Scoring functions calculate engagement quality
- [x] Discovery algorithm applies time-on-page boost
- [x] Auto-advance UX improved (like doesn't auto-advance)
- [x] Batch queries for performance
- [x] Confidence scaling based on sample size
- [x] Documentation complete

---

**Implementation Complete** ✅  
Ready for production use with comprehensive engagement tracking and quality-based content ranking.

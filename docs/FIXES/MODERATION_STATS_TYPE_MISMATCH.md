# Moderation Stats Type Mismatch - FIXED

## Error
```
moderation-stats-cards.tsx:54 Uncaught TypeError: Cannot read properties of undefined (reading 'toLocaleString')
    at ModerationStatsCards (moderation-stats-cards.tsx:54:86)
```

## Root Cause
The `ModerationStatsCards` component interface didn't match the actual API response structure from the moderation service.

### API Response Structure (Actual)
```typescript
interface ModerationAnalytics {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    avgReviewTime: number | null;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
}
```

### Component Expected (Wrong)
```typescript
interface ModerationStats {
    total: number;
    byStatus: {
        pending: number;
        approved: number;
        rejected: number;
        reviewing: number;
    };
    recentActivity: {
        last7Days: number;
        last30Days: number;
    };
    approvalRate: number;
    avgReviewTimeHours: number;
}
```

## Fix Applied

### 1. Updated Interface
Changed component interface to match API response:
```typescript
interface ModerationStats {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    avgReviewTime: number | null;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
}
```

### 2. Updated Component Logic
Transformed the stats display to work with API data:

**Before:**
```tsx
<p>{stats.total.toLocaleString()}</p>  // ❌ stats.total doesn't exist
<p>{stats.approvalRate.toFixed(1)}%</p>  // ❌ stats.approvalRate doesn't exist
<p>{stats.recentActivity.last7Days}</p>  // ❌ stats.recentActivity doesn't exist
```

**After:**
```tsx
const totalItems = stats.totalPending + stats.totalReviewed;
const approvalRate = stats.totalReviewed > 0 
    ? (stats.totalApproved / stats.totalReviewed) * 100 
    : 0;

<p>{totalItems.toLocaleString()}</p>  // ✅ Calculated from API data
<p>{approvalRate.toFixed(1)}%</p>  // ✅ Calculated from API data
<p>{stats.totalReports}</p>  // ✅ Changed to show reports instead
```

### 3. Updated Stats Cards

| Card | Old Data | New Data |
|------|----------|----------|
| **Total Queue Items** | `stats.total` | `totalPending + totalReviewed` |
| **Approval Rate** | `stats.approvalRate` | Calculated: `(totalApproved / totalReviewed) * 100` |
| **Recent Activity** | `stats.recentActivity.last7Days` | Changed to **Content Reports**: `totalReports` |
| **Avg Review Time** | `stats.avgReviewTimeHours` | `stats.avgReviewTime` (with null check) |

## Files Modified
- `ui/portal/components/moderation-stats-cards.tsx`

## Verification
- ✅ TypeScript compilation successful (0 errors)
- ✅ Component interface matches API response
- ✅ All stats calculations correct
- ✅ Null handling for avgReviewTime

## Related Issues
- Initially caused by database migration issue (score → trust_score)
- After migration applied, this type mismatch was revealed
- Component was designed for a different API structure

---

**Status**: ✅ **RESOLVED**  
**Date**: October 2, 2025  
**Files Changed**: 1

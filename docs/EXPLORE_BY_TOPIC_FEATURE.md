# Explore by Topic Feature - Implementation Guide

## Overview
Added a comprehensive "Explore by Topic" feature that allows users to browse discoveries filtered by topic, with sorting options and pagination.

## Architecture

### Backend (Discovery Service)

#### New API Endpoint
**Route**: `GET /api/explore`

**Query Parameters**:
- `topic` (optional): Filter by specific topic slug (e.g., "technology", "art")
- `limit` (optional, default: 24): Number of results per page
- `offset` (optional, default: 0): Pagination offset
- `sortBy` (optional, default: "recent"): Sort order - "recent", "popular", or "quality"

**Response**:
```json
{
  "discoveries": [{ /* Discovery objects */ }],
  "pagination": {
    "limit": 24,
    "offset": 0,
    "total": 156,
    "hasMore": true
  },
  "filters": {
    "topic": "technology",
    "sortBy": "recent"
  }
}
```

#### New Repository Methods

**`getDiscoveriesByTopic(topic, limit, offset, sortBy)`**
- Filters content by topic using JSONB `contains` operator
- Supports pagination and multiple sort options
- Returns discoveries with full metadata including images, metrics, and topic info

**`getDiscoveriesWithPagination(limit, offset, sortBy)`**
- Gets all active discoveries without topic filtering
- Used when no topic is selected

**`getTotalDiscoveriesCount()`**
- Returns total count of active discoveries for pagination

#### Files Modified
- `apis/discovery-service/src/routes/explore.ts` (NEW)
- `apis/discovery-service/src/lib/repository.ts` (added 3 new methods)
- `apis/discovery-service/src/server.ts` (registered new route)

### Frontend (Portal)

#### New Page: `/explore`
**File**: `ui/portal/app/explore/page.tsx`

**Features**:
- Topic filtering with visual pill buttons
- Sort options: Most Recent, Most Popular, Highest Quality
- Grid layout with responsive cards (1-4 columns based on screen size)
- Infinite scroll with "Load More" button
- Real-time stats display (total discoveries, topic count)
- Empty states for no results
- CTA to return to Stumble mode
- URL query params sync (`?topic=tech&sortBy=popular`)

**Components Used**:
- `DiscoveryPreviewCard` - Reusable card component
- `DiscoveryPreviewCardSkeleton` - Loading states
- Suspense boundary for SSR compatibility

#### API Client Updates
**File**: `ui/portal/lib/api-client.ts`

Added `DiscoveryAPI.explore()` method:
```typescript
DiscoveryAPI.explore({
  topic: 'technology',
  limit: 24,
  offset: 0,
  sortBy: 'recent',
  token: authToken
})
```

#### Landing Page Enhancement
**File**: `ui/portal/app/page.tsx`

Added "Explore by Topic CTA" section between featured discoveries and "How It Works":
- Eye-catching card with gradient background
- Clear value proposition
- Direct link to `/explore` page

#### Navigation
**File**: `ui/portal/components/header.tsx` (already had it!)

"Explore" link already exists in both authenticated and public navigation menus.

## User Flow

### Discovery Flow
1. User lands on homepage
2. Sees "Prefer to Browse?" CTA card
3. Clicks "Explore by Topic" button
4. Arrives at `/explore` with all discoveries shown
5. Can filter by topic or change sort order
6. Browses cards in grid layout
7. Clicks "Load More" for additional results
8. Can click on any discovery to visit external site

### Filter Flow
1. User clicks topic pill (e.g., "Technology")
2. URL updates: `/explore?topic=technology`
3. Cards refresh showing only tech content
4. Pagination resets to offset 0
5. User can clear filter to see all topics again

### Sort Flow
1. User clicks "Most Popular" button
2. URL updates: `/explore?topic=technology&sortBy=popular`
3. Cards re-sort by popularity score
4. Maintains current topic filter
5. Pagination resets

## Design Features

### Visual Design
- **Hero Section**: Gradient background matching brand colors
- **Topic Pills**: Active state with primary color, ghost state otherwise
- **Sort Buttons**: Secondary color for active, ghost for inactive
- **Cards**: Responsive grid (1-4 columns), hover effects, consistent with discovery cards
- **Stats Bar**: Shows total discoveries and topic count
- **Empty State**: Friendly message with CTA to clear filters

### Responsive Design
- Mobile: 1 column grid
- Tablet: 2 columns
- Desktop: 3 columns
- Large Desktop: 4 columns

### Performance
- Lazy loading with offset-based pagination
- Client-side topic caching
- URL param sync for bookmarking/sharing
- Suspense boundaries for SSR

## Database Queries

### Topic Filtering
Uses JSONB `contains` operator on `content.topics` column:
```sql
SELECT * FROM content 
WHERE is_active = true 
  AND topics @> '["technology"]'
ORDER BY created_at DESC
LIMIT 24 OFFSET 0;
```

### Sorting Options
- **Recent**: `ORDER BY created_at DESC`
- **Popular**: `ORDER BY popularity_score DESC`
- **Quality**: `ORDER BY quality_score DESC`

### Performance Considerations
- Indexed columns: `topics` (GIN index), `created_at`, `quality_score`, `popularity_score`
- Pagination limits maximum 100 items per request
- Separate count query for total (cached when possible)

## Testing Checklist

### Backend
- [ ] Test `/api/explore` without parameters (all content)
- [ ] Test with topic filter: `/api/explore?topic=technology`
- [ ] Test with pagination: `/api/explore?limit=24&offset=24`
- [ ] Test with sorting: `/api/explore?sortBy=popular`
- [ ] Test combined filters: `/api/explore?topic=art&sortBy=quality&offset=48`
- [ ] Verify empty results handling
- [ ] Check rate limiting (100 req/min default)

### Frontend
- [ ] Navigate to `/explore` page
- [ ] Verify all topics load correctly
- [ ] Click topic filter and verify URL updates
- [ ] Click sort buttons and verify re-ordering
- [ ] Scroll down and click "Load More"
- [ ] Verify empty state when no results
- [ ] Test back button (URL params should restore state)
- [ ] Test direct URL with params: `/explore?topic=tech`
- [ ] Verify mobile responsive design
- [ ] Check loading skeletons display correctly

## Future Enhancements

### Potential Additions
1. **Multi-topic filtering**: Select multiple topics at once
2. **Search functionality**: Free-text search within filtered results
3. **Saved searches**: Save favorite topic/sort combinations
4. **Topic categories**: Group related topics (e.g., "Science & Tech", "Arts & Culture")
5. **Advanced filters**: Date range, reading time, domain
6. **Infinite scroll**: Auto-load more on scroll (instead of button)
7. **Topic analytics**: Show popular topics with counts
8. **Related topics**: Suggest similar topics to explore

### Performance Optimizations
1. **Redis caching**: Cache popular topic queries
2. **CDN**: Edge caching for static topic lists
3. **Preloading**: Prefetch next page on hover
4. **Virtual scrolling**: For very large result sets
5. **Debounced filtering**: Reduce API calls during rapid filter changes

## Rollout Strategy

### Phase 1 (Current)
- ✅ Basic explore page with topic filtering
- ✅ Three sort options
- ✅ Pagination with "Load More"
- ✅ Mobile responsive
- ✅ Landing page CTA

### Phase 2 (Planned)
- Multi-topic selection
- Topic categories/grouping
- Advanced filters panel
- Topic popularity badges

### Phase 3 (Future)
- Personalized topic recommendations
- Saved searches
- Topic-based email digests
- Topic discovery stats for users

## Monitoring

### Key Metrics to Track
1. **Usage**: Page views on `/explore`
2. **Engagement**: Click-through rate from explore to discoveries
3. **Filters**: Most popular topics filtered
4. **Sorting**: Distribution of sort preferences
5. **Pagination**: Average pages loaded per session
6. **Conversion**: Users who return to `/stumble` after exploring

### Analytics Events
- `explore_page_view`
- `explore_topic_filter` (topic_id)
- `explore_sort_change` (sort_option)
- `explore_load_more` (offset)
- `explore_discovery_click` (discovery_id, topic)

---

**Status**: ✅ Feature Complete & Ready for Testing
**API Version**: 1.0
**Last Updated**: 2025-10-04

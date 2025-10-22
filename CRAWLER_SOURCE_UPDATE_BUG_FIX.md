# Crawler Source Update Bug Fix

## Problem Summary

When a user tried to update a crawler source in the admin dashboard (changing the type from RSS to Sitemap, for example), the changes were not being saved. The frontend would show a success message, but refreshing would reveal the changes were never persisted.

## Root Cause

The backend's `UpdateSourceSchema` validation in the Crawler Service was missing the `type` field. 

### The Issue

**Frontend sending:**
```typescript
{
    name: "Example Feed",
    type: "sitemap",        // ← Trying to send this
    url: "https://example.com/sitemap.xml",
    crawl_frequency_hours: 24,
    topics: ["technology"],
    enabled: true
}
```

**Backend schema accepting:**
```typescript
const UpdateSourceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    // ❌ type field was MISSING!
    url: z.string().url().optional(),
    crawl_frequency_hours: z.number().optional(),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    extract_links: z.boolean().optional(),
    reddit_subreddit: z.string().optional()
});
```

When Zod validated the request body, it would silently strip out the `type` field since it wasn't in the schema, and the update would succeed but without changing the source type.

## Solution

Added the `type` field to the `UpdateSourceSchema` with proper validation:

### File: `apis/crawler-service/src/routes/sources.ts`

**Lines 26-42 (Updated):**
```typescript
const UpdateSourceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['rss', 'sitemap', 'web']).optional(),  // ✅ ADDED
    url: z.string().url().refine((url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }, { message: 'Only HTTPS URLs are allowed for security' }).optional(),
    crawl_frequency_hours: z.number().min(1).max(168).optional(),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    extract_links: z.boolean().optional(),
    reddit_subreddit: z.string().optional()
});
```

## Why This Fixes It

Now when the frontend sends:
```typescript
{
    type: "sitemap",
    ...other fields
}
```

The schema validates and preserves the `type` field, and Supabase updates the record with the new type value.

## Code Flow

### Request Journey
1. **Frontend** (`crawler-management.tsx`) calls `CrawlerAPI.updateSource(id, formData, token)`
2. **API Client** (`lib/api-client.ts`) makes PUT request with full formData including `type` field
3. **Backend Route** (`sources.ts`) receives request at `PUT /api/sources/:id`
4. **Schema Validation** (`UpdateSourceSchema`) now properly accepts `type` field ✅
5. **Database Update** Supabase updates the record with new `type` value
6. **Response** Returns updated source with new type

### Before Fix (Failed)
1. Frontend sends: `{ type: "sitemap", ... }`
2. Schema strips `type` field (not in schema)
3. Database updates with: `{ ... }` (without type change)
4. Frontend shows success, but type unchanged ❌

### After Fix (Works)
1. Frontend sends: `{ type: "sitemap", ... }`
2. Schema accepts `type` field ✅
3. Database updates with: `{ type: "sitemap", ... }`
4. Type is now updated ✅

## Affected Operations

- **Update source type** (RSS ↔ Sitemap ↔ Web)
- **Update source name**
- **Update source URL**
- **Update crawl frequency**
- **Update topics**
- **Update enabled status**
- **Update extract_links** (for Reddit sources)
- **Update reddit_subreddit** (for Reddit sources)

All of these work together - if any field was missing from the schema, it would be silently dropped.

## Testing Recommendations

1. **Edit a crawler source**: Change type from RSS → Sitemap
   - Update form, click Save
   - Should see "Source updated successfully"
   - Refresh page, verify type changed

2. **Update multiple fields**: Change name, type, and topics simultaneously
   - All changes should persist

3. **Toggle enable/disable**: Update enabled status
   - Status should persist after refresh

4. **Update crawl frequency**: Change from 24 to 48 hours
   - Should persist correctly

## Related Code

### API Client: `ui/portal/lib/api-client.ts` (lines 1936-1957)
- Correctly accepts and sends `type` field ✅
- No changes needed

### Component: `ui/portal/components/crawler-management.tsx` (line 133)
- Correctly includes `type` in formData ✅
- No changes needed

### Backend Route: `apis/crawler-service/src/routes/sources.ts` (lines 153-186)
- PUT handler correctly spreads body into update ✅
- Schema now validates all fields properly ✅

## Summary

**Bug**: `UpdateSourceSchema` missing `type` field  
**Impact**: Unable to change source type (or any field would be silently dropped)  
**Fix**: Added `type: z.enum(['rss', 'sitemap', 'web']).optional()` to schema  
**Severity**: High - Affects core functionality  
**Lines Changed**: 2 lines in `apis/crawler-service/src/routes/sources.ts`  
**Database**: No migration needed - just schema validation fix  

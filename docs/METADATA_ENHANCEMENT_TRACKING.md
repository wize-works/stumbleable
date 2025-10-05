# Metadata Enhancement Tracking Implementation

## Problem
The metadata enhancement process was reprocessing the same URLs repeatedly because:
1. Query selected any record with missing metadata fields
2. No tracking of which records had already been scraped
3. Records could have some fields populated but still get selected if other fields were missing

## Solution: Added `metadata_scraped_at` Timestamp

### Database Changes

**Migration: `018_add_metadata_scraped_at.sql`**
- Added `metadata_scraped_at TIMESTAMP WITH TIME ZONE` column to `content` table
- Added partial index for efficient queries: `WHERE metadata_scraped_at IS NULL`
- Prevents reprocessing of already-scraped URLs

### Backend Changes (`apis/crawler-service/src/routes/enhance.ts`)

#### 1. Updated Query Logic
```typescript
// OLD: Selected records with ANY missing metadata
.or('image_url.is.null,author.is.null,content_text.is.null,word_count.is.null')

// NEW: Only selects records never scraped
.is('metadata_scraped_at', null)
```

#### 2. Added `forceRescrape` Option
- Request schema now accepts `forceRescrape: boolean` parameter
- Allows admins to manually rescrape specific content IDs
- Default behavior still respects the scraped timestamp

#### 3. Always Mark as Scraped
```typescript
// After processing (success or failure), always mark as scraped
fieldsToUpdate.metadata_scraped_at = new Date().toISOString();
```

This prevents retry loops even when:
- No metadata was found
- Scraping failed
- Fields were already populated

#### 4. Updated Status Endpoint
Now returns:
- `needs_enhancement` - Records with `metadata_scraped_at IS NULL`
- `already_scraped` - Records that have been processed
- Field coverage stats (unchanged)

### Frontend Changes

#### API Client (`ui/portal/lib/api-client.ts`)
- Updated `getEnhancementStatus()` return type to include `already_scraped`
- Updated `enhanceMetadata()` to accept optional `forceRescrape` parameter

#### UI Component (`ui/portal/components/crawler-management.tsx`)
- Replaced "Needs Enhancement" with clearer labels:
  - **Not Scraped** (warning) - Never attempted
  - **Already Scraped** (success) - Processing complete
- Shows completion percentage for already-scraped content

### Behavior Changes

#### Before
1. Select records with missing metadata → Process → Update some fields
2. Next run: Same records selected (still missing other fields) → Infinite loop

#### After
1. Select records where `metadata_scraped_at IS NULL` → Process → **Mark as scraped**
2. Next run: Those records are **skipped** (timestamp set)
3. Only new/unprocessed content is selected

### Future Enhancements

The `forceRescrape` flag enables:
- Manual rescraping of specific URLs
- Batch refreshes of outdated metadata
- Admin-triggered updates for content with bad metadata

Example usage:
```typescript
// Rescrape specific content IDs
await CrawlerAPI.enhanceMetadata({
    contentIds: ['uuid-1', 'uuid-2'],
    forceRescrape: true
}, token);
```

## Database Migration

To apply the migration:

```sql
-- Run this on your Supabase database
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS metadata_scraped_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_content_metadata_scraped_at 
ON content(metadata_scraped_at) 
WHERE metadata_scraped_at IS NULL;

COMMENT ON COLUMN content.metadata_scraped_at IS 
'Timestamp of when metadata was last scraped from the URL. NULL means never scraped.';
```

Or use the Supabase dashboard to run the migration file directly.

## Testing

1. Run enhancement batch: Should only process unscraped content
2. Check stats: "Already Scraped" count should increase
3. Run again: Should not reprocess same URLs
4. Verify database: `metadata_scraped_at` column populated for processed records

## Benefits

✅ **No more infinite loops** - Each URL is only scraped once  
✅ **Clear progress tracking** - Know exactly how many items are left  
✅ **Better resource usage** - Don't waste API calls rescanning the same content  
✅ **Future-proof** - Can implement selective rescraping later  
✅ **Performance** - Partial index makes queries fast even with millions of records

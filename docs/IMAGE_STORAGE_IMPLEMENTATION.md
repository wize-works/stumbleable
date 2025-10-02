# Image Storage Implementation

**Status:** ✅ Complete
**Date:** September 30, 2025
**Purpose:** Store content images and favicons locally in Supabase Storage instead of hotlinking external URLs

## Problem

The application was experiencing Next.js image errors:
```
Invalid src prop (https://www.futureme.org/favicon.ico) on `next/image`, 
hostname "www.futureme.org" is not configured under images in your `next.config.js`
```

This occurred because we were hotlinking to external image URLs, which:
- Requires Next.js domain configuration for every external host
- Creates broken images if external sources go down
- Raises privacy concerns (tracking pixels)
- Provides inconsistent performance

## Solution

Implemented a comprehensive image storage system using Supabase Storage, following the PRD §7 requirement to "store metadata/thumbnails locally".

### Architecture

```
Content Submission → Metadata Extraction → Image Capture → Supabase Storage
                                                                    ↓
Frontend ← Discovery API ← Database (with storage paths) ←────────┘
```

## Implementation Details

### 1. Database Schema (Migration 011)

**File:** `database/migrations/011_add_image_storage_columns.sql`

Added three new columns to the `content` table:
```sql
- favicon_url TEXT          -- Stored favicon URL from Supabase Storage
- image_storage_path TEXT   -- Path to stored image (e.g., content-images/abc123.jpg)
- image_url TEXT            -- Kept as fallback for external URLs
```

Created index for performance:
```sql
CREATE INDEX idx_content_has_stored_image 
ON content(image_storage_path) 
WHERE image_storage_path IS NOT NULL;
```

### 2. Supabase Storage Buckets

**Files:** 
- `scripts/setup-storage-buckets.js` - Setup script
- Buckets created:
  - `content-images` - Public bucket for content images (5MB limit, image/* types)
  - `favicons` - Public bucket for favicons (1MB limit, icon/* types)

**Features:**
- Public read access
- File size limits
- MIME type restrictions
- Automatic deduplication (hash-based filenames)

### 3. Image Capture Utility

**File:** `apis/discovery-service/src/lib/image-capture.ts`

Three main functions:

#### `captureContentImage(imageUrl, contentId)`
- Downloads images from external URLs (30s timeout)
- Validates content type and size (5MB max)
- Generates hash-based filename for deduplication
- Uploads to `content-images` bucket
- Returns storage path and public URL

#### `captureFavicon(domain)`
- Tries multiple favicon sources:
  1. `https://{domain}/favicon.ico`
  2. `https://www.{domain}/favicon.ico`
  3. `https://{domain}/favicon.png`
  4. Google favicon service (fallback)
- Generates domain-based filename
- Uploads to `favicons` bucket
- Cached by domain hash

#### `captureContentMedia(contentId, imageUrl, domain)`
- Orchestrates both image and favicon capture
- Returns all captured media URLs
- Handles failures gracefully with fallbacks

### 4. Content Submission Integration

**File:** `apis/discovery-service/src/routes/submit.ts`

**Metadata Extraction Enhanced:**
```typescript
// Added Open Graph image extraction
const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
```

**Image Capture Flow:**
```typescript
// After moderation approval, before saving to database
const captureResult = await captureContentMedia(
    url,
    metadata.image || null,
    metadata.domain
);

// Use captured images in database
await repository.createDiscovery({
    imageUrl: metadata.image,           // Keep original as fallback
    imageStoragePath: captureResult.imageStoragePath,  // Prefer local
    faviconUrl: captureResult.faviconUrl || metadata.favicon
});
```

### 5. Repository Updates

**File:** `apis/discovery-service/src/lib/repository.ts`

**Changes:**
- Updated `createDiscovery()` to accept `imageUrl`, `imageStoragePath`, `faviconUrl`
- Updated all `.select()` queries to include new fields
- Enhanced `transformContentData()` to map storage fields

**Select queries now include:**
```typescript
.select(`
    ...,
    image_url,
    image_storage_path,
    favicon_url,
    ...
`)
```

### 6. Type System Updates

**Files:**
- `apis/discovery-service/src/types.ts` - Backend types
- `ui/portal/data/types.ts` - Frontend types

**Discovery Interface Enhanced:**
```typescript
export interface Discovery {
    // ...existing fields
    image?: string;              // External URL (fallback)
    imageStoragePath?: string;   // Supabase Storage path (preferred)
    faviconUrl?: string;         // Stored favicon URL
}
```

### 7. Frontend Integration

**File:** `ui/portal/components/discovery-card.tsx`

**Smart Image Selection:**
```typescript
// Prefer stored image path over external URL
const imageUrl = discovery.imageStoragePath || discovery.image;
const faviconUrl = discovery.faviconUrl;

<Image
    src={imageUrl}
    unoptimized={!discovery.imageStoragePath} // Only for external URLs
    ...
/>
```

**Favicon Display:**
```tsx
{faviconUrl && (
    <Image
        src={faviconUrl}
        width={16}
        height={16}
        unoptimized
    />
)}
```

## Benefits

### Performance
- ✅ CDN-backed Supabase Storage URLs (fast global delivery)
- ✅ No Next.js domain configuration needed
- ✅ Consistent image availability (no broken external links)
- ✅ Image deduplication (hash-based storage)

### Reliability
- ✅ Images persist even if original source goes down
- ✅ Graceful fallback to external URLs if capture fails
- ✅ Timeout and size limit protections

### Privacy & Security
- ✅ No external tracking pixels
- ✅ Content validation (MIME types, sizes)
- ✅ Controlled storage with access policies

### Developer Experience
- ✅ No manual Next.js image domain configuration
- ✅ Automatic image capture during submission
- ✅ Comprehensive error handling and logging

## Usage Examples

### Submitting Content (Automatic)
```typescript
// Content submission now automatically captures images
POST /api/submit
{
    "url": "https://example.com/article",
    "title": "Cool Article"
}

// Response includes captured media
{
    "discovery": {
        "image": "https://example.com/og-image.jpg",  // Fallback
        "imageStoragePath": "abc123.jpg",             // Preferred
        "faviconUrl": "https://...supabase.co/favicons/def456.ico"
    }
}
```

### Frontend Display (Automatic)
```typescript
// DiscoveryCard automatically prefers stored images
<DiscoveryCard discovery={discovery} />

// Renders with Supabase Storage URL if available, falls back to external
```

### Manual Image Capture (Backend)
```typescript
import { captureContentMedia } from './lib/image-capture';

const result = await captureContentMedia(
    contentId,
    'https://example.com/image.jpg',
    'example.com'
);

console.log(result.imageStoragePath);  // "abc123.jpg"
console.log(result.imagePublicUrl);    // Full Supabase Storage URL
console.log(result.faviconUrl);        // Favicon storage URL
```

## Testing

### Verify Storage Buckets
```bash
npm run setup-storage-buckets
# Should show: content-images (public: true), favicons (public: true)
```

### Test Content Submission
```bash
# Submit new content - images will be captured automatically
curl -X POST http://localhost:7001/api/submit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://techcrunch.com/article"}'
```

### Check Database
```sql
SELECT 
    title,
    image_url,           -- External URL
    image_storage_path,  -- Local storage
    favicon_url          -- Stored favicon
FROM content
WHERE image_storage_path IS NOT NULL;
```

## Migration Notes

### Existing Content
- ✅ Old content still works with external `image_url`
- ✅ New content automatically uses Supabase Storage
- ⚠️ TODO: Migrate existing sample content (Task #6)

### Rollback Plan
If issues arise:
1. Keep using external URLs (system falls back automatically)
2. The `image_url` field is preserved as fallback
3. No breaking changes to existing content

## Files Modified

### Database
- ✅ `database/migrations/011_add_image_storage_columns.sql`

### Backend (Discovery Service)
- ✅ `apis/discovery-service/src/lib/image-capture.ts` (new)
- ✅ `apis/discovery-service/src/lib/repository.ts`
- ✅ `apis/discovery-service/src/routes/submit.ts`
- ✅ `apis/discovery-service/src/types.ts`

### Frontend (Portal)
- ✅ `ui/portal/components/discovery-card.tsx`
- ✅ `ui/portal/data/types.ts`

### Scripts
- ✅ `scripts/setup-storage-buckets.js` (new)

## Future Enhancements

1. **Image Optimization**
   - Generate multiple sizes (thumbnail, medium, large)
   - WebP conversion for better compression
   - Lazy loading improvements

2. **Migration Tool**
   - Script to migrate existing content images to Supabase Storage
   - Batch processing with progress tracking

3. **Analytics**
   - Track image capture success/failure rates
   - Monitor storage usage and costs
   - Identify domains with frequent failures

4. **Advanced Features**
   - Screenshot generation for pages without OG images
   - Image quality detection and filtering
   - Automatic alt text generation (accessibility)

## Configuration

### Environment Variables Required
```bash
# In apis/discovery-service/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Supabase Storage Policies
Both buckets are configured with:
- Public read access (anyone can view)
- Authenticated write access (only service can upload)
- MIME type restrictions
- File size limits

## Troubleshooting

### Images Not Displaying
1. Check if `imageStoragePath` exists in database
2. Verify Supabase Storage buckets are public
3. Check browser console for CORS errors
4. Verify Supabase URL in environment variables

### Image Capture Failures
1. Check discovery-service logs for capture errors
2. Verify external URL is accessible
3. Check image size and MIME type
4. Ensure Supabase Storage has capacity

### Next.js Image Errors
- Should be resolved! But if they persist:
- Verify `unoptimized` prop is used for external URLs
- Check that storage URLs are being returned from API

## Summary

✅ **Problem Solved:** No more Next.js image configuration errors
✅ **Better Performance:** CDN-backed Supabase Storage
✅ **Improved Reliability:** Images persist locally
✅ **Enhanced Privacy:** No external tracking
✅ **Future-Proof:** Easy to migrate existing content

The system now automatically captures and stores all images and favicons during content submission, providing a fast, reliable, and privacy-respecting image delivery system.

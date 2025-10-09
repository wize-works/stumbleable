# Automatic Metadata Enhancement

## Overview

The automatic metadata enhancement system processes unscraped content in small batches to gradually enrich the database without overwhelming the system. This runs automatically via the scheduler service.

## How It Works

### 1. **Scheduled Job**
- **Job Name**: `auto-enhance-metadata`
- **Schedule**: Every 30 minutes (`*/30 * * * *`)
- **Batch Size**: 20 items per run
- **Service**: Crawler Service
- **Endpoint**: `/api/enhance/auto`

### 2. **Processing Strategy**
- Processes **newest content first** (ordered by `created_at DESC`)
- Only processes items where `metadata_scraped_at IS NULL` (never attempted)
- Extracts missing metadata: images, authors, content text, word count, topics
- **Always marks items as scraped** to prevent re-processing

### 3. **Critical Error Handling** ⚠️
**Problem**: Without proper error handling, failed items would retry forever, blocking all progress.

**Solution**: 
- ✅ **Always mark as scraped** - Even if extraction fails
- ✅ **Log the error** - Track what went wrong for debugging
- ✅ **Continue processing** - Don't let one bad URL stop the entire batch
- ✅ **Manual retry available** - Use `forceRescrape` flag if needed

**Why this matters**:
```typescript
// ❌ BAD: Failed items retry forever
try {
  const metadata = await extractMetadata(url);
  await saveMetadata(metadata);
} catch (error) {
  console.error(error); // Item stays unscraped, retries next run
}

// ✅ GOOD: Failed items are marked, progress continues
try {
  const metadata = await extractMetadata(url);
  await saveMetadata(metadata);
} catch (error) {
  await markAsScraped(url); // Mark as attempted even on failure
  console.error(error);     // Log for debugging
}
```

Common failures that should be skipped:
- **404/403 errors**: Content removed or access denied
- **Timeouts**: Server not responding
- **Invalid HTML**: Malformed pages
- **Bot blocking**: Site blocking automated access

### 4. **Performance Impact**
With 3,117 unscraped items:
- **156 runs** needed (3,117 ÷ 20)
- **~78 hours** to complete (156 × 0.5 hours)
- **~3.25 days** for full enhancement

This gradual approach ensures:
- ✅ No performance degradation
- ✅ System remains responsive
- ✅ Failed items don't block progress
- ✅ Can run alongside normal operations
- ✅ Bad URLs marked and skipped automatically

## Database Schema

The `content` table includes:
```sql
metadata_scraped_at TIMESTAMPTZ
  -- NULL: Never scraped (eligible for enhancement)
  -- NOT NULL: Already attempted (skip)
```

## API Endpoints

### POST `/api/enhance/auto`
**Called by**: Scheduler Service  
**Purpose**: Process a batch of unscraped content

**Request Body** (from scheduler):
```json
{
  "jobName": "auto-enhance-metadata",
  "config": {
    "batchSize": 20
  },
  "executionId": "uuid",
  "triggeredBy": "scheduler"
}
```

**Response**:
```json
{
  "success": true,
  "itemsProcessed": 20,
  "itemsSucceeded": 18,
  "itemsFailed": 2,
  "metadata": {
    "remainingCount": 3097,
    "errors": ["url1: timeout", "url2: 404"]
  }
}
```

## Admin UI

The crawler management page (`/admin/sources`) shows:
- **Progress Bar**: Visual representation of completion
- **Real-time Stats**: Scraped vs unscraped counts
- **Time Estimate**: Approximate completion time
- **Manual Enhancement**: Override buttons for immediate processing

### UI Features
```tsx
🤖 Automatic Enhancement Active
The scheduler processes 20 items every 30 minutes automatically.
At 3,117 items remaining, completion in approximately 78 hours.
```

## Configuration

### Adjusting Batch Size
To process more or fewer items per run:

```sql
UPDATE job_schedules 
SET config = '{"batchSize": 50}'::jsonb 
WHERE job_name = 'auto-enhance-metadata';
```

### Adjusting Frequency
To run more or less often:

```sql
-- Every 15 minutes
UPDATE job_schedules 
SET cron_expression = '*/15 * * * *' 
WHERE job_name = 'auto-enhance-metadata';

-- Every hour
UPDATE job_schedules 
SET cron_expression = '0 * * * *' 
WHERE job_name = 'auto-enhance-metadata';
```

### Disabling Auto-Enhancement
If you need to temporarily stop:

```sql
UPDATE job_schedules 
SET enabled = false 
WHERE job_name = 'auto-enhance-metadata';
```

Or via the Admin UI:
1. Navigate to `/admin/scheduler`
2. Find "🔍 Auto-Enhance Metadata"
3. Click "Disable"

## Monitoring

### Check Job Status
```sql
SELECT 
  job_name,
  status,
  started_at,
  completed_at,
  items_processed,
  items_succeeded,
  items_failed
FROM scheduled_jobs
WHERE job_name = 'auto-enhance-metadata'
ORDER BY started_at DESC
LIMIT 10;
```

### Check Remaining Items
```sql
SELECT 
  COUNT(*) as total,
  COUNT(metadata_scraped_at) as scraped,
  COUNT(*) - COUNT(metadata_scraped_at) as unscraped
FROM content;
```

### View Recent Errors
```sql
SELECT 
  metadata->>'errors' as errors
FROM scheduled_jobs
WHERE job_name = 'auto-enhance-metadata'
  AND items_failed > 0
ORDER BY started_at DESC
LIMIT 5;
```

## Manual Retry for Failed Items

If you need to retry items that failed during auto-enhancement:

### Option 1: Force Rescrape Specific URLs
```bash
curl -X POST http://localhost:7004/api/enhance/metadata \
  -H "Content-Type: application/json" \
  -d '{
    "contentIds": ["uuid1", "uuid2"],
    "forceRescrape": true
  }'
```

### Option 2: Reset Scraped Status
If many items failed and you want to retry them all:

```sql
-- Reset scraped status for items with missing critical fields
UPDATE content 
SET metadata_scraped_at = NULL 
WHERE metadata_scraped_at IS NOT NULL 
  AND (
    image_url IS NULL 
    OR author IS NULL 
    OR content_text IS NULL
  );
```

**Warning**: Use this cautiously - it will cause items to be re-processed!

### Option 3: Identify Problematic Domains
Find domains with high failure rates:

```sql
SELECT 
  domain,
  COUNT(*) as total,
  COUNT(image_url) as has_image,
  COUNT(author) as has_author,
  COUNT(content_text) as has_content,
  (COUNT(*) - COUNT(image_url)) as missing_images
FROM content
WHERE metadata_scraped_at IS NOT NULL
GROUP BY domain
HAVING (COUNT(*) - COUNT(image_url)) > 5
ORDER BY missing_images DESC
LIMIT 20;
```

## Troubleshooting

### Job Not Running
1. Check if scheduler service is running:
   ```bash
   curl http://localhost:7007/health
   ```

2. Check if job is enabled:
   ```sql
   SELECT enabled FROM job_schedules 
   WHERE job_name = 'auto-enhance-metadata';
   ```

3. Restart scheduler service to reload jobs:
   ```bash
   npm run dev:scheduler
   ```

### High Failure Rate
If many items are failing:
1. Check recent errors in `scheduled_jobs.metadata`
2. Common issues:
   - **Timeouts**: Increase timeout in `extractMetadata()`
   - **403/404 errors**: Content removed or blocking bots
   - **Invalid URLs**: Clean up data before enhancement

### Manual Trigger
To run immediately (bypass schedule):
```bash
curl -X POST http://localhost:7007/api/jobs/auto-enhance-metadata/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## Architecture

```
┌─────────────────────┐
│  Scheduler Service  │
│   (Port 7007)       │
│                     │
│  ┌──────────────┐   │
│  │  Cron Jobs   │   │
│  │  Every 30min │   │
│  └──────┬───────┘   │
└─────────┼───────────┘
          │
          │ POST /api/enhance/auto
          ▼
┌─────────────────────┐
│  Crawler Service    │
│   (Port 7004)       │
│                     │
│  ┌──────────────┐   │
│  │  Enhance     │   │
│  │  Endpoint    │   │
│  └──────┬───────┘   │
└─────────┼───────────┘
          │
          │ SELECT metadata_scraped_at IS NULL
          │ UPDATE metadata_scraped_at = NOW()
          ▼
┌─────────────────────┐
│    Supabase         │
│   (PostgreSQL)      │
│                     │
│  ┌──────────────┐   │
│  │   content    │   │
│  │   table      │   │
│  └──────────────┘   │
└─────────────────────┘
```

## Future Enhancements

### Intelligent Prioritization
Instead of newest-first, prioritize by:
- Content popularity (views, saves)
- Domain reputation
- Missing field count

### Adaptive Batch Size
Automatically adjust batch size based on:
- System load
- Time of day
- Success/failure rate

### Retry Logic
- Retry failed items after X days
- Exponential backoff for persistent failures
- Permanent failure tracking

### Quality Metrics
Track enhancement quality:
- Fields successfully extracted
- Common failure patterns
- Domain-specific success rates

## See Also
- [Metadata Enhancement Tracking](./METADATA_ENHANCEMENT_TRACKING.md)
- [Metadata Enhancement Migration](./METADATA_ENHANCEMENT_MIGRATION.md)
- [Scheduler Service Documentation](../apis/scheduler-service/README.md)
- [Crawler Service Documentation](../apis/crawler-service/README.md)

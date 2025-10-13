# Reddit Link Extraction Feature

## Overview

The Reddit Link Extraction feature allows Stumbleable to automatically discover and queue external content from Reddit RSS feeds. This multiplies content discovery by using Reddit's community curation to find interesting external links.

## How It Works

### 1. **Reddit RSS Sources**
- Add Reddit RSS feeds (e.g., `https://www.reddit.com/r/photography/.rss`)
- Enable link extraction to automatically find external URLs from Reddit posts
- System processes both the Reddit post itself AND external links mentioned in posts

### 2. **Link Extraction Process**
- Parse Reddit RSS feed items
- Extract external links from post content and descriptions  
- Filter out social media, ads, and low-quality sites
- Queue both Reddit posts and extracted external links for crawling
- External links get higher priority (8) vs Reddit posts (5)

### 3. **Content Flow**
```
Reddit RSS Feed → Parse Posts → Extract External Links → Queue for Processing
      ↓                ↓                    ↓                     ↓
   r/photography    Parse HTML         Filter URLs           Add to Queue
      ↓                ↓                    ↓                     ↓
  Reddit Post    Extract <a href>    Block social media    Higher Priority
      +               +                    +                     +
External Links   Extract text URLs   Block URL shorteners  Lower Priority
```

## Database Schema

### Enhanced crawler_sources Table
```sql
ALTER TABLE crawler_sources 
ADD COLUMN extract_links BOOLEAN DEFAULT FALSE,
ADD COLUMN last_extraction TIMESTAMPTZ,
ADD COLUMN reddit_subreddit TEXT;
```

### New extracted_links_queue Table
```sql
CREATE TABLE extracted_links_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES crawler_sources(id),
  original_url TEXT NOT NULL,    -- Reddit post URL
  extracted_url TEXT NOT NULL,   -- External link found in post
  title TEXT,
  subreddit TEXT,
  extraction_context JSONB,      -- Post title, author, etc.
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Add Reddit Source (Shortcut)
```typescript
POST /api/sources/reddit
{
  "subreddit": "photography",
  "extract_links": true,
  "crawl_frequency_hours": 24,
  "topics": ["photography"],
  "enabled": true
}
```

### Manual Link Extraction
```typescript
POST /api/sources/:sourceId/extract-links
```

### View Extracted Links Queue
```typescript
GET /api/extracted-links?status=pending&limit=50&subreddit=photography
```

### Mark Link as Processed
```typescript
PATCH /api/extracted-links/:linkId
{
  "status": "processed",
  "error_message": "Optional error details"
}
```

## Frontend Integration

### CrawlerAPI Methods
```typescript
// Add a Reddit source with link extraction
const result = await CrawlerAPI.addRedditSource({
  subreddit: 'photography',
  extractLinks: true,
  crawlFrequencyHours: 24,
  topics: ['photography']
}, token);

// Manually trigger link extraction
await CrawlerAPI.extractLinksFromSource(sourceId, token);

// Get extracted links queue
const links = await CrawlerAPI.getExtractedLinks({
  status: 'pending',
  limit: 50
}, token);

// Mark as processed
await CrawlerAPI.markExtractedLinkAsProcessed(
  linkId, 
  'processed', 
  undefined, 
  token
);
```

## Content Filtering

### Blocked Domains (Automatically Filtered)
- **Social Media**: Facebook, Twitter, Instagram, YouTube, TikTok, LinkedIn
- **E-commerce**: Amazon, eBay, Alibaba, Shopify, Etsy, Walmart
- **URL Shorteners**: bit.ly, tinyurl.com, t.co, goo.gl, ow.ly
- **Ad Networks**: doubleclick.net, googleadservices.com, outbrain.com
- **File Sharing**: Dropbox, Google Drive, Mega, MediaFire
- **Low-quality**: Content farms, clickbait sites
- **Adult Content**: Adult entertainment sites

### Allowed Content
- News websites and blogs
- Educational content
- Technical documentation
- Photography portfolios and tutorials
- Research papers and articles
- Open source projects
- Creative portfolios

## Example Workflow

1. **Admin adds Reddit source**:
   ```typescript
   await CrawlerAPI.addRedditSource({
     subreddit: 'webdev',
     extractLinks: true
   }, adminToken);
   ```

2. **System extracts links**:
   - Finds Reddit post: "Amazing new CSS framework"
   - Extracts external link: `https://newcssframework.com`
   - Queues both with context

3. **Content gets processed**:
   - Reddit post tagged as `webdev` topic
   - External site gets crawled and metadata extracted
   - Both appear in discovery feed with proper attribution

## Benefits

- **10x Content Multiplier**: One Reddit RSS feed → dozens of external links
- **Community Curation**: Reddit's voting system pre-filters quality
- **Natural Topics**: Subreddits provide automatic topic categorization
- **Fresh Discovery**: Latest community discussions lead to new sites
- **Context Preservation**: Know why/where content was shared

## Admin Interface

The admin dashboard shows:
- Reddit sources with extraction status
- Extracted links queue with processing status  
- Statistics on extraction success rates
- Manual controls for triggering extraction
- Filtering and search for specific subreddits

## Performance Considerations

- Link extraction runs asynchronously
- Duplicate URLs automatically filtered
- Configurable extraction frequency per source
- Batch processing of extracted links
- Priority queuing for external vs Reddit content

## Future Enhancements

- **AI Content Classification**: Auto-tag extracted content
- **Quality Scoring**: Rate external sites based on Reddit engagement
- **User Preferences**: Let users follow specific subreddits
- **Link Validation**: Check if external links are still active
- **Trend Detection**: Identify viral content across subreddits
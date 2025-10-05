# Cascading Metadata Extraction Implementation

## Overview

Implemented a comprehensive cascading fallback system for metadata extraction in the crawler service. The system prioritizes semantic HTML, falls back to SEO/social meta tags, and finally uses generic HTML as a last resort.

## Implementation Date
October 4, 2025

## Problem Statement

When scraping websites, we need to extract metadata (title, description, images, etc.) reliably across different site structures. Previously:
- Limited fallback options led to missing data
- No prioritization of semantic vs. generic sources
- Manual batch processing required after crawling
- Poor extraction logging made debugging difficult

## Solution

### 1. Cascading Fallback System

Implemented a priority-based extraction system that tries multiple sources for each metadata field:

#### Title Extraction Chain
1. `<h1>` - Semantic heading (highest priority)
2. `<meta property="og:title">` - Open Graph
3. `<meta name="twitter:title">` - Twitter Cards
4. `<title>` - HTML title tag
5. `<h2>` - Secondary heading
6. Schema.org `itemprop="headline"` - Structured data

#### Description Extraction Chain
1. `<meta property="og:description">` - Open Graph
2. `<meta name="twitter:description">` - Twitter Cards
3. `<meta name="description">` - Standard meta tag
4. Schema.org `itemprop="description"` - Structured data
5. First `<p>` in article or document

#### Image Extraction Chain
1. `<meta property="og:image">` - Open Graph (preferred)
2. `<meta property="og:image:secure_url">` - Secure OG image
3. `<meta name="twitter:image">` - Twitter Cards
4. Schema.org `itemprop="image"` - Structured data
5. `<link rel="image_src">` - Legacy image source
6. First `<img>` in `<article>` element
7. First `<img>` in document

#### Author Extraction Chain
1. `<meta name="author">` - Standard meta tag
2. `<meta property="article:author">` - Article metadata
3. Schema.org `itemprop="author"` - Structured data
4. `<a rel="author">` - Semantic author link
5. Elements with class `author`
6. Elements with class `byline`
7. Pattern matching for "By AuthorName"

#### Published Date Extraction Chain
1. `<meta property="article:published_time">` - Article metadata
2. `<meta itemprop="datePublished">` - Schema.org
3. `<meta name="date">` - Generic date meta
4. `<meta name="publish-date">` - Publish date meta
5. `<time datetime="">` - Semantic time element
6. `<time pubdate>` - Published time element

#### Content Text Extraction Chain
1. `<article>` - Semantic article container
2. `[role="main"]` - Main content role
3. `[itemprop="articleBody"]` - Schema.org article body
4. `<main>` - Main content element
5. `.content, .post-content, .entry-content` - Common content classes
6. `.article-body, .article-content` - Article classes
7. `.post, .entry` - Post classes
8. `#content, #main-content` - Common content IDs
9. All `<p>` tags as fallback

#### Topics Extraction Chain
1. `<meta name="keywords">` - Meta keywords
2. `<meta property="article:tag">` - Article tags (multiple)
3. Schema.org `itemprop="keywords"` - Structured data keywords
4. `.tag, .tags, .category, .categories, [rel="tag"]` - HTML tag/category elements
5. URL path segments (excluding common paths like `/blog/`, `/post/`)
6. **Content analysis** - Keyword detection from content text:
   - Technology, Science, Business, Health, Education
   - Entertainment, Sports, Finance, Politics, Design
   - Food, Travel, Fashion, Gaming, Crypto, AI
   - Environment, Photography, Music
   - Requires 2+ matching keywords for topic assignment

### 2. Automatic Enhancement After Crawling

**Before**: Manual batch processing of 100 items at a time
**After**: Automatic enhancement triggered immediately after crawling

**Implementation**:
```typescript
// In CrawlerEngine.crawlSource()
const results = await this.submitItems(source, job.id, items);

// Automatic enhancement for newly submitted content
if (results.newContentIds.length > 0) {
    console.log(`Triggering metadata enhancement for ${results.newContentIds.length} new items`);
    this.enhanceMetadata(results.newContentIds).catch((error: Error) => {
        console.error('Background metadata enhancement failed:', error);
    });
}
```

**Benefits**:
- No manual intervention required
- New content fully enriched immediately
- Non-blocking background process
- Configurable via `AUTO_ENHANCE_METADATA` environment variable

### 3. Enhanced Validation & Cleaning

**Title Validation**:
- Length between 3-200 characters
- Removes common suffixes (e.g., "| Site Name")
- Cleans whitespace and newlines

**Description Validation**:
- Length between 20-500 characters
- Cleans whitespace and newlines

**Image Validation**:
- Must be http/https URL
- Must match common image extensions or be valid URL
- Filters out tracking pixels (1x1, pixel, track, beacon patterns)
- Resolves relative URLs to absolute

**Author Validation**:
- Length between 2-100 characters
- Removes "by", "von", "de", "par" prefixes
- Cleans whitespace

**Date Validation**:
- Valid ISO date format
- Year between 1990 and current year
- Converts to ISO 8601 format

**Content Text Validation**:
- Minimum 50 characters
- Maximum 2000 characters
- Removes script, style, nav, footer, aside elements
- Removes advertisement elements
- Cleans and normalizes whitespace
- Calculates word count

### 4. Extraction Logging

Each extraction logs which source was used:

```
[https://example.com] Extracted from: title:h1, description:og:description, image:og:image, author:meta:author, date:article:published_time, content:article, topics:meta:keywords+content:analysis
```

This enables:
- Debugging extraction issues
- Understanding which sources work best
- Optimizing extraction order
- Identifying sites with poor metadata

### 5. Intelligent Topic Detection

**Topic Merging Strategy**:
- User-provided topics from crawler sources are preserved
- Extracted topics are **added** to existing topics (not replaced)
- Duplicates are automatically filtered
- Maximum 10 topics per content item

**Content-Based Topic Detection**:
Uses keyword analysis to detect topics from the actual content. Requires 2+ matching keywords from predefined topic categories:

| Topic | Keywords |
|-------|----------|
| **Technology** | software, hardware, computer, digital, internet, programming, code, developer |
| **Science** | research, study, scientist, laboratory, experiment, discovery, scientific |
| **Business** | company, startup, entrepreneur, market, industry, enterprise, corporate |
| **Health** | health, medical, doctor, patient, disease, treatment, medicine, wellness |
| **Education** | education, school, university, learning, student, teacher, course, academic |
| **Entertainment** | movie, film, music, game, show, series, artist |
| **Sports** | sport, team, player, game, match, league, championship, athlete |
| **Finance** | finance, money, investment, stock, trading, market, economy, financial |
| **Politics** | government, political, election, policy, democracy, vote, parliament |
| **Design** | design, ui, ux, interface, visual, graphic, creative, branding |
| **AI** | artificial intelligence, machine learning, neural network, deep learning, chatbot |
| **Crypto** | crypto, cryptocurrency, bitcoin, blockchain, ethereum, wallet, mining |
| **Gaming** | gaming, gamer, console, gameplay, rpg, fps, multiplayer |

**Topic Normalization**:
- Lowercase conversion
- Special character removal (keeps spaces and hyphens)
- Length validation (3-30 characters)
- Stop word filtering
- Number-only filtering

**Example**:
```typescript
// Page has:
// - Meta keywords: "web development, javascript, react"
// - Article tags: "frontend", "coding"
// - URL: /blog/react-tutorial
// - Content: mentions "programming", "developer", "code" multiple times

// Result:
topics: [
  "web development",  // from meta keywords
  "javascript",        // from meta keywords
  "react",            // from meta keywords + URL
  "frontend",         // from article tags
  "coding",           // from article tags
  "technology"        // from content analysis (programming, developer, code)
]
```

## Configuration

### Environment Variables

```env
# Enable/disable automatic enhancement after crawling
AUTO_ENHANCE_METADATA=true  # Default: true

# Crawler service URL for internal API calls
CRAWLER_SERVICE_URL=http://localhost:7004
```

### Disabling Auto-Enhancement

If you prefer manual batch processing:
```env
AUTO_ENHANCE_METADATA=false
```

Then manually trigger:
```bash
curl -X POST http://localhost:7004/api/enhance/metadata \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 100}'
```

## API Changes

### Enhanced Endpoint: POST /api/enhance/metadata

**Request Body**:
```json
{
  "contentIds": ["uuid1", "uuid2"],  // Optional: specific IDs to enhance
  "batchSize": 10,                    // Default: 10, max: 100
  "forceRescrape": false              // Default: false
}
```

**Response**:
```json
{
  "message": "Metadata enhancement completed",
  "processed": 10,
  "enhanced": 8,
  "results": [
    {
      "id": "uuid1",
      "url": "https://example.com",
      "status": "enhanced",
      "fieldsAdded": ["image_url", "author", "published_at"]
    }
  ]
}
```

### New Extraction Sources Logged

The extraction now logs which source was used for each field:
- `title:h1` - Title from h1 tag
- `description:meta:description` - Description from meta tag
- `image:og:image` - Image from Open Graph
- `author:article:author` - Author from article metadata
- `date:article:published_time` - Date from article metadata
- `content:article` - Content from article element
- `topics:meta:keywords+content:analysis` - Topics from multiple sources (combined with `+`)

## Testing

### Test with gerbera.io

**Before Enhancement**:
```sql
SELECT title, description, image_url, author FROM content WHERE url = 'https://gerbera.io/';
```

**Expected Results** (with cascading):
- **Title**: "Gerbera - A free media server. Stream your media to devices on your home network."
- **Description**: "Gerbera - A free media server. Stream your media to devices on your home network: Home Page"
- **Image**: GitHub fork ribbon image
- **Author**: null (not present on page)

**Console Log**:
```
[https://gerbera.io/] Extracted from: title:title, description:meta:description, image:first-img, content:paragraphs, topics:meta:keywords+url:path
```

### Manual Testing

1. **Mark content for re-scraping**:
```sql
UPDATE content SET metadata_scraped_at = NULL WHERE url = 'https://example.com/';
```

2. **Trigger enhancement**:
```bash
curl -X POST http://localhost:7004/api/enhance/metadata \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 1}'
```

3. **Check logs** for extraction sources
4. **Verify results** in database

## Performance Considerations

### Rate Limiting
- 500ms delay between requests (configurable)
- 10-second timeout per request
- Non-blocking enhancement doesn't block crawl completion

### Batch Processing
- Default batch size: 10 items
- Maximum batch size: 100 items
- Automatic enhancement processes all new items immediately

### Resource Usage
- Background enhancement runs asynchronously
- Failed enhancements don't fail the crawl
- Errors logged but don't stop processing

## Future Improvements

1. **Parallel Processing**: Process multiple URLs concurrently with worker pool
2. **Smart Caching**: Cache extraction patterns per domain
3. **ML-based Extraction**: Learn which selectors work best per domain
4. **Image Quality Check**: Validate image dimensions and quality
5. **Content Summarization**: Generate AI summaries for missing descriptions
6. **Language Detection**: Detect and store content language
7. **Structured Data**: Extract schema.org structured data more comprehensively
8. **AI Topic Classification**: Use LLM to classify content into topics based on actual understanding
9. **Topic Confidence Scores**: Assign confidence scores to detected topics
10. **Topic Hierarchy**: Build parent-child relationships between topics (e.g., "react" → "javascript" → "technology")

## Migration Notes

### For Existing Content

To re-enhance all existing content with the new extraction logic:

```sql
-- Reset metadata_scraped_at for all content
UPDATE content SET metadata_scraped_at = NULL;
```

Then trigger batch enhancement:
```bash
# Process in batches of 100
curl -X POST http://localhost:7004/api/enhance/metadata \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 100}'
```

### For New Deployments

No migration needed - new content will be automatically enhanced after crawling.

## Related Files

- `apis/crawler-service/src/routes/enhance.ts` - Extraction logic
- `apis/crawler-service/src/lib/crawler.ts` - Auto-enhancement trigger
- `apis/crawler-service/README.md` - Service documentation

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [HTML5 Semantic Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

# Metadata Enhancement Migration Summary

## What Changed

The metadata enhancement functionality has been **moved from Discovery Service to Crawler Service** to follow proper microservices architecture patterns.

## Why This Change?

- **Discovery Service** should focus on fast, read-only discovery operations
- **Crawler Service** is the appropriate place for heavy, write-intensive operations like web scraping and content enhancement
- This separation improves performance and maintainability

## Changes Made

### 1. Created New Enhance Route in Crawler Service
- **File**: `apis/crawler-service/src/routes/enhance.ts`
- **Endpoints**:
  - `POST /api/enhance/metadata` - Enhance content with missing metadata
  - `GET /api/enhance/status` - Get statistics about content needing enhancement

### 2. Updated Crawler Service
- Added `cheerio` dependency for HTML parsing
- Registered enhance route in `server.ts`
- Now listens on port **7004**

### 3. Removed from Discovery Service
- Deleted `apis/discovery-service/src/routes/enhance.ts`
- Removed enhance route registration from `server.ts`

### 4. Updated Enhancement Script
- **File**: `run-enhancement.ps1`
- Changed from Discovery Service (port 7001) to Crawler Service (port 7004)
- Updated all references and instructions

## How to Use

### Run the Enhancement Script
```powershell
.\run-enhancement.ps1
```

### Prerequisites
The Crawler Service must be running:
```powershell
npm run dev:crawler
# or start all services
npm run dev
```

### Manual Enhancement (PowerShell)
```powershell
# Enhance 10 records
$body = @{ batchSize = 10 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:7004/api/enhance/metadata" -Method POST -Body $body -ContentType "application/json"

# Check status
Invoke-RestMethod -Uri "http://localhost:7004/api/enhance/status" -Method GET
```

## API Endpoints

### POST /api/enhance/metadata
Scrapes web pages and enhances content records with missing metadata.

**Request Body:**
```json
{
  "batchSize": 10,  // optional, 1-100, default 10
  "contentIds": []  // optional, specific UUIDs to enhance
}
```

**Response:**
```json
{
  "message": "Metadata enhancement completed",
  "processed": 10,
  "enhanced": 8,
  "results": [
    {
      "id": "uuid",
      "url": "https://example.com",
      "status": "enhanced",
      "fieldsAdded": ["title", "description", "image_url", "author", "content_text", "word_count"]
    }
  ]
}
```

### GET /api/enhance/status
Get statistics about content that needs enhancement.

**Response:**
```json
{
  "total_content": 2000,
  "needs_enhancement": 1990,
  "has_image": 132,
  "has_author": 11,
  "has_content": 120,
  "has_word_count": 120
}
```

## What Gets Enhanced

The scraper extracts the following metadata from web pages:

1. **Title** - From Open Graph, Twitter Card, or `<title>` tag
2. **Description** - From meta tags
3. **Image URL** - From Open Graph, Twitter Card, or first `<img>` tag
4. **Author** - From meta tags or author elements
5. **Published Date** - From article metadata
6. **Content Text** - Extracted article body text (up to 2000 chars)
7. **Word Count** - Calculated from content text

## Architecture Benefits

### Before (Discovery Service)
- Mixed read and write operations
- Heavy scraping slowed down discovery queries
- Violated single responsibility principle

### After (Crawler Service)
- **Discovery Service**: Fast, read-only operations
- **Crawler Service**: Heavy write operations, scraping, content management
- Clear separation of concerns
- Better scalability

## Files Modified

1. ✅ `apis/crawler-service/src/routes/enhance.ts` - NEW
2. ✅ `apis/crawler-service/src/server.ts` - Updated
3. ✅ `apis/crawler-service/package.json` - Added cheerio
4. ✅ `apis/discovery-service/src/routes/enhance.ts` - DELETED
5. ✅ `apis/discovery-service/src/server.ts` - Removed enhance registration
6. ✅ `run-enhancement.ps1` - Updated to use port 7004

## Testing Results

Tested with 3 records:
- ✅ **3 processed**
- ✅ **3 enhanced** 
- ✅ Successfully extracted titles, descriptions, images, content, and word counts
- ✅ Database updated correctly

## Next Steps

You can now:
1. Run larger batches: `$body = @{ batchSize = 50 } | ConvertTo-Json; Invoke-RestMethod -Uri "http://localhost:7004/api/enhance/metadata" -Method POST -Body $body -ContentType "application/json"`
2. Check Supabase to verify the enhanced metadata
3. Use the enhanced metadata in your discovery cards

---

*Last Updated: October 3, 2025*

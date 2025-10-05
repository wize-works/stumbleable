# Batch Content Upload Feature - Implementation Summary

**Date**: October 4, 2025  
**Feature**: CSV Batch Upload for Content/Discoveries  
**Service**: Crawler Service  
**Status**: ✅ **COMPLETE**

---

## 📋 Overview

Admin users can now bulk upload content via CSV files. The system automatically:
1. ✅ Parses CSV file (up to 2000 rows, 10MB max)
2. ✅ **Smart column detection** - automatically maps column names (e.g., "link" → "url")
3. ✅ Validates URLs and metadata
4. ✅ Crawls and scrapes each URL for metadata
5. ✅ Extracts missing metadata (title, description, image, etc.)
6. ✅ Inserts content into database (status: 'pending' for moderation)
7. ✅ Returns detailed success/failure report with column mapping info

---

## 🏗️ Architecture

### Backend (Crawler Service)

**New Files:**
- `apis/crawler-service/src/routes/batch.ts` - Batch upload routes

**Modified Files:**
- `apis/crawler-service/package.json` - Added dependencies
- `apis/crawler-service/src/server.ts` - Registered multipart & batch routes

**Dependencies Added:**
- `@fastify/multipart@^8.3.0` - File upload handling
- `csv-parse@^5.5.6` - CSV parsing

### Frontend (Portal)

**New Files:**
- `ui/portal/components/batch-upload.tsx` - Upload UI component

**Modified Files:**
- `ui/portal/components/admin-dashboard.tsx` - Integrated upload component
- `ui/portal/lib/api-client.ts` - Added `CrawlerAPI.batchUpload()`

---

## 📡 API Endpoints

### POST `/api/admin/batch-upload`

**Authentication**: Admin only (via `requireAdmin` middleware)  
**Content-Type**: `multipart/form-data`  
**Max File Size**: 10MB  
**Max Rows**: 1000 per upload

**Request:**
```http
POST /api/admin/batch-upload
Authorization: Bearer {admin-clerk-jwt}
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="content.csv"
Content-Type: text/csv

{CSV content}
--boundary--
```

**Response:**
```json
{
  "success": true,
  "columnMapping": {
    "url": "Link",
    "title": "Name",
    "description": "Summary",
    "topics": "Tags",
    "author": "Creator",
    "published_date": "Date",
    "image_url": "Image"
  },
  "detectedColumns": ["Link", "Name", "Summary", "Tags", "Creator", "Date", "Image"],
  "summary": {
    "totalRows": 100,
    "processed": 100,
    "succeeded": 95,
    "failed": 5
  },
  "results": [
    {
      "row": 1,
      "url": "https://example.com/article1",
      "success": true,
      "contentId": "uuid-1234"
    },
    {
      "row": 42,
      "url": "https://bad-url.com",
      "success": false,
      "error": "URL already exists in database"
    }
  ]
}
```

### GET `/api/admin/batch-history`

**Authentication**: Admin only  
**Returns**: Recent batch uploads (last 100 items)

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid-1",
      "url": "https://example.com/article1",
      "title": "Article Title",
      "created_at": "2025-10-04T10:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

## 📄 CSV Format

### 🎯 Flexible Column Names (Smart Detection)

The system automatically detects and maps column names, so you don't have to rename your columns!

**URL Column (Required)** - Any of these work:
- `url`, `link`, `website`, `webpage`, `site`, `address`, `href`, `web address`

**Optional Columns** - Common variations are auto-detected:
- **Title**: `title`, `name`, `heading`, `header`, `headline`
- **Description**: `description`, `desc`, `summary`, `excerpt`, `content`, `body`, `text`
- **Topics**: `topics`, `tags`, `categories`, `category`, `keywords`, `subject`, `subjects`
- **Author**: `author`, `creator`, `writer`, `by`, `written by`, `posted by`
- **Published Date**: `published_date`, `date`, `published`, `publish_date`, `pub_date`, `created`, `created_at`, `published_at`, `publication_date`
- **Image**: `image_url`, `image`, `img`, `thumbnail`, `picture`, `photo`, `cover`, `cover_image`
- **Domain**: `domain`, `hostname`, `host`, `site_name`, `source`
- **Read Time**: `read_time`, `reading_time`, `read_duration`, `time_to_read`, `minutes`
- **Word Count**: `word_count`, `words`, `length`, `word_length`
- **Status**: `status`, `state`, `approval`, `moderation` (values: pending, approved, rejected, active)
- **Content Type**: `content_type`, `type`, `format`, `media_type`

**Case Insensitive**: Column names are matched regardless of case (e.g., `URL`, `Url`, `url` all work)

**Empty Values**: Empty strings in optional fields are treated as null/undefined and don't cause validation errors

### Example CSVs

**Standard Format:**
```csv
url,title,description,topics,author,published_date,image_url,domain,read_time,word_count,status
https://example.com/article1,Understanding ML,A guide to ML,"tech,ai",Dr. Jane,2025-10-01,https://example.com/img1.jpg,example.com,5,1200,approved
https://example.com/article2,Climate Solutions,Combat climate change,"science",John Doe,2025-10-02,,example.com,8,2000,pending
```

**Note**: Empty values (like the missing image_url in row 2) are handled gracefully.

**Alternative Format (auto-detected):**
```csv
Link,Name,Summary,Tags,Creator,Date,Image
https://example.com/article1,Understanding ML,A guide to ML,"tech,ai",Dr. Jane,2025-10-01,https://example.com/img1.jpg
https://example.com/article2,Climate Solutions,Combat climate change,"science",John Doe,2025-10-02,https://example.com/img2.jpg
```

**Minimal Format (URL only):**
```csv
website
https://example.com/article1
https://example.com/article2
```

**Sample Files**:
- Standard: `stumbleable/sample-batch-upload.csv`
- Alternative: `stumbleable/sample-batch-upload-alternative.csv`
- Minimal: `stumbleable/sample-batch-minimal.csv`

---

## 🎯 Column Mapping Examples

### Example 1: Standard Format
**Your CSV:**
```csv
url,title,description
https://example.com,My Article,Great content
```

**Detected Mapping:**
```json
{
  "url": "url",
  "title": "title",
  "description": "description"
}
```

### Example 2: Alternative Names
**Your CSV:**
```csv
Link,Name,Summary,Tags
https://example.com,My Article,Great content,"tech,ai"
```

**Detected Mapping:**
```json
{
  "url": "Link",        // ← Mapped from "link"
  "title": "Name",      // ← Mapped from "name"
  "description": "Summary",  // ← Mapped from "summary"
  "topics": "Tags"      // ← Mapped from "tags"
}
```

### Example 3: Mixed Case
**Your CSV:**
```csv
Website,TITLE,desc,Author
https://example.com,My Article,Great content,John Doe
```

**Detected Mapping:**
```json
{
  "url": "Website",     // ← Case-insensitive match
  "title": "TITLE",     // ← Works with any case
  "description": "desc", // ← Alias support
  "author": "Author"
}
```

### Example 4: Unmapped Columns
**Your CSV:**
```csv
url,title,internal_id,notes
https://example.com,My Article,12345,Some internal notes
```

**Detected Mapping:**
```json
{
  "url": "url",
  "title": "title"
  // internal_id and notes are ignored (not mapped)
}
```

**Note**: Unmapped columns are shown in the response but don't cause errors.

---

## 🔄 Processing Flow

```
1. User uploads CSV → Admin Dashboard
   ↓
2. Frontend validates file (size, type)
   ↓
3. POST /api/admin/batch-upload (Crawler Service)
   ↓
4. Parse CSV with csv-parse
   ↓
5. For each row:
   ├─ Validate URL format
   ├─ Check if URL already exists
   ├─ Fetch and scrape URL for metadata
   ├─ Merge CSV data with scraped data (CSV takes precedence)
   ├─ Extract domain
   └─ Insert into content table (status: 'pending')
   ↓
6. Return summary with successes/failures
   ↓
7. Frontend displays results
   ├─ Show statistics (total, succeeded, failed)
   ├─ List failed rows with errors
   └─ Allow downloading error report CSV
```

---

## 🎯 Data Merging Strategy

**Priority**: CSV data > Scraped data > Defaults

```typescript
// Example merge logic
const finalTitle = 
    row.title ||              // 1. CSV provided title
    processedContent.title || // 2. Scraped from page
    new URL(url).hostname;    // 3. Default to domain

const finalTopics = 
    csvTopics.length > 0 ? csvTopics :  // CSV topics
    processedContent.topics || [];      // Scraped topics
```

---

## 🔐 Security

### Admin-Only Access
- ✅ `requireAdmin` middleware checks user role
- ✅ Verifies Clerk JWT authentication
- ✅ Queries database for user role = 'admin'

### Column Mapping (Smart Detection)
- ✅ **Automatic detection** of CSV column names
- ✅ **Case-insensitive** matching (URL = Url = url)
- ✅ **Alias support** for common variations:
  - URL: `url`, `link`, `website`, `webpage`, `site`, `address`, `href`
  - Title: `title`, `name`, `heading`, `header`, `headline`
  - Description: `description`, `desc`, `summary`, `excerpt`, `content`, `body`
  - Topics: `topics`, `tags`, `categories`, `category`, `keywords`
  - Author: `author`, `creator`, `writer`, `by`
  - Date: `published_date`, `date`, `published`, `pub_date`, `created`
  - Image: `image_url`, `image`, `img`, `thumbnail`, `picture`, `photo`
- ✅ **Flexible format** - no need to rename columns in your CSV
- ✅ **Mapping feedback** - shows detected columns in response
- ✅ **Unmapped column detection** - identifies unused columns

### File Validation
- ✅ File type: Only `.csv` allowed
- ✅ File size: Max 10MB
- ✅ Row count: Max 2000 rows per upload
- ✅ URL validation: Must be valid HTTPS URLs
- ✅ **URL column required** - returns clear error if missing

### Rate Limiting
- ✅ 500ms delay between URL processing
- ✅ 10-second timeout per URL fetch
- ✅ Graceful error handling (continue on failures)

### Data Safety
- ✅ All content starts with `status: 'pending'`
- ✅ Requires moderation approval before going live
- ✅ Duplicate URL check (prevents re-adding existing content)
- ✅ Transaction-safe inserts

---

## 🎨 Frontend Features

### Upload Component (`BatchUpload`)

**Location**: `/admin` dashboard (admin-only)

**Features**:
- ✅ Drag-and-drop CSV file input
- ✅ File validation (type, size)
- ✅ Upload progress indicator
- ✅ Real-time status updates
- ✅ Success/failure statistics
- ✅ Detailed error table
- ✅ Download error report CSV
- ✅ Format instructions with example

**UI Elements**:
- Instructions card with required/optional columns
- Example CSV format preview
- File upload input with validation
- Upload button with loading state
- Results summary (stats cards)
- Failed rows table with links
- Download error report button

---

## 📊 Database Schema

### Content Table

**New Records Created**:
```sql
INSERT INTO content (
    url,
    title,
    description,
    domain,
    topics,
    image_url,
    author,
    published_date,
    status,            -- 'pending' (awaits moderation)
    metadata           -- JSON with source: 'batch_upload'
) VALUES (...);
```

**Metadata JSON**:
```json
{
  "source": "batch_upload",
  "csv_provided": {
    "title": true,
    "description": false,
    "topics": true,
    "author": false,
    "published_date": true,
    "image_url": true
  },
  "processed_at": "2025-10-04T10:00:00Z"
}
```

---

## 🧪 Testing

### Manual Testing

1. **Start services**:
   ```powershell
   npm run dev
   ```

2. **Navigate to admin dashboard**:
   - URL: http://localhost:3000/admin
   - Must be logged in as admin user

3. **Upload CSV**:
   - Use `sample-batch-upload.csv` as test file
   - Click "Upload" button
   - Wait for processing (should take ~1-2 minutes for 3 rows)
   - Verify results displayed

4. **Check database**:
   ```sql
   SELECT * FROM content 
   WHERE metadata->>'source' = 'batch_upload'
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Test Cases

**Standard Tests:**
- ✅ Valid CSV with all columns (`sample-batch-upload.csv`)
- ✅ Alternative column names (`sample-batch-upload-alternative.csv`)
- ✅ Minimal format - URL only (`sample-batch-minimal.csv`)
- ✅ Duplicate URLs (should fail gracefully)
- ✅ Invalid URLs (should fail with error message)
- ✅ Large file (test 10MB limit)
- ✅ Many rows (test 2000 row limit)
- ✅ Non-CSV file (should reject)
- ✅ Empty CSV (should show error)
- ✅ Malformed CSV (should show parse error)

**Column Mapping Tests:**
- ✅ Mixed case column names (`URL`, `Url`, `url`)
- ✅ Common aliases (`link` instead of `url`)
- ✅ Multiple valid aliases (should use first match)
- ✅ Unmapped columns (should be ignored)
- ✅ Missing URL column (should show clear error)

---

## 📈 Performance

### Processing Speed
- **Rate limit**: 500ms delay between URLs
- **Expected**: ~2 URLs per second
- **2000 rows**: ~16-20 minutes total

### Optimization Opportunities
- ⚡ Parallel processing (process 5-10 URLs concurrently)
- ⚡ Queue system (background jobs with Bull/Redis)
- ⚡ Batch database inserts (100 rows at a time)
- ⚡ Caching for duplicate domain checks

---

## 🚀 Future Enhancements

### Short Term
- [ ] Add batch upload history table (track uploads over time)
- [ ] Show real-time progress during upload
- [ ] Email notification when batch completes
- [ ] Retry failed rows

### Medium Term
- [ ] Schedule recurring batch uploads (cron jobs)
- [ ] Import from Google Sheets URL
- [ ] Support for other formats (JSON, XML)
- [ ] Batch edit existing content

### Long Term
- [ ] AI-powered topic extraction
- [ ] Automatic image generation (if missing)
- [ ] Content quality scoring
- [ ] Duplicate detection (similar URLs/titles)

---

## 📝 Usage Instructions

### For Admins

1. **Access Admin Dashboard**
   - Navigate to `/admin`
   - Ensure you have admin role

2. **Prepare CSV File**
   - Use the sample file as a template
   - Required: `url` column with HTTPS URLs
   - Optional: title, description, topics, author, etc.
   - Max 2000 rows, 10MB file size

3. **Upload**
   - Click "Select CSV File" button
   - Choose your CSV file
   - Click "Upload" button
   - Wait for processing (progress shown)

4. **Review Results**
   - Check summary statistics
   - Review failed rows (if any)
   - Download error report for failures
   - Fix errors and re-upload failed rows

5. **Moderation**
   - All uploaded content goes to moderation queue
   - Review at `/admin/moderation`
   - Approve/reject before going live

---

## 🛠️ Troubleshooting

### "File too large" Error
- **Cause**: CSV file > 10MB
- **Solution**: Split into smaller files (max 2000 rows each)

### "Too many rows" Error
- **Cause**: CSV has > 2000 rows
- **Solution**: Split into multiple batches

### "Invalid CSV format" Error
- **Cause**: Malformed CSV (quotes, commas, encoding)
- **Solution**: Re-save as UTF-8 CSV, check for special characters

### "URL already exists" Errors
- **Cause**: URL is already in database
- **Solution**: Check existing content, remove duplicates from CSV

### Slow Processing
- **Cause**: Many URLs to scrape (500ms delay per URL)
- **Expected**: ~2 URLs/second = ~16 minutes for 2000 rows
- **Solution**: Use smaller batches for faster feedback

### Scraping Failures
- **Cause**: Website blocking, timeout, invalid HTML
- **Solution**: CSV data still used, scraping optional

---

## ✅ Checklist

### Backend
- [x] Add CSV parsing library
- [x] Add multipart file upload support
- [x] Create batch upload endpoint
- [x] Implement CSV validation
- [x] Implement URL scraping/crawling
- [x] Implement metadata extraction
- [x] Implement database insertion
- [x] Add admin authentication
- [x] Add error handling
- [x] Register routes in server

### Frontend
- [x] Create upload component
- [x] Add file validation
- [x] Add progress indicator
- [x] Display results summary
- [x] Show failed rows
- [x] Download error report
- [x] Add to admin dashboard
- [x] Update API client

### Documentation
- [x] API endpoint documentation
- [x] CSV format specification
- [x] Usage instructions
- [x] Security considerations
- [x] Testing procedures
- [x] Sample CSV file

---

## 📚 Related Files

### Backend
- `apis/crawler-service/src/routes/batch.ts`
- `apis/crawler-service/src/server.ts`
- `apis/crawler-service/package.json`
- `apis/crawler-service/src/middleware/auth.ts`

### Frontend
- `ui/portal/components/batch-upload.tsx`
- `ui/portal/components/admin-dashboard.tsx`
- `ui/portal/lib/api-client.ts`

### Documentation
- `sample-batch-upload.csv`
- `docs/BATCH_UPLOAD_FEATURE.md` (this file)

---

**Implementation Complete**: October 4, 2025  
**Next Steps**: Test with real data, gather admin feedback, optimize performance

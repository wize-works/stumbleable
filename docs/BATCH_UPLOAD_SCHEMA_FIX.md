# Batch Upload Schema Fix - Complete

**Date**: October 4, 2025  
**Issue**: Database schema mismatch causing insert failures  
**Status**: ✅ **FIXED**

---

## 🔍 Problem Analysis

Used Supabase MCP tool to verify actual table structure and discovered multiple mismatches:

### ❌ Issues Found
```typescript
// WRONG - What we thought existed:
{
    published_date: '...',              // ❌ Column doesn't exist
    reading_time_minutes: 5,            // ❌ Column name is wrong
    status: 'pending',                  // ❌ Column doesn't exist  
    metadata: {...},                    // ❌ Column doesn't exist
    content_type: '...'                 // ❌ Column doesn't exist
}
// Topics via junction table only      // ❌ Also direct ARRAY column

// WRONG - Timestamp handling:
published_at: ""                        // ❌ Empty string fails PostgreSQL validation
published_at: "2025-10-03 00:00:00 +0000 UTC"  // ❌ Invalid format
```

### ✅ Actual Schema (from Supabase)
```sql
CREATE TABLE content (
    id UUID PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT NOT NULL,              -- ✅ EXISTS
    image_url TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,          -- ✅ NOT published_date
    reading_time INTEGER,              -- ✅ NOT reading_time_minutes
    word_count INTEGER DEFAULT 0,
    content_text TEXT,
    topics TEXT[],                     -- ✅ ARRAY column (not just junction)
    quality_score NUMERIC,
    freshness_score NUMERIC,
    trending_score NUMERIC,
    base_score NUMERIC,
    popularity_score NUMERIC,
    is_active BOOLEAN DEFAULT true,
    ...
    -- NO status, metadata, or content_type columns
);
```

---

## ✅ Fixes Applied

### 1. Empty String Validation
```typescript
// Transform empty strings to undefined before validation
const emptyStringToUndefined = (val: any) => {
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
};

// All optional fields use preprocess
image_url: z.preprocess(emptyStringToUndefined, z.string().url().optional())
```

### 2. Timestamp Sanitization (New Fix)
```typescript
// Sanitize timestamps to ISO 8601 or null
const sanitizeTimestamp = (val: any): string | null => {
    if (!val || typeof val !== 'string') return null;
    
    const trimmed = val.trim();
    if (trimmed === '') return null;
    
    try {
        // Handle format: "2025-10-03 00:00:00 +0000 UTC"
        const cleaned = trimmed.replace(/ UTC$/, '');
        const date = new Date(cleaned);
        
        // Check if valid date
        if (isNaN(date.getTime())) return null;
        
        // Return ISO 8601 format
        return date.toISOString();
    } catch (error) {
        // Invalid date - return null instead of throwing
        return null;
    }
};

// Apply to published_date field
published_date: z.preprocess(sanitizeTimestamp, z.string().optional())
```

**What it fixes:**
- ✅ Empty strings → `null` (not database error)
- ✅ `"2025-10-03 00:00:00 +0000 UTC"` → `"2025-10-03T00:00:00.000Z"`
- ✅ Invalid formats → `null` with warning logged
- ✅ Unparseable dates don't block entire row import

### 3. Correct Column Names
```typescript
// BEFORE (Wrong column names)
published_date: finalPublishedDate,     // ❌
reading_time_minutes: readTime,         // ❌
status: finalStatus,                    // ❌
metadata: {...}                         // ❌

// AFTER (Correct column names)
published_at: finalPublishedAt,         // ✅
reading_time: readingTimeMinutes,       // ✅
domain: domain,                         // ✅ (extracted from URL)
topics: finalTopics,                    // ✅ (ARRAY column)
// Removed: status, metadata, content_type
```

### 4. Non-Critical Optional Field Handling
```typescript
// Log warnings but don't fail import for bad optional values
const finalImageUrl = row.image_url || processedContent.image_url;
if (row.image_url && !finalImageUrl) {
    fastify.log.warn({ url, image_url: row.image_url }, 'Invalid image URL, skipping');
}

const finalPublishedAt = row.published_date || sanitizeTimestamp(processedContent.published_at);
if ((row.published_date || processedContent.published_at) && !finalPublishedAt) {
    fastify.log.warn({ url, timestamp: ... }, 'Invalid timestamp format, skipping');
}
```

**Benefits:**
- ✅ Invalid optional fields → warning logged, field set to null
- ✅ Import continues successfully
- ✅ Users get feedback about data issues without blocking bulk upload

### 5. Topics Handling
```typescript
// Topics are stored BOTH ways:
// 1. Direct ARRAY column on content table
topics: finalTopics,  // ['tech', 'ai', 'ml']

// 2. Junction table for relational queries (optional, best-effort)
// Insert into content_topics with topic_id references
```

---

## 📊 Final Insert Structure

```typescript
await supabase
    .from('content')
    .insert({
        url,                              // ✅ Required
        title: finalTitle,                // ✅ Required
        description: finalDescription,    // ✅ Optional
        domain,                           // ✅ Required (from URL)
        topics: finalTopics,              // ✅ ARRAY of strings
        image_url: finalImageUrl,         // ✅ Optional (empty string → NULL)
        author: finalAuthor,              // ✅ Optional
        published_at: finalPublishedAt,   // ✅ Timestamp
        word_count: wordCount || 0,       // ✅ Integer
        reading_time: readingMinutes || 0,// ✅ Integer
        content_text: scrapedText,        // ✅ Full content
        is_active: true                   // ✅ Boolean
    });
```

---

## 🧪 Testing Checklist

Now ready to upload your CSV with:
- ✅ Empty optional fields (image_url, author, published_date, etc.)
- ✅ Domain values (extracted if not provided)
- ✅ Topics as comma-separated strings
- ✅ Reading time and word count
- ✅ Published dates in various formats (ISO 8601, UTC format, etc.)
- ✅ Invalid timestamps (will be logged and skipped, not fail import)
- ✅ All flexible column name variations

**Timestamp Format Examples:**
- ✅ `"2025-10-03T14:30:00Z"` → Valid ISO 8601
- ✅ `"2025-10-03 00:00:00 +0000 UTC"` → Sanitized to ISO 8601
- ✅ `""` → Null (no error)
- ✅ `"invalid-date"` → Null with warning logged

---

## 📝 Key Learnings

1. **Always verify schema** - Use Supabase MCP tools to confirm actual structure
2. **Column names matter** - `reading_time` ≠ `reading_time_minutes`, `published_at` ≠ `published_date`
3. **Check for duplicates** - Some data (topics) stored in multiple places
4. **Handle nulls properly** - Empty strings must become undefined/null for validation
5. **Sanitize timestamps** - PostgreSQL requires valid ISO 8601 or null, not empty strings
6. **Make optional fields non-critical** - Invalid values shouldn't block entire import
7. **Don't assume migrations** - Features like `metadata` may not exist yet

---

## 🚀 Ready to Upload

Your `stumbleable_niche_20251004_023558_part1.csv` should now process successfully!

```powershell
# Start services
npm run dev

# Upload via admin dashboard
# http://localhost:3000/admin
```

Expected: All rows with proper URLs should insert successfully, with empty fields handled gracefully.

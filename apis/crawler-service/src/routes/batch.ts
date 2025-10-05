import * as cheerio from 'cheerio';
import { parse } from 'csv-parse/sync';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';

// Column mapping - supports various naming conventions
const COLUMN_MAPPINGS: Record<string, string[]> = {
    url: ['url', 'link', 'website', 'webpage', 'site', 'address', 'href', 'web address'],
    title: ['title', 'name', 'heading', 'header', 'headline'],
    description: ['description', 'desc', 'summary', 'excerpt', 'content', 'body', 'text'],
    topics: ['topics', 'tags', 'categories', 'category', 'keywords', 'subject', 'subjects'],
    author: ['author', 'creator', 'writer', 'by', 'written by', 'posted by'],
    published_date: ['published_date', 'date', 'published', 'publish_date', 'pub_date', 'created', 'created_at', 'published_at', 'publication_date'],
    image_url: ['image_url', 'image', 'img', 'thumbnail', 'picture', 'photo', 'cover', 'cover_image'],
    favicon_url: ['favicon_url', 'favicon', 'icon'],
    domain: ['domain', 'hostname', 'host', 'site_name', 'source'],
    read_time: ['read_time', 'reading_time', 'read_duration', 'time_to_read', 'minutes'],
    word_count: ['word_count', 'words', 'length', 'word_length'],
    status: ['status', 'state', 'approval', 'moderation'],
    content_type: ['content_type', 'type', 'format', 'media_type']
};

// Helper to transform empty strings to undefined
const emptyStringToUndefined = (val: any) => {
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
};

// Helper to sanitize and validate timestamps
// Converts to ISO 8601 or returns undefined for invalid formats
// Returns undefined (not null) so Zod optional() works correctly
const sanitizeTimestamp = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val !== 'string') return undefined;

    const trimmed = val.trim();
    if (trimmed === '') return undefined;

    try {
        // Handle format: "2025-10-03 00:00:00 +0000 UTC"
        // Remove the trailing " UTC" if present
        const cleaned = trimmed.replace(/ UTC$/, '');

        // Try to parse as Date
        const date = new Date(cleaned);

        // Check if valid date
        if (isNaN(date.getTime())) {
            return undefined;
        }

        // Return ISO 8601 format
        return date.toISOString();
    } catch (error) {
        // Invalid date format - return undefined instead of throwing
        return undefined;
    }
};

// CSV row validation schema
const CsvRowSchema = z.object({
    url: z.string().url(),
    title: z.preprocess(emptyStringToUndefined, z.string().optional()),
    description: z.preprocess(emptyStringToUndefined, z.string().optional()),
    topics: z.preprocess(emptyStringToUndefined, z.string().optional()), // Comma-separated or semicolon-separated
    author: z.preprocess(emptyStringToUndefined, z.string().optional()),
    published_date: z.preprocess(sanitizeTimestamp, z.string().optional()), // Will be null for invalid formats
    image_url: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
    domain: z.preprocess(emptyStringToUndefined, z.string().optional()),
    read_time: z.preprocess(emptyStringToUndefined, z.union([z.string(), z.number()]).optional()),
    word_count: z.preprocess(emptyStringToUndefined, z.union([z.string(), z.number()]).optional()),
    status: z.preprocess(emptyStringToUndefined, z.enum(['pending', 'approved', 'rejected', 'active']).optional()),
    content_type: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

interface CsvRow {
    url: string;
    title?: string;
    description?: string;
    topics?: string;
    author?: string;
    published_date?: string;
    image_url?: string;
    domain?: string;
    read_time?: string | number;
    word_count?: string | number;
    status?: 'pending' | 'approved' | 'rejected' | 'active';
    content_type?: string;
}

interface ProcessingResult {
    row: number;
    url: string;
    success: boolean;
    contentId?: string;
    error?: string;
}

interface ColumnMapping {
    [key: string]: string | null; // Maps our field names to detected CSV column names
}

interface ExtractedMetadata {
    title?: string;
    description?: string;
    image_url?: string;
    author?: string;
    published_at?: string;
    word_count?: number;
    content_text?: string;
    topics?: string[];
}

/**
 * Detect column mapping from CSV headers
 * Maps CSV column names to our standardized field names
 */
function detectColumnMapping(csvHeaders: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
        url: null,
        title: null,
        description: null,
        topics: null,
        author: null,
        published_date: null,
        image_url: null,
        domain: null,
        read_time: null,
        word_count: null,
        status: null,
        content_type: null
    };

    // Normalize CSV headers (lowercase, trim)
    const normalizedHeaders = csvHeaders.map(h => h.toLowerCase().trim());

    // Try to match each of our fields
    for (const [ourField, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        for (const alias of aliases) {
            const foundIndex = normalizedHeaders.indexOf(alias.toLowerCase());
            if (foundIndex !== -1) {
                mapping[ourField] = csvHeaders[foundIndex]; // Store original column name
                break; // Use first match
            }
        }
    }

    return mapping;
}

/**
 * Map a CSV row to our standardized format using detected column mapping
 */
function mapCsvRow(row: any, mapping: ColumnMapping): CsvRow {
    const mapped: any = {};

    for (const [ourField, csvColumn] of Object.entries(mapping)) {
        if (csvColumn && row[csvColumn] !== undefined) {
            mapped[ourField] = row[csvColumn];
        }
    }

    return mapped as CsvRow;
}

/**
 * Batch upload routes for content ingestion
 * Admin-only endpoints for bulk CSV upload and processing
 */
export async function batchRoutes(fastify: FastifyInstance) {

    /**
     * Upload and process CSV file with content URLs
     * POST /admin/batch-upload
     * 
     * CSV Format:
     * url,title,description,topics,author,published_date,image_url
     * https://example.com/article1,Title 1,Description 1,"tech,ai",John Doe,2025-10-01,https://example.com/img1.jpg
     * https://example.com/article2,Title 2,Description 2,"science",Jane Smith,2025-10-02,https://example.com/img2.jpg
     * 
     * Required columns: url
     * Optional columns: title, description, topics, author, published_date, image_url
     */
    fastify.post('/admin/batch-upload', {
        preHandler: requireAdmin
    }, async (request: FastifyRequest, reply) => {
        try {
            const data = await (request as any).file();

            if (!data) {
                return reply.status(400).send({
                    error: 'No file uploaded',
                    message: 'Please upload a CSV file'
                });
            }

            // Validate file type
            const filename = data.filename.toLowerCase();
            if (!filename.endsWith('.csv')) {
                return reply.status(400).send({
                    error: 'Invalid file type',
                    message: 'Only CSV files are supported'
                });
            }

            // Read file content
            const buffer = await data.toBuffer();
            const csvContent = buffer.toString('utf-8');

            // Validate file size (max 10MB)
            if (buffer.length > 10 * 1024 * 1024) {
                return reply.status(400).send({
                    error: 'File too large',
                    message: 'Maximum file size is 10MB'
                });
            }

            // Parse CSV
            let records: any[];
            let headers: string[];
            try {
                records = parse(csvContent, {
                    columns: true, // Use first row as column names
                    skip_empty_lines: true,
                    trim: true,
                    relax_quotes: true,
                });

                // Extract headers from first record
                if (records.length > 0) {
                    headers = Object.keys(records[0]);
                } else {
                    throw new Error('No headers found');
                }
            } catch (error) {
                fastify.log.error(error, 'CSV parsing error');
                return reply.status(400).send({
                    error: 'Invalid CSV format',
                    message: 'Failed to parse CSV file. Please check the format.'
                });
            }

            if (records.length === 0) {
                return reply.status(400).send({
                    error: 'Empty CSV',
                    message: 'The CSV file contains no data rows'
                });
            }

            if (records.length > 2000) {
                return reply.status(400).send({
                    error: 'Too many rows',
                    message: 'Maximum 2000 rows per upload. Please split into smaller batches.'
                });
            }

            // Detect column mapping
            const columnMapping = detectColumnMapping(headers);

            // Validate that we have a URL column
            if (!columnMapping.url) {
                return reply.status(400).send({
                    error: 'Missing URL column',
                    message: `Could not find a URL column. Please include one of: ${COLUMN_MAPPINGS.url.join(', ')}`,
                    detectedColumns: headers
                });
            }

            fastify.log.info({
                rowCount: records.length,
                columnMapping,
                detectedColumns: headers
            }, 'Starting batch processing');

            // Validate and process each row
            const results: ProcessingResult[] = [];
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header row

                try {
                    // Map CSV row to our format
                    const mappedRow = mapCsvRow(row, columnMapping);

                    // Validate row
                    const validatedRow = CsvRowSchema.parse(mappedRow);

                    // Process the URL
                    const result = await processContentRow(validatedRow, fastify);

                    if (result.success) {
                        successCount++;
                        results.push({
                            row: rowNumber,
                            url: validatedRow.url,
                            success: true,
                            contentId: result.contentId
                        });
                    } else {
                        failureCount++;
                        results.push({
                            row: rowNumber,
                            url: validatedRow.url,
                            success: false,
                            error: result.error
                        });
                    }

                } catch (error) {
                    failureCount++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    results.push({
                        row: rowNumber,
                        url: row.url || 'Invalid URL',
                        success: false,
                        error: errorMessage
                    });
                    fastify.log.error({ row: rowNumber, error: errorMessage }, 'Row processing failed');
                }
            }

            fastify.log.info({
                total: records.length,
                succeeded: successCount,
                failed: failureCount
            }, 'Batch processing completed');

            return reply.send({
                success: true,
                columnMapping: columnMapping,
                detectedColumns: headers,
                summary: {
                    totalRows: records.length,
                    processed: records.length,
                    succeeded: successCount,
                    failed: failureCount
                },
                results: results
            });

        } catch (error) {
            fastify.log.error(error, 'Error in batch upload');
            return reply.status(500).send({
                error: 'Internal server error',
                message: 'Failed to process batch upload'
            });
        }
    });

    /**
     * Get batch processing status/history
     * GET /admin/batch-history
     */
    fastify.get('/admin/batch-history', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        try {
            // Get recent batch uploads from database
            // This could be enhanced with a dedicated batch_uploads table
            const { data, error } = await supabase
                .from('content')
                .select('id, url, title, created_at, status')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                fastify.log.error(error, 'Error fetching batch history');
                return reply.status(500).send({
                    error: 'Failed to fetch batch history'
                });
            }

            return reply.send({
                success: true,
                items: data || []
            });
        } catch (error) {
            fastify.log.error(error, 'Error in batch history');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
}

/**
 * Process a single content row from CSV
 * Handles crawling, scraping, and database insertion
 */
async function processContentRow(
    row: CsvRow,
    fastify: FastifyInstance
): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
        const url = row.url;

        // Check if URL already exists
        const { data: existing, error: checkError } = await supabase
            .from('content')
            .select('id')
            .eq('url', url)
            .single();

        if (existing && !checkError) {
            return {
                success: false,
                error: 'URL already exists in database'
            };
        }

        // Parse topics if provided
        let topics: string[] = [];
        if (row.topics) {
            topics = row.topics
                .split(/[,;]/)
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);
        }

        // Process the URL (crawl and extract metadata)
        const processedContent = await extractMetadata(url);

        // Merge CSV data with processed data (CSV takes precedence for provided fields)
        const finalTitle = row.title || processedContent.title || new URL(url).hostname;
        const finalDescription = row.description || processedContent.description || '';
        const finalTopics = topics.length > 0 ? topics : (processedContent.topics || []);

        // Handle optional fields gracefully - log warnings but don't fail import
        const finalImageUrl = row.image_url || processedContent.image_url;
        if (row.image_url && !finalImageUrl) {
            fastify.log.warn({ url, image_url: row.image_url }, 'Invalid image URL, skipping');
        }

        const finalAuthor = row.author || processedContent.author;

        // Sanitized timestamp (already converted to ISO 8601 or null)
        const finalPublishedAt = row.published_date || sanitizeTimestamp(processedContent.published_at);
        if ((row.published_date || processedContent.published_at) && !finalPublishedAt) {
            fastify.log.warn({ url, timestamp: row.published_date || processedContent.published_at }, 'Invalid timestamp format, skipping');
        }

        // Parse numeric fields - schema uses 'reading_time_minutes' not 'read_time'
        const wordCount = row.word_count ?
            (typeof row.word_count === 'number' ? row.word_count : parseInt(String(row.word_count), 10)) :
            processedContent.word_count;

        const readingTimeMinutes = row.read_time ?
            (typeof row.read_time === 'number' ? row.read_time : parseInt(String(row.read_time), 10)) :
            undefined;

        // Extract domain from URL
        const domain = new URL(url).hostname;

        // Insert into database using ACTUAL schema column names from Supabase
        // Confirmed columns: url, title, description, domain, image_url, author, 
        //                   published_at, reading_time (NOT reading_time_minutes!),
        //                   word_count, content_text, topics (ARRAY), is_active
        // Build insert object, only including optional fields if they have values
        const insertData: any = {
            url,
            title: finalTitle,
            description: finalDescription || null,
            domain,
            topics: finalTopics, // ARRAY column on content table
            word_count: wordCount || 0,
            reading_time: readingTimeMinutes || 0,
            is_active: true
        };

        // Only add optional fields if they have values (not undefined/null/empty)
        if (finalImageUrl) insertData.image_url = finalImageUrl;
        if (finalAuthor) insertData.author = finalAuthor;
        if (finalPublishedAt) insertData.published_at = finalPublishedAt;
        if (processedContent.content_text) insertData.content_text = processedContent.content_text;

        const { data: content, error: insertError } = await supabase
            .from('content')
            .insert(insertData)
            .select('id')
            .single();

        if (insertError || !content) {
            fastify.log.error({ url, error: insertError }, 'Failed to insert content');
            return {
                success: false,
                error: `Database insert failed: ${insertError?.message || 'Unknown error'}`
            };
        }

        // Optionally also insert into content_topics junction table for better querying
        if (finalTopics.length > 0) {
            // Get topic IDs for the topic names
            const { data: topicRecords, error: topicError } = await supabase
                .from('topics')
                .select('id, name')
                .in('name', finalTopics);

            if (topicRecords && topicRecords.length > 0) {
                // Insert into content_topics junction table
                const topicAssociations = topicRecords.map(topic => ({
                    content_id: content.id,
                    topic_id: topic.id,
                    confidence_score: 1.0 // High confidence for manually provided topics
                }));

                const { error: junctionError } = await supabase
                    .from('content_topics')
                    .insert(topicAssociations);

                if (junctionError) {
                    fastify.log.warn({ contentId: content.id, error: junctionError },
                        'Failed to insert topic associations (non-critical)');
                }
            }
        }

        return {
            success: true,
            contentId: content.id
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error({ url: row.url, error: errorMessage }, 'Content processing failed');
        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Extract metadata from a webpage URL
 * Simplified version for batch processing
 */
async function extractMetadata(url: string): Promise<ExtractedMetadata> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; StumbleableBot/1.0; +https://stumbleable.app)'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const metadata: ExtractedMetadata = {};

        // Extract title
        metadata.title =
            $('meta[property="og:title"]').attr('content')?.trim() ||
            $('meta[name="twitter:title"]').attr('content')?.trim() ||
            $('title').text()?.trim() ||
            $('h1').first().text()?.trim();

        // Extract description
        metadata.description =
            $('meta[property="og:description"]').attr('content')?.trim() ||
            $('meta[name="twitter:description"]').attr('content')?.trim() ||
            $('meta[name="description"]').attr('content')?.trim() ||
            $('p').first().text()?.trim();

        // Extract image
        metadata.image_url =
            $('meta[property="og:image"]').attr('content')?.trim() ||
            $('meta[name="twitter:image"]').attr('content')?.trim() ||
            $('img').first().attr('src')?.trim();

        // Extract author
        metadata.author =
            $('meta[name="author"]').attr('content')?.trim() ||
            $('[rel="author"]').text()?.trim() ||
            $('[itemprop="author"]').text()?.trim();

        // Extract published date
        const rawPublishedAt =
            $('meta[property="article:published_time"]').attr('content')?.trim() ||
            $('time[datetime]').attr('datetime')?.trim();

        // Sanitize timestamp to ISO 8601 or null
        metadata.published_at = sanitizeTimestamp(rawPublishedAt) || undefined;

        // Extract content text
        const contentText = $('article').text() || $('main').text() || $('body').text();
        if (contentText) {
            metadata.content_text = contentText.replace(/\s+/g, ' ').trim().substring(0, 5000);
            metadata.word_count = contentText.split(/\s+/).length;
        }

        // Extract topics from keywords
        const keywords = $('meta[name="keywords"]').attr('content');
        if (keywords) {
            metadata.topics = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        }

        return metadata;

    } catch (error) {
        // Return empty metadata on error
        return {};
    }
}

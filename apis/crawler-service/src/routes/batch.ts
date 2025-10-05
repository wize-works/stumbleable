import * as cheerio from 'cheerio';
import { parse } from 'csv-parse/sync';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';

// CSV row validation schema
const CsvRowSchema = z.object({
    url: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
    topics: z.string().optional(), // Comma-separated or semicolon-separated
    author: z.string().optional(),
    published_date: z.string().optional(),
    image_url: z.string().url().optional(),
});

interface CsvRow {
    url: string;
    title?: string;
    description?: string;
    topics?: string;
    author?: string;
    published_date?: string;
    image_url?: string;
}

interface ProcessingResult {
    row: number;
    url: string;
    success: boolean;
    contentId?: string;
    error?: string;
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
            try {
                records = parse(csvContent, {
                    columns: true, // Use first row as column names
                    skip_empty_lines: true,
                    trim: true,
                    relax_quotes: true,
                });
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

            if (records.length > 1000) {
                return reply.status(400).send({
                    error: 'Too many rows',
                    message: 'Maximum 1000 rows per upload. Please split into smaller batches.'
                });
            }

            fastify.log.info({ rowCount: records.length }, 'Starting batch processing');

            // Validate and process each row
            const results: ProcessingResult[] = [];
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header row

                try {
                    // Validate row
                    const validatedRow = CsvRowSchema.parse(row);

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
        const finalImageUrl = row.image_url || processedContent.image_url;
        const finalAuthor = row.author || processedContent.author;
        const finalPublishedDate = row.published_date || processedContent.published_at;

        // Extract domain
        const domain = new URL(url).hostname;

        // Insert into database
        const { data: content, error: insertError } = await supabase
            .from('content')
            .insert({
                url,
                title: finalTitle,
                description: finalDescription,
                domain,
                topics: finalTopics,
                image_url: finalImageUrl,
                author: finalAuthor,
                published_date: finalPublishedDate,
                status: 'pending', // Will go through moderation
                metadata: {
                    source: 'batch_upload',
                    csv_provided: {
                        title: !!row.title,
                        description: !!row.description,
                        topics: !!row.topics,
                        author: !!row.author,
                        published_date: !!row.published_date,
                        image_url: !!row.image_url
                    },
                    processed_at: new Date().toISOString()
                }
            })
            .select('id')
            .single();

        if (insertError || !content) {
            fastify.log.error({ url, error: insertError }, 'Failed to insert content');
            return {
                success: false,
                error: `Database insert failed: ${insertError?.message || 'Unknown error'}`
            };
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
        metadata.published_at =
            $('meta[property="article:published_time"]').attr('content')?.trim() ||
            $('time[datetime]').attr('datetime')?.trim();

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

import * as cheerio from 'cheerio';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// Validation schemas
const EnhanceRequestSchema = z.object({
    contentIds: z.array(z.string().uuid()).optional(),
    batchSize: z.number().min(1).max(100).default(10),
    forceRescrape: z.boolean().optional().default(false)
});

interface ExtractedMetadata {
    title?: string;
    description?: string;
    image_url?: string;
    author?: string;
    published_at?: string;
    word_count?: number;
    content_text?: string;
    topics?: string[];
    allows_framing?: boolean;
}

interface ContentRecord {
    id: string;
    url: string;
    image_url?: string;
    author?: string;
    content_text?: string;
    word_count?: number;
    title?: string;
    description?: string;
    topics?: string[];
}

/**
 * Content metadata enhancement routes
 * Scrapes missing metadata from web pages and updates the database
 */
export const enhanceRoute: FastifyPluginAsync = async (fastify) => {

    /**
     * POST /enhance/metadata
     * Enhance content records with missing metadata by scraping their URLs
     */
    fastify.post('/enhance/metadata', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = EnhanceRequestSchema.parse(request.body);

            // Get content records that need enhancement
            let contentRecords: ContentRecord[];

            if (body.contentIds && body.contentIds.length > 0) {
                // Enhance specific content IDs (for manual rescraping)
                let query = supabase
                    .from('content')
                    .select('id, url')
                    .in('id', body.contentIds);

                // For specific IDs, still respect the scraped timestamp unless forced
                if (!body.forceRescrape) {
                    query = query.is('metadata_scraped_at', null);
                }

                const { data, error } = await query;
                if (error) throw error;
                contentRecords = data || [];
            } else {
                // Get records that have never been scraped for metadata
                const { data, error } = await supabase
                    .from('content')
                    .select('id, url')
                    .is('metadata_scraped_at', null)
                    .limit(body.batchSize);

                if (error) throw error;
                contentRecords = data || [];
            }

            if (!contentRecords || contentRecords.length === 0) {
                return reply.send({
                    message: 'No content records need metadata enhancement',
                    processed: 0,
                    enhanced: 0
                });
            }

            fastify.log.info(`Starting metadata enhancement for ${contentRecords.length} records`);

            let processed = 0;
            let enhanced = 0;
            const results: Array<{ id: string; url: string; status: string; fieldsAdded?: string[] }> = [];

            for (const record of contentRecords) {
                try {
                    fastify.log.info(`Processing: ${record.url}`);

                    // Get current record to check which fields are missing
                    const { data: currentRecord, error: fetchError } = await supabase
                        .from('content')
                        .select('image_url, author, content_text, word_count, title, description, topics')
                        .eq('id', record.id)
                        .single();

                    if (fetchError) throw fetchError;

                    const metadata = await extractMetadata(record.url);

                    if (Object.keys(metadata).length > 0) {
                        // Only update fields that are currently null/missing
                        const fieldsToUpdate: Record<string, any> = {};

                        if (!currentRecord.image_url && metadata.image_url) {
                            fieldsToUpdate.image_url = metadata.image_url;
                        }
                        if (!currentRecord.author && metadata.author) {
                            fieldsToUpdate.author = metadata.author;
                        }
                        if (!currentRecord.content_text && metadata.content_text) {
                            fieldsToUpdate.content_text = metadata.content_text;
                        }
                        if (!currentRecord.word_count && metadata.word_count) {
                            fieldsToUpdate.word_count = metadata.word_count;
                        }
                        // Also update title/description if missing or if we found better ones
                        if ((!currentRecord.title || currentRecord.title.length < 10) && metadata.title) {
                            fieldsToUpdate.title = metadata.title;
                        }
                        if ((!currentRecord.description || currentRecord.description.length < 20) && metadata.description) {
                            fieldsToUpdate.description = metadata.description;
                        }
                        // Merge topics: combine existing topics with newly extracted ones (unique)
                        if (metadata.topics && metadata.topics.length > 0) {
                            const existingTopics = currentRecord.topics || [];
                            const newTopics = metadata.topics.filter(t => !existingTopics.includes(t));
                            if (newTopics.length > 0) {
                                fieldsToUpdate.topics = [...existingTopics, ...newTopics];
                            }
                        }
                        // Update allows_framing if detected (important for iframe compatibility)
                        if (metadata.allows_framing !== undefined) {
                            fieldsToUpdate.allows_framing = metadata.allows_framing;
                        }

                        // Always mark as scraped, even if no new fields were found
                        fieldsToUpdate.metadata_scraped_at = new Date().toISOString();

                        if (Object.keys(fieldsToUpdate).length > 1) { // > 1 because scraped_at is always included
                            // Update the database with only the missing fields + scraped timestamp
                            const { error } = await supabase
                                .from('content')
                                .update(fieldsToUpdate)
                                .eq('id', record.id);

                            if (error) {
                                fastify.log.error(error, `Database update failed for ${record.url}`);
                                throw error;
                            }

                            enhanced++;

                            const addedFields = Object.keys(fieldsToUpdate).filter(f => f !== 'metadata_scraped_at');
                            results.push({
                                id: record.id,
                                url: record.url,
                                status: 'enhanced',
                                fieldsAdded: addedFields
                            });

                            fastify.log.info(`Enhanced ${record.url} with fields: ${addedFields.join(', ')}`);
                        } else {
                            // Just mark as scraped even if no metadata was found
                            const { error } = await supabase
                                .from('content')
                                .update({ metadata_scraped_at: new Date().toISOString() })
                                .eq('id', record.id);

                            if (error) {
                                fastify.log.error(error, `Failed to mark as scraped: ${record.url}`);
                                throw error;
                            }

                            results.push({
                                id: record.id,
                                url: record.url,
                                status: 'no_new_metadata'
                            });
                            fastify.log.info(`No new metadata found for ${record.url}, marked as scraped`);
                        }
                    } else {
                        // No metadata extracted, but still mark as scraped to avoid retrying
                        const { error } = await supabase
                            .from('content')
                            .update({ metadata_scraped_at: new Date().toISOString() })
                            .eq('id', record.id);

                        if (error) {
                            fastify.log.error(error, `Failed to mark as scraped: ${record.url}`);
                        }

                        results.push({
                            id: record.id,
                            url: record.url,
                            status: 'no_metadata_found'
                        });
                    }

                    processed++;

                    // Rate limiting - wait 500ms between requests
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    fastify.log.error(error, `Error processing ${record.url}`);
                    results.push({
                        id: record.id,
                        url: record.url,
                        status: 'error'
                    });
                    processed++;
                }
            }

            return reply.send({
                message: 'Metadata enhancement completed',
                processed,
                enhanced,
                results
            });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }

            fastify.log.error(error, 'Error in /enhance/metadata endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    /**
     * POST /enhance/auto
     * Automatically enhance a batch of unscraped content (for scheduled jobs)
     * This endpoint is designed to be called by the scheduler service
     */
    fastify.post('/enhance/auto', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { jobName, config, executionId } = request.body as any;
            const batchSize = config?.batchSize || 20; // Default to 20 items per run

            fastify.log.info(`🔄 Auto-enhance job started (execution: ${executionId})`);

            // Get content that has never been scraped
            const { data: contentRecords, error: fetchError } = await supabase
                .from('content')
                .select('id, url')
                .is('metadata_scraped_at', null)
                .order('created_at', { ascending: false }) // Process newest first
                .limit(batchSize);

            if (fetchError) throw fetchError;

            if (!contentRecords || contentRecords.length === 0) {
                fastify.log.info('✅ All content has been enhanced');
                return reply.send({
                    success: true,
                    itemsProcessed: 0,
                    itemsSucceeded: 0,
                    itemsFailed: 0,
                    metadata: {
                        message: 'All content already enhanced'
                    }
                });
            }

            fastify.log.info(`📊 Processing ${contentRecords.length} unscraped items`);

            let succeeded = 0;
            let failed = 0;
            const errors: string[] = [];

            for (const record of contentRecords) {
                try {
                    // Get current record to check which fields are missing
                    const { data: currentRecord, error: currentError } = await supabase
                        .from('content')
                        .select('image_url, author, content_text, word_count, title, description, topics')
                        .eq('id', record.id)
                        .single();

                    if (currentError) throw currentError;

                    const metadata = await extractMetadata(record.url);

                    if (Object.keys(metadata).length > 0) {
                        // Build update object with only missing fields
                        const fieldsToUpdate: Record<string, any> = {};

                        if (!currentRecord.image_url && metadata.image_url) {
                            fieldsToUpdate.image_url = metadata.image_url;
                        }
                        if (!currentRecord.author && metadata.author) {
                            fieldsToUpdate.author = metadata.author;
                        }
                        if (!currentRecord.content_text && metadata.content_text) {
                            fieldsToUpdate.content_text = metadata.content_text;
                        }
                        if (!currentRecord.word_count && metadata.word_count) {
                            fieldsToUpdate.word_count = metadata.word_count;
                        }
                        if ((!currentRecord.title || currentRecord.title.length < 10) && metadata.title) {
                            fieldsToUpdate.title = metadata.title;
                        }
                        if ((!currentRecord.description || currentRecord.description.length < 20) && metadata.description) {
                            fieldsToUpdate.description = metadata.description;
                        }
                        if (metadata.topics && metadata.topics.length > 0) {
                            const existingTopics = currentRecord.topics || [];
                            const uniqueTopics = [...new Set([...existingTopics, ...metadata.topics])];
                            fieldsToUpdate.topics = uniqueTopics;
                        }

                        // Always mark as scraped
                        fieldsToUpdate.metadata_scraped_at = new Date().toISOString();

                        if (Object.keys(fieldsToUpdate).length > 1) { // More than just scraped_at
                            const { error: updateError } = await supabase
                                .from('content')
                                .update(fieldsToUpdate)
                                .eq('id', record.id);

                            if (updateError) throw updateError;
                            succeeded++;
                        } else {
                            // Just mark as scraped
                            const { error: markError } = await supabase
                                .from('content')
                                .update({ metadata_scraped_at: new Date().toISOString() })
                                .eq('id', record.id);

                            if (markError) throw markError;
                            succeeded++;
                        }
                    } else {
                        // No metadata found, but still mark as scraped
                        const { error: markError } = await supabase
                            .from('content')
                            .update({ metadata_scraped_at: new Date().toISOString() })
                            .eq('id', record.id);

                        if (markError) throw markError;
                        succeeded++;
                    }

                    fastify.log.info(`✓ Enhanced ${record.url}`);

                } catch (error: any) {
                    failed++;
                    const errorMsg = `${record.url}: ${error.message}`;
                    errors.push(errorMsg);
                    fastify.log.error(`✗ Failed to enhance ${record.url}:`, error);
                }
            }

            // Get remaining count
            const { count: remainingCount } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .is('metadata_scraped_at', null);

            fastify.log.info(`✅ Auto-enhance complete: ${succeeded} succeeded, ${failed} failed, ${remainingCount || 0} remaining`);

            return reply.send({
                success: true,
                itemsProcessed: contentRecords.length,
                itemsSucceeded: succeeded,
                itemsFailed: failed,
                metadata: {
                    remainingCount: remainingCount || 0,
                    errors: errors.slice(0, 10), // Only include first 10 errors
                }
            });

        } catch (error: any) {
            fastify.log.error('Error in auto-enhance endpoint:', error);
            return reply.status(500).send({
                success: false,
                itemsProcessed: 0,
                itemsSucceeded: 0,
                itemsFailed: 0,
                error: error.message
            });
        }
    });

    /**
     * GET /enhance/status
     * Get statistics about content that needs enhancement
     */
    fastify.get('/enhance/status', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get total content count
            const { count: totalCount, error: totalError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Get counts for each field
            const { count: hasImage, error: imageError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('image_url', 'is', null);

            if (imageError) throw imageError;

            const { count: hasAuthor, error: authorError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('author', 'is', null);

            if (authorError) throw authorError;

            const { count: hasContent, error: contentError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('content_text', 'is', null);

            if (contentError) throw contentError;

            const { count: hasWordCount, error: wordCountError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('word_count', 'is', null);

            if (wordCountError) throw wordCountError;

            // Calculate needs enhancement (never scraped)
            const { count: needsEnhancement, error: needsError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .is('metadata_scraped_at', null);

            if (needsError) throw needsError;

            // Calculate already scraped count
            const { count: alreadyScraped, error: scrapedError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('metadata_scraped_at', 'is', null);

            if (scrapedError) throw scrapedError;

            return reply.send({
                total_content: totalCount || 0,
                needs_enhancement: needsEnhancement || 0,
                already_scraped: alreadyScraped || 0,
                has_image: hasImage || 0,
                has_author: hasAuthor || 0,
                has_content: hasContent || 0,
                has_word_count: hasWordCount || 0
            });

        } catch (error) {
            fastify.log.error(error, 'Error in /enhance/status endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};

/**
 * Extract metadata from a webpage URL with cascading fallbacks
 */
async function extractMetadata(url: string): Promise<ExtractedMetadata> {
    try {
        // Create abort controller for timeout
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

        // Check headers for iframe blocking policies
        const xFrameOptions = response.headers.get('x-frame-options')?.toLowerCase();
        const csp = response.headers.get('content-security-policy')?.toLowerCase();

        // Determine if framing is allowed
        let allowsFraming = true; // Assume allowed unless restricted

        // Check X-Frame-Options header
        if (xFrameOptions) {
            if (xFrameOptions === 'deny' || xFrameOptions === 'sameorigin') {
                allowsFraming = false;
                console.log(`[${url}] X-Frame-Options: ${xFrameOptions} - blocks framing`);
            }
        }

        // Check Content-Security-Policy frame-ancestors directive
        if (csp && csp.includes('frame-ancestors')) {
            // Extract frame-ancestors value
            const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/);
            if (frameAncestorsMatch) {
                const value = frameAncestorsMatch[1].trim();
                // 'none' or 'self' blocks framing from external sites
                if (value === "'none'" || value === "'self'") {
                    allowsFraming = false;
                    console.log(`[${url}] CSP frame-ancestors: ${value} - blocks framing`);
                }
            }
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const metadata: ExtractedMetadata = {
            allows_framing: allowsFraming
        };
        const extractionLog: string[] = [];

        if (!allowsFraming) {
            extractionLog.push('iframe:blocked');
        }

        // ========================================
        // TITLE EXTRACTION (Cascading Fallbacks)
        // ========================================
        const titleCandidates = [
            { source: 'h1', value: $('h1').first().text()?.trim() },
            { source: 'og:title', value: $('meta[property="og:title"]').attr('content')?.trim() },
            { source: 'twitter:title', value: $('meta[name="twitter:title"]').attr('content')?.trim() },
            { source: 'title', value: $('title').text()?.trim() },
            { source: 'h2', value: $('h2').first().text()?.trim() },
            { source: 'schema.org', value: $('[itemtype*="schema.org"] [itemprop="headline"]').first().text()?.trim() },
        ];

        for (const candidate of titleCandidates) {
            if (candidate.value && candidate.value.length >= 3 && candidate.value.length <= 200) {
                // Clean up common title patterns
                let cleanTitle = candidate.value
                    .replace(/\s+/g, ' ')
                    .replace(/\n+/g, ' ')
                    .trim();

                // Remove common suffixes (can be customized)
                cleanTitle = cleanTitle.replace(/\s*[\|\-–—]\s*.{0,50}$/, '').trim();

                if (cleanTitle.length >= 3) {
                    metadata.title = cleanTitle.substring(0, 200);
                    extractionLog.push(`title:${candidate.source}`);
                    break;
                }
            }
        }

        // ========================================
        // DESCRIPTION EXTRACTION (Cascading Fallbacks)
        // ========================================
        const descriptionCandidates = [
            { source: 'og:description', value: $('meta[property="og:description"]').attr('content')?.trim() },
            { source: 'twitter:description', value: $('meta[name="twitter:description"]').attr('content')?.trim() },
            { source: 'meta:description', value: $('meta[name="description"]').attr('content')?.trim() },
            { source: 'schema.org', value: $('[itemtype*="schema.org"] [itemprop="description"]').first().text()?.trim() },
            { source: 'first-p', value: $('article p').first().text()?.trim() || $('p').first().text()?.trim() },
        ];

        for (const candidate of descriptionCandidates) {
            if (candidate.value && candidate.value.length >= 20 && candidate.value.length <= 1000) {
                const cleanDesc = candidate.value
                    .replace(/\s+/g, ' ')
                    .replace(/\n+/g, ' ')
                    .trim();

                if (cleanDesc.length >= 20) {
                    metadata.description = cleanDesc.substring(0, 500);
                    extractionLog.push(`description:${candidate.source}`);
                    break;
                }
            }
        }

        // ========================================
        // IMAGE EXTRACTION (Cascading Fallbacks)
        // ========================================
        const imageCandidates = [
            { source: 'og:image', value: $('meta[property="og:image"]').attr('content') },
            { source: 'og:image:secure_url', value: $('meta[property="og:image:secure_url"]').attr('content') },
            { source: 'twitter:image', value: $('meta[name="twitter:image"]').attr('content') },
            { source: 'schema.org', value: $('[itemtype*="schema.org"] [itemprop="image"]').attr('content') || $('[itemtype*="schema.org"] [itemprop="image"]').attr('src') },
            { source: 'link:image_src', value: $('link[rel="image_src"]').attr('href') },
            { source: 'article-img', value: $('article img').first().attr('src') },
            { source: 'first-img', value: $('img').first().attr('src') },
        ];

        for (const candidate of imageCandidates) {
            if (candidate.value) {
                const resolvedUrl = resolveUrl(candidate.value, url);
                // Basic validation: must be http/https and not a tracking pixel
                if (resolvedUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i) ||
                    resolvedUrl.match(/^https?:\/\/.+/)) {
                    // Skip tiny images (likely tracking pixels)
                    if (!resolvedUrl.match(/1x1|pixel|track|beacon/i)) {
                        metadata.image_url = resolvedUrl;
                        extractionLog.push(`image:${candidate.source}`);
                        break;
                    }
                }
            }
        }

        // ========================================
        // AUTHOR EXTRACTION (Cascading Fallbacks)
        // ========================================
        const authorCandidates = [
            { source: 'meta:author', value: $('meta[name="author"]').attr('content')?.trim() },
            { source: 'article:author', value: $('meta[property="article:author"]').attr('content')?.trim() },
            { source: 'schema.org', value: $('[itemtype*="schema.org"] [itemprop="author"]').text()?.trim() },
            { source: 'rel:author', value: $('[rel="author"]').first().text()?.trim() },
            { source: 'class:author', value: $('.author').first().text()?.trim() },
            { source: 'class:byline', value: $('.byline').first().text()?.trim() },
            { source: 'by-author-pattern', value: extractByAuthorPattern($) },
        ];

        for (const candidate of authorCandidates) {
            if (candidate.value && candidate.value.length >= 2 && candidate.value.length <= 100) {
                // Clean up author name
                const cleanAuthor = candidate.value
                    .replace(/^(by|von|de|par)\s+/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (cleanAuthor.length >= 2 && cleanAuthor.length <= 100) {
                    metadata.author = cleanAuthor;
                    extractionLog.push(`author:${candidate.source}`);
                    break;
                }
            }
        }

        // ========================================
        // PUBLISHED DATE EXTRACTION (Cascading Fallbacks)
        // ========================================
        const dateCandidates = [
            { source: 'article:published_time', value: $('meta[property="article:published_time"]').attr('content') },
            { source: 'datePublished', value: $('meta[itemprop="datePublished"]').attr('content') },
            { source: 'meta:date', value: $('meta[name="date"]').attr('content') },
            { source: 'meta:publish-date', value: $('meta[name="publish-date"]').attr('content') },
            { source: 'time:datetime', value: $('time[datetime]').first().attr('datetime') },
            { source: 'time:pubdate', value: $('time[pubdate]').first().attr('datetime') },
        ];

        for (const candidate of dateCandidates) {
            if (candidate.value) {
                try {
                    const date = new Date(candidate.value);
                    if (!isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() <= new Date().getFullYear()) {
                        metadata.published_at = date.toISOString();
                        extractionLog.push(`date:${candidate.source}`);
                        break;
                    }
                } catch (e) {
                    // Invalid date, continue to next candidate
                }
            }
        }

        // ========================================
        // CONTENT TEXT EXTRACTION (Cascading Fallbacks)
        // ========================================
        const contentSelectors = [
            { source: 'article', selector: 'article' },
            { source: 'role:main', selector: '[role="main"]' },
            { source: 'schema:articleBody', selector: '[itemprop="articleBody"]' },
            { source: 'main', selector: 'main' },
            { source: 'class:content', selector: '.content, .post-content, .entry-content' },
            { source: 'class:article', selector: '.article-body, .article-content' },
            { source: 'class:post', selector: '.post, .entry' },
            { source: 'id:content', selector: '#content, #main-content' },
        ];

        let contentText = '';
        let contentSource = '';

        for (const candidate of contentSelectors) {
            const element = $(candidate.selector).first();
            if (element.length > 0) {
                // Remove script, style, nav, footer, aside elements
                element.find('script, style, nav, footer, aside, .advertisement, .ad').remove();

                const text = element.text().trim();
                if (text.length > 200) {
                    contentText = text;
                    contentSource = candidate.source;
                    break;
                }
            }
        }

        // Fallback to paragraphs
        if (!contentText || contentText.length < 200) {
            const paragraphs = $('p')
                .map((_: number, el: any) => $(el).text().trim())
                .get()
                .filter((p: string) => p.length > 20);

            if (paragraphs.length > 0) {
                contentText = paragraphs.join(' ').trim();
                contentSource = 'paragraphs';
            }
        }

        if (contentText && contentText.length > 50) {
            // Clean up content text
            contentText = contentText
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .trim()
                .substring(0, 2000); // Limit to 2000 chars

            if (contentText.length > 50) {
                metadata.content_text = contentText;
                metadata.word_count = contentText.split(/\s+/).filter((w: string) => w.length > 0).length;
                extractionLog.push(`content:${contentSource}`);
            }
        }

        // ========================================
        // TOPIC EXTRACTION (Cascading Fallbacks)
        // ========================================
        const extractedTopics = await extractTopics($, url, contentText);
        if (extractedTopics.topics.length > 0) {
            metadata.topics = extractedTopics.topics;
            extractionLog.push(`topics:${extractedTopics.sources.join('+')}`);
        }

        // Log extraction sources for debugging
        if (extractionLog.length > 0) {
            console.log(`[${url}] Extracted from: ${extractionLog.join(', ')}`);
        }

        return metadata;

    } catch (error) {
        console.error(`Failed to extract metadata from ${url}:`, error);
        return {};
    }
}

/**
 * Extract topics from page metadata, tags, categories, and content
 */
async function extractTopics(
    $: cheerio.CheerioAPI,
    url: string,
    contentText: string
): Promise<{ topics: string[]; sources: string[] }> {
    const topicsSet = new Set<string>();
    const sources: string[] = [];

    // ========================================
    // 1. META KEYWORDS
    // ========================================
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
        const keywords = metaKeywords
            .split(',')
            .map(k => k.trim().toLowerCase())
            .filter(k => k.length >= 3 && k.length <= 30);

        keywords.forEach(k => topicsSet.add(k));
        if (keywords.length > 0) sources.push('meta:keywords');
    }

    // ========================================
    // 2. ARTICLE TAGS
    // ========================================
    const articleTags = $('meta[property="article:tag"]')
        .map((_: number, el: any) => $(el).attr('content')?.trim().toLowerCase())
        .get()
        .filter((t: string) => t && t.length >= 3 && t.length <= 30);

    articleTags.forEach((t: string) => topicsSet.add(t));
    if (articleTags.length > 0) sources.push('article:tag');

    // ========================================
    // 3. SCHEMA.ORG KEYWORDS
    // ========================================
    const schemaKeywords = $('[itemprop="keywords"]')
        .map((_: number, el: any) => $(el).attr('content') || $(el).text())
        .get()
        .flatMap((k: string) => k.split(',').map((s: string) => s.trim().toLowerCase()))
        .filter((k: string) => k && k.length >= 3 && k.length <= 30);

    schemaKeywords.forEach((k: string) => topicsSet.add(k));
    if (schemaKeywords.length > 0) sources.push('schema:keywords');

    // ========================================
    // 4. HTML TAG/CATEGORY ELEMENTS
    // ========================================
    const htmlTags = $('.tag, .tags a, .category, .categories a, [rel="tag"]')
        .map((_: number, el: any) => $(el).text().trim().toLowerCase())
        .get()
        .filter((t: string) => t && t.length >= 3 && t.length <= 30);

    htmlTags.forEach((t: string) => topicsSet.add(t));
    if (htmlTags.length > 0) sources.push('html:tags');

    // ========================================
    // 5. URL PATH ANALYSIS
    // ========================================
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname
            .split('/')
            .filter(s => s && s.length >= 3 && s.length <= 30)
            .map(s => s.replace(/[-_]/g, ' ').toLowerCase())
            .filter(s => {
                // Filter out common non-topic segments
                const excluded = ['www', 'blog', 'post', 'article', 'page', 'news', 'story', 'index', 'home', 'en', 'us'];
                return !excluded.includes(s) && !s.match(/^\d+$/); // Not just numbers
            });

        pathSegments.forEach(s => topicsSet.add(s));
        if (pathSegments.length > 0) sources.push('url:path');
    } catch (e) {
        // Invalid URL, skip
    }

    // ========================================
    // 6. CONTENT-BASED TOPIC DETECTION
    // ========================================
    if (contentText && contentText.length > 100) {
        const detectedTopics = await detectTopicsFromContent(contentText);
        detectedTopics.forEach(t => topicsSet.add(t));
        if (detectedTopics.length > 0) sources.push('content:analysis');
    }

    // ========================================
    // NORMALIZATION & CLEANING
    // ========================================
    const topics = Array.from(topicsSet)
        .map(t => normalizeTopicString(t))
        .filter(t => t !== null) as string[];

    // Deduplicate and limit
    const uniqueTopics = [...new Set(topics)].slice(0, 10); // Max 10 topics

    return {
        topics: uniqueTopics,
        sources
    };
}

/**
 * Detect topics from content text using keyword analysis
 */
async function detectTopicsFromContent(contentText: string): Promise<string[]> {
    const topics: string[] = [];

    // Common topic keywords to look for (expandable)
    const topicKeywords: Record<string, string[]> = {
        'technology': ['software', 'hardware', 'computer', 'digital', 'internet', 'tech', 'programming', 'code', 'developer'],
        'science': ['research', 'study', 'scientist', 'laboratory', 'experiment', 'discovery', 'scientific'],
        'business': ['company', 'startup', 'entrepreneur', 'business', 'market', 'industry', 'enterprise', 'corporate'],
        'health': ['health', 'medical', 'doctor', 'patient', 'disease', 'treatment', 'medicine', 'wellness'],
        'education': ['education', 'school', 'university', 'learning', 'student', 'teacher', 'course', 'academic'],
        'entertainment': ['movie', 'film', 'music', 'game', 'entertainment', 'show', 'series', 'artist'],
        'sports': ['sport', 'team', 'player', 'game', 'match', 'league', 'championship', 'athlete'],
        'finance': ['finance', 'money', 'investment', 'stock', 'trading', 'market', 'economy', 'financial'],
        'politics': ['government', 'political', 'election', 'policy', 'democracy', 'vote', 'parliament', 'congress'],
        'design': ['design', 'ui', 'ux', 'interface', 'visual', 'graphic', 'creative', 'branding'],
        'food': ['food', 'recipe', 'cooking', 'chef', 'restaurant', 'cuisine', 'meal', 'ingredient'],
        'travel': ['travel', 'destination', 'trip', 'tourism', 'vacation', 'hotel', 'flight', 'journey'],
        'fashion': ['fashion', 'style', 'clothing', 'outfit', 'designer', 'trend', 'wardrobe'],
        'gaming': ['gaming', 'gamer', 'console', 'gameplay', 'rpg', 'fps', 'multiplayer'],
        'crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'blockchain', 'ethereum', 'wallet', 'mining'],
        'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ai', 'ml', 'chatbot'],
        'environment': ['environment', 'climate', 'sustainability', 'green', 'renewable', 'conservation', 'ecology'],
        'photography': ['photo', 'photography', 'camera', 'photographer', 'lens', 'shot', 'portrait'],
        'music': ['music', 'song', 'album', 'artist', 'band', 'concert', 'musician', 'melody'],
    };

    const lowerContent = contentText.toLowerCase();

    // Check for keyword presence
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length;
        // If 2+ keywords match, consider it a relevant topic
        if (matchCount >= 2) {
            topics.push(topic);
        }
    }

    return topics;
}

/**
 * Normalize and clean topic strings
 */
function normalizeTopicString(topic: string): string | null {
    if (!topic || typeof topic !== 'string') return null;

    // Clean and normalize
    let normalized = topic
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    // Filter out invalid topics
    if (normalized.length < 3 || normalized.length > 30) return null;

    // Filter out common stop words that aren't useful as topics
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'a', 'an'];
    if (stopWords.includes(normalized)) return null;

    // Filter out numbers-only
    if (/^\d+$/.test(normalized)) return null;

    return normalized;
}

/**
 * Extract author from common "By AuthorName" patterns in text
 */
function extractByAuthorPattern($: cheerio.CheerioAPI): string | undefined {
    const text = $('body').text();
    const byPattern = /\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i;
    const match = text.match(byPattern);
    return match ? match[1].trim() : undefined;
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
    try {
        return new URL(url, baseUrl).href;
    } catch {
        return url;
    }
}

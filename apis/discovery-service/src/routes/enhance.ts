import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { DiscoveryRepository } from '../lib/repository';

const repository = new DiscoveryRepository();

// Validation schemas
const EnhanceRequestSchema = z.object({
    contentIds: z.array(z.string().uuid()).optional(),
    batchSize: z.number().min(1).max(100).default(10)
});

interface ExtractedMetadata {
    title?: string;
    description?: string;
    imageUrl?: string;
    author?: string;
    publishedAt?: string;
    wordCount?: number;
    contentText?: string;
}

/**
 * Content metadata enhancement routes
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
            let contentRecords;

            if (body.contentIds && body.contentIds.length > 0) {
                // Enhance specific content IDs
                contentRecords = await repository.getContentByIds(body.contentIds);
            } else {
                // Get records that need enhancement (missing metadata)
                contentRecords = await repository.getContentNeedingEnhancement(body.batchSize);
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

                    const metadata = await extractMetadata(record.url);

                    if (Object.keys(metadata).length > 0) {
                        await repository.updateContentMetadata(record.id, metadata);
                        enhanced++;

                        results.push({
                            id: record.id,
                            url: record.url,
                            status: 'enhanced',
                            fieldsAdded: Object.keys(metadata)
                        });
                    } else {
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
     * GET /enhance/status
     * Get statistics about content that needs enhancement
     */
    fastify.get('/enhance/status', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = await repository.getEnhancementStats();

            return reply.send({
                total_content: stats.total,
                needs_enhancement: stats.needsEnhancement,
                has_image: stats.hasImage,
                has_author: stats.hasAuthor,
                has_content: stats.hasContent,
                has_word_count: stats.hasWordCount
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
 * Extract metadata from a webpage URL
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

        const html = await response.text();
        const $ = cheerio.load(html);

        const metadata: ExtractedMetadata = {};

        // Extract title
        metadata.title =
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text() ||
            $('h1').first().text();

        // Clean title
        if (metadata.title) {
            metadata.title = metadata.title.trim().substring(0, 200);
        }

        // Extract description
        metadata.description =
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content') ||
            $('meta[name="description"]').attr('content');

        // Clean description
        if (metadata.description) {
            metadata.description = metadata.description.trim().substring(0, 500);
        }

        // Extract image
        const ogImage = $('meta[property="og:image"]').attr('content');
        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        const firstImg = $('img').first().attr('src');

        if (ogImage) metadata.imageUrl = resolveUrl(ogImage, url);
        else if (twitterImage) metadata.imageUrl = resolveUrl(twitterImage, url);
        else if (firstImg) metadata.imageUrl = resolveUrl(firstImg, url);

        // Extract author
        metadata.author =
            $('meta[name="author"]').attr('content') ||
            $('meta[property="article:author"]').attr('content') ||
            $('.author').first().text() ||
            $('[rel="author"]').first().text();

        // Clean author
        if (metadata.author) {
            metadata.author = metadata.author.trim().substring(0, 100);
        }

        // Extract published date
        const publishedDate =
            $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="date"]').attr('content') ||
            $('time[datetime]').attr('datetime');

        if (publishedDate) {
            try {
                metadata.publishedAt = new Date(publishedDate).toISOString();
            } catch (e) {
                // Invalid date format, skip
            }
        }

        // Extract content text (article body)
        const contentSelectors = [
            'article', '.content', '.post-content', '.entry-content',
            '.article-body', 'main', '.main-content', '.post', '.entry'
        ];

        let contentText = '';
        for (const selector of contentSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                contentText = element.text().trim();
                if (contentText.length > 200) break; // Good content found
            }
        }

        if (!contentText) {
            // Fallback to paragraphs
            const paragraphs = $('p').map((_: number, el: any) => $(el).text().trim()).get();
            contentText = paragraphs.join(' ').trim();
        }

        if (contentText) {
            // Clean up content text
            contentText = contentText
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .trim()
                .substring(0, 2000); // Limit to 2000 chars

            if (contentText.length > 50) {
                metadata.contentText = contentText;
                metadata.wordCount = contentText.split(/\s+/).length;
            }
        }

        return metadata;

    } catch (error) {
        console.error(`Failed to extract metadata from ${url}:`, error);
        return {};
    }
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
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RedditLinkExtractor } from '../lib/reddit-extractor';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';

// Validation schemas
const CreateSourceSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['rss', 'sitemap', 'web']),
    url: z.string().url().refine((url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }, { message: 'Only HTTPS URLs are allowed for security' }),
    crawl_frequency_hours: z.number().min(1).max(168).default(24),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().default(true),
    extract_links: z.boolean().default(false), // New: enable link extraction
    reddit_subreddit: z.string().optional() // New: subreddit name for Reddit RSS feeds
});

const UpdateSourceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['rss', 'sitemap', 'web']).optional(),
    url: z.string().url().refine((url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }, { message: 'Only HTTPS URLs are allowed for security' }).optional(),
    crawl_frequency_hours: z.number().min(1).max(168).optional(),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    extract_links: z.boolean().optional(),
    reddit_subreddit: z.string().optional()
});

/**
 * Crawler source management routes
 */
export async function sourceRoutes(fastify: FastifyInstance) {

    // Get all sources (admin only) with pagination
    fastify.get('/sources', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const query = z.object({
            page: z.coerce.number().min(1).default(1),
            limit: z.coerce.number().min(1).max(100).default(20),
            enabled: z.enum(['true', 'false']).optional(),
            search: z.string().optional(),
            sortBy: z.enum(['name', 'type', 'domain', 'last_crawled_at', 'created_at']).optional(),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        }).parse(request.query);

        try {
            const offset = (query.page - 1) * query.limit;

            // Get total count
            let countQuery = supabase
                .from('crawler_sources')
                .select('*', { count: 'exact', head: true });

            if (query.enabled !== undefined) {
                countQuery = countQuery.eq('enabled', query.enabled === 'true');
            }

            // Apply search filter to count
            if (query.search) {
                const searchLower = query.search.toLowerCase();
                countQuery = countQuery.or(`name.ilike.%${searchLower}%,type.ilike.%${searchLower}%,domain.ilike.%${searchLower}%,url.ilike.%${searchLower}%`);
            }

            const { count, error: countError } = await countQuery;

            if (countError) {
                fastify.log.error(countError, 'Error counting sources');
                return reply.status(500).send({ error: 'Failed to count sources' });
            }

            // Get paginated data
            let dataQuery = supabase
                .from('crawler_sources')
                .select('*');

            if (query.enabled !== undefined) {
                dataQuery = dataQuery.eq('enabled', query.enabled === 'true');
            }

            // Apply search filter
            if (query.search) {
                const searchLower = query.search.toLowerCase();
                dataQuery = dataQuery.or(`name.ilike.%${searchLower}%,type.ilike.%${searchLower}%,domain.ilike.%${searchLower}%,url.ilike.%${searchLower}%`);
            }

            // Apply sorting
            const sortBy = query.sortBy || 'created_at';
            const ascending = query.sortOrder === 'asc';
            dataQuery = dataQuery.order(sortBy, { ascending, nullsFirst: !ascending });

            // Apply pagination
            dataQuery = dataQuery.range(offset, offset + query.limit - 1);

            const { data, error } = await dataQuery;

            if (error) {
                fastify.log.error(error, 'Error fetching sources');
                return reply.status(500).send({ error: 'Failed to fetch sources' });
            }

            return reply.send({
                sources: data || [],
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / query.limit)
                }
            });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /sources');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get a single source (admin only)
    fastify.get('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const { data, error } = await supabase
                .from('crawler_sources')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                return reply.status(404).send({ error: 'Source not found' });
            }

            return reply.send({ source: data });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create a new source (admin only)
    fastify.post('/sources', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        try {
            const body = CreateSourceSchema.parse(request.body);
            const domain = new URL(body.url).hostname;

            // Auto-detect Reddit subreddit if URL is a Reddit RSS feed
            let redditSubreddit = body.reddit_subreddit;
            if (!redditSubreddit && domain.includes('reddit.com')) {
                const match = body.url.match(/\/r\/([^\/]+)/);
                redditSubreddit = match ? match[1] : undefined;
            }

            const { data, error } = await supabase
                .from('crawler_sources')
                .insert({
                    ...body,
                    domain,
                    reddit_subreddit: redditSubreddit,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error || !data) {
                fastify.log.error(error, 'Error creating source');
                return reply.status(500).send({ error: 'Failed to create source' });
            }

            // If it's a Reddit RSS with link extraction enabled, trigger initial extraction
            if (body.extract_links && domain.includes('reddit.com')) {
                try {
                    const extractor = new RedditLinkExtractor();
                    const extractedLinks = await extractor.extractLinksFromFeed(body.url, data.id);
                    fastify.log.info(`Extracted ${extractedLinks.length} links from new Reddit source`);
                } catch (extractError) {
                    fastify.log.error(extractError, 'Error during initial Reddit link extraction');
                    // Don't fail source creation if extraction fails
                }
            }

            return reply.status(201).send({ source: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }
            fastify.log.error(error, 'Error in POST /sources');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update a source (admin only)
    fastify.put('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const body = UpdateSourceSchema.parse(request.body);

            const { data, error } = await supabase
                .from('crawler_sources')
                .update({
                    ...body,
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id)
                .select()
                .single();

            if (error || !data) {
                return reply.status(404).send({ error: 'Source not found' });
            }

            return reply.send({ source: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }
            fastify.log.error(error, 'Error in PUT /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete a source (admin only)
    fastify.delete('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const { error } = await supabase
                .from('crawler_sources')
                .delete()
                .eq('id', params.id);

            if (error) {
                fastify.log.error(error, 'Error deleting source');
                return reply.status(500).send({ error: 'Failed to delete source' });
            }

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error in DELETE /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Manually trigger link extraction for a Reddit source (admin only)
    fastify.post('/sources/:id/extract-links', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            // Get the source
            const { data: source, error: fetchError } = await supabase
                .from('crawler_sources')
                .select('*')
                .eq('id', params.id)
                .single();

            if (fetchError || !source) {
                return reply.status(404).send({ error: 'Source not found' });
            }

            // Validate that it's a Reddit RSS source
            if (source.type !== 'rss' || !source.url.includes('reddit.com')) {
                return reply.status(400).send({
                    error: 'Link extraction only supported for Reddit RSS feeds'
                });
            }

            // Extract links
            const extractor = new RedditLinkExtractor();
            const extractedLinks = await extractor.extractLinksFromFeed(source.url, source.id);

            // Update last extraction timestamp
            await supabase
                .from('crawler_sources')
                .update({
                    last_extraction: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id);

            return reply.send({
                success: true,
                extracted: extractedLinks.length,
                message: `Successfully extracted ${extractedLinks.length} links from Reddit RSS feed`
            });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /sources/:id/extract-links');
            return reply.status(500).send({
                error: 'Link extraction failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Get extracted links queue (admin only)
    fastify.get('/extracted-links', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const query = z.object({
            status: z.enum(['pending', 'processed', 'failed', 'duplicate']).optional(),
            limit: z.coerce.number().min(1).max(100).default(50),
            subreddit: z.string().optional()
        }).parse(request.query);

        try {
            let dbQuery = supabase
                .from('extracted_links_queue')
                .select('*, crawler_sources!inner(name, url)')
                .order('priority', { ascending: false })
                .order('created_at', { ascending: true })
                .limit(query.limit);

            if (query.status) {
                dbQuery = dbQuery.eq('status', query.status);
            }

            if (query.subreddit) {
                dbQuery = dbQuery.eq('subreddit', query.subreddit);
            }

            const { data, error } = await dbQuery;

            if (error) {
                fastify.log.error(error, 'Error fetching extracted links');
                return reply.status(500).send({ error: 'Failed to fetch extracted links' });
            }

            return reply.send({
                links: data || [],
                count: data?.length || 0
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /extracted-links');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Mark extracted link as processed (admin only)
    fastify.patch('/extracted-links/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        const body = z.object({
            status: z.enum(['processed', 'failed', 'duplicate']),
            error_message: z.string().optional()
        }).parse(request.body);

        try {
            const extractor = new RedditLinkExtractor();
            await extractor.markExtractedLinkAsProcessed(
                params.id,
                body.status,
                body.error_message
            );

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error in PATCH /extracted-links/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Add Reddit source shortcut (admin only)
    fastify.post('/sources/reddit', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const body = z.object({
            subreddit: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/,
                'Subreddit name must contain only letters, numbers, and underscores'),
            extract_links: z.boolean().default(true),
            crawl_frequency_hours: z.number().min(1).max(168).default(24),
            topics: z.array(z.string()).optional(),
            enabled: z.boolean().default(true)
        }).parse(request.body);

        try {
            const redditRssUrl = `https://www.reddit.com/r/${body.subreddit}/.rss`;
            const domain = 'reddit.com';

            // Check if source already exists
            const { data: existing } = await supabase
                .from('crawler_sources')
                .select('id')
                .eq('url', redditRssUrl)
                .single();

            if (existing) {
                return reply.status(409).send({
                    error: 'Reddit source already exists',
                    sourceId: existing.id
                });
            }

            // Create the source
            const { data, error } = await supabase
                .from('crawler_sources')
                .insert({
                    name: `Reddit - r/${body.subreddit}`,
                    type: 'rss',
                    url: redditRssUrl,
                    domain,
                    reddit_subreddit: body.subreddit,
                    extract_links: body.extract_links,
                    crawl_frequency_hours: body.crawl_frequency_hours,
                    topics: body.topics || [body.subreddit],
                    enabled: body.enabled,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error || !data) {
                fastify.log.error(error, 'Error creating Reddit source');
                return reply.status(500).send({ error: 'Failed to create Reddit source' });
            }

            // Trigger initial link extraction if enabled
            if (body.extract_links) {
                try {
                    const extractor = new RedditLinkExtractor();
                    const extractedLinks = await extractor.extractLinksFromFeed(redditRssUrl, data.id);
                    fastify.log.info(`Extracted ${extractedLinks.length} links from new Reddit source r/${body.subreddit}`);

                    return reply.status(201).send({
                        source: data,
                        extracted_links: extractedLinks.length,
                        message: `Reddit source created and ${extractedLinks.length} links extracted`
                    });
                } catch (extractError) {
                    fastify.log.error(extractError, 'Error during initial Reddit link extraction');
                    return reply.status(201).send({
                        source: data,
                        warning: 'Source created but initial link extraction failed'
                    });
                }
            }

            return reply.status(201).send({ source: data });

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }
            fastify.log.error(error, 'Error in POST /sources/reddit');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

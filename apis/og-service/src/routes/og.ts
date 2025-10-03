import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { generateCacheKey, generateOGImage } from '../lib/generator';
import type { OGImageParams } from '../types';

// Query params schema
const ogQuerySchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(300).optional(),
    type: z.enum(['default', 'article', 'about', 'alternative']).optional().default('default'),
    theme: z.enum(['light', 'dark']).optional().default('light')
});

// Simple in-memory cache (for production, use Redis)
const imageCache = new Map<string, Buffer>();

export async function ogRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/og/generate
     * Generate OG image dynamically
     */
    fastify.get('/og/generate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Validate query params
            const params = ogQuerySchema.parse(request.query);

            // Generate cache key
            const cacheKey = generateCacheKey(params);

            // Check cache first
            let imageBuffer = imageCache.get(cacheKey);

            if (!imageBuffer) {
                // Generate new image
                fastify.log.info({ cacheKey, params }, 'Generating new OG image');
                imageBuffer = await generateOGImage(params as OGImageParams);

                // Cache it (with size limit)
                if (imageCache.size < 100) {
                    imageCache.set(cacheKey, imageBuffer);
                } else {
                    // Simple LRU: delete first item
                    const firstKey = imageCache.keys().next().value;
                    if (firstKey) imageCache.delete(firstKey);
                    imageCache.set(cacheKey, imageBuffer);
                }
            } else {
                fastify.log.info({ cacheKey }, 'Serving cached OG image');
            }

            // Set headers for image
            reply
                .header('Content-Type', 'image/png')
                .header('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800') // 24h cache, 7d stale
                .header('Content-Length', imageBuffer.length)
                .send(imageBuffer);

        } catch (error) {
            fastify.log.error(error);

            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid parameters',
                    details: error.errors
                });
            }

            return reply.status(500).send({
                error: 'Failed to generate OG image'
            });
        }
    });

    /**
     * GET /api/og/info
     * Get service info and example URLs
     */
    fastify.get('/og/info', async (_request: FastifyRequest, reply: FastifyReply) => {
        const baseUrl = `http://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 7005}`;

        return reply.send({
            service: 'og-service',
            version: '1.0.0',
            cache: {
                size: imageCache.size,
                maxSize: 100
            },
            examples: [
                {
                    name: 'Homepage',
                    url: `${baseUrl}/api/og/generate?title=Rediscover%20the%20Magic%20of%20Web%20Discovery&description=One%20click.%20One%20surprise.%20Pure%20serendipity.&type=default&theme=light`
                },
                {
                    name: 'About Page',
                    url: `${baseUrl}/api/og/generate?title=About%20Stumbleable&description=Bringing%20back%20the%20joy%20of%20web%20discovery&type=about&theme=light`
                },
                {
                    name: 'Alternatives Page',
                    url: `${baseUrl}/api/og/generate?title=Best%20StumbleUpon%20Alternative%202025&description=The%20serendipity%20engine%20you've%20been%20missing&type=alternative&theme=light`
                }
            ],
            usage: {
                endpoint: '/api/og/generate',
                method: 'GET',
                params: {
                    title: 'string (required, 1-200 chars)',
                    description: 'string (optional, max 300 chars)',
                    type: 'enum (optional): default | article | about | alternative',
                    theme: 'enum (optional): light | dark'
                }
            }
        });
    });

    /**
     * DELETE /api/og/cache
     * Clear image cache (for development/debugging)
     */
    fastify.delete('/og/cache', async (_request: FastifyRequest, reply: FastifyReply) => {
        const size = imageCache.size;
        imageCache.clear();

        return reply.send({
            message: 'Cache cleared',
            clearedImages: size
        });
    });
}

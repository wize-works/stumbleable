import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DiscoveryRepository } from '../lib/repository';
import { calculateTrendingScore } from '../lib/scoring';
import { TrendingResponse } from '../types';

const repository = new DiscoveryRepository();

// Validation schema for query parameters
const trendingQuerySchema = z.object({
    timeWindow: z.enum(['hour', 'day', 'week']).optional().default('day'),
    limit: z.coerce.number().min(1).max(50).optional().default(20)
});

/**
 * Enhanced trending discovery route plugin
 */
export const trendingDiscoveryRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get<{ Querystring: { timeWindow?: 'hour' | 'day' | 'week'; limit?: number } }>(
        '/trending',
        async (request: FastifyRequest<{ Querystring: { timeWindow?: 'hour' | 'day' | 'week'; limit?: number } }>, reply: FastifyReply) => {
            try {
                // Validate query parameters
                const validationResult = trendingQuerySchema.safeParse(request.query);
                if (!validationResult.success) {
                    return reply.status(400).send({
                        error: 'Invalid query parameters',
                        details: validationResult.error.errors
                    });
                }

                const { timeWindow, limit } = validationResult.data;

                // Try to get trending content from database first
                let trending = await repository.getTrendingContent(timeWindow, limit);

                // If no trending data exists, fall back to calculated trending
                if (trending.length === 0) {
                    fastify.log.info('No trending data found, calculating on-demand');

                    const allDiscoveries = await repository.getAllDiscoveries();
                    const now = new Date();

                    // Calculate trending scores for all content with images
                    const scoredContent = allDiscoveries
                        .filter(discovery => discovery.image) // Filter: only content with images
                        .map(discovery => {
                            const createdAt = new Date(discovery.createdAt || now);
                            const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

                            const trendingScore = discovery.metrics
                                ? calculateTrendingScore(discovery.metrics, ageDays, timeWindow)
                                : (discovery.quality || 0.5) * Math.exp(-ageDays / 2); // Simple fallback

                            return {
                                ...discovery,
                                trendingScore
                            };
                        })
                        .filter(item => item.trendingScore > 0.1) // Filter out very low scores
                        .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
                        .slice(0, limit);

                    trending = scoredContent;

                    fastify.log.info({
                        timeWindow,
                        calculatedCount: scoredContent.length,
                        topScore: scoredContent[0]?.trendingScore || 0
                    }, 'Calculated trending content on-demand');
                }

                const response: TrendingResponse = {
                    discoveries: trending,
                    count: trending.length
                };

                // Log trending request for analytics
                fastify.log.info({
                    timeWindow,
                    limit,
                    resultCount: trending.length,
                    topTitles: trending.slice(0, 3).map(d => d.title)
                }, 'Trending content requested');

                return reply.send(response);

            } catch (error) {
                fastify.log.error(error, 'Error in /trending endpoint');
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );
};
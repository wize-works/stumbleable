import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DiscoveryRepository } from '../lib/repository';
import { Discovery } from '../types';

const repository = new DiscoveryRepository();

// Validation schema for query parameters
const exploreQuerySchema = z.object({
    topic: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(24),
    offset: z.coerce.number().min(0).optional().default(0),
    sortBy: z.enum(['recent', 'popular', 'quality']).optional().default('recent')
});

type ExploreQuery = z.infer<typeof exploreQuerySchema>;

/**
 * Explore discoveries by topic route plugin
 */
export const exploreDiscoveryRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /explore
     * Fetch discoveries filtered by topic with pagination
     */
    fastify.get<{ Querystring: ExploreQuery }>(
        '/explore',
        async (request: FastifyRequest<{ Querystring: ExploreQuery }>, reply: FastifyReply) => {
            try {
                // Validate query parameters
                const validationResult = exploreQuerySchema.safeParse(request.query);
                if (!validationResult.success) {
                    return reply.status(400).send({
                        error: 'Invalid query parameters',
                        details: validationResult.error.errors
                    });
                }

                const { topic, limit, offset, sortBy } = validationResult.data;

                let discoveries: Discovery[] = [];
                let totalCount = 0;

                if (topic) {
                    // Filter by specific topic
                    const result = await repository.getDiscoveriesByTopic(topic, limit, offset, sortBy);
                    discoveries = result.discoveries;
                    totalCount = result.total;
                } else {
                    // Get all discoveries (no topic filter)
                    discoveries = await repository.getDiscoveriesWithPagination(limit, offset, sortBy);
                    totalCount = await repository.getTotalDiscoveriesCount();
                }

                const response = {
                    discoveries,
                    pagination: {
                        limit,
                        offset,
                        total: totalCount,
                        hasMore: offset + discoveries.length < totalCount
                    },
                    filters: {
                        topic: topic || null,
                        sortBy
                    }
                };

                fastify.log.info({
                    topic: topic || 'all',
                    sortBy,
                    limit,
                    offset,
                    resultCount: discoveries.length,
                    totalCount
                }, 'Explore request processed');

                return reply.send(response);

            } catch (error) {
                fastify.log.error(error, 'Error in /explore endpoint');
                return reply.status(500).send({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    );
};

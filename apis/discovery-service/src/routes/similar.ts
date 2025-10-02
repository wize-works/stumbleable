import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DiscoveryRepository, EnhancedDiscovery } from '../lib/repository';
import {
    calculateContentSimilarity,
    calculateFreshness,
    calculatePopularityScore,
    getAgeDays
} from '../lib/scoring';

const repository = new DiscoveryRepository();

// Validation schema for similar content request
const similarContentSchema = z.object({
    contentId: z.string().uuid(),
    limit: z.number().min(1).max(20).optional().default(10)
});

interface ScoredSimilarContent {
    discovery: EnhancedDiscovery;
    similarityScore: number;
    overallScore: number;
}

/**
 * Similar content route plugin (H2.4: Content Similarity Matching)
 * Returns content similar to a reference content item
 */
export const similarContentRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /api/discovery/similar/:contentId
     * Find content similar to the specified content ID
     */
    fastify.get<{
        Params: { contentId: string };
        Querystring: { limit?: number };
    }>(
        '/similar/:contentId',
        async (
            request: FastifyRequest<{
                Params: { contentId: string };
                Querystring: { limit?: number };
            }>,
            reply: FastifyReply
        ) => {
            try {
                // Optional authentication - works better with user context but not required
                const auth = getAuth(request as any);
                const isAuthenticated = auth?.isAuthenticated || false;

                // Validate request
                const validationResult = similarContentSchema.safeParse({
                    contentId: request.params.contentId,
                    limit: request.query.limit
                });

                if (!validationResult.success) {
                    return reply.status(400).send({
                        error: 'Invalid request parameters',
                        details: validationResult.error.errors
                    });
                }

                const { contentId, limit } = validationResult.data;

                // Get the reference content first
                const referenceContent = await repository.getDiscoveryById(contentId);
                if (!referenceContent) {
                    return reply.status(404).send({
                        error: 'Reference content not found'
                    });
                }

                // Find similar content
                const similarContent = await repository.findSimilarContent(contentId, limit);

                if (similarContent.length === 0) {
                    return reply.send({
                        reference: referenceContent,
                        similar: [],
                        message: 'No similar content found'
                    });
                }

                // Get global engagement stats for scoring
                const globalStats = await repository.getGlobalEngagementStats();

                // Score similar content
                const scoredSimilar: ScoredSimilarContent[] = similarContent.map(discovery => {
                    const ageDays = getAgeDays(discovery.createdAt || new Date().toISOString());

                    // Calculate topic similarity
                    const topicSimilarity = calculateContentSimilarity(
                        referenceContent.topics,
                        discovery.topics
                    );

                    // Domain match bonus
                    const domainMatch = discovery.domain === referenceContent.domain ? 0.1 : 0;

                    // Freshness and quality
                    const freshnessScore = calculateFreshness(ageDays);
                    const qualityScore = discovery.quality || 0.5;
                    const popularityScore = discovery.metrics
                        ? calculatePopularityScore(discovery.metrics, ageDays, globalStats.averageEngagement)
                        : discovery.popularityScore || 0.5;

                    // Overall score: similarity is most important, then quality/freshness
                    const overallScore =
                        topicSimilarity * 0.5 +
                        qualityScore * 0.2 +
                        freshnessScore * 0.15 +
                        popularityScore * 0.1 +
                        domainMatch * 0.05;

                    return {
                        discovery,
                        similarityScore: topicSimilarity + domainMatch,
                        overallScore
                    };
                });

                // Sort by overall score
                scoredSimilar.sort((a, b) => b.overallScore - a.overallScore);

                // Format response
                const response = {
                    reference: {
                        id: referenceContent.id,
                        title: referenceContent.title,
                        domain: referenceContent.domain,
                        topics: referenceContent.topics
                    },
                    similar: scoredSimilar.map(item => ({
                        ...item.discovery,
                        similarityScore: Math.round(item.similarityScore * 1000) / 1000,
                        overallScore: Math.round(item.overallScore * 1000) / 1000
                    })),
                    count: scoredSimilar.length
                };

                fastify.log.info({
                    referenceId: contentId,
                    similarCount: scoredSimilar.length,
                    authenticated: isAuthenticated
                }, 'Similar content fetched');

                return reply.send(response);

            } catch (error) {
                fastify.log.error(error, 'Error in /similar endpoint');
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );

    /**
     * POST /api/discovery/similar
     * Find similar content with additional filtering options
     */
    fastify.post<{
        Body: {
            contentId: string;
            limit?: number;
            excludeIds?: string[];
            minSimilarity?: number;
        };
    }>(
        '/similar',
        async (
            request: FastifyRequest<{
                Body: {
                    contentId: string;
                    limit?: number;
                    excludeIds?: string[];
                    minSimilarity?: number;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const { contentId, limit = 10, excludeIds = [], minSimilarity = 0.1 } = request.body;

                // Validate content ID
                if (!contentId || typeof contentId !== 'string') {
                    return reply.status(400).send({
                        error: 'Invalid contentId'
                    });
                }

                // Get reference content
                const referenceContent = await repository.getDiscoveryById(contentId);
                if (!referenceContent) {
                    return reply.status(404).send({
                        error: 'Reference content not found'
                    });
                }

                // Find similar content (get extra for filtering)
                const similarContent = await repository.findSimilarContent(contentId, limit * 2);

                // Filter by excludeIds and calculate scores
                const globalStats = await repository.getGlobalEngagementStats();

                const filtered = similarContent
                    .filter(discovery => !excludeIds.includes(discovery.id))
                    .map(discovery => {
                        const ageDays = getAgeDays(discovery.createdAt || new Date().toISOString());
                        const topicSimilarity = calculateContentSimilarity(
                            referenceContent.topics,
                            discovery.topics
                        );
                        const domainMatch = discovery.domain === referenceContent.domain ? 0.1 : 0;
                        const freshnessScore = calculateFreshness(ageDays);
                        const qualityScore = discovery.quality || 0.5;
                        const popularityScore = discovery.metrics
                            ? calculatePopularityScore(discovery.metrics, ageDays, globalStats.averageEngagement)
                            : discovery.popularityScore || 0.5;

                        const overallScore =
                            topicSimilarity * 0.5 +
                            qualityScore * 0.2 +
                            freshnessScore * 0.15 +
                            popularityScore * 0.1 +
                            domainMatch * 0.05;

                        return {
                            discovery,
                            similarityScore: topicSimilarity + domainMatch,
                            overallScore
                        };
                    })
                    .filter(item => item.similarityScore >= minSimilarity)
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .slice(0, limit);

                const response = {
                    reference: {
                        id: referenceContent.id,
                        title: referenceContent.title,
                        domain: referenceContent.domain,
                        topics: referenceContent.topics
                    },
                    similar: filtered.map(item => ({
                        ...item.discovery,
                        similarityScore: Math.round(item.similarityScore * 1000) / 1000,
                        overallScore: Math.round(item.overallScore * 1000) / 1000
                    })),
                    count: filtered.length
                };

                fastify.log.info({
                    referenceId: contentId,
                    similarCount: filtered.length,
                    minSimilarity
                }, 'Similar content fetched (filtered)');

                return reply.send(response);

            } catch (error) {
                fastify.log.error(error, 'Error in POST /similar endpoint');
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );
};

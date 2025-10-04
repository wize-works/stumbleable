import { getAuth } from '@clerk/fastify';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { interactionStore } from '../store';
import { FeedbackRequest } from '../types';

// Validation schemas
const FeedbackRequestSchema = z.object({
    discoveryId: z.string().min(1),
    action: z.enum(['up', 'down', 'save', 'unsave', 'skip', 'share', 'view']),
    userId: z.string().optional(),
});

/**
 * Feedback and interaction routes
 */
export async function feedbackRoutes(fastify: FastifyInstance) {

    /**
     * Record user feedback/interaction
     * POST /feedback
     */
    fastify.post<{ Body: FeedbackRequest & { userId?: string } }>('/feedback', async (request, reply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }
            const authenticatedUserId = auth.userId;

            const { discoveryId, action, userId } = FeedbackRequestSchema.parse(request.body);

            const interaction = await interactionStore.recordInteraction(discoveryId, action, authenticatedUserId);

            fastify.log.info({ discoveryId, action, userId, interactionId: interaction.id }, 'Recorded interaction');

            const stats = await interactionStore.getStats(discoveryId);

            return {
                success: true,
                interaction,
                stats,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Invalid request',
                    details: error.errors,
                };
            }

            fastify.log.error(error, 'Error recording feedback');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });

    /**
     * Get interaction stats for a discovery
     * GET /stats/:discoveryId
     */
    fastify.get<{ Params: { discoveryId: string } }>('/stats/:discoveryId', async (request, reply) => {
        try {
            const { discoveryId } = request.params;

            const stats = await interactionStore.getStats(discoveryId);

            return {
                success: true,
                discoveryId,
                stats,
            };
        } catch (error) {
            fastify.log.error(error, 'Error getting stats');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });
}
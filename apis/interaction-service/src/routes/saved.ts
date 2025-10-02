import { getAuth } from '@clerk/fastify';
import { FastifyInstance } from 'fastify';
import { interactionStore } from '../store';

/**
 * Saved discoveries routes
 */
export async function savedRoutes(fastify: FastifyInstance) {

    /**
     * Check if a discovery is saved
     * GET /saved/:discoveryId
     */
    fastify.get<{
        Params: { discoveryId: string };
    }>('/saved/:discoveryId', async (request, reply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }
            const userId = auth.userId;

            const { discoveryId } = request.params;

            const isSaved = await interactionStore.isSaved(discoveryId, userId);

            return {
                success: true,
                discoveryId,
                isSaved,
            };
        } catch (error) {
            fastify.log.error(error, 'Error checking saved status');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });

    /**
     * Get all saved discoveries
     * GET /saved
     */
    fastify.get('/saved', async (request, reply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }
            const userId = auth.userId;

            const saved = await interactionStore.getSaved(userId);

            return {
                success: true,
                saved,
            };
        } catch (error) {
            fastify.log.error(error, 'Error getting saved discoveries');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });
}
import { FastifyInstance } from 'fastify';
import { interactionStore } from '../store';

/**
 * Analytics and reporting routes
 */
export async function analyticsRoutes(fastify: FastifyInstance) {

    /**
     * Get analytics summary
     * GET /analytics/summary
     */
    fastify.get<{ Querystring: { userId?: string } }>('/analytics/summary', async (request, reply) => {
        try {
            const { userId } = request.query;
            const allInteractions = await interactionStore.getAllInteractions();

            const summary = {
                totalInteractions: allInteractions.length,
                byAction: {
                    up: allInteractions.filter(i => i.action === 'up').length,
                    down: allInteractions.filter(i => i.action === 'down').length,
                    save: allInteractions.filter(i => i.action === 'save').length,
                    share: allInteractions.filter(i => i.action === 'share').length,
                    skip: allInteractions.filter(i => i.action === 'skip').length,
                },
                savedCount: userId ? (await interactionStore.getSaved(userId)).length : 0,
            };

            return {
                success: true,
                summary,
            };
        } catch (error) {
            fastify.log.error(error, 'Error getting analytics summary');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });

    /**
     * Get recent interactions
     * GET /analytics/recent
     */
    fastify.get('/analytics/recent', async (request, reply) => {
        try {
            const allInteractions = await interactionStore.getAllInteractions();

            // Get last 50 interactions, sorted by timestamp (newest first)
            const recentInteractions = allInteractions
                .sort((a, b) => b.at - a.at)
                .slice(0, 50);

            return {
                success: true,
                interactions: recentInteractions,
            };
        } catch (error) {
            fastify.log.error(error, 'Error getting recent interactions');
            reply.status(500);
            return {
                success: false,
                error: 'Internal server error',
            };
        }
    });
}
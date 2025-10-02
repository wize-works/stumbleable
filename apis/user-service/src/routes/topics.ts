import { FastifyPluginAsync } from 'fastify';
import { UserRepository } from '../lib/repository';

const repository = new UserRepository();

/**
 * Topics routes
 */
export const topicsRoutes: FastifyPluginAsync = async (fastify) => {

    // Get all available topics
    fastify.get('/topics', async (request, reply) => {
        try {
            const topics = await repository.getAvailableTopics();
            return reply.send({ topics });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /topics');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
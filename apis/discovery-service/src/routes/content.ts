import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { DiscoveryRepository } from '../lib/repository';

const repository = new DiscoveryRepository();

/**
 * Content retrieval routes
 */
export const contentRoute: FastifyPluginAsync = async (fastify) => {

    // Get discovery by ID
    fastify.get<{ Params: { id: string } }>('/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { id } = request.params;

            if (!id) {
                return reply.status(400).send({
                    error: 'Discovery ID is required'
                });
            }

            const discovery = await repository.getDiscoveryById(id);

            if (!discovery) {
                return reply.status(404).send({
                    error: 'Discovery not found'
                });
            }

            return reply.send({ discovery });

        } catch (error) {
            fastify.log.error(error, 'Error in /content/:id endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
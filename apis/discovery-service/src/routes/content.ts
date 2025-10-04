import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { DiscoveryRepository } from '../lib/repository';

const repository = new DiscoveryRepository();

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Content retrieval routes
 */
export const contentRoute: FastifyPluginAsync = async (fastify) => {

    // Get discovery by ID
    // Public endpoint (no auth required) for shareable links
    fastify.get<{ Params: { id: string } }>('/content/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            // Validate UUID format
            if (!id || !UUID_REGEX.test(id)) {
                return reply.status(400).send({
                    error: 'Invalid discovery ID format. Must be a valid UUID.'
                });
            }

            const discovery = await repository.getDiscoveryById(id);

            if (!discovery) {
                return reply.status(404).send({
                    error: 'Discovery not found'
                });
            }

            // Include a reason for transparency (why this content)
            const reason = 'Shared content';

            return reply.send({
                discovery,
                reason
            });

        } catch (error) {
            fastify.log.error(error, 'Error in /content/:id endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
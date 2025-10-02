import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';

// Validation schemas
const CreateSourceSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['rss', 'sitemap', 'web']),
    url: z.string().url(),
    crawl_frequency_hours: z.number().min(1).max(168).default(24),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().default(true)
});

const UpdateSourceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    url: z.string().url().optional(),
    crawl_frequency_hours: z.number().min(1).max(168).optional(),
    topics: z.array(z.string()).optional(),
    enabled: z.boolean().optional()
});

/**
 * Crawler source management routes
 */
export async function sourceRoutes(fastify: FastifyInstance) {

    // Get all sources (admin only)
    fastify.get('/sources', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('crawler_sources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                fastify.log.error(error, 'Error fetching sources');
                return reply.status(500).send({ error: 'Failed to fetch sources' });
            }

            return reply.send({ sources: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /sources');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get a single source (admin only)
    fastify.get('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const { data, error } = await supabase
                .from('crawler_sources')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                return reply.status(404).send({ error: 'Source not found' });
            }

            return reply.send({ source: data });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create a new source (admin only)
    fastify.post('/sources', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        try {
            const body = CreateSourceSchema.parse(request.body);
            const domain = new URL(body.url).hostname;

            const { data, error } = await supabase
                .from('crawler_sources')
                .insert({
                    ...body,
                    domain,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error || !data) {
                fastify.log.error(error, 'Error creating source');
                return reply.status(500).send({ error: 'Failed to create source' });
            }

            return reply.status(201).send({ source: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }
            fastify.log.error(error, 'Error in POST /sources');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update a source (admin only)
    fastify.put('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const body = UpdateSourceSchema.parse(request.body);

            const { data, error } = await supabase
                .from('crawler_sources')
                .update({
                    ...body,
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id)
                .select()
                .single();

            if (error || !data) {
                return reply.status(404).send({ error: 'Source not found' });
            }

            return reply.send({ source: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: error.errors
                });
            }
            fastify.log.error(error, 'Error in PUT /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete a source (admin only)
    fastify.delete('/sources/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const { error } = await supabase
                .from('crawler_sources')
                .delete()
                .eq('id', params.id);

            if (error) {
                fastify.log.error(error, 'Error deleting source');
                return reply.status(500).send({ error: 'Failed to delete source' });
            }

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error in DELETE /sources/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../lib/auth.js';
import { supabase } from '../lib/supabase.js';
import { CreatePlatformRequest, LaunchPlatform, UpdatePlatformRequest } from '../types.js';

export default async function platformRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/platforms
     * Get all active launch platforms (public endpoint)
     */
    fastify.get('/platforms', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('launch_platforms')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) {
                fastify.log.error({ error }, 'Error fetching platforms');
                return reply.code(500).send({ error: 'Failed to fetch platforms' });
            }

            return reply.send({
                platforms: data as LaunchPlatform[],
                count: data?.length || 0
            });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error fetching platforms');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * GET /api/platforms/slugs
     * Get all platform slugs for static generation (public endpoint)
     */
    fastify.get('/platforms/slugs', async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('launch_platforms')
                .select('slug')
                .eq('is_active', true);

            if (error) {
                fastify.log.error({ error }, 'Error fetching platform slugs');
                return reply.code(500).send({ error: 'Failed to fetch platform slugs' });
            }

            const slugs = data?.map(row => row.slug) || [];
            return reply.send({ slugs });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error fetching platform slugs');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * GET /api/platforms/:slug
     * Get a specific platform by slug (public endpoint)
     */
    fastify.get<{ Params: { slug: string } }>('/platforms/:slug', async (request, reply) => {
        try {
            const { slug } = request.params;

            const { data, error } = await supabase
                .from('launch_platforms')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.code(404).send({ error: 'Platform not found' });
                }
                fastify.log.error({ error }, 'Error fetching platform');
                return reply.code(500).send({ error: 'Failed to fetch platform' });
            }

            return reply.send({ platform: data as LaunchPlatform });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error fetching platform');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * GET /api/admin/platforms
     * Get all platforms including inactive (admin only)
     */
    fastify.get('/admin/platforms', async (request, reply) => {
        try {
            // Check admin authorization
            const authCheck = await requireAdmin(request);
            if (!authCheck.isAuthorized) {
                fastify.log.warn({ clerkUserId: authCheck.clerkUserId, role: authCheck.role }, 'Unauthorized admin access attempt');
                return reply.code(403).send({ error: authCheck.error || 'Admin access required' });
            }

            const { data, error } = await supabase
                .from('launch_platforms')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) {
                fastify.log.error({ error }, 'Error fetching all platforms');
                return reply.code(500).send({ error: 'Failed to fetch platforms' });
            }

            return reply.send({
                platforms: data as LaunchPlatform[],
                count: data?.length || 0
            });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error fetching all platforms');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * POST /api/admin/platforms
     * Create a new platform (admin only)
     */
    fastify.post<{ Body: CreatePlatformRequest }>('/admin/platforms', async (request, reply) => {
        try {
            // Check admin authorization
            const authCheck = await requireAdmin(request);
            if (!authCheck.isAuthorized) {
                fastify.log.warn({ clerkUserId: authCheck.clerkUserId, role: authCheck.role }, 'Unauthorized platform creation attempt');
                return reply.code(403).send({ error: authCheck.error || 'Admin access required' });
            }

            const platform = request.body;

            // Check if slug already exists
            const { data: existing } = await supabase
                .from('launch_platforms')
                .select('slug')
                .eq('slug', platform.slug)
                .single();

            if (existing) {
                return reply.code(400).send({ error: 'Platform with this slug already exists' });
            }

            const { data, error } = await supabase
                .from('launch_platforms')
                .insert([platform])
                .select()
                .single();

            if (error) {
                fastify.log.error({ error }, 'Error creating platform');
                return reply.code(500).send({ error: 'Failed to create platform' });
            }

            fastify.log.info({ platformId: data.id, slug: data.slug, userId: authCheck.userId }, 'Platform created by admin');
            return reply.code(201).send({ platform: data as LaunchPlatform });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error creating platform');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * PUT /api/admin/platforms/:id
     * Update a platform (admin only)
     */
    fastify.put<{ Params: { id: string }; Body: UpdatePlatformRequest }>('/admin/platforms/:id', async (request, reply) => {
        try {
            // Check admin authorization
            const authCheck = await requireAdmin(request);
            if (!authCheck.isAuthorized) {
                fastify.log.warn({ clerkUserId: authCheck.clerkUserId, role: authCheck.role }, 'Unauthorized platform update attempt');
                return reply.code(403).send({ error: authCheck.error || 'Admin access required' });
            }

            const { id } = request.params;
            const updates = request.body;

            const { data, error } = await supabase
                .from('launch_platforms')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return reply.code(404).send({ error: 'Platform not found' });
                }
                fastify.log.error({ error }, 'Error updating platform');
                return reply.code(500).send({ error: 'Failed to update platform' });
            }

            fastify.log.info({ platformId: id, slug: data.slug, userId: authCheck.userId }, 'Platform updated by admin');
            return reply.send({ platform: data as LaunchPlatform });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error updating platform');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * DELETE /api/admin/platforms/:id
     * Delete a platform (admin only)
     */
    fastify.delete<{ Params: { id: string } }>('/admin/platforms/:id', async (request, reply) => {
        try {
            // Check admin authorization
            const authCheck = await requireAdmin(request);
            if (!authCheck.isAuthorized) {
                fastify.log.warn({ clerkUserId: authCheck.clerkUserId, role: authCheck.role }, 'Unauthorized platform deletion attempt');
                return reply.code(403).send({ error: authCheck.error || 'Admin access required' });
            }

            const { id } = request.params;

            const { error } = await supabase
                .from('launch_platforms')
                .delete()
                .eq('id', id);

            if (error) {
                fastify.log.error({ error }, 'Error deleting platform');
                return reply.code(500).send({ error: 'Failed to delete platform' });
            }

            fastify.log.info({ platformId: id, userId: authCheck.userId }, 'Platform deleted by admin');
            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error({ error }, 'Unexpected error deleting platform');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}

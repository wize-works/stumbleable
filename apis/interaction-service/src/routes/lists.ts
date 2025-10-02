import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// Validation schemas
const createListSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    emoji: z.string().max(10).optional(),
    color: z.string().max(50).optional(),
    isPublic: z.boolean().optional().default(false),
    isCollaborative: z.boolean().optional().default(false),
    isQuest: z.boolean().optional().default(false),
    questConfig: z.any().optional()
});

const updateListSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    emoji: z.string().max(10).optional(),
    color: z.string().max(50).optional(),
    isPublic: z.boolean().optional(),
    isCollaborative: z.boolean().optional()
});

const addListItemSchema = z.object({
    contentId: z.string().uuid(),
    notes: z.string().max(500).optional(),
    position: z.number().int().min(0).optional()
});

/**
 * Lists routes plugin for H3 Features
 * Handles user list management and operations
 */
export const listsRoutes: FastifyPluginAsync = async (fastify) => {

    /**
     * GET /api/lists
     * Get all lists for the authenticated user
     */
    fastify.get('/lists', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const auth = getAuth(request as any);
            if (!auth?.isAuthenticated) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            // Get user from database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('clerk_user_id', auth.userId)
                .single();

            if (userError || !userData) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Fetch user's lists
            const { data: lists, error: listsError } = await supabase
                .from('user_lists')
                .select('*')
                .eq('user_id', userData.id)
                .order('updated_at', { ascending: false });

            if (listsError) {
                fastify.log.error(listsError, 'Error fetching lists');
                return reply.status(500).send({ error: 'Failed to fetch lists' });
            }

            return reply.send({
                lists: lists || [],
                count: lists?.length || 0
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /lists');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * GET /api/lists/public
     * Get public lists (for discovery)
     */
    fastify.get('/lists/public', async (request: FastifyRequest<{
        Querystring: { limit?: number; offset?: number };
    }>, reply: FastifyReply) => {
        try {
            const { limit = 20, offset = 0 } = request.query as any;

            // Fetch public lists with basic user info
            const { data: lists, error: listsError } = await supabase
                .from('user_lists')
                .select(`
                    *,
                    users!inner(id, email, created_at)
                `)
                .eq('is_public', true)
                .order('follower_count', { ascending: false })
                .order('item_count', { ascending: false })
                .range(offset, offset + limit - 1);

            if (listsError) {
                fastify.log.error(listsError, 'Error fetching public lists');
                return reply.status(500).send({ error: 'Failed to fetch public lists' });
            }

            return reply.send({
                lists: lists || [],
                count: lists?.length || 0,
                offset,
                limit
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /lists/public');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * GET /api/lists/:listId
     * Get a specific list with items
     */
    fastify.get<{ Params: { listId: string } }>(
        '/lists/:listId',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                // Get list with items
                const { data: list, error: listError } = await supabase
                    .from('user_lists')
                    .select(`
                        *,
                        users!inner(id, email, created_at),
                        list_items!inner(
                            id,
                            position,
                            notes,
                            added_at,
                            is_checkpoint,
                            checkpoint_order,
                            content!inner(
                                id,
                                url,
                                title,
                                description,
                                image_url,
                                domain,
                                topics,
                                reading_time_minutes,
                                quality_score,
                                created_at
                            )
                        )
                    `)
                    .eq('id', listId)
                    .single();

                if (listError || !list) {
                    return reply.status(404).send({ error: 'List not found' });
                }

                // Check if user has access (public or owner)
                let isOwner = false;
                if (auth?.isAuthenticated) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('clerk_user_id', auth.userId)
                        .single();

                    isOwner = userData?.id === list.user_id;
                }

                if (!list.is_public && !isOwner) {
                    return reply.status(403).send({ error: 'Access denied' });
                }

                // Sort items by position
                if (list.list_items) {
                    list.list_items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                }

                return reply.send({
                    list,
                    isOwner
                });

            } catch (error) {
                fastify.log.error(error, 'Error in GET /lists/:listId');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * POST /api/lists
     * Create a new list
     */
    fastify.post('/lists', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const auth = getAuth(request as any);
            if (!auth?.isAuthenticated) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            // Validate request body
            const validation = createListSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validation.error.errors
                });
            }

            const { title, description, emoji, color, isPublic, isCollaborative, isQuest, questConfig } = validation.data;

            // Get user from database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('clerk_user_id', auth.userId)
                .single();

            if (userError || !userData) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Create list
            const { data: list, error: createError } = await supabase
                .from('user_lists')
                .insert({
                    user_id: userData.id,
                    title,
                    description,
                    emoji,
                    color,
                    is_public: isPublic,
                    is_collaborative: isCollaborative,
                    is_quest: isQuest,
                    quest_config: questConfig
                })
                .select()
                .single();

            if (createError) {
                fastify.log.error(createError, 'Error creating list');
                return reply.status(500).send({ error: 'Failed to create list' });
            }

            fastify.log.info({ listId: list.id, userId: userData.id }, 'List created');

            return reply.status(201).send({ list });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /lists');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * PUT /api/lists/:listId
     * Update a list
     */
    fastify.put<{ Params: { listId: string } }>(
        '/lists/:listId',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Validate request body
                const validation = updateListSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({
                        error: 'Invalid request body',
                        details: validation.error.errors
                    });
                }

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Update list (RLS will ensure user owns it)
                const { data: list, error: updateError } = await supabase
                    .from('user_lists')
                    .update({
                        ...validation.data,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', listId)
                    .eq('user_id', userData.id)
                    .select()
                    .single();

                if (updateError || !list) {
                    fastify.log.error(updateError, 'Error updating list');
                    return reply.status(404).send({ error: 'List not found or access denied' });
                }

                fastify.log.info({ listId, userId: userData.id }, 'List updated');

                return reply.send({ list });

            } catch (error) {
                fastify.log.error(error, 'Error in PUT /lists/:listId');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * DELETE /api/lists/:listId
     * Delete a list
     */
    fastify.delete<{ Params: { listId: string } }>(
        '/lists/:listId',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Delete list (cascade will remove items)
                const { error: deleteError } = await supabase
                    .from('user_lists')
                    .delete()
                    .eq('id', listId)
                    .eq('user_id', userData.id);

                if (deleteError) {
                    fastify.log.error(deleteError, 'Error deleting list');
                    return reply.status(500).send({ error: 'Failed to delete list' });
                }

                fastify.log.info({ listId, userId: userData.id }, 'List deleted');

                return reply.send({ success: true });

            } catch (error) {
                fastify.log.error(error, 'Error in DELETE /lists/:listId');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * POST /api/lists/:listId/items
     * Add an item to a list
     */
    fastify.post<{ Params: { listId: string } }>(
        '/lists/:listId/items',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Validate request body
                const validation = addListItemSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({
                        error: 'Invalid request body',
                        details: validation.error.errors
                    });
                }

                const { contentId, notes, position } = validation.data;

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Add item to list
                const { data: item, error: addError } = await supabase
                    .from('list_items')
                    .insert({
                        list_id: listId,
                        content_id: contentId,
                        user_id: userData.id,
                        notes,
                        position: position ?? 0
                    })
                    .select()
                    .single();

                if (addError) {
                    if (addError.code === '23505') { // Duplicate key
                        return reply.status(409).send({ error: 'Item already in list' });
                    }
                    fastify.log.error(addError, 'Error adding item to list');
                    return reply.status(500).send({ error: 'Failed to add item to list' });
                }

                fastify.log.info({ listId, contentId, userId: userData.id }, 'Item added to list');

                return reply.status(201).send({ item });

            } catch (error) {
                fastify.log.error(error, 'Error in POST /lists/:listId/items');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * DELETE /api/lists/:listId/items/:itemId
     * Remove an item from a list
     */
    fastify.delete<{ Params: { listId: string; itemId: string } }>(
        '/lists/:listId/items/:itemId',
        async (request: FastifyRequest<{ Params: { listId: string; itemId: string } }>, reply: FastifyReply) => {
            try {
                const { listId, itemId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Delete item (RLS will check permissions)
                const { error: deleteError } = await supabase
                    .from('list_items')
                    .delete()
                    .eq('id', itemId)
                    .eq('list_id', listId);

                if (deleteError) {
                    fastify.log.error(deleteError, 'Error removing item from list');
                    return reply.status(500).send({ error: 'Failed to remove item' });
                }

                fastify.log.info({ listId, itemId, userId: userData.id }, 'Item removed from list');

                return reply.send({ success: true });

            } catch (error) {
                fastify.log.error(error, 'Error in DELETE /lists/:listId/items/:itemId');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * POST /api/lists/:listId/follow
     * Follow a public list
     */
    fastify.post<{ Params: { listId: string } }>(
        '/lists/:listId/follow',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Follow list
                const { data: follow, error: followError } = await supabase
                    .from('list_followers')
                    .insert({
                        list_id: listId,
                        user_id: userData.id
                    })
                    .select()
                    .single();

                if (followError) {
                    if (followError.code === '23505') { // Already following
                        return reply.status(409).send({ error: 'Already following this list' });
                    }
                    fastify.log.error(followError, 'Error following list');
                    return reply.status(500).send({ error: 'Failed to follow list' });
                }

                fastify.log.info({ listId, userId: userData.id }, 'List followed');

                return reply.status(201).send({ follow });

            } catch (error) {
                fastify.log.error(error, 'Error in POST /lists/:listId/follow');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );

    /**
     * DELETE /api/lists/:listId/follow
     * Unfollow a list
     */
    fastify.delete<{ Params: { listId: string } }>(
        '/lists/:listId/follow',
        async (request: FastifyRequest<{ Params: { listId: string } }>, reply: FastifyReply) => {
            try {
                const { listId } = request.params;
                const auth = getAuth(request as any);

                if (!auth?.isAuthenticated) {
                    return reply.status(401).send({ error: 'Not authenticated' });
                }

                // Get user from database
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_user_id', auth.userId)
                    .single();

                if (userError || !userData) {
                    return reply.status(404).send({ error: 'User not found' });
                }

                // Unfollow list
                const { error: unfollowError } = await supabase
                    .from('list_followers')
                    .delete()
                    .eq('list_id', listId)
                    .eq('user_id', userData.id);

                if (unfollowError) {
                    fastify.log.error(unfollowError, 'Error unfollowing list');
                    return reply.status(500).send({ error: 'Failed to unfollow list' });
                }

                fastify.log.info({ listId, userId: userData.id }, 'List unfollowed');

                return reply.send({ success: true });

            } catch (error) {
                fastify.log.error(error, 'Error in DELETE /lists/:listId/follow');
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );
};

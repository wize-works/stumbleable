import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

/**
 * Lists management routes for user-service
 * Handles list creation, visibility, collaborators, and follows
 */

/**
 * Helper function to get database user ID from Clerk user ID
 * Returns null if user not found
 */
async function getDatabaseUserId(clerkUserId: string): Promise<string | null> {
    const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error || !user) return null;
    return user.id;
}

// Request schemas
const CreateListSchema = z.object({
    userId: z.string().min(1), // Can be Clerk ID (user_xxx) or database UUID
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
    isPublic: z.boolean().default(false),
    isCollaborative: z.boolean().default(false)
});

const UpdateListSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    emoji: z.string().optional(),
    color: z.string().optional(),
    isPublic: z.boolean().optional(),
    isCollaborative: z.boolean().optional()
});

const AddCollaboratorSchema = z.object({
    userId: z.string().min(1), // Can be Clerk ID (user_xxx) or database UUID
    canAddItems: z.boolean().default(true),
    canRemoveItems: z.boolean().default(false),
    canEditList: z.boolean().default(false)
});

export async function listsRoutes(fastify: FastifyInstance) {
    /**
     * Get user's lists
     * GET /lists?userId=xxx
     * userId can be either Clerk user ID or database UUID
     */
    fastify.get('/lists', async (request: FastifyRequest<{
        Querystring: { userId: string }
    }>, reply: FastifyReply) => {
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({ error: 'userId is required' });
        }

        try {
            // Convert Clerk user ID to database UUID if needed
            let dbUserId = userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { data, error } = await supabase
                .from('user_lists')
                .select(`
                    *,
                    list_items(count),
                    list_collaborators(count),
                    list_followers(count)
                `)
                .eq('user_id', dbUserId)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return reply.send({ lists: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error fetching user lists:');
            return reply.code(500).send({ error: 'Failed to fetch lists' });
        }
    });

    /**
     * Get public lists for discovery
     * GET /lists/public?limit=20&offset=0&search=term
     */
    fastify.get('/lists/public', async (request: FastifyRequest<{
        Querystring: { limit?: string, offset?: string, search?: string }
    }>, reply: FastifyReply) => {
        const limit = parseInt(request.query.limit || '20');
        const offset = parseInt(request.query.offset || '0');
        const search = request.query.search;

        try {
            let query = supabase
                .from('user_lists')
                .select(`
                    *,
                    list_items(count),
                    list_followers(count)
                `, { count: 'exact' })
                .eq('is_public', true)
                .order('follower_count', { ascending: false })
                .range(offset, offset + limit - 1);

            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            return reply.send({
                lists: data || [],
                total: count || 0,
                limit,
                offset
            });
        } catch (error) {
            fastify.log.error(error, 'Error fetching public lists:');
            return reply.code(500).send({ error: 'Failed to fetch public lists' });
        }
    });

    /**
     * Get single list by ID
     * GET /lists/:id
     */
    fastify.get('/lists/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const { data, error } = await supabase
                .from('user_lists')
                .select(`
                    *,
                    list_items(
                        *,
                        content(*)
                    ),
                    list_collaborators(
                        *,
                        users!list_collaborators_user_id_fkey(id, clerk_user_id)
                    ),
                    list_followers(count)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) {
                return reply.code(404).send({ error: 'List not found' });
            }

            return reply.send({ list: data });
        } catch (error) {
            fastify.log.error(error, 'Error fetching list:');
            return reply.code(500).send({ error: 'Failed to fetch list' });
        }
    });

    /**
     * Create new list
     * POST /lists
     * userId can be either Clerk user ID or database UUID
     */
    fastify.post('/lists', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const listData = CreateListSchema.parse(request.body);

            // Convert Clerk user ID to database UUID if needed
            let dbUserId = listData.userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (listData.userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(listData.userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { data, error } = await supabase
                .from('user_lists')
                .insert({
                    user_id: dbUserId,
                    title: listData.title,
                    description: listData.description,
                    emoji: listData.emoji,
                    color: listData.color,
                    is_public: listData.isPublic,
                    is_collaborative: listData.isCollaborative,
                    item_count: 0,
                    view_count: 0,
                    follower_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return reply.code(201).send({ list: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request data', details: error.errors });
            }
            fastify.log.error(error, 'Error creating list:');
            return reply.code(500).send({ error: 'Failed to create list' });
        }
    });

    /**
     * Update list
     * PATCH /lists/:id
     */
    fastify.patch('/lists/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const updates = UpdateListSchema.parse(request.body);

            const { data, error } = await supabase
                .from('user_lists')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return reply.code(404).send({ error: 'List not found' });
            }

            return reply.send({ list: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request data', details: error.errors });
            }
            fastify.log.error(error, 'Error updating list:');
            return reply.code(500).send({ error: 'Failed to update list' });
        }
    });

    /**
     * Toggle list visibility (public/private)
     * POST /lists/:id/visibility
     */
    fastify.post('/lists/:id/visibility', async (request: FastifyRequest<{
        Params: { id: string },
        Body: { isPublic: boolean }
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { isPublic } = request.body;

        try {
            const { data, error } = await supabase
                .from('user_lists')
                .update({
                    is_public: isPublic,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return reply.code(404).send({ error: 'List not found' });
            }

            return reply.send({ list: data });
        } catch (error) {
            fastify.log.error(error, 'Error toggling list visibility:');
            return reply.code(500).send({ error: 'Failed to toggle visibility' });
        }
    });

    /**
     * Add collaborator to list
     * POST /lists/:id/collaborators
     * userId can be either Clerk user ID or database UUID
     */
    fastify.post('/lists/:id/collaborators', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            const collaborator = AddCollaboratorSchema.parse(request.body);

            // Convert Clerk user ID to database UUID if needed
            let dbUserId = collaborator.userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (collaborator.userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(collaborator.userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { data, error } = await supabase
                .from('list_collaborators')
                .insert({
                    list_id: id,
                    user_id: dbUserId,
                    can_add_items: collaborator.canAddItems,
                    can_remove_items: collaborator.canRemoveItems,
                    can_edit_list: collaborator.canEditList,
                    added_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Update collaborative flag if first collaborator
            await supabase
                .from('user_lists')
                .update({ is_collaborative: true })
                .eq('id', id);

            return reply.code(201).send({ collaborator: data });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Invalid request data', details: error.errors });
            }
            fastify.log.error(error, 'Error adding collaborator:');
            return reply.code(500).send({ error: 'Failed to add collaborator' });
        }
    });

    /**
     * Remove collaborator from list
     * DELETE /lists/:id/collaborators/:userId
     * userId can be either Clerk user ID or database UUID
     */
    fastify.delete('/lists/:id/collaborators/:userId', async (request: FastifyRequest<{
        Params: { id: string, userId: string }
    }>, reply: FastifyReply) => {
        const { id, userId } = request.params;

        try {
            // Convert Clerk user ID to database UUID if needed
            let dbUserId = userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { error } = await supabase
                .from('list_collaborators')
                .delete()
                .eq('list_id', id)
                .eq('user_id', dbUserId);

            if (error) throw error;

            // Check if list still has collaborators
            const { data: remaining } = await supabase
                .from('list_collaborators')
                .select('id')
                .eq('list_id', id);

            if (!remaining || remaining.length === 0) {
                // No more collaborators, set collaborative to false
                await supabase
                    .from('user_lists')
                    .update({ is_collaborative: false })
                    .eq('id', id);
            }

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error removing collaborator:');
            return reply.code(500).send({ error: 'Failed to remove collaborator' });
        }
    });

    /**
     * Follow a list
     * POST /lists/:id/follow
     * userId can be either Clerk user ID or database UUID
     */
    fastify.post('/lists/:id/follow', async (request: FastifyRequest<{
        Params: { id: string },
        Body: { userId: string, notifyOnNewItems?: boolean }
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { userId, notifyOnNewItems = false } = request.body;

        if (!userId) {
            return reply.code(400).send({ error: 'userId is required' });
        }

        try {
            // Convert Clerk user ID to database UUID if needed
            let dbUserId = userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            // Check if already following
            const { data: existing } = await supabase
                .from('list_followers')
                .select('id')
                .eq('list_id', id)
                .eq('user_id', dbUserId)
                .single();

            if (existing) {
                return reply.code(400).send({ error: 'Already following this list' });
            }

            const { data, error } = await supabase
                .from('list_followers')
                .insert({
                    list_id: id,
                    user_id: dbUserId,
                    notify_on_new_items: notifyOnNewItems,
                    followed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Increment follower count
            await supabase.rpc('increment_follower_count', { list_id: id });

            return reply.code(201).send({ follow: data });
        } catch (error) {
            fastify.log.error(error, 'Error following list:');
            return reply.code(500).send({ error: 'Failed to follow list' });
        }
    });

    /**
     * Unfollow a list
     * DELETE /lists/:id/follow
     * userId can be either Clerk user ID or database UUID
     */
    fastify.delete('/lists/:id/follow', async (request: FastifyRequest<{
        Params: { id: string },
        Querystring: { userId: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({ error: 'userId is required' });
        }

        try {
            // Convert Clerk user ID to database UUID if needed
            let dbUserId = userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { error } = await supabase
                .from('list_followers')
                .delete()
                .eq('list_id', id)
                .eq('user_id', dbUserId);

            if (error) throw error;

            // Decrement follower count
            await supabase.rpc('decrement_follower_count', { list_id: id });

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error unfollowing list:');
            return reply.code(500).send({ error: 'Failed to unfollow list' });
        }
    });

    /**
     * Get user's followed lists
     * GET /lists/followed?userId=xxx
     * userId can be either Clerk user ID or database UUID
     */
    fastify.get('/lists/followed', async (request: FastifyRequest<{
        Querystring: { userId: string }
    }>, reply: FastifyReply) => {
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({ error: 'userId is required' });
        }

        try {
            // Convert Clerk user ID to database UUID if needed
            let dbUserId = userId;

            // Check if it's a Clerk ID (starts with "user_")
            if (userId.startsWith('user_')) {
                const convertedId = await getDatabaseUserId(userId);
                if (!convertedId) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                dbUserId = convertedId;
            }

            const { data, error } = await supabase
                .from('list_followers')
                .select(`
                    *,
                    user_lists(
                        *,
                        list_items(count)
                    )
                `)
                .eq('user_id', dbUserId)
                .order('followed_at', { ascending: false });

            if (error) throw error;

            return reply.send({ lists: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error fetching followed lists:');
            return reply.code(500).send({ error: 'Failed to fetch followed lists' });
        }
    });

    /**
     * Delete list
     * DELETE /lists/:id
     */
    fastify.delete('/lists/:id', async (request: FastifyRequest<{
        Params: { id: string }
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        try {
            // Delete will cascade to list_items, list_collaborators, list_followers
            const { error } = await supabase
                .from('user_lists')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error, 'Error deleting list:');
            return reply.code(500).send({ error: 'Failed to delete list' });
        }
    });
}

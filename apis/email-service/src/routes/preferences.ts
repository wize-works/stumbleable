import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';

/**
 * Helper function to get internal user UUID from Clerk user ID
 */
async function getUserUUID(clerkUserId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error || !data) {
        return null;
    }

    return data.id;
}

const preferencesRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/preferences/:userId - Get user's email preferences
    // userId can be either Clerk user ID or internal UUID
    fastify.get('/preferences/:userId', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().min(1),
        });

        try {
            const params = paramsSchema.parse(request.params);
            let userUUID = params.userId;

            // If it's a Clerk user ID (starts with "user_"), look up the UUID
            if (params.userId.startsWith('user_')) {
                const uuid = await getUserUUID(params.userId);
                if (!uuid) {
                    return reply.code(404).send({
                        success: false,
                        error: 'User not found',
                        message: 'No user found with this Clerk user ID',
                    });
                }
                userUUID = uuid;
            }

            const { data, error } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', userUUID)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            // Return default preferences if not found
            if (!data) {
                return reply.send({
                    preferences: {
                        user_id: userUUID,
                        clerk_user_id: params.userId,
                        welcome_email: true,
                        weekly_trending: false, // Opt-in required for marketing emails
                        weekly_new: false,
                        saved_digest: false,
                        submission_updates: true,
                        re_engagement: true,
                        account_notifications: true,
                        unsubscribed_all: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }
                });
            }

            return reply.send({
                preferences: {
                    ...data,
                    clerk_user_id: params.userId,
                }
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid user ID',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to fetch preferences:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch preferences',
                message: error.message,
            });
        }
    });

    // PUT /api/preferences/:userId - Update user's email preferences
    // userId can be either Clerk user ID or internal UUID
    fastify.put('/preferences/:userId', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().min(1),
        });

        const bodySchema = z.object({
            welcome_email: z.boolean().optional(),
            weekly_trending: z.boolean().optional(),
            weekly_new: z.boolean().optional(),
            saved_digest: z.boolean().optional(),
            submission_updates: z.boolean().optional(),
            re_engagement: z.boolean().optional(),
            account_notifications: z.boolean().optional(),
            unsubscribed_all: z.boolean().optional(),
        });

        try {
            const params = paramsSchema.parse(request.params);
            const body = bodySchema.parse(request.body);
            let userUUID = params.userId;

            // If it's a Clerk user ID (starts with "user_"), look up the UUID
            if (params.userId.startsWith('user_')) {
                const uuid = await getUserUUID(params.userId);
                if (!uuid) {
                    return reply.code(404).send({
                        success: false,
                        error: 'User not found',
                        message: 'No user found with this Clerk user ID',
                    });
                }
                userUUID = uuid;
            }

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('user_id', userUUID)
                .single();

            let data, error;

            if (existing) {
                // Update existing preferences
                const result = await supabase
                    .from('email_preferences')
                    .update({
                        ...body,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userUUID)
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            } else {
                // Create new preferences
                const result = await supabase
                    .from('email_preferences')
                    .insert({
                        user_id: userUUID,
                        ...body,
                    })
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            }

            if (error) {
                throw error;
            }

            return reply.send({
                success: true,
                preferences: {
                    ...data,
                    clerk_user_id: params.userId,
                },
                message: 'Preferences updated successfully',
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to update preferences:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to update preferences',
                message: error.message,
            });
        }
    });

    // POST /api/preferences/:userId/unsubscribe - Unsubscribe from all emails
    // userId can be either Clerk user ID or internal UUID
    fastify.post('/preferences/:userId/unsubscribe', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().min(1),
        });

        try {
            const params = paramsSchema.parse(request.params);
            let userUUID = params.userId;

            // If it's a Clerk user ID (starts with "user_"), look up the UUID
            if (params.userId.startsWith('user_')) {
                const uuid = await getUserUUID(params.userId);
                if (!uuid) {
                    return reply.code(404).send({
                        success: false,
                        error: 'User not found',
                        message: 'No user found with this Clerk user ID',
                    });
                }
                userUUID = uuid;
            }

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', userUUID)
                .single();

            let data, error;

            if (existing) {
                // Update existing preferences to unsubscribe all
                const result = await supabase
                    .from('email_preferences')
                    .update({
                        unsubscribed_all: true,
                        welcome_email: false,
                        weekly_trending: false,
                        weekly_new: false,
                        saved_digest: false,
                        submission_updates: false,
                        re_engagement: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userUUID)
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            } else {
                // Create new preferences with unsubscribed state
                const result = await supabase
                    .from('email_preferences')
                    .insert({
                        user_id: userUUID,
                        unsubscribed_all: true,
                        welcome_email: false,
                        weekly_trending: false,
                        weekly_new: false,
                        saved_digest: false,
                        submission_updates: false,
                        re_engagement: false,
                        account_notifications: true, // Keep account notifications enabled
                    })
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            }

            if (error) {
                throw error;
            }

            return reply.send({
                success: true,
                message: 'Successfully unsubscribed from all emails',
                preferences: {
                    ...data,
                    clerk_user_id: params.userId,
                },
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid user ID',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to unsubscribe:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to unsubscribe',
                message: error.message,
            });
        }
    });

    // POST /api/preferences/:userId/resubscribe - Resubscribe to all emails
    // userId can be either Clerk user ID or internal UUID
    fastify.post('/preferences/:userId/resubscribe', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().min(1),
        });

        try {
            const params = paramsSchema.parse(request.params);
            let userUUID = params.userId;

            // If it's a Clerk user ID (starts with "user_"), look up the UUID
            if (params.userId.startsWith('user_')) {
                const uuid = await getUserUUID(params.userId);
                if (!uuid) {
                    return reply.code(404).send({
                        success: false,
                        error: 'User not found',
                        message: 'No user found with this Clerk user ID',
                    });
                }
                userUUID = uuid;
            }

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', userUUID)
                .single();

            if (!existing) {
                return reply.code(404).send({
                    success: false,
                    error: 'User preferences not found',
                });
            }

            // Re-enable default preferences
            const { data, error } = await supabase
                .from('email_preferences')
                .update({
                    unsubscribed_all: false,
                    welcome_email: true,
                    submission_updates: true,
                    re_engagement: true,
                    account_notifications: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userUUID)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return reply.send({
                success: true,
                message: 'Successfully resubscribed to emails',
                preferences: {
                    ...data,
                    clerk_user_id: params.userId,
                },
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid user ID',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to resubscribe:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to resubscribe',
                message: error.message,
            });
        }
    });
};

export default preferencesRoutes;

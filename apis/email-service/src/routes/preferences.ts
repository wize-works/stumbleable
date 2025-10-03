import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';

const preferencesRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/preferences/:userId - Get user's email preferences
    fastify.get('/preferences/:userId', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().uuid(),
        });

        try {
            const params = paramsSchema.parse(request.params);

            const { data, error } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', params.userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            // Return default preferences if not found
            if (!data) {
                return reply.send({
                    user_id: params.userId,
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
                });
            }

            return reply.send(data);
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
    fastify.put('/preferences/:userId', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().uuid(),
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

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('user_id', params.userId)
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
                    .eq('user_id', params.userId)
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            } else {
                // Create new preferences
                const result = await supabase
                    .from('email_preferences')
                    .insert({
                        user_id: params.userId,
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
                preferences: data,
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
    fastify.post('/preferences/:userId/unsubscribe', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().uuid(),
        });

        try {
            const params = paramsSchema.parse(request.params);

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', params.userId)
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
                    .eq('user_id', params.userId)
                    .select()
                    .single();

                data = result.data;
                error = result.error;
            } else {
                // Create new preferences with unsubscribed state
                const result = await supabase
                    .from('email_preferences')
                    .insert({
                        user_id: params.userId,
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
                preferences: data,
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
    fastify.post('/preferences/:userId/resubscribe', async (request, reply) => {
        const paramsSchema = z.object({
            userId: z.string().uuid(),
        });

        try {
            const params = paramsSchema.parse(request.params);

            // Check if preferences exist
            const { data: existing } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', params.userId)
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
                .eq('user_id', params.userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return reply.send({
                success: true,
                message: 'Successfully resubscribed to emails',
                preferences: data,
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

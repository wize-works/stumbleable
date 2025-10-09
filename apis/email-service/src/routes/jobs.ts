import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EmailQueue } from '../lib/queue.js';
import { EmailScheduler } from '../lib/scheduler.js';
import { supabase } from '../lib/supabase.js';

/**
 * Email Job Endpoints
 * These endpoints are triggered by the scheduler-service to execute email jobs
 */

// ===== Request Schemas =====

const JobContextSchema = z.object({
    jobName: z.string(),
    config: z.record(z.string(), z.any()).default({}),
    executionId: z.string(),
    triggeredBy: z.enum(['scheduler', 'manual']).default('scheduler'),
    triggeredByUser: z.string().optional(),
});

// ===== Route Handlers =====

export default async function jobRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/jobs/weekly-digest
     * Send weekly trending content digest to opted-in users
     */
    fastify.post<{
        Body: z.infer<typeof JobContextSchema>;
    }>('/jobs/weekly-digest', async (request, reply) => {
        const startTime = Date.now();
        let itemsProcessed = 0;
        let itemsSucceeded = 0;
        let itemsFailed = 0;

        try {
            const context = JobContextSchema.parse(request.body);
            fastify.log.info(`Starting weekly-digest job (execution: ${context.executionId})`);

            // Execute the weekly trending job
            await EmailScheduler.sendWeeklyTrending();

            // TODO: Get actual counts from EmailScheduler
            // For now, query recent queued emails
            const { count } = await supabase
                .from('email_queue')
                .select('*', { count: 'exact', head: true })
                .eq('email_type', 'weekly-digest')
                .gte('created_at', new Date(startTime).toISOString());

            itemsProcessed = count || 0;
            itemsSucceeded = count || 0;

            const duration = Date.now() - startTime;
            fastify.log.info(`Completed weekly-digest job in ${duration}ms`);

            return reply.send({
                success: true,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed,
                durationMs: duration,
                metadata: {
                    jobType: 'weekly-digest',
                    executionId: context.executionId,
                },
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            fastify.log.error(`Failed weekly-digest job:`, error);

            return reply.status(500).send({
                success: false,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed: itemsFailed + 1,
                durationMs: duration,
                error: error.message,
            });
        }
    });

    /**
     * POST /api/jobs/re-engagement
     * Send personalized re-engagement emails to inactive users
     */
    fastify.post<{
        Body: z.infer<typeof JobContextSchema>;
    }>('/jobs/re-engagement', async (request, reply) => {
        const startTime = Date.now();
        let itemsProcessed = 0;
        let itemsSucceeded = 0;
        let itemsFailed = 0;

        try {
            const context = JobContextSchema.parse(request.body);
            fastify.log.info(`Starting re-engagement job (execution: ${context.executionId})`);

            // Get config from context
            const daysInactive = Number(context.config.daysInactive) || 7;
            const batchSize = Number(context.config.batchSize) || 50;
            const maxEmails = Number(context.config.maxEmails) || 500;

            // Get inactive users using database function
            const { data: inactiveUsers, error } = await supabase.rpc(
                'get_inactive_users_for_reengagement',
                {
                    days_inactive: daysInactive,
                    batch_size: Math.min(batchSize, maxEmails),
                }
            );

            if (error) {
                throw new Error(`Failed to fetch inactive users: ${error.message}`);
            }

            if (!inactiveUsers || inactiveUsers.length === 0) {
                fastify.log.info('No inactive users found for re-engagement');
                return reply.send({
                    success: true,
                    itemsProcessed: 0,
                    itemsSucceeded: 0,
                    itemsFailed: 0,
                    durationMs: Date.now() - startTime,
                    metadata: {
                        message: 'No inactive users found',
                    },
                });
            }

            fastify.log.info(`Found ${inactiveUsers.length} inactive users`);

            // Queue re-engagement emails
            for (const user of inactiveUsers) {
                try {
                    await EmailQueue.enqueue(
                        user.user_id,
                        're-engagement',
                        user.email,
                        {
                            fullName: user.full_name,
                            daysSinceActivity: user.days_since_activity,
                            lastActivityAt: user.last_stumble_at,
                        }
                    );
                    itemsSucceeded++;
                } catch (error: any) {
                    fastify.log.error(`Failed to queue email for user ${user.user_id}:`, error);
                    itemsFailed++;
                }
                itemsProcessed++;
            }

            const duration = Date.now() - startTime;
            fastify.log.info(`Completed re-engagement job: ${itemsSucceeded} emails queued in ${duration}ms`);

            return reply.send({
                success: true,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed,
                durationMs: duration,
                metadata: {
                    jobType: 're-engagement',
                    daysInactive,
                    executionId: context.executionId,
                },
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            fastify.log.error(`Failed re-engagement job:`, error);

            return reply.status(500).send({
                success: false,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed: itemsFailed + 1,
                durationMs: duration,
                error: error.message,
            });
        }
    });

    /**
     * POST /api/jobs/queue-cleanup
     * Clean up old processed emails from the email_queue table
     */
    fastify.post<{
        Body: z.infer<typeof JobContextSchema>;
    }>('/jobs/queue-cleanup', async (request, reply) => {
        const startTime = Date.now();
        let itemsProcessed = 0;
        let itemsSucceeded = 0;
        let itemsFailed = 0;

        try {
            const context = JobContextSchema.parse(request.body);
            fastify.log.info(`Starting queue-cleanup job (execution: ${context.executionId})`);

            // Get config from context
            const retentionDays = Number(context.config.retentionDays) || 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // Delete old processed emails (sent or failed with max attempts reached)
            const { data, error } = await supabase
                .from('email_queue')
                .delete()
                .or(`status.eq.sent,and(status.eq.failed,attempts.gte.max_attempts)`)
                .lt('created_at', cutoffDate.toISOString())
                .select('id');

            if (error) {
                throw new Error(`Failed to clean up email queue: ${error.message}`);
            }

            itemsProcessed = data?.length || 0;
            itemsSucceeded = itemsProcessed;

            const duration = Date.now() - startTime;
            fastify.log.info(`Completed queue-cleanup job: removed ${itemsProcessed} old emails in ${duration}ms`);

            return reply.send({
                success: true,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed,
                durationMs: duration,
                metadata: {
                    jobType: 'queue-cleanup',
                    retentionDays,
                    cutoffDate: cutoffDate.toISOString(),
                    executionId: context.executionId,
                },
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            fastify.log.error(`Failed queue-cleanup job:`, error);

            return reply.status(500).send({
                success: false,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed: itemsFailed + 1,
                durationMs: duration,
                error: error.message,
            });
        }
    });
}

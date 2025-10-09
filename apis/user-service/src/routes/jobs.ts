import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EmailClient } from '../lib/email-client';
import { UserRepository } from '../lib/repository';

/**
 * User Service Job Endpoints
 * These endpoints are triggered by the scheduler-service to execute background jobs
 */

const repository = new UserRepository();

// ===== Request Schemas =====

const JobContextSchema = z.object({
    jobName: z.string(),
    config: z.record(z.string(), z.any()).default({}),
    executionId: z.string(),
    triggeredBy: z.enum(['scheduler', 'manual', 'admin']).default('scheduler'),
    triggeredByUser: z.string().optional(),
});

// ===== Route Handlers =====

export async function jobRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/jobs/process-deletions
     * Process pending account deletions after 30-day grace period
     * Also sends reminder emails for upcoming deletions
     */
    fastify.post<{
        Body: z.infer<typeof JobContextSchema>;
    }>('/jobs/process-deletions', async (request, reply) => {
        const startTime = Date.now();
        let itemsProcessed = 0;
        let itemsSucceeded = 0;
        let itemsFailed = 0;
        const metadata: any = {
            deletionsCompleted: 0,
            remindersSent: {
                sevenDay: 0,
                oneDay: 0,
            },
            errors: [],
        };

        try {
            const context = JobContextSchema.parse(request.body);
            fastify.log.info(`Starting deletion-cleanup job (execution: ${context.executionId})`);

            const now = new Date();

            // Get all pending deletion requests
            const pendingDeletions = await repository.getPendingDeletions();
            fastify.log.info(`Found ${pendingDeletions.length} pending deletion requests to process`);

            for (const deletion of pendingDeletions) {
                itemsProcessed++;

                try {
                    const scheduledDate = new Date(deletion.scheduled_deletion_at);
                    const daysUntilDeletion = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    fastify.log.info(`Processing deletion request ${deletion.id} - ${daysUntilDeletion} days until deletion`);

                    // If scheduled date has passed, complete the deletion
                    if (scheduledDate <= now) {
                        fastify.log.info(`Completing deletion for ${deletion.clerk_user_id}`);

                        const success = await repository.completeDeletion(deletion.id);

                        if (success) {
                            // Send deletion completion email
                            try {
                                await EmailClient.sendDeletionCompleteEmail(
                                    deletion.user_email,
                                    deletion.clerk_user_id
                                );
                                fastify.log.info(`Sent deletion completion email to ${deletion.user_email}`);
                            } catch (emailError: any) {
                                fastify.log.error(`Failed to send completion email: ${emailError.message}`);
                                // Don't fail the job if email fails
                            }

                            metadata.deletionsCompleted++;
                            itemsSucceeded++;
                            fastify.log.info(`✅ Completed deletion for ${deletion.clerk_user_id}`);
                        } else {
                            throw new Error(`Failed to complete deletion for ${deletion.clerk_user_id}`);
                        }
                    }
                    // Send 7-day reminder if deletion is in 7 days
                    else if (daysUntilDeletion === 7) {
                        try {
                            await EmailClient.send7DayDeletionReminderEmail(
                                deletion.clerk_user_id,
                                deletion.user_email,
                                deletion.scheduled_deletion_at,
                                deletion.id
                            );
                            metadata.remindersSent.sevenDay++;
                            itemsSucceeded++;
                            fastify.log.info(`Sent 7-day reminder email to ${deletion.user_email}`);
                        } catch (emailError: any) {
                            fastify.log.error(`Failed to send 7-day reminder: ${emailError.message}`);
                            itemsFailed++;
                            metadata.errors.push({
                                deletionId: deletion.id,
                                type: 'reminder_7day',
                                error: emailError.message,
                            });
                        }
                    }
                    // Send 1-day reminder if deletion is in 1 day
                    else if (daysUntilDeletion === 1) {
                        try {
                            await EmailClient.send1DayDeletionReminderEmail(
                                deletion.clerk_user_id,
                                deletion.user_email,
                                deletion.scheduled_deletion_at,
                                deletion.id
                            );
                            metadata.remindersSent.oneDay++;
                            itemsSucceeded++;
                            fastify.log.info(`Sent 1-day reminder email to ${deletion.user_email}`);
                        } catch (emailError: any) {
                            fastify.log.error(`Failed to send 1-day reminder: ${emailError.message}`);
                            itemsFailed++;
                            metadata.errors.push({
                                deletionId: deletion.id,
                                type: 'reminder_1day',
                                error: emailError.message,
                            });
                        }
                    }
                } catch (error: any) {
                    itemsFailed++;
                    fastify.log.error(`Error processing deletion ${deletion.id}:`, error);
                    metadata.errors.push({
                        deletionId: deletion.id,
                        type: 'deletion_processing',
                        error: error.message,
                    });
                }
            }

            const duration = Date.now() - startTime;
            fastify.log.info(
                `Completed deletion-cleanup job in ${duration}ms: ` +
                `${metadata.deletionsCompleted} deletions completed, ` +
                `${metadata.remindersSent.sevenDay} 7-day reminders, ` +
                `${metadata.remindersSent.oneDay} 1-day reminders`
            );

            return reply.send({
                success: true,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed,
                durationMs: duration,
                metadata,
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            fastify.log.error(`Failed deletion-cleanup job:`, error);

            return reply.status(500).send({
                success: false,
                itemsProcessed,
                itemsSucceeded,
                itemsFailed: itemsFailed + 1,
                durationMs: duration,
                error: error.message,
                metadata,
            });
        }
    });
}

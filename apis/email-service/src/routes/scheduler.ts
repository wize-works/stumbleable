import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { scheduler } from '../lib/scheduler.js';
import { supabase } from '../lib/supabase.js';

/**
 * Scheduler Management API Routes
 * Admin-only endpoints for managing scheduled email jobs
 */

// ===== Request Schemas =====

const TriggerJobSchema = z.object({
    userId: z.string().optional(), // Admin user triggering the job
});

const UpdateCronSchema = z.object({
    cronExpression: z.string(),
});

const JobHistoryQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
});

const JobStatsQuerySchema = z.object({
    days: z.coerce.number().min(1).max(365).default(30),
});

// ===== Route Handlers =====

export default async function schedulerRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/admin/scheduler/jobs
     * List all registered jobs with their current status
     */
    fastify.get('/admin/scheduler/jobs', async (request, reply) => {
        try {
            // Get job definitions with runtime status
            const jobs = scheduler.getJobs();

            // Get database status for each job
            const { data: dbJobs, error } = await supabase
                .from('job_schedules')
                .select('*');

            if (error) {
                return reply.status(500).send({
                    error: 'Failed to fetch job schedules',
                    message: error.message,
                });
            }

            // Merge runtime and database info
            const jobsWithStatus = jobs.map((job) => {
                const dbJob = dbJobs?.find((j: any) => j.job_name === job.name);
                return {
                    name: job.name,
                    displayName: job.displayName,
                    description: job.description,
                    cronExpression: job.cronExpression,
                    enabled: job.enabled,
                    isRunning: job.isRunning,
                    jobType: job.jobType,
                    lastRunAt: dbJob?.last_run_at || null,
                    lastRunStatus: dbJob?.last_run_status || null,
                    lastRunDuration: dbJob?.last_run_duration_ms || null,
                    nextRunAt: dbJob?.next_run_at || null,
                    totalRuns: dbJob?.total_runs || 0,
                    successfulRuns: dbJob?.successful_runs || 0,
                    failedRuns: dbJob?.failed_runs || 0,
                    config: dbJob?.config || {},
                };
            });

            return reply.send({ jobs: jobsWithStatus });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch jobs',
                message: error.message,
            });
        }
    });

    /**
     * GET /api/admin/scheduler/jobs/:jobName
     * Get detailed information about a specific job
     */
    fastify.get<{
        Params: { jobName: string };
    }>('/admin/scheduler/jobs/:jobName', async (request, reply) => {
        try {
            const { jobName } = request.params;

            // Get job definition
            const jobs = scheduler.getJobs();
            const job = jobs.find((j) => j.name === jobName);

            if (!job) {
                return reply.status(404).send({
                    error: 'Job not found',
                    message: `Job ${jobName} does not exist`,
                });
            }

            // Get database status
            const dbJob = await scheduler.getJobStatus(jobName);

            return reply.send({
                name: job.name,
                displayName: job.displayName,
                description: job.description,
                cronExpression: job.cronExpression,
                enabled: job.enabled,
                isRunning: job.isRunning,
                jobType: job.jobType,
                lastRunAt: dbJob?.last_run_at || null,
                lastRunStatus: dbJob?.last_run_status || null,
                lastRunDuration: dbJob?.last_run_duration_ms || null,
                nextRunAt: dbJob?.next_run_at || null,
                totalRuns: dbJob?.total_runs || 0,
                successfulRuns: dbJob?.successful_runs || 0,
                failedRuns: dbJob?.failed_runs || 0,
                config: dbJob?.config || {},
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch job details',
                message: error.message,
            });
        }
    });

    /**
     * POST /api/admin/scheduler/jobs/:jobName/trigger
     * Manually trigger a job execution
     */
    fastify.post<{
        Params: { jobName: string };
        Body: z.infer<typeof TriggerJobSchema>;
    }>('/admin/scheduler/jobs/:jobName/trigger', async (request, reply) => {
        try {
            const { jobName } = request.params;
            const { userId } = TriggerJobSchema.parse(request.body);

            // Get job definition to verify it exists
            const jobs = scheduler.getJobs();
            const job = jobs.find((j) => j.name === jobName);

            if (!job) {
                return reply.status(404).send({
                    error: 'Job not found',
                    message: `Job ${jobName} does not exist`,
                });
            }

            // Execute the job manually
            const result = await scheduler.executeJob(jobName, 'manual', userId);

            return reply.send({
                message: `Job ${jobName} triggered successfully`,
                result: {
                    success: result.success,
                    itemsProcessed: result.itemsProcessed,
                    itemsSucceeded: result.itemsSucceeded,
                    itemsFailed: result.itemsFailed,
                    error: result.error || null,
                    metadata: result.metadata || {},
                },
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to trigger job',
                message: error.message,
            });
        }
    });

    /**
     * POST /api/admin/scheduler/jobs/:jobName/enable
     * Enable a disabled job
     */
    fastify.post<{
        Params: { jobName: string };
    }>('/admin/scheduler/jobs/:jobName/enable', async (request, reply) => {
        try {
            const { jobName } = request.params;

            await scheduler.enableJob(jobName);

            return reply.send({
                message: `Job ${jobName} enabled successfully`,
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to enable job',
                message: error.message,
            });
        }
    });

    /**
     * POST /api/admin/scheduler/jobs/:jobName/disable
     * Disable an enabled job
     */
    fastify.post<{
        Params: { jobName: string };
    }>('/admin/scheduler/jobs/:jobName/disable', async (request, reply) => {
        try {
            const { jobName } = request.params;

            await scheduler.disableJob(jobName);

            return reply.send({
                message: `Job ${jobName} disabled successfully`,
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to disable job',
                message: error.message,
            });
        }
    });

    /**
     * GET /api/admin/scheduler/jobs/:jobName/history
     * Get execution history for a job
     */
    fastify.get<{
        Params: { jobName: string };
        Querystring: z.infer<typeof JobHistoryQuerySchema>;
    }>('/admin/scheduler/jobs/:jobName/history', async (request, reply) => {
        try {
            const { jobName } = request.params;
            const { limit, offset } = JobHistoryQuerySchema.parse(request.query);

            // Use database function to get execution history
            const { data, error } = await supabase.rpc('get_job_execution_history', {
                p_job_name: jobName,
                p_limit: limit,
                p_offset: offset,
            });

            if (error) {
                return reply.status(500).send({
                    error: 'Failed to fetch execution history',
                    message: error.message,
                });
            }

            // Get total count for pagination
            const { count, error: countError } = await supabase
                .from('scheduled_jobs')
                .select('*', { count: 'exact', head: true })
                .eq('job_name', jobName);

            if (countError) {
                return reply.status(500).send({
                    error: 'Failed to count executions',
                    message: countError.message,
                });
            }

            return reply.send({
                executions: data || [],
                pagination: {
                    limit,
                    offset,
                    total: count || 0,
                    hasMore: (offset + limit) < (count || 0),
                },
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch execution history',
                message: error.message,
            });
        }
    });

    /**
     * GET /api/admin/scheduler/jobs/:jobName/stats
     * Get execution statistics for a job
     */
    fastify.get<{
        Params: { jobName: string };
        Querystring: z.infer<typeof JobStatsQuerySchema>;
    }>('/admin/scheduler/jobs/:jobName/stats', async (request, reply) => {
        try {
            const { jobName } = request.params;
            const { days } = JobStatsQuerySchema.parse(request.query);

            // Use database function to get execution stats
            const { data, error } = await supabase.rpc('get_job_execution_stats', {
                p_job_name: jobName,
                p_days: days,
            });

            if (error) {
                return reply.status(500).send({
                    error: 'Failed to fetch execution stats',
                    message: error.message,
                });
            }

            return reply.send({
                stats: data || {
                    total_executions: 0,
                    successful_executions: 0,
                    failed_executions: 0,
                    avg_duration_ms: 0,
                    total_items_processed: 0,
                },
                period: {
                    days,
                    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    to: new Date().toISOString(),
                },
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to fetch execution stats',
                message: error.message,
            });
        }
    });

    /**
     * PUT /api/admin/scheduler/jobs/:jobName/cron
     * Update job cron expression
     */
    fastify.put<{
        Params: { jobName: string };
        Body: z.infer<typeof UpdateCronSchema>;
    }>('/admin/scheduler/jobs/:jobName/cron', async (request, reply) => {
        try {
            const { jobName } = request.params;
            const { cronExpression } = UpdateCronSchema.parse(request.body);

            // Validate cron expression
            const cron = await import('node-cron');
            if (!cron.validate(cronExpression)) {
                return reply.status(400).send({
                    error: 'Invalid cron expression',
                    message: `The cron expression "${cronExpression}" is not valid`,
                });
            }

            // Update job configuration in database
            const { error } = await supabase
                .from('job_schedules')
                .update({
                    cron_expression: cronExpression,
                    updated_at: new Date().toISOString(),
                })
                .eq('job_name', jobName);

            if (error) {
                return reply.status(500).send({
                    error: 'Failed to update cron expression',
                    message: error.message,
                });
            }

            // Restart the job if it's enabled
            const jobs = scheduler.getJobs();
            const job = jobs.find((j) => j.name === jobName);

            if (job?.enabled) {
                await scheduler.disableJob(jobName);
                job.cronExpression = cronExpression;
                await scheduler.enableJob(jobName);
            }

            return reply.send({
                message: `Cron expression updated for job ${jobName}`,
                cronExpression,
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Failed to update cron expression',
                message: error.message,
            });
        }
    });
}

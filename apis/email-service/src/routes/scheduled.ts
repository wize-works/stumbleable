import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { EmailScheduler } from '../lib/scheduler.js';

const scheduledRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /api/scheduled/trigger - Trigger scheduled email job
    fastify.post('/scheduled/trigger', async (request, reply) => {
        const schema = z.object({
            jobType: z.enum(['weekly-trending', 'weekly-new']),
        });

        try {
            const body = schema.parse(request.body);

            // Start job asynchronously
            if (body.jobType === 'weekly-trending') {
                EmailScheduler.sendWeeklyTrending().catch((error) => {
                    fastify.log.error('Weekly trending job failed:', error);
                });
            } else if (body.jobType === 'weekly-new') {
                EmailScheduler.sendWeeklyNew().catch((error) => {
                    fastify.log.error('Weekly new job failed:', error);
                });
            }

            return reply.send({
                success: true,
                message: `${body.jobType} job started`,
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to trigger job:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to trigger job',
                message: error.message,
            });
        }
    });

    // GET /api/scheduled/status - Get scheduler status
    fastify.get('/scheduled/status', async (request, reply) => {
        return reply.send({
            scheduler: 'running',
            supportedJobs: ['weekly-trending', 'weekly-new'],
            schedule: {
                'weekly-trending': 'Mondays at 10:00 AM',
                'weekly-new': 'Thursdays at 10:00 AM',
            },
            timestamp: new Date().toISOString(),
        });
    });
};

export default scheduledRoutes;

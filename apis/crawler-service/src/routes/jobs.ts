import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CrawlerScheduler } from '../lib/scheduler';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/auth';

let scheduler: CrawlerScheduler;

export function setScheduler(s: CrawlerScheduler) {
    scheduler = s;
}

/**
 * Crawler job management routes
 */
export async function jobRoutes(fastify: FastifyInstance) {

    // Get all jobs (admin only)
    fastify.get('/jobs', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const query = z.object({
            source_id: z.string().uuid().optional(),
            status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
            limit: z.coerce.number().min(1).max(100).default(50)
        }).parse(request.query);

        try {
            let dbQuery = supabase
                .from('crawler_jobs')
                .select('*, crawler_sources(name, type, url)')
                .order('created_at', { ascending: false })
                .limit(query.limit);

            if (query.source_id) {
                dbQuery = dbQuery.eq('source_id', query.source_id);
            }

            if (query.status) {
                dbQuery = dbQuery.eq('status', query.status);
            }

            const { data, error } = await dbQuery;

            if (error) {
                fastify.log.error(error, 'Error fetching jobs');
                return reply.status(500).send({ error: 'Failed to fetch jobs' });
            }

            return reply.send({ jobs: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /jobs');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get a single job (admin only)
    fastify.get('/jobs/:id', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            id: z.string().uuid()
        }).parse(request.params);

        try {
            const { data, error } = await supabase
                .from('crawler_jobs')
                .select('*, crawler_sources(name, type, url)')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                return reply.status(404).send({ error: 'Job not found' });
            }

            return reply.send({ job: data });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /jobs/:id');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Trigger a manual crawl (admin only)
    fastify.post('/crawl/:sourceId', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        const params = z.object({
            sourceId: z.string().uuid()
        }).parse(request.params);

        try {
            if (!scheduler) {
                return reply.status(500).send({ error: 'Scheduler not initialized' });
            }

            const job = await scheduler.triggerCrawl(params.sourceId);

            return reply.status(202).send({
                message: 'Crawl started',
                job
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /crawl/:sourceId');
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });

    // Get crawl history for a source
    fastify.get('/history/:sourceId', async (request, reply) => {
        const params = z.object({
            sourceId: z.string().uuid()
        }).parse(request.params);

        const query = z.object({
            limit: z.coerce.number().min(1).max(1000).default(100)
        }).parse(request.query);

        try {
            const { data, error } = await supabase
                .from('crawler_history')
                .select('*')
                .eq('source_id', params.sourceId)
                .order('discovered_at', { ascending: false })
                .limit(query.limit);

            if (error) {
                fastify.log.error(error, 'Error fetching history');
                return reply.status(500).send({ error: 'Failed to fetch history' });
            }

            return reply.send({ history: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /history/:sourceId');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get stats for all sources (admin only)
    fastify.get('/stats', {
        preHandler: requireAdmin
    }, async (request, reply) => {
        try {
            const { data, error } = await supabase
                .from('crawler_stats')
                .select('*, crawler_sources(name, type, url)')
                .order('total_items_approved', { ascending: false });

            if (error) {
                fastify.log.error(error, 'Error fetching stats');
                return reply.status(500).send({ error: 'Failed to fetch stats' });
            }

            return reply.send({ stats: data || [] });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /stats');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

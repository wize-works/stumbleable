import { FastifyPluginAsync } from 'fastify';
import { EmailQueue } from '../lib/queue.js';
import { supabase } from '../lib/supabase.js';

const queueRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /api/queue/process - Manually trigger queue processing
    fastify.post('/queue/process', async (request, reply) => {
        try {
            fastify.log.info('Manual queue processing triggered');
            await EmailQueue.processPendingEmails(10);

            return reply.send({
                success: true,
                message: 'Queue processing completed',
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            fastify.log.error('Queue processing failed:', error);
            return reply.code(500).send({
                success: false,
                error: 'Queue processing failed',
                message: error.message,
            });
        }
    });

    // GET /api/queue/status - Get queue status with stats
    fastify.get('/queue/status', async (request, reply) => {
        try {
            // Get counts by status
            const { data: stats, error: statsError } = await supabase
                .from('email_queue')
                .select('status', { count: 'exact' });

            if (statsError) throw statsError;

            // Count by status
            const pending = stats?.filter(s => s.status === 'pending').length || 0;
            const sent = stats?.filter(s => s.status === 'sent').length || 0;
            const failed = stats?.filter(s => s.status === 'failed').length || 0;
            const total = stats?.length || 0;

            return reply.send({
                status: 'running',
                stats: {
                    total,
                    pending,
                    sent,
                    failed,
                },
                message: 'Queue processor runs every 60 seconds',
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            fastify.log.error('Failed to get queue status:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to get queue status',
                message: error.message,
            });
        }
    });

    // GET /api/queue/items - Get queue items with optional filtering
    fastify.get<{
        Querystring: { status?: string; limit?: number; offset?: number };
    }>('/queue/items', async (request, reply) => {
        try {
            const { status, limit = 50, offset = 0 } = request.query;

            let query = supabase
                .from('email_queue')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            const { data: items, error } = await query;

            if (error) throw error;

            return reply.send({
                items: items || [],
                limit,
                offset,
            });
        } catch (error: any) {
            fastify.log.error('Failed to get queue items:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to get queue items',
                message: error.message,
            });
        }
    });

    // POST /api/queue/retry/:id - Retry a specific email
    fastify.post<{
        Params: { id: string };
    }>('/queue/retry/:id', async (request, reply) => {
        try {
            const { id } = request.params;

            // Reset attempts and set status back to pending
            const { error } = await supabase
                .from('email_queue')
                .update({
                    status: 'pending',
                    attempts: 0,
                    error_message: null,
                })
                .eq('id', id);

            if (error) throw error;

            return reply.send({
                success: true,
                message: 'Email reset for retry',
                emailId: id,
            });
        } catch (error: any) {
            fastify.log.error('Failed to retry email:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to retry email',
                message: error.message,
            });
        }
    });

    // DELETE /api/queue/:id - Delete an email from queue
    fastify.delete<{
        Params: { id: string };
    }>('/queue/:id', async (request, reply) => {
        try {
            const { id } = request.params;

            const { error } = await supabase
                .from('email_queue')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return reply.send({
                success: true,
                message: 'Email deleted from queue',
                emailId: id,
            });
        } catch (error: any) {
            fastify.log.error('Failed to delete email:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to delete email',
                message: error.message,
            });
        }
    });
};

export default queueRoutes;

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ContentModerationService } from '../lib/moderation';
import { DiscoveryRepository } from '../lib/repository';
import { supabase } from '../lib/supabase';
import { classifyContent } from './submit';

const repository = new DiscoveryRepository();
const moderationService = new ContentModerationService();

// Moderation decision schema
const moderationDecisionSchema = z.object({
    decision: z.enum(['approve', 'reject']),
    moderatorNotes: z.string().max(500).optional(),
    moderatorId: z.string().uuid('Invalid moderator ID')
});

// Get queue filters schema
const getQueueSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'reviewing']).optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0)
});

/**
 * Content moderation queue routes for admin interface
 */
export const moderationRoutes: FastifyPluginAsync = async (fastify) => {

    // Get moderation queue
    fastify.get<{ Querystring: any }>('/moderation/queue', async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
        try {
            const validationResult = getQueueSchema.safeParse(request.query);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid query parameters',
                    details: validationResult.error.errors
                });
            }

            const { status, limit, offset } = validationResult.data;

            let query = supabase
                .from('moderation_queue')
                .select(`
                    id,
                    url,
                    title,
                    description,
                    domain,
                    issues,
                    confidence_score,
                    status,
                    moderator_notes,
                    created_at,
                    moderated_at
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data: queue, error } = await query;

            if (error) {
                fastify.log.error(error, 'Error fetching moderation queue');
                return reply.status(500).send({
                    error: 'Failed to fetch moderation queue'
                });
            }

            // Get total count for pagination
            let countQuery = supabase
                .from('moderation_queue')
                .select('*', { count: 'exact', head: true });

            if (status) {
                countQuery = countQuery.eq('status', status);
            }

            const { count, error: countError } = await countQuery;

            if (countError) {
                fastify.log.error(countError, 'Error counting moderation queue');
            }

            return reply.send({
                queue: queue || [],
                pagination: {
                    total: count || 0,
                    limit,
                    offset,
                    hasMore: (count || 0) > offset + limit
                }
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /moderation/queue');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get specific queued item
    fastify.get<{ Params: { itemId: string } }>('/moderation/queue/:itemId', async (request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) => {
        try {
            const { itemId } = request.params;

            const { data: item, error } = await supabase
                .from('moderation_queue')
                .select(`
                    id,
                    url,
                    title,
                    description,
                    domain,
                    issues,
                    confidence_score,
                    status,
                    moderator_notes,
                    submitted_by,
                    created_at,
                    moderated_at
                `)
                .eq('id', itemId)
                .single();

            if (error || !item) {
                return reply.status(404).send({
                    error: 'Moderation item not found'
                });
            }

            // Get domain reputation for context
            const domainRep = await moderationService.getDomainReputation(item.domain);

            return reply.send({
                item,
                context: {
                    domainReputation: domainRep
                }
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /moderation/queue/:itemId');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Make moderation decision
    fastify.post<{
        Params: { itemId: string },
        Body: any
    }>('/moderation/queue/:itemId/decide', async (request: FastifyRequest<{
        Params: { itemId: string },
        Body: any
    }>, reply: FastifyReply) => {
        try {
            const validationResult = moderationDecisionSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { itemId } = request.params;
            const { decision, moderatorNotes, moderatorId } = validationResult.data;

            // Get the moderation item
            const { data: item, error: fetchError } = await supabase
                .from('moderation_queue')
                .select('*')
                .eq('id', itemId)
                .single();

            if (fetchError || !item) {
                return reply.status(404).send({
                    error: 'Moderation item not found'
                });
            }

            if (item.status !== 'pending') {
                return reply.status(400).send({
                    error: 'Item has already been moderated'
                });
            }

            const newStatus = decision === 'approve' ? 'approved' : 'rejected';

            // Update moderation queue item
            const { error: updateError } = await supabase
                .from('moderation_queue')
                .update({
                    status: newStatus,
                    moderator_notes: moderatorNotes,
                    moderated_by: moderatorId,
                    moderated_at: new Date().toISOString()
                })
                .eq('id', itemId);

            if (updateError) {
                fastify.log.error(updateError, 'Error updating moderation item');
                return reply.status(500).send({
                    error: 'Failed to update moderation item'
                });
            }

            // If approved, create the discovery
            if (decision === 'approve') {
                try {
                    // Re-classify content to determine topics
                    const topics = classifyContent(item.url, item.title, item.description || undefined);

                    const discovery = await repository.createDiscovery({
                        url: item.url,
                        title: item.title,
                        description: item.description || '',
                        domain: item.domain,
                        faviconUrl: `https://${item.domain}/favicon.ico`, // Fallback favicon
                        topics,
                        readTime: Math.max(1, Math.floor((item.title.length + (item.description?.length || 0)) / 200)),
                        submittedAt: new Date(item.created_at)
                    });

                    fastify.log.info({
                        itemId,
                        discoveryId: discovery.id,
                        moderatorId
                    }, 'Content approved and published');

                } catch (creationError) {
                    fastify.log.error(creationError, 'Error creating discovery after approval');
                    // Don't fail the moderation decision if discovery creation fails
                }
            }

            // Update domain reputation
            await moderationService.updateDomainReputation(item.domain, decision === 'approve');

            fastify.log.info({
                itemId,
                decision,
                moderatorId
            }, 'Moderation decision made');

            return reply.send({
                message: `Content ${decision}d successfully`,
                decision,
                status: newStatus
            });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /moderation/queue/:itemId/decide');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Bulk moderation actions
    fastify.post<{ Body: any }>('/moderation/queue/bulk', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        try {
            const bulkSchema = z.object({
                itemIds: z.array(z.string().uuid()).min(1).max(50),
                decision: z.enum(['approve', 'reject']),
                moderatorNotes: z.string().max(500).optional(),
                moderatorId: z.string().uuid('Invalid moderator ID')
            });

            const validationResult = bulkSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { itemIds, decision, moderatorNotes, moderatorId } = validationResult.data;
            const newStatus = decision === 'approve' ? 'approved' : 'rejected';

            // Update all items
            const { data: updatedItems, error: updateError } = await supabase
                .from('moderation_queue')
                .update({
                    status: newStatus,
                    moderator_notes: moderatorNotes,
                    moderated_by: moderatorId,
                    moderated_at: new Date().toISOString()
                })
                .in('id', itemIds)
                .eq('status', 'pending') // Only update pending items
                .select();

            if (updateError) {
                fastify.log.error(updateError, 'Error bulk updating moderation items');
                return reply.status(500).send({
                    error: 'Failed to update moderation items'
                });
            }

            const updatedCount = updatedItems?.length || 0;

            // If approving, create discoveries for all approved items
            if (decision === 'approve' && updatedItems) {
                const approvedDiscoveries = [];

                for (const item of updatedItems) {
                    try {
                        const discovery = await repository.createDiscovery({
                            url: item.url,
                            title: item.title,
                            description: item.description || '',
                            domain: item.domain,
                            faviconUrl: `https://${item.domain}/favicon.ico`,
                            topics: [],
                            readTime: Math.max(1, Math.floor((item.title.length + (item.description?.length || 0)) / 200)),
                            submittedAt: new Date(item.created_at)
                        });

                        approvedDiscoveries.push(discovery.id);

                        // Update domain reputation
                        await moderationService.updateDomainReputation(item.domain, true);

                    } catch (creationError) {
                        fastify.log.error(creationError, `Error creating discovery for item ${item.id}`);
                    }
                }

                fastify.log.info({
                    approvedCount: updatedCount,
                    createdDiscoveries: approvedDiscoveries.length,
                    moderatorId
                }, 'Bulk content approval completed');
            }

            return reply.send({
                message: `${updatedCount} items ${decision}d successfully`,
                processedCount: updatedCount,
                requestedCount: itemIds.length
            });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /moderation/queue/bulk');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get moderation statistics
    fastify.get('/moderation/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get queue stats
            const { data: queueStats, error: queueError } = await supabase
                .from('moderation_queue')
                .select('status, created_at, issues');

            if (queueError) {
                fastify.log.error(queueError, 'Error fetching moderation queue stats');
                return reply.status(500).send({
                    error: 'Failed to fetch moderation statistics'
                });
            }

            // Get reports stats
            const { data: reportsStats, error: reportsError } = await supabase
                .from('content_reports')
                .select('status, reason');

            if (reportsError) {
                fastify.log.error(reportsError, 'Error fetching reports stats');
            }

            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Process queue stats
            const queueStatusCounts = {
                pending: 0,
                approved: 0,
                rejected: 0,
                reviewing: 0
            };

            const commonIssues: Record<string, number> = {};
            let recentQueueItems = 0;

            queueStats?.forEach(item => {
                queueStatusCounts[item.status as keyof typeof queueStatusCounts]++;

                if (new Date(item.created_at) > oneWeekAgo) {
                    recentQueueItems++;
                }

                // Count common issues
                item.issues?.forEach((issue: string) => {
                    commonIssues[issue] = (commonIssues[issue] || 0) + 1;
                });
            });

            // Process reports stats
            const reportStatusCounts = {
                pending: 0,
                resolved: 0,
                dismissed: 0
            };

            reportsStats?.forEach(report => {
                reportStatusCounts[report.status as keyof typeof reportStatusCounts]++;
            });

            return reply.send({
                queue: {
                    total: queueStats?.length || 0,
                    byStatus: queueStatusCounts,
                    recentItems: recentQueueItems,
                    commonIssues: Object.entries(commonIssues)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
                },
                reports: {
                    total: reportsStats?.length || 0,
                    byStatus: reportStatusCounts
                },
                workload: {
                    pendingQueue: queueStatusCounts.pending,
                    pendingReports: reportStatusCounts.pending,
                    totalPending: queueStatusCounts.pending + reportStatusCounts.pending
                }
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /moderation/stats');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
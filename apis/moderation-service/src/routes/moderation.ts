import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ModerationRepository } from '../lib/repository.js';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireModeratorRole } from '../middleware/auth.js';

const repository = new ModerationRepository();

/**
 * Helper function to convert Clerk user ID to database UUID
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

// ============================================================================
// Request Validation Schemas
// ============================================================================

const listModerationQueueSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
});

const reviewContentSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    moderatorNotes: z.string().optional(),
});

const bulkReviewSchema = z.object({
    queueIds: z.array(z.string().uuid()),
    moderatorNotes: z.string().optional(),
});

const listContentReportsSchema = z.object({
    status: z.enum(['pending', 'resolved', 'dismissed', 'all']).optional(),
    discoveryId: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
});

const resolveReportSchema = z.object({
    status: z.enum(['resolved', 'dismissed']),
    notes: z.string().optional(),
});

const reportContentSchema = z.object({
    contentId: z.string().uuid(),
    contentType: z.enum(['discovery', 'submission']).default('discovery'),
    reason: z.enum(['spam', 'inappropriate', 'broken', 'offensive', 'copyright', 'other']),
    description: z.string().optional(),
});

const updateDomainReputationSchema = z.object({
    score: z.number().min(0).max(1),
    notes: z.string().optional(),
});

const listDomainReputationsSchema = z.object({
    search: z.string().optional(),
    blacklistedOnly: z.coerce.boolean().optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
    maxScore: z.coerce.number().min(0).max(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Moderation Routes
// ============================================================================

export async function moderationRoutes(fastify: FastifyInstance) {
    // ========================================================================
    // MODERATION QUEUE ROUTES
    // ========================================================================

    // List moderation queue items
    fastify.get(
        '/moderation/queue',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const params = listModerationQueueSchema.parse(request.query);

            try {
                const result = await repository.listModerationQueue(params);
                return reply.code(200).send(result);
            } catch (error) {
                request.log.error({ error }, 'Failed to list moderation queue');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch moderation queue',
                });
            }
        }
    );

    // Get specific moderation queue item
    fastify.get(
        '/moderation/queue/:queueId',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { queueId } = request.params as { queueId: string };

            try {
                const item = await repository.getModerationQueueItem(queueId);

                if (!item) {
                    return reply.code(404).send({
                        error: 'Not Found',
                        message: 'Moderation queue item not found',
                    });
                }

                return reply.code(200).send({ item });
            } catch (error) {
                request.log.error({ error, queueId }, 'Failed to get moderation queue item');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch moderation queue item',
                });
            }
        }
    );

    // Review content (approve or reject)
    fastify.post(
        '/moderation/queue/:queueId/review',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { queueId } = request.params as { queueId: string };
            const userId = (request as any).userId;
            const body = reviewContentSchema.parse(request.body);

            try {
                const updated = await repository.reviewContent(
                    queueId,
                    body.status,
                    userId,
                    body.moderatorNotes
                );

                return reply.code(200).send({
                    success: true,
                    item: updated,
                });
            } catch (error) {
                request.log.error({ error, queueId }, 'Failed to review content');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to review content',
                });
            }
        }
    );

    // Bulk approve content
    fastify.post(
        '/moderation/queue/bulk-approve',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const userId = (request as any).userId;
            const body = bulkReviewSchema.parse(request.body);

            try {
                const results = await repository.bulkReviewContent(
                    body.queueIds,
                    'approved',
                    userId,
                    body.moderatorNotes
                );

                return reply.code(200).send({
                    success: true,
                    ...results,
                });
            } catch (error) {
                request.log.error({ error }, 'Failed to bulk approve content');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to bulk approve content',
                });
            }
        }
    );

    // Bulk reject content
    fastify.post(
        '/moderation/queue/bulk-reject',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const userId = (request as any).userId;
            const body = bulkReviewSchema.parse(request.body);

            try {
                const results = await repository.bulkReviewContent(
                    body.queueIds,
                    'rejected',
                    userId,
                    body.moderatorNotes
                );

                return reply.code(200).send({
                    success: true,
                    ...results,
                });
            } catch (error) {
                request.log.error({ error }, 'Failed to bulk reject content');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to bulk reject content',
                });
            }
        }
    );

    // Get moderation analytics
    fastify.get(
        '/moderation/analytics',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            try {
                const analytics = await repository.getModerationAnalytics();
                return reply.code(200).send({ analytics });
            } catch (error) {
                request.log.error({ error }, 'Failed to get moderation analytics');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch moderation analytics',
                });
            }
        }
    );

    // ========================================================================
    // CONTENT REPORTS ROUTES
    // ========================================================================

    // List content reports
    fastify.get(
        '/moderation/reports',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const params = listContentReportsSchema.parse(request.query);

            try {
                const result = await repository.listContentReports(params);
                return reply.code(200).send(result);
            } catch (error) {
                request.log.error({ error }, 'Failed to list content reports');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch content reports',
                });
            }
        }
    );

    // Get specific report
    fastify.get(
        '/moderation/reports/:reportId',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { reportId } = request.params as { reportId: string };

            try {
                const report = await repository.getContentReport(reportId);

                if (!report) {
                    return reply.code(404).send({
                        error: 'Not Found',
                        message: 'Content report not found',
                    });
                }

                return reply.code(200).send({ report });
            } catch (error) {
                request.log.error({ error, reportId }, 'Failed to get content report');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch content report',
                });
            }
        }
    );

    // Resolve content report
    fastify.post(
        '/moderation/reports/:reportId/resolve',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { reportId } = request.params as { reportId: string };
            const userId = (request as any).userId;
            const body = resolveReportSchema.parse(request.body);

            try {
                const updated = await repository.resolveContentReport(
                    reportId,
                    body.status,
                    userId,
                    body.notes
                );

                return reply.code(200).send({
                    success: true,
                    report: updated,
                });
            } catch (error) {
                request.log.error({ error, reportId }, 'Failed to resolve content report');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to resolve content report',
                });
            }
        }
    );

    // Report content (user-facing endpoint)
    fastify.post(
        '/moderation/report',
        { preHandler: requireAuth },
        async (request, reply) => {
            const clerkUserId = (request as any).userId;
            const body = reportContentSchema.parse(request.body);

            try {
                // Convert Clerk user ID to database UUID
                let dbUserId = clerkUserId;
                if (clerkUserId.startsWith('user_')) {
                    const convertedId = await getDatabaseUserId(clerkUserId);
                    if (!convertedId) {
                        return reply.code(404).send({
                            error: 'Not Found',
                            message: 'User not found in database',
                        });
                    }
                    dbUserId = convertedId;
                }

                const report = await repository.reportContent(
                    body.contentId,
                    body.contentType,
                    dbUserId,
                    body.reason,
                    body.description
                );

                return reply.code(201).send({
                    success: true,
                    report,
                });
            } catch (error: any) {
                if (error.code === '23505') { // Unique constraint violation
                    return reply.code(409).send({
                        error: 'Conflict',
                        message: 'You have already reported this content',
                    });
                }

                request.log.error({ error }, 'Failed to create content report');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to submit report',
                });
            }
        }
    );

    // ========================================================================
    // DOMAIN REPUTATION ROUTES
    // ========================================================================

    // List domain reputations
    fastify.get(
        '/moderation/domains',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const params = listDomainReputationsSchema.parse(request.query);

            try {
                const result = await repository.listDomainReputations(params);
                return reply.code(200).send(result);
            } catch (error) {
                request.log.error({ error }, 'Failed to list domain reputations');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch domain reputations',
                });
            }
        }
    );

    // Get specific domain reputation
    fastify.get(
        '/moderation/domains/:domain',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { domain } = request.params as { domain: string };

            try {
                const reputation = await repository.getDomainReputation(domain);

                if (!reputation) {
                    return reply.code(404).send({
                        error: 'Not Found',
                        message: 'Domain reputation not found',
                    });
                }

                return reply.code(200).send({ reputation });
            } catch (error) {
                request.log.error({ error, domain }, 'Failed to get domain reputation');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to fetch domain reputation',
                });
            }
        }
    );

    // Update domain reputation
    fastify.patch(
        '/moderation/domains/:domain',
        { preHandler: requireModeratorRole },
        async (request, reply) => {
            const { domain } = request.params as { domain: string };
            const body = updateDomainReputationSchema.parse(request.body);

            try {
                const updated = await repository.updateDomainReputation(
                    domain,
                    body.score,
                    body.notes
                );

                return reply.code(200).send({
                    success: true,
                    reputation: updated,
                });
            } catch (error) {
                request.log.error({ error, domain }, 'Failed to update domain reputation');
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: 'Failed to update domain reputation',
                });
            }
        }
    );
}

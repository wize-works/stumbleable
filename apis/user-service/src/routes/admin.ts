import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserRepository } from '../lib/repository';

const repository = new UserRepository();

// Validation schemas
const listDeletionRequestsSchema = z.object({
    status: z.enum(['pending', 'cancelled', 'completed', 'all']).optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
});

const adminCancelDeletionSchema = z.object({
    reason: z.string().min(1).max(500),
});

const extendGracePeriodSchema = z.object({
    additionalDays: z.number().min(1).max(90),
    reason: z.string().min(1).max(500),
});

const addNoteSchema = z.object({
    note: z.string().min(1).max(1000),
});

/**
 * Admin routes for managing deletion requests
 * All routes require admin or moderator role
 */
export const adminRoutes: FastifyPluginAsync = async (fastify) => {

    // Middleware to check admin/moderator role
    const requireAdminRole = async (request: FastifyRequest, reply: FastifyReply) => {
        const auth = getAuth(request as any);
        if (!auth.isAuthenticated || !auth.userId) {
            return reply.status(401).send({
                error: 'Authentication required'
            });
        }

        const hasAccess = await repository.checkUserRole(auth.userId, 'moderator');
        if (!hasAccess) {
            return reply.status(403).send({
                error: 'Access denied. Admin or moderator role required.'
            });
        }
    };

    // List deletion requests with filters
    fastify.get<{
        Querystring: {
            status?: 'pending' | 'cancelled' | 'completed' | 'all';
            search?: string;
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        }
    }>('/admin/deletion-requests', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest<{
        Querystring: {
            status?: 'pending' | 'cancelled' | 'completed' | 'all';
            search?: string;
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        }
    }>, reply: FastifyReply) => {
        try {
            const { status, search, startDate, endDate, limit = 20, offset = 0 } = request.query;

            const result = await repository.listDeletionRequests({
                status: status === 'all' ? undefined : status,
                search,
                startDate,
                endDate,
                limit,
                offset,
            });

            return reply.send({
                requests: result.requests,
                total: result.total,
                limit,
                offset,
            });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /admin/deletion-requests');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get detailed deletion request
    fastify.get<{
        Params: { requestId: string }
    }>('/admin/deletion-requests/:requestId', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest<{
        Params: { requestId: string }
    }>, reply: FastifyReply) => {
        try {
            const { requestId } = request.params;

            const deletionRequest = await repository.getDeletionRequestById(requestId);
            if (!deletionRequest) {
                return reply.status(404).send({
                    error: 'Deletion request not found'
                });
            }

            return reply.send({ request: deletionRequest });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /admin/deletion-requests/:requestId');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Admin cancel deletion request
    fastify.post<{
        Params: { requestId: string };
        Body: { reason: string };
    }>('/admin/deletion-requests/:requestId/cancel', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest<{
        Params: { requestId: string };
        Body: { reason: string };
    }>, reply: FastifyReply) => {
        try {
            const auth = getAuth(request as any);
            const { requestId } = request.params;

            const validationResult = adminCancelDeletionSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { reason } = validationResult.data;

            const result = await repository.adminCancelDeletion(
                requestId,
                auth.userId!,
                reason
            );

            if (!result) {
                return reply.status(404).send({
                    error: 'Deletion request not found or already processed'
                });
            }

            return reply.send({
                message: 'Deletion request cancelled successfully',
                request: result
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /admin/deletion-requests/:requestId/cancel');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Extend grace period
    fastify.post<{
        Params: { requestId: string };
        Body: { additionalDays: number; reason: string };
    }>('/admin/deletion-requests/:requestId/extend', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest<{
        Params: { requestId: string };
        Body: { additionalDays: number; reason: string };
    }>, reply: FastifyReply) => {
        try {
            const auth = getAuth(request as any);
            const { requestId } = request.params;

            const validationResult = extendGracePeriodSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { additionalDays, reason } = validationResult.data;

            const result = await repository.extendGracePeriod(
                requestId,
                additionalDays,
                auth.userId!,
                reason
            );

            if (!result) {
                return reply.status(404).send({
                    error: 'Deletion request not found or cannot be extended'
                });
            }

            return reply.send({
                message: `Grace period extended by ${additionalDays} days`,
                request: result
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /admin/deletion-requests/:requestId/extend');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Add admin note to deletion request
    fastify.post<{
        Params: { requestId: string };
        Body: { note: string };
    }>('/admin/deletion-requests/:requestId/notes', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest<{
        Params: { requestId: string };
        Body: { note: string };
    }>, reply: FastifyReply) => {
        try {
            const auth = getAuth(request as any);
            const { requestId } = request.params;

            const validationResult = addNoteSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { note } = validationResult.data;

            const result = await repository.addDeletionRequestNote(
                requestId,
                auth.userId!,
                note
            );

            if (!result) {
                return reply.status(404).send({
                    error: 'Deletion request not found'
                });
            }

            return reply.send({
                message: 'Note added successfully',
                note: result
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /admin/deletion-requests/:requestId/notes');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get deletion request analytics
    fastify.get('/admin/deletion-requests/analytics/summary', {
        preHandler: requireAdminRole
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const analytics = await repository.getDeletionAnalytics();

            return reply.send({ analytics });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /admin/deletion-requests/analytics/summary');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};

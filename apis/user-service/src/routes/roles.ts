import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserRepository } from '../lib/repository';
import { UpdateRoleRequest } from '../types';

const repository = new UserRepository();

// Validation schemas
const updateRoleSchema = z.object({
    role: z.enum(['user', 'moderator', 'admin'])
});

/**
 * Role management routes
 */
export const roleRoutes: FastifyPluginAsync = async (fastify) => {

    /**
     * Check if user has required role
     * GET /roles/check?required=moderator
     */
    fastify.get<{ Querystring: { required?: string } }>(
        '/roles/check',
        async (request: FastifyRequest<{ Querystring: { required?: string } }>, reply: FastifyReply) => {
            try {
                // Check authentication
                const auth = getAuth(request as any);
                if (!auth.isAuthenticated || !auth.userId) {
                    return reply.status(401).send({
                        error: 'User not authenticated'
                    });
                }

                const clerkUserId = auth.userId;
                const requiredRole = request.query.required as 'user' | 'moderator' | 'admin' || 'user';

                // Validate required role
                if (!['user', 'moderator', 'admin'].includes(requiredRole)) {
                    return reply.status(400).send({
                        error: 'Invalid role. Must be one of: user, moderator, admin'
                    });
                }

                const userRole = await repository.getUserRole(clerkUserId);
                if (!userRole) {
                    return reply.status(404).send({
                        error: 'User not found'
                    });
                }

                const hasAccess = await repository.checkUserRole(clerkUserId, requiredRole);

                return reply.send({
                    userId: clerkUserId,
                    role: userRole,
                    hasAccess,
                    requiredRole
                });
            } catch (error) {
                fastify.log.error(error, 'Error in GET /roles/check');
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );

    /**
     * Get current user's role
     * GET /roles/me
     */
    fastify.get('/roles/me', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated || !auth.userId) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const clerkUserId = auth.userId;
            const role = await repository.getUserRole(clerkUserId);

            if (!role) {
                return reply.status(404).send({
                    error: 'User not found'
                });
            }

            return reply.send({
                userId: clerkUserId,
                role
            });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /roles/me');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    /**
     * Update user role (admin only)
     * PUT /roles/:userId
     */
    fastify.put<{
        Params: { userId: string },
        Body: UpdateRoleRequest
    }>(
        '/roles/:userId',
        async (request: FastifyRequest<{
            Params: { userId: string },
            Body: UpdateRoleRequest
        }>, reply: FastifyReply) => {
            try {
                // Check authentication
                const auth = getAuth(request as any);
                if (!auth.isAuthenticated || !auth.userId) {
                    return reply.status(401).send({
                        error: 'User not authenticated'
                    });
                }

                // Check if current user is admin
                const isAdmin = await repository.checkUserRole(auth.userId, 'admin');
                if (!isAdmin) {
                    return reply.status(403).send({
                        error: 'Forbidden: Only admins can update user roles'
                    });
                }

                const { userId } = request.params;
                const validationResult = updateRoleSchema.safeParse(request.body);

                if (!validationResult.success) {
                    return reply.status(400).send({
                        error: 'Invalid request body',
                        details: validationResult.error.errors
                    });
                }

                const { role } = validationResult.data;

                // Update the role
                const updated = await repository.updateUserRole(userId, role);
                if (!updated) {
                    return reply.status(404).send({
                        error: 'User not found'
                    });
                }

                return reply.send({
                    success: true,
                    userId,
                    newRole: role
                });
            } catch (error) {
                fastify.log.error(error, 'Error in PUT /roles/:userId');
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );
};

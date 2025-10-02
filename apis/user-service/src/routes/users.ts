import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserRepository } from '../lib/repository';
import { CreateUserRequest, UpdatePreferencesRequest } from '../types';

const repository = new UserRepository();

// Validation schemas
const createUserSchema = z.object({
    userId: z.string().min(1),
    preferences: z.object({
        preferredTopics: z.array(z.string()).min(1).max(20).optional(),
        wildness: z.number().min(0).max(100).optional()
    }).optional()
});

const updatePreferencesSchema = z.object({
    preferredTopics: z.array(z.string()).min(1).max(20).optional(),
    wildness: z.number().min(0).max(100).optional()
}).refine((data) => data.preferredTopics || data.wildness !== undefined, {
    message: "At least one field (preferredTopics or wildness) must be provided"
});

/**
 * User management routes
 */
export const userRoutes: FastifyPluginAsync = async (fastify) => {

    // Get user profile (does NOT auto-create - user must exist)
    fastify.get<{ Params: { userId: string } }>('/users/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Only get existing user - do not auto-create
            const user = await repository.getUserById(userId);
            if (!user) {
                return reply.status(404).send({
                    error: 'User not found. Please complete signup first.'
                });
            }

            return reply.send({ user });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /users/:userId');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });



    // Create user after Clerk authentication (called by frontend after successful Clerk signup)
    fastify.post<{ Body: CreateUserRequest }>('/users', async (request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply) => {
        try {
            const validationResult = createUserSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { userId, preferences } = validationResult.data;

            // Check if user already exists
            const existingUser = await repository.getUserById(userId);
            if (existingUser) {
                return reply.status(409).send({
                    error: 'User already exists',
                    user: existingUser
                });
            }

            // Validate topics if provided
            if (preferences?.preferredTopics) {
                const validation = await repository.validateTopics(preferences.preferredTopics);
                if (validation.invalid.length > 0) {
                    return reply.status(400).send({
                        error: 'Invalid topic IDs',
                        invalidTopics: validation.invalid
                    });
                }
            }

            const user = await repository.createUser(userId, preferences);
            return reply.status(201).send({ user });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /users');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Update user preferences
    fastify.put<{
        Params: { userId: string },
        Body: UpdatePreferencesRequest
    }>('/users/:userId/preferences', async (request: FastifyRequest<{
        Params: { userId: string },
        Body: UpdatePreferencesRequest
    }>, reply: FastifyReply) => {
        try {
            const { userId } = request.params;

            const validationResult = updatePreferencesSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const updates = validationResult.data;

            // Validate topics if provided
            if (updates.preferredTopics) {
                const validation = await repository.validateTopics(updates.preferredTopics);
                if (validation.invalid.length > 0) {
                    return reply.status(400).send({
                        error: 'Invalid topic IDs',
                        invalidTopics: validation.invalid
                    });
                }
            }

            const updatedUser = await repository.updateUserPreferences(userId, updates);
            if (!updatedUser) {
                return reply.status(404).send({
                    error: 'User not found'
                });
            }

            return reply.send({ user: updatedUser });
        } catch (error) {
            fastify.log.error(error, 'Error in PUT /users/:userId/preferences');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Accept community guidelines
    fastify.put<{ Params: { userId: string } }>('/users/:userId/accept-guidelines', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Update guidelines acceptance timestamp
            const updatedUser = await repository.acceptGuidelines(userId);
            if (!updatedUser) {
                return reply.status(404).send({
                    error: 'User not found'
                });
            }

            return reply.send({ user: updatedUser });
        } catch (error) {
            fastify.log.error(error, 'Error in PUT /users/:userId/accept-guidelines');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Request account deletion (with 30-day grace period)
    fastify.post<{ Params: { userId: string } }>('/users/:userId/deletion-request', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Check if user exists
            const user = await repository.getUserById(userId);
            if (!user) {
                return reply.status(404).send({
                    error: 'User not found'
                });
            }

            // Create deletion request
            const deletionRequest = await repository.createDeletionRequest(userId, user.email || '');

            // Soft delete the user (deactivate account)
            await repository.softDeleteUser(userId, deletionRequest.id);

            return reply.status(201).send({
                deletionRequest: {
                    id: deletionRequest.id,
                    requestedAt: deletionRequest.requestedAt,
                    scheduledDeletionAt: deletionRequest.scheduledDeletionAt,
                    status: deletionRequest.status
                },
                message: 'Account deletion scheduled. You have 30 days to cancel this request.'
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /users/:userId/deletion-request');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Cancel deletion request (recover account during grace period)
    fastify.post<{ Params: { userId: string } }>('/users/:userId/cancel-deletion', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Cancel the deletion request and restore account
            const result = await repository.cancelDeletionRequest(userId);
            if (!result) {
                return reply.status(404).send({
                    error: 'No active deletion request found for this user'
                });
            }

            return reply.send({
                message: 'Account deletion cancelled successfully. Your account has been restored.',
                user: result
            });
        } catch (error) {
            fastify.log.error(error, 'Error in POST /users/:userId/cancel-deletion');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get deletion request status
    fastify.get<{ Params: { userId: string } }>('/users/:userId/deletion-request', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }

            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            const deletionRequest = await repository.getDeletionRequest(userId);
            if (!deletionRequest) {
                return reply.status(404).send({
                    error: 'No deletion request found for this user'
                });
            }

            return reply.send({ deletionRequest });
        } catch (error) {
            fastify.log.error(error, 'Error in GET /users/:userId/deletion-request');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Delete user (hard delete - admin only or after grace period)
    fastify.delete<{ Params: { userId: string } }>('/users/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            const { userId } = request.params;

            const deleted = await repository.deleteUser(userId);
            if (!deleted) {
                return reply.status(404).send({
                    error: 'User not found'
                });
            }

            return reply.status(204).send();
        } catch (error) {
            fastify.log.error(error, 'Error in DELETE /users/:userId');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
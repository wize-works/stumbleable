import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authenticateAndAuthorize, authenticateUser } from '../lib/auth';
import { UserRepository } from '../lib/repository';
import { CreateUserRequest, UpdatePreferencesRequest } from '../types';

const repository = new UserRepository();

// Validation schemas
const createUserSchema = z.object({
    userId: z.string().min(1),
    userData: z.object({
        email: z.string().email().optional(),
        fullName: z.string().optional(),
        imageUrl: z.string().url().optional(),
        preferredTopics: z.array(z.string()).min(1).max(20).optional(),
        wildness: z.number().min(0).max(100).optional()
    }).optional(),
    // Legacy support - can remove later
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
    fastify.get('/users/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for get user');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
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

            const { userId, userData, preferences } = validationResult.data;

            // Authenticate the user to ensure they can create this user account
            const authResult = authenticateUser(request);

            // Log authentication details for debugging
            fastify.log.info({
                isAuthenticated: authResult.isAuthenticated,
                userId: authResult.userId,
                requestedUserId: userId,
                hasUserData: !!userData,
                hasPreferences: !!preferences,
                error: authResult.error
            }, 'Authentication check for create user');

            if (!authResult.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated',
                    details: authResult.error || 'Invalid or missing authentication token'
                });
            }

            // Authorization check: user can only create their own account
            if (authResult.userId !== userId) {
                return reply.status(403).send({
                    error: 'Forbidden: Cannot create account for another user'
                });
            }

            // Check if user already exists
            const existingUser = await repository.getUserById(userId);
            if (existingUser) {
                return reply.status(409).send({
                    error: 'User already exists',
                    user: existingUser
                });
            }

            // Merge userData and preferences (userData takes precedence)
            const finalUserData = {
                email: userData?.email,
                fullName: userData?.fullName,
                imageUrl: userData?.imageUrl,
                preferredTopics: userData?.preferredTopics || preferences?.preferredTopics || ['technology', 'culture', 'science'],
                wildness: userData?.wildness ?? preferences?.wildness ?? 35
            };

            // Validate topics if provided
            if (finalUserData.preferredTopics) {
                const validation = await repository.validateTopics(finalUserData.preferredTopics);
                if (validation.invalid.length > 0) {
                    return reply.status(400).send({
                        error: 'Invalid topic IDs',
                        invalidTopics: validation.invalid
                    });
                }
            }

            const user = await repository.createUser(userId, finalUserData);
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

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for update preferences');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
                });
            }

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
            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for accept-guidelines');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
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
            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for deletion request');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
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
            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for cancel deletion');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
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
            const { userId } = request.params;

            if (!userId) {
                return reply.status(400).send({
                    error: 'User ID is required'
                });
            }

            // Use robust authentication and authorization
            const authCheck = authenticateAndAuthorize(request, userId);

            // Log authentication details for debugging
            fastify.log.info({
                isValid: authCheck.isValid,
                isAuthenticated: authCheck.authResult.isAuthenticated,
                userId: authCheck.authResult.userId,
                requestedUserId: userId,
                error: authCheck.error || authCheck.authResult.error
            }, 'Authentication check for get deletion request status');

            if (!authCheck.isValid) {
                const statusCode = authCheck.authResult.isAuthenticated ? 403 : 401;
                return reply.status(statusCode).send({
                    error: authCheck.error || 'Authentication failed',
                    details: authCheck.authResult.error
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
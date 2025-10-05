import { getAuth } from '@clerk/fastify';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ModerationRepository } from '../lib/repository.js';

const repository = new ModerationRepository();

/**
 * Middleware to require moderator or admin role
 * Uses Clerk JWT for authentication and validates role via direct database query
 */
export async function requireModeratorRole(
    request: FastifyRequest,
    reply: FastifyReply
) {
    // Use Clerk's getAuth to extract user ID from JWT
    const auth = getAuth(request);

    // Log auth details for debugging
    request.log.debug({
        hasAuth: !!auth,
        hasUserId: !!auth?.userId,
        hasAuthHeader: !!request.headers.authorization,
        authHeader: request.headers.authorization ? 'Bearer ...' : 'Missing'
    }, 'Auth check');

    if (!auth || !auth.userId) {
        request.log.warn({
            headers: {
                authorization: request.headers.authorization ? 'Present (Bearer ...)' : 'Missing',
                host: request.headers.host,
                origin: request.headers.origin
            },
            path: request.url,
            method: request.method
        }, 'Authentication failed - no auth or userId');

        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    const userId = auth.userId;

    try {
        // Check role directly via database (same pattern as user-service)
        const hasAccess = await repository.checkUserRole(userId, 'moderator');

        if (!hasAccess) {
            const userRole = await repository.getUserRole(userId);
            request.log.warn({ userId, role: userRole }, 'User does not have moderator access');
            return reply.code(403).send({
                error: 'Forbidden',
                message: 'Moderator or admin role required',
            });
        }

        const userRole = await repository.getUserRole(userId);
        request.log.info({ userId, role: userRole }, 'Role check passed');

        // Attach userId to request for use in handlers
        (request as any).userId = userId;

    } catch (error) {
        request.log.error({
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
            userId
        }, 'Failed to check user role');
        return reply.code(500).send({
            error: 'Internal Server Error',
            message: 'Failed to verify user permissions',
        });
    }
}

/**
 * Middleware to require authentication (any authenticated user)
 */
export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const auth = getAuth(request);

    if (!auth || !auth.userId) {
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    // Attach userId to request for use in handlers
    (request as any).userId = auth.userId;
}

import { getAuth } from '@clerk/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Extended request type with authentication data
 */
export interface AuthenticatedRequest extends FastifyRequest {
    auth?: {
        userId: string;
        sessionId?: string;
        orgId?: string;
        orgRole?: string;
    };
    user?: {
        id: string;
        clerk_user_id: string;
        role: string;
    };
}

/**
 * Middleware to require authentication
 * Rejects requests without valid Clerk authentication
 */
export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    const auth = getAuth(request);

    if (!auth || !auth.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required to access this endpoint'
        });
    }

    // Attach auth to request for downstream use
    request.auth = auth;
}

/**
 * Middleware for optional authentication
 * Extracts auth if present but doesn't reject if missing
 */
export async function optionalAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    const auth = getAuth(request);

    if (auth && auth.userId) {
        request.auth = auth;
    }
}

/**
 * Helper to check if the authenticated user owns a resource
 */
export function isResourceOwner(request: AuthenticatedRequest, resourceUserId: string): boolean {
    if (!request.auth || !request.auth.userId) {
        return false;
    }

    return request.auth.userId === resourceUserId;
}

/**
 * Middleware factory for resource ownership validation
 * Creates middleware that checks if user owns the resource
 */
export function requireResourceOwnership(getUserIdFromParams: (request: AuthenticatedRequest) => string) {
    return async function (request: AuthenticatedRequest, reply: FastifyReply) {
        // First ensure user is authenticated
        await requireAuth(request, reply);

        // Get the resource owner's user ID from request params
        const resourceUserId = getUserIdFromParams(request);

        // Check ownership
        if (!isResourceOwner(request, resourceUserId)) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource'
            });
        }
    };
}

/**
 * Helper to check if user has a specific role
 * Currently uses Clerk organizations for role-based access
 */
export function hasRole(request: AuthenticatedRequest, role: string): boolean {
    if (!request.auth || !request.auth.orgRole) {
        return false;
    }

    return request.auth.orgRole === role;
}

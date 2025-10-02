/**
 * Authentication middleware for user-service using Clerk
 * Uses @clerk/fastify for JWT verification and user authentication
 */

import { getAuth } from '@clerk/fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Extended request interface with Clerk auth data
 */
export interface AuthenticatedRequest extends FastifyRequest {
    auth?: {
        userId: string | null;
        sessionId: string | null;
        getToken: (options?: { template?: string }) => Promise<string | null>;
    };
}

/**
 * Middleware to verify Clerk JWT and require authentication
 * Extracts user ID from Clerk session and attaches to request
 */
export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    const auth = getAuth(request);

    if (!auth || !auth.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required. Please provide a valid Clerk session token.'
        });
    }

    // Attach auth data to request for use in route handlers
    request.auth = auth;
}

/**
 * Optional auth middleware - extracts auth if present but doesn't require it
 */
export async function optionalAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    const auth = getAuth(request);

    if (auth && auth.userId) {
        request.auth = auth;
    }
    // Don't block request if not authenticated
}

/**
 * Helper to check if the authenticated user is the owner of the resource
 * @param request - The authenticated request
 * @param resourceUserId - The user ID associated with the resource
 * @returns true if the authenticated user owns the resource
 */
export function isResourceOwner(request: AuthenticatedRequest, resourceUserId: string): boolean {
    return request.auth?.userId === resourceUserId;
}

/**
 * Helper to check if the authenticated user has a specific role
 * @param request - The authenticated request
 * @param role - The required role
 * @returns true if the user has the role
 */
export function hasRole(request: AuthenticatedRequest, role: string): boolean {
    // Clerk roles would need to be configured in Clerk dashboard
    // and accessed via request.auth or additional metadata
    // This is a placeholder for future role-based access control
    return false;
}

/**
 * Middleware factory to require resource ownership
 * @param getUserIdFromParams - Function to extract user ID from route params
 */
export function requireResourceOwnership(getUserIdFromParams: (request: FastifyRequest) => string) {
    return async function (request: AuthenticatedRequest, reply: FastifyReply) {
        // First ensure user is authenticated
        await requireAuth(request, reply);

        const resourceUserId = getUserIdFromParams(request);

        if (!isResourceOwner(request, resourceUserId)) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource.'
            });
        }
    };
}
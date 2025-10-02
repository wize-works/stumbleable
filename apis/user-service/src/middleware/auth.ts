import { clerkClient } from '@clerk/clerk-sdk-node';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
    clerkUserId?: string;
}

/**
 * Middleware to verify Clerk JWT and extract user ID
 */
export async function verifyClerkAuth(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Verify the JWT token with Clerk
            const sessionClaims = await clerkClient.verifyToken(token);

            if (!sessionClaims || !sessionClaims.sub) {
                return reply.status(401).send({
                    error: 'Invalid token'
                });
            }

            // Add the user ID to the request object
            request.clerkUserId = sessionClaims.sub;

        } catch (verifyError) {
            console.error('Token verification error:', verifyError);
            return reply.status(401).send({
                error: 'Token verification failed'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        return reply.status(500).send({
            error: 'Authentication error'
        });
    }
}

/**
 * Helper to check if the requested user ID matches the authenticated user
 */
export function requireOwnUser(request: AuthenticatedRequest, requestedUserId: string): boolean {
    return request.clerkUserId === requestedUserId;
}
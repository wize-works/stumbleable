import { getAuth } from '@clerk/fastify';
import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../lib/supabase';

/**
 * Authentication Middleware
 * Verifies Clerk authentication for admin-only endpoints
 */

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Get auth from Clerk
        const auth = getAuth(request as any);

        if (!auth.isAuthenticated || !auth.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        // Attach userId to request for downstream handlers
        // @ts-ignore
        request.userId = auth.userId;
    } catch (error) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid authentication token',
        });
    }
}

/**
 * Admin Role Check Middleware
 * Verifies user has admin role in database
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
        // First check if user is authenticated
        const auth = getAuth(request as any);

        if (!auth.isAuthenticated || !auth.userId) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        const clerkUserId = auth.userId;

        // Check user role in database (not in Clerk session claims)
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (error || !user) {
            request.log.error({ error, clerkUserId }, 'Failed to fetch user role from database');
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'User not found or invalid role',
            });
        }

        // Check if user has admin role
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'Admin access required',
            });
        }

        // Attach userId to request for downstream handlers
        // @ts-ignore
        request.userId = clerkUserId;
    } catch (error) {
        request.log.error({ error }, 'Error in requireAdmin middleware');
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'Admin access required',
        });
    }
}

/**
 * Service-to-Service Authentication
 * Allows internal service calls without user authentication
 * Validates requests from known internal services
 */
export async function allowServiceToService(request: FastifyRequest, reply: FastifyReply) {
    // Check if request has a valid service token or comes from internal network
    const serviceToken = request.headers['x-service-token'] as string;
    const expectedToken = process.env.SERVICE_TOKEN;

    // If no service token configured, allow all internal requests (development mode)
    if (!expectedToken) {
        request.log.warn('SERVICE_TOKEN not configured - allowing all service-to-service calls');
        return;
    }

    // Validate service token
    if (serviceToken !== expectedToken) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid service token',
        });
    }
}

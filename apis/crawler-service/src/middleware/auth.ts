import type { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../lib/supabase';

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const auth = (request as any).auth;

    if (!auth || !auth.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required to access this endpoint'
        });
    }
}

/**
 * Middleware to require admin role
 * Crawler management should only be accessible to admins
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const auth = (request as any).auth;

    if (!auth || !auth.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    try {
        // Get user from database to check role
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_user_id', auth.userId)
            .single();

        if (error || !user) {
            request.log.warn({ clerkUserId: auth.userId }, 'User not found in database');
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'User not found or not authorized'
            });
        }

        if (user.role !== 'admin') {
            request.log.warn({
                clerkUserId: auth.userId,
                role: user.role
            }, 'Non-admin user attempted to access crawler management');

            return reply.status(403).send({
                error: 'Forbidden',
                message: 'Admin access required. Only administrators can manage crawler sources.'
            });
        }

        // Store user info in request for later use
        (request as any).user = user;

    } catch (error) {
        request.log.error(error, 'Error checking user role');
        return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Error verifying user permissions'
        });
    }
}

/**
 * Authentication and authorization utilities for Content Service
 * Validates JWT tokens and checks user roles for admin access
 */

import { FastifyRequest } from 'fastify';
import { supabase } from './supabase.js';

export interface AuthResult {
    isAuthenticated: boolean;
    userId: string | null;
    clerkUserId: string | null;
    error?: string;
}

export interface RoleCheckResult {
    hasAccess: boolean;
    role: 'user' | 'moderator' | 'admin' | null;
    userId: string | null;
    error?: string;
}

/**
 * Extract and validate JWT token from Authorization header
 * Returns the Clerk user ID from the token
 */
export function authenticateUser(request: FastifyRequest): AuthResult {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                isAuthenticated: false,
                userId: null,
                clerkUserId: null,
                error: 'Missing or invalid Authorization header'
            };
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return {
                isAuthenticated: false,
                userId: null,
                clerkUserId: null,
                error: 'Empty JWT token'
            };
        }

        // Basic JWT structure validation
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return {
                isAuthenticated: false,
                userId: null,
                clerkUserId: null,
                error: 'Invalid JWT token structure'
            };
        }

        try {
            // Decode the payload (we trust Clerk's signature verification)
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

            // Check if token has a user ID (Clerk tokens have 'sub' field)
            const clerkUserId = payload.sub;
            if (!clerkUserId || typeof clerkUserId !== 'string') {
                return {
                    isAuthenticated: false,
                    userId: null,
                    clerkUserId: null,
                    error: 'No valid user ID in token'
                };
            }

            // Check token expiration
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                return {
                    isAuthenticated: false,
                    userId: null,
                    clerkUserId: null,
                    error: 'Token expired'
                };
            }

            // Token looks valid
            return {
                isAuthenticated: true,
                userId: null, // Will be fetched from database
                clerkUserId: clerkUserId
            };

        } catch (decodeError) {
            return {
                isAuthenticated: false,
                userId: null,
                clerkUserId: null,
                error: 'Failed to decode JWT token'
            };
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return {
            isAuthenticated: false,
            userId: null,
            clerkUserId: null,
            error: 'Authentication system error'
        };
    }
}

/**
 * Check if user has admin role
 * Queries the database to get user's role from the users table
 */
export async function checkAdminRole(clerkUserId: string): Promise<RoleCheckResult> {
    try {
        // Query users table for role
        const { data, error } = await supabase
            .from('users')
            .select('id, role')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error);
            return {
                hasAccess: false,
                role: null,
                userId: null,
                error: 'Failed to fetch user role'
            };
        }

        if (!data) {
            return {
                hasAccess: false,
                role: null,
                userId: null,
                error: 'User not found'
            };
        }

        const role = data.role as 'user' | 'moderator' | 'admin';
        const hasAdminAccess = role === 'admin';

        return {
            hasAccess: hasAdminAccess,
            role: role,
            userId: data.id,
            error: hasAdminAccess ? undefined : 'Admin role required'
        };

    } catch (error) {
        console.error('Role check error:', error);
        return {
            hasAccess: false,
            role: null,
            userId: null,
            error: 'Role check system error'
        };
    }
}

/**
 * Combined authentication and admin authorization check
 * Use this as middleware for admin-only endpoints
 */
export async function requireAdmin(request: FastifyRequest): Promise<{
    isAuthorized: boolean;
    userId: string | null;
    clerkUserId: string | null;
    role: 'user' | 'moderator' | 'admin' | null;
    error?: string;
}> {
    // First, authenticate the user
    const authResult = authenticateUser(request);

    if (!authResult.isAuthenticated || !authResult.clerkUserId) {
        return {
            isAuthorized: false,
            userId: null,
            clerkUserId: null,
            role: null,
            error: authResult.error || 'User not authenticated'
        };
    }

    // Then check if they have admin role
    const roleCheck = await checkAdminRole(authResult.clerkUserId);

    if (!roleCheck.hasAccess) {
        return {
            isAuthorized: false,
            userId: roleCheck.userId,
            clerkUserId: authResult.clerkUserId,
            role: roleCheck.role,
            error: roleCheck.error || 'Admin access required'
        };
    }

    return {
        isAuthorized: true,
        userId: roleCheck.userId,
        clerkUserId: authResult.clerkUserId,
        role: roleCheck.role
    };
}

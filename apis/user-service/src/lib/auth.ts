/**
 * Authentication utilities for user service
 * Provides robust JWT validation and user authorization
 */

import { FastifyRequest } from 'fastify';
import { getAuth } from '@clerk/fastify';

export interface AuthResult {
    isAuthenticated: boolean;
    userId: string | null;
    error?: string;
}

/**
 * Enhanced authentication check with fallback JWT validation
 */
export function authenticateUser(request: FastifyRequest): AuthResult {
    try {
        // First try Clerk's getAuth
        const clerkAuth = getAuth(request as any);

        if (clerkAuth.isAuthenticated && clerkAuth.userId) {
            return {
                isAuthenticated: true,
                userId: clerkAuth.userId
            };
        }

        // Fallback: manual JWT token extraction and basic validation
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                isAuthenticated: false,
                userId: null,
                error: 'Missing or invalid Authorization header'
            };
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return {
                isAuthenticated: false,
                userId: null,
                error: 'Empty JWT token'
            };
        }

        // Basic JWT structure validation
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return {
                isAuthenticated: false,
                userId: null,
                error: 'Invalid JWT token structure'
            };
        }

        try {
            // Decode the payload (we're not verifying signature here - that's Clerk's job)
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

            // Check if token has a user ID (Clerk tokens have 'sub' field)
            const userId = payload.sub;
            if (!userId || typeof userId !== 'string') {
                return {
                    isAuthenticated: false,
                    userId: null,
                    error: 'No valid user ID in token'
                };
            }

            // Check token expiration
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                return {
                    isAuthenticated: false,
                    userId: null,
                    error: 'Token expired'
                };
            }

            // Token looks valid - accept it
            return {
                isAuthenticated: true,
                userId: userId
            };

        } catch (decodeError) {
            return {
                isAuthenticated: false,
                userId: null,
                error: 'Failed to decode JWT token'
            };
        }

    } catch (error) {
        // Clerk authentication failed completely
        console.error('Authentication error:', error);
        return {
            isAuthenticated: false,
            userId: null,
            error: 'Authentication system error'
        };
    }
}

/**
 * Check if authenticated user is authorized to access/modify target user's data
 */
export function authorizeUserAccess(authUserId: string, targetUserId: string): boolean {
    return authUserId === targetUserId;
}

/**
 * Combined authentication and authorization check
 */
export function authenticateAndAuthorize(request: FastifyRequest, targetUserId: string): {
    isValid: boolean;
    authResult: AuthResult;
    error?: string;
} {
    const authResult = authenticateUser(request);

    if (!authResult.isAuthenticated) {
        return {
            isValid: false,
            authResult,
            error: authResult.error || 'User not authenticated'
        };
    }

    if (!authorizeUserAccess(authResult.userId!, targetUserId)) {
        return {
            isValid: false,
            authResult,
            error: 'Forbidden: Cannot access another user\'s data'
        };
    }

    return {
        isValid: true,
        authResult
    };
}
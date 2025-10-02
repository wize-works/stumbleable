import { clerkPlugin } from '@clerk/fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import 'dotenv/config';
import Fastify from 'fastify';

import { listsRoutes } from './routes/lists';
import { roleRoutes } from './routes/roles';
import { topicsRoutes } from './routes/topics';
import { userRoutes } from './routes/users';

// Environment schema
const envSchema = {
    type: 'object',
    required: ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
    properties: {
        NODE_ENV: { type: 'string', default: 'development' },
        PORT: { type: 'string', default: '7003' },
        HOST: { type: 'string', default: '127.0.0.1' },
        ALLOWED_ORIGINS: { type: 'string', default: 'http://localhost:3000' },
        SUPABASE_URL: { type: 'string' },
        SUPABASE_SERVICE_KEY: { type: 'string' },
        RATE_LIMIT_MAX: { type: 'string', default: '100' },
        RATE_LIMIT_WINDOW: { type: 'string', default: '60000' }
    }
};

// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    }
});

// Register plugins
async function buildApp() {
    // Environment validation
    await fastify.register(fastifyEnv, {
        schema: envSchema,
        dotenv: true
    });

    // Rate limiting - MUST be registered before routes
    await fastify.register(fastifyRateLimit, {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
        cache: 10000, // Cache 10k entries
        allowList: ['127.0.0.1'], // Whitelist localhost for development
        continueExceeding: true, // Don't ban, just reject
        skipOnError: true, // Don't apply rate limit if error
        addHeadersOnExceeding: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true
        },
        addHeaders: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true
        },
        keyGenerator: (request) => {
            // Use Clerk user ID if authenticated, otherwise IP
            const clerkUserId = (request as any).auth?.userId;
            if (clerkUserId) {
                return `user:${clerkUserId}`;
            }
            return request.ip || 'unknown';
        },
        errorResponseBuilder: (request, context) => {
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
                retryAfter: Math.ceil(context.ttl / 1000)
            };
        },
        onExceeding: (request, key) => {
            fastify.log.warn({ key, ip: request.ip }, 'Rate limit threshold approaching');
        },
        onExceeded: (request, key) => {
            fastify.log.error({ key, ip: request.ip }, 'Rate limit exceeded');
        }
    });

    // Health check (MUST be registered BEFORE Clerk to avoid authentication requirement)
    fastify.get('/health', {
        config: {
            rateLimit: false // Disable rate limiting for health checks
        }
    }, async (request, reply) => {
        return {
            status: 'healthy',
            service: 'user-service',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            rateLimit: {
                enabled: true,
                max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)
            }
        };
    });

    // Clerk authentication (registered AFTER health check)
    console.log('🔑 Clerk keys:', {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
        secretKey: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing'
    });

    // Only register Clerk if keys are provided
    if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
        await fastify.register(clerkPlugin as any, {
            publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
            secretKey: process.env.CLERK_SECRET_KEY,
        });
    } else {
        console.warn('⚠️  Clerk not configured - authentication will not be available');
    }

    // Security headers
    await fastify.register(fastifyHelmet, {
        contentSecurityPolicy: false // Allow for development
    });

    // CORS
    await fastify.register(fastifyCors, {
        origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        credentials: true
    });

    // Register routes
    await fastify.register(userRoutes, { prefix: '/api' });
    await fastify.register(topicsRoutes, { prefix: '/api' });
    await fastify.register(roleRoutes, { prefix: '/api' });
    await fastify.register(listsRoutes, { prefix: '/api' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        fastify.log.error(error);

        const statusCode = error.statusCode || 500;
        const response: any = {
            error: error.message || 'Internal server error',
            statusCode
        };

        if (process.env.NODE_ENV === 'development') {
            response.stack = error.stack;
        }

        reply.status(statusCode).send(response);
    });

    // 404 handler
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            error: 'Endpoint not found',
            path: request.url,
            method: request.method
        });
    });

    return fastify;
}

// Start server
async function start() {
    try {
        const app = await buildApp();
        const port = parseInt(process.env.PORT || '8080', 10);
        const host = process.env.HOST || '0.0.0.0';

        await app.listen({ port, host });

        console.log(`🚀 User Service running on http://${host}:${port}`);
        console.log(`📊 Health check: http://${host}:${port}/health`);
        console.log(`👤 User management: GET/POST/PUT/DELETE http://${host}:${port}/api/users`);
        console.log(`📚 Topics: GET http://${host}:${port}/api/topics`);
        console.log(`� Roles: GET http://${host}:${port}/api/roles/check, /api/roles/me, PUT /api/roles/:userId`);
        console.log(`�🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10) / 1000)} seconds`);

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await fastify.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await fastify.close();
    process.exit(0);
});

// Start the server
start();
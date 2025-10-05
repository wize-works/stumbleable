import { clerkPlugin } from '@clerk/fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import 'dotenv/config';
import Fastify from 'fastify';

import { moderationRoutes } from './routes/moderation.js';

// Environment schema
const envSchema = {
    type: 'object',
    required: ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
    properties: {
        NODE_ENV: { type: 'string', default: 'development' },
        PORT: { type: 'string', default: '7005' },
        HOST: { type: 'string', default: '0.0.0.0' },
        ALLOWED_ORIGINS: { type: 'string', default: 'http://localhost:3000' },
        SUPABASE_URL: { type: 'string' },
        SUPABASE_SERVICE_KEY: { type: 'string' },
        USER_SERVICE_URL: { type: 'string', default: 'http://localhost:7003' },
        RATE_LIMIT_MAX: { type: 'string', default: '100' },
        RATE_LIMIT_WINDOW: { type: 'string', default: '60000' }
    }
};

// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
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

    // Allow empty JSON bodies (for PUT/DELETE without body)
    fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        try {
            const json = body === '' ? {} : JSON.parse(body as string);
            done(null, json);
        } catch (err: any) {
            err.statusCode = 400;
            done(err, undefined);
        }
    });

    // Rate limiting - MUST be registered before routes
    await fastify.register(fastifyRateLimit, {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
        cache: 10000,
        allowList: ['127.0.0.1'],
        continueExceeding: true,
        skipOnError: true,
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
        }
    });

    // Health check (MUST be registered BEFORE Clerk to avoid authentication requirement)
    fastify.get('/health', {
        config: {
            rateLimit: false
        }
    }, async (request, reply) => {
        return {
            status: 'healthy',
            service: 'moderation-service',
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
    const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    console.log('🔑 Clerk configuration:', {
        publishableKey: clerkPublishableKey ? `✅ Set (${clerkPublishableKey.substring(0, 20)}...)` : '❌ Missing',
        secretKey: clerkSecretKey ? `✅ Set (${clerkSecretKey.substring(0, 20)}...)` : '❌ Missing',
        envFile: process.env.NODE_ENV === 'production' ? 'Production' : 'Development (.env)'
    });

    if (!clerkPublishableKey || !clerkSecretKey) {
        console.error('❌ CRITICAL: Clerk keys not found!');
        console.error('   Please ensure .env file has:');
        console.error('   - CLERK_PUBLISHABLE_KEY=pk_test_...');
        console.error('   - CLERK_SECRET_KEY=sk_test_...');
        throw new Error('Clerk authentication keys are required');
    }

    try {
        await fastify.register(clerkPlugin as any, {
            publishableKey: clerkPublishableKey,
            secretKey: clerkSecretKey,
        });
        console.log('✅ Clerk plugin registered successfully');
    } catch (error) {
        console.error('❌ Failed to register Clerk plugin:', error);
        throw error;
    }

    // Security headers
    await fastify.register(fastifyHelmet, {
        contentSecurityPolicy: false
    });

    // CORS
    await fastify.register(fastifyCors, {
        origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        credentials: true
    });

    // Register routes
    await fastify.register(moderationRoutes, { prefix: '/api' });

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

        console.log(`🚀 Moderation Service running on http://${host}:${port}`);
        console.log(`📊 Health check: http://${host}:${port}/health`);
        console.log(`🛡️  Moderation queue: GET/POST http://${host}:${port}/api/moderation/queue`);
        console.log(`📝 Content reports: GET/POST http://${host}:${port}/api/moderation/reports`);
        console.log(`🌐 Domain reputation: GET/PATCH http://${host}:${port}/api/moderation/domains`);
        console.log(`📈 Analytics: GET http://${host}:${port}/api/moderation/analytics`);
        console.log(`🚨 Rate limiting: ${process.env.RATE_LIMIT_MAX || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10) / 1000)} seconds`);

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

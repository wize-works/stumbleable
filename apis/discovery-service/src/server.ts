// dotenv must be imported before @clerk/fastify
import { clerkPlugin } from '@clerk/fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import 'dotenv/config';
import Fastify from 'fastify';

import { getLogLevel } from './lib/logger';
import { trendingCalculator } from './lib/trending-calculator';
import requestLoggingPlugin from './middleware/request-logging';

import { contentRoute } from './routes/content';
import { moderationRoutes } from './routes/moderation';
import { nextDiscoveryRoute } from './routes/next';
import { reportsRoutes } from './routes/reports';
import { similarContentRoute } from './routes/similar';
import { submitRoutes } from './routes/submit';
import { trendingDiscoveryRoute } from './routes/trending';

// Environment schema
const envSchema = {
    type: 'object',
    required: ['NODE_ENV'],
    properties: {
        NODE_ENV: { type: 'string', default: 'development' },
        PORT: { type: 'string', default: '7001' },
        HOST: { type: 'string', default: '127.0.0.1' },
        ALLOWED_ORIGINS: { type: 'string', default: 'http://localhost:3000' },
        RATE_LIMIT_MAX: { type: 'string', default: '100' },
        RATE_LIMIT_WINDOW: { type: 'string', default: '60000' },
        LOG_LEVEL: { type: 'string', default: 'info' }
    }
};

// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: getLogLevel(),
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss.l Z',
                ignore: 'pid,hostname',
                colorize: true,
                singleLine: false
            }
        },
        serializers: {
            req: (request) => ({
                method: request.method,
                url: request.url,
                headers: request.headers,
                remoteAddress: request.socket?.remoteAddress,
                remotePort: request.socket?.remotePort
            }),
            res: (response) => ({
                statusCode: response.statusCode
            })
        }
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true // We'll handle this with our middleware
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

    // Request logging with correlation IDs
    await fastify.register(requestLoggingPlugin);

    // Clerk authentication
    console.log('🔑 Clerk keys:', {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
        secretKey: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing'
    });

    await fastify.register(clerkPlugin as any, {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Security headers
    await fastify.register(fastifyHelmet, {
        contentSecurityPolicy: false // Allow for development
    });

    // CORS
    await fastify.register(fastifyCors, {
        origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        credentials: true
    });

    // Health check (no rate limit)
    fastify.get('/health', {
        config: {
            rateLimit: false // Disable rate limiting for health checks
        }
    }, async (request, reply) => {
        return {
            status: 'healthy',
            service: 'discovery-service',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            rateLimit: {
                enabled: true,
                max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)
            }
        };
    });

    // Register routes
    await fastify.register(nextDiscoveryRoute, { prefix: '/api' });
    await fastify.register(trendingDiscoveryRoute, { prefix: '/api' });
    await fastify.register(similarContentRoute, { prefix: '/api' });
    await fastify.register(contentRoute, { prefix: '/api' });
    await fastify.register(submitRoutes, { prefix: '/api' });
    await fastify.register(reportsRoutes, { prefix: '/api' });
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
        const port = parseInt(process.env.PORT || '7001', 10);
        const host = process.env.HOST || '127.0.0.1';

        await app.listen({ port, host });

        console.log(`🚀 Discovery Service running on http://${host}:${port}`);
        console.log(`📊 Health check: http://${host}:${port}/health`);
        console.log(`🔍 Next discovery: POST http://${host}:${port}/api/discovery/next`);
        console.log(`📈 Trending: GET http://${host}:${port}/api/discovery/trending`);
        console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10) / 1000)} seconds`);

        // Start trending calculator (runs every 15 minutes)
        trendingCalculator.start();

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    trendingCalculator.stop();
    await fastify.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    trendingCalculator.stop();
    await fastify.close();
    process.exit(0);
});

// Start the server
start();
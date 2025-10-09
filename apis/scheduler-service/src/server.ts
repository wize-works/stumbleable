import { clerkPlugin } from '@clerk/fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import 'dotenv/config';
import Fastify from 'fastify';

import { scheduler } from './lib/scheduler';
import jobRoutes from './routes/jobs';

// Environment schema
const envSchema = {
    type: 'object',
    required: ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
    properties: {
        NODE_ENV: { type: 'string', default: 'development' },
        PORT: { type: 'string', default: '8080' },
        HOST: { type: 'string', default: '0.0.0.0' },
        ALLOWED_ORIGINS: { type: 'string', default: 'http://localhost:3000' },
        SUPABASE_URL: { type: 'string' },
        SUPABASE_SERVICE_KEY: { type: 'string' },
        EMAIL_SERVICE_URL: { type: 'string', default: 'http://email-service:8080' },
        CRAWLER_SERVICE_URL: { type: 'string', default: 'http://crawler-service:8080' },
        DISCOVERY_SERVICE_URL: { type: 'string', default: 'http://discovery-service:8080' },
        INTERACTION_SERVICE_URL: { type: 'string', default: 'http://interaction-service:8080' },
        USER_SERVICE_URL: { type: 'string', default: 'http://user-service:8080' },
        RATE_LIMIT_MAX: { type: 'string', default: '100' },
        RATE_LIMIT_WINDOW: { type: 'string', default: '60000' },
        LOG_LEVEL: { type: 'string', default: 'info' },
        SERVICE_TOKEN: { type: 'string' }, // Optional: For service-to-service auth
    }
};

// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
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
        return reply.code(200).send({
            status: 'healthy',
            service: 'scheduler-service',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            jobs: scheduler.getJobs().length,
        });
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

    // Register API routes with /api prefix
    await fastify.register(jobRoutes, { prefix: '/api' });

    // Initialize scheduler
    try {
        await scheduler.initialize();
        fastify.log.info('✅ Scheduler initialized');
    } catch (error) {
        fastify.log.error({ error }, '❌ Failed to initialize scheduler');
    }

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

        console.log(`
  ╔════════════════════════════════════════╗
  ║   ⏰ Scheduler Service Running         ║
  ║   Port: ${port.toString().padEnd(28)} ║
  ║   Host: ${host.padEnd(28)} ║
  ║   Health: http://${host}:${port}/health       ║
  ║   Jobs: ${scheduler.getJobs().length.toString().padEnd(28)} ║
  ╚════════════════════════════════════════╝
        `);
        console.log(`🚀 Scheduler Service running on http://${host}:${port}`);
        console.log(`📊 Health check: http://${host}:${port}/health`);
        console.log(`📝 Register job: POST http://${host}:${port}/api/jobs/register`);
        console.log(`📋 List jobs: GET http://${host}:${port}/api/jobs`);
        console.log(`⚡ Trigger job: POST http://${host}:${port}/api/jobs/:jobName/trigger`);
        console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10) / 1000)} seconds`);
        console.log(`⏰ ${scheduler.getJobs().length} jobs registered`);

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    scheduler.shutdown();
    await fastify.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    scheduler.shutdown();
    await fastify.close();
    process.exit(0);
});

// Start the server
start();

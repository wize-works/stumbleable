import { clerkPlugin } from '@clerk/fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import 'dotenv/config';
import Fastify from 'fastify';

import { adminRoutes } from './routes/admin';
import { jobRoutes } from './routes/jobs';
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
        HOST: { type: 'string', default: '0.0.0.0' },
        ALLOWED_ORIGINS: { type: 'string', default: 'http://localhost:3000' },
        EMAIL_API_URL: { type: 'string', default: 'http://email-service:8080' },
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
    await fastify.register(adminRoutes, { prefix: '/api' });
    await fastify.register(jobRoutes, { prefix: '/api' });

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

// Register jobs with scheduler-service
const SCHEDULER_API_URL = process.env.SCHEDULER_API_URL || 'http://127.0.0.1:7007';

async function registerJobsWithScheduler(logger: any) {
    const jobs = [
        {
            name: 'deletion-cleanup',
            displayName: 'Account Deletion Cleanup',
            description: 'Process pending account deletions after 30-day grace period and send reminder emails',
            cronExpression: '0 2 * * *', // Daily at 2 AM UTC
            jobType: 'cleanup',
            service: 'user-service',
            endpoint: '/api/jobs/process-deletions',
            enabled: true,
            config: {
                gracePeriodDays: 30,
                batchSize: 100,
                sendReminders: true,
            },
        },
    ];

    for (const job of jobs) {
        try {
            console.log(`Registering job: ${job.name} to ${SCHEDULER_API_URL}/api/jobs/register`);

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (process.env.SERVICE_TOKEN) {
                headers['X-Service-Token'] = process.env.SERVICE_TOKEN;
            }

            const response = await fetch(`${SCHEDULER_API_URL}/api/jobs/register`, {
                method: 'POST',
                headers,
                body: JSON.stringify(job),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`Failed to register job ${job.name}: ${response.status} ${response.statusText}`);
                console.error(`Error details: ${error}`);
                logger.error(`Failed to register job ${job.name}: ${error}`);
            } else {
                const result = await response.json();
                console.log(`✅ Successfully registered job: ${job.name}`, result);
                logger.info(`✅ Registered job: ${job.name}`);
            }
        } catch (error: any) {
            console.error(`Exception while registering job ${job.name}:`, error);
            logger.error(`Failed to register job ${job.name}:`, error.message);
        }
    }
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
        console.log(`🛡️  Roles: GET http://${host}:${port}/api/roles/check, /api/roles/me, PUT /api/roles/:userId`);
        console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10) / 1000)} seconds`);

        // Register jobs with scheduler (with delay to ensure scheduler is ready)
        setTimeout(async () => {
            try {
                await registerJobsWithScheduler(app.log);
                app.log.info('✅ Jobs registered with scheduler-service');
            } catch (error) {
                app.log.error({ error }, '❌ Failed to register jobs with scheduler-service');
            }
        }, 2000);

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
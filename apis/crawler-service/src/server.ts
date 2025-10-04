// dotenv must be imported before @clerk/fastify
import { clerkPlugin } from '@clerk/fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { CrawlerScheduler } from './lib/scheduler';
import { trendingCalculator } from './lib/trending-calculator';
import { enhanceRoute } from './routes/enhance';
import { jobRoutes, setScheduler } from './routes/jobs';
import { sourceRoutes } from './routes/sources';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '7004');
const HOST = '0.0.0.0';

// Initialize scheduler
const scheduler = new CrawlerScheduler();

// Build Fastify app
async function buildApp() {
    // Create Fastify instance
    const fastify = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            transport: process.env.NODE_ENV !== 'production' ? {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            } : undefined,
        },
    });

    // Register CORS
    await fastify.register(cors, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
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

    // Health check endpoint (MUST be registered BEFORE Clerk plugin to avoid authentication)
    // CRITICAL: Keep this endpoint FAST and dependency-free for K8s probes
    fastify.get('/health', async (request, reply) => {
        reply.code(200).send({
            status: 'healthy',
            service: 'crawler-service',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    // Clerk authentication (registered AFTER health check to avoid requiring auth for health)
    console.log('🔑 Clerk keys:', {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
        secretKey: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing'
    });

    // Only register Clerk if keys are provided (allows health checks to work without Clerk)
    if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
        await fastify.register(clerkPlugin as any, {
            publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
            secretKey: process.env.CLERK_SECRET_KEY,
        });
    } else {
        console.warn('⚠️  Clerk not configured - authentication will not be available');
    }

    // Register routes (with auth protection)
    await fastify.register(sourceRoutes, { prefix: '/api' });
    await fastify.register(jobRoutes, { prefix: '/api' });
    await fastify.register(enhanceRoute, { prefix: '/api' });

    // Set scheduler reference for routes
    setScheduler(scheduler);

    return fastify;
}

// Start server
const start = async () => {
    try {
        const app = await buildApp();
        await app.listen({ port: PORT, host: HOST });

        console.log(`
🚀 Crawler Service Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
📡 API:    http://localhost:${PORT}/api
🔒 Auth:   Clerk (Admin access required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

        // Start the crawler scheduler
        scheduler.start();

        // Start the trending calculator (runs every 15 minutes)
        trendingCalculator.start();
        console.log('📈 Trending calculator started');

    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down crawler service...');
    scheduler.stop();
    trendingCalculator.stop();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

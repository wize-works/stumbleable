import cors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { EmailQueue } from './lib/queue.js';
import preferencesRoutes from './routes/preferences.js';
import queueRoutes from './routes/queue.js';
import scheduledRoutes from './routes/scheduled.js';
import sendRoutes from './routes/send.js';

dotenv.config();

const port = parseInt(process.env.PORT || '8080');
const host = process.env.HOST || '0.0.0.0';

const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

// Register CORS
await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
});

// Health check endpoint (no /api prefix)
app.get('/health', async () => {
    return {
        status: 'healthy',
        service: 'email-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    };
});

// Register API routes with /api prefix
await app.register(sendRoutes, { prefix: '/api' });
await app.register(preferencesRoutes, { prefix: '/api' });
await app.register(queueRoutes, { prefix: '/api' });
await app.register(scheduledRoutes, { prefix: '/api' });

// Start background queue processor with retry logic
let queueProcessorRetries = 0;
const MAX_RETRIES = 3;

setInterval(async () => {
    try {
        await EmailQueue.processPendingEmails(10);
        queueProcessorRetries = 0; // Reset on success
    } catch (error: any) {
        queueProcessorRetries++;
        app.log.error({ error, retries: queueProcessorRetries }, 'Queue processing error');

        if (error.message?.includes('fetch failed')) {
            app.log.warn('Supabase connection issue - will retry on next interval');
            if (queueProcessorRetries >= MAX_RETRIES) {
                app.log.error('Max retries reached - check Supabase connectivity');
            }
        }
    }
}, 60000); // Process every minute

// Start server
try {
    await app.listen({ port, host });
    console.log(`
  ╔════════════════════════════════════════╗
  ║   📧 Email Service Running             ║
  ║   Port: ${port}                           ║
  ║   Host: ${host}                    ║
  ║   Health: http://${host}:${port}/health    ║
  ╚════════════════════════════════════════╝
  `);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down email service...');
    await app.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down email service...');
    await app.close();
    process.exit(0);
});

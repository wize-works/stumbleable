import cors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { EmailQueue } from './lib/queue.js';
import jobRoutes from './routes/jobs.js';
import preferencesRoutes from './routes/preferences.js';
import queueRoutes from './routes/queue.js';
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
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
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
await app.register(jobRoutes, { prefix: '/api' });

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

// Register jobs with scheduler-service
const SCHEDULER_API_URL = process.env.SCHEDULER_API_URL || 'http://127.0.0.1:7007';

async function registerJobsWithScheduler() {
    const jobs = [
        {
            name: 'weekly-digest',
            displayName: 'Weekly Digest',
            description: 'Send weekly trending content digest to opted-in users',
            cronExpression: '0 9 * * 1', // Mondays at 9 AM
            jobType: 'email',
            service: 'email-service',
            endpoint: '/api/jobs/weekly-digest',
            enabled: true,
            config: {
                batchSize: 100,
                maxEmails: 10000,
            },
        },
        {
            name: 're-engagement',
            displayName: 'Re-engagement Emails',
            description: 'Send personalized emails to inactive users (7+ days)',
            cronExpression: '0 10 * * *', // Daily at 10 AM
            jobType: 'email',
            service: 'email-service',
            endpoint: '/api/jobs/re-engagement',
            enabled: true,
            config: {
                daysInactive: 7,
                batchSize: 50,
                maxEmails: 500,
            },
        },
        {
            name: 'queue-cleanup',
            displayName: 'Email Queue Cleanup',
            description: 'Remove old processed emails from queue',
            cronExpression: '0 2 * * *', // Daily at 2 AM
            jobType: 'cleanup',
            service: 'email-service',
            endpoint: '/api/jobs/queue-cleanup',
            enabled: true,
            config: {
                retentionDays: 30,
            },
        },
    ];

    for (const job of jobs) {
        try {
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
                app.log.error(`Failed to register job ${job.name}: ${error}`);
            } else {
                app.log.info(`✅ Registered job: ${job.name}`);
            }
        } catch (error: any) {
            app.log.error(`Failed to register job ${job.name}:`, error.message);
        }
    }
}

// Register jobs on startup (with retry if scheduler not ready)
setTimeout(async () => {
    try {
        await registerJobsWithScheduler();
        app.log.info('✅ Email jobs registered with scheduler-service');
    } catch (error) {
        app.log.error({ error }, '❌ Failed to register jobs with scheduler-service');
    }
}, 2000); // Wait 2 seconds for scheduler to be ready

// Start server
try {
    await app.listen({ port, host });
    console.log(`
  ╔════════════════════════════════════════╗
  ║   📧 Email Service Running             ║
  ║   Port: ${port}                           ║
  ║   Host: ${host}                    ║
  ║   Health: http://${host}:${port}/health    ║
  ║   Job Endpoints: /api/jobs/*           ║
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

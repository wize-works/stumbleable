import cors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import platformRoutes from './routes/platforms.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

async function start() {
    // Register CORS
    await app.register(cors, {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Health check endpoint (no /api prefix)
    app.get('/health', async () => {
        return {
            status: 'healthy',
            service: 'content-service',
            timestamp: new Date().toISOString(),
        };
    });

    // Register routes with /api prefix
    await app.register(platformRoutes, { prefix: '/api' });

    // Start server
    try {
        await app.listen({ port: PORT, host: HOST });
        console.log(`🚀 Content Service running on http://${HOST}:${PORT}`);
        console.log(`📋 Health check: http://${HOST}:${PORT}/health`);
        console.log(`📄 API routes: http://${HOST}:${PORT}/api/*`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();

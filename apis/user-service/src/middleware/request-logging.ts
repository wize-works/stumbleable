import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createRequestLogger, getCorrelationId, redactSensitiveData } from '../lib/logger';

/**
 * Fastify plugin for request logging with correlation IDs
 */
async function requestLoggingPlugin(fastify: FastifyInstance) {
    // Add correlation ID to all requests
    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);

        // Store correlation ID and start time in request context
        (request as any).correlationId = correlationId;
        (request as any).startTime = Date.now();

        // Add correlation ID to response headers
        reply.header('x-correlation-id', correlationId);

        // Create child logger with correlation ID
        request.log = createRequestLogger(fastify.log, correlationId);

        // Log incoming request
        request.log.info({
            method: request.method,
            url: request.url,
            correlationId,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            referer: request.headers['referer']
        }, 'Incoming request');
    });

    // Log request completion
    fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        const responseTime = Date.now() - ((request as any).startTime || Date.now());
        const correlationId = (request as any).correlationId;

        const logData = {
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime,
            correlationId,
            ip: request.ip
        };

        // Log at different levels based on status code
        if (reply.statusCode >= 500) {
            request.log.error(logData, 'Request failed with server error');
        } else if (reply.statusCode >= 400) {
            request.log.warn(logData, 'Request failed with client error');
        } else if (responseTime > 1000) {
            request.log.warn(logData, 'Slow request detected');
        } else {
            request.log.info(logData, 'Request completed');
        }
    });

    // Log errors
    fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
        const correlationId = (request as any).correlationId;

        request.log.error({
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            method: request.method,
            url: request.url,
            correlationId,
            ip: request.ip
        }, 'Request error occurred');
    });

    // Add logging helper to fastify instance
    fastify.decorate('logPerformance', (operation: string, duration: number, metadata: any = {}) => {
        const logData = {
            operation,
            duration,
            ...redactSensitiveData(metadata)
        };

        if (duration > 1000) {
            fastify.log.warn(logData, `Slow operation: ${operation} took ${duration}ms`);
        } else if (duration > 500) {
            fastify.log.info(logData, `Operation ${operation} took ${duration}ms`);
        } else {
            fastify.log.debug(logData, `Operation ${operation} completed in ${duration}ms`);
        }
    });
}

export default fp(requestLoggingPlugin, {
    name: 'request-logging',
    fastify: '4.x'
});

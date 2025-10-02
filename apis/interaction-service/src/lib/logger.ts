import { randomUUID } from 'crypto';
import type { FastifyRequest } from 'fastify';

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
    return randomUUID();
}

/**
 * Extract or generate correlation ID from request
 */
export function getCorrelationId(request: FastifyRequest): string {
    // Check if correlation ID exists in headers (from upstream service or API gateway)
    const headerCorrelationId = request.headers['x-correlation-id'] as string;
    if (headerCorrelationId) {
        return headerCorrelationId;
    }

    // Generate new correlation ID if not provided
    return generateCorrelationId();
}

/**
 * Performance tracker for database queries and operations
 */
export class PerformanceTracker {
    private startTime: number;
    private operation: string;
    private metadata: Record<string, any>;

    constructor(operation: string, metadata: Record<string, any> = {}) {
        this.operation = operation;
        this.metadata = metadata;
        this.startTime = Date.now();
    }

    /**
     * End tracking and return duration in milliseconds
     */
    end(): number {
        return Date.now() - this.startTime;
    }

    /**
     * End tracking and log performance metrics
     */
    endAndLog(logger: any, level: 'info' | 'warn' | 'error' = 'info') {
        const duration = this.end();
        const logData = {
            operation: this.operation,
            duration,
            ...this.metadata
        };

        // Warn on slow operations (> 1 second)
        if (duration > 1000) {
            logger.warn(logData, `Slow operation: ${this.operation} took ${duration}ms`);
        } else if (duration > 500) {
            logger.info(logData, `Operation ${this.operation} took ${duration}ms`);
        } else {
            logger.debug(logData, `Operation ${this.operation} completed in ${duration}ms`);
        }

        return duration;
    }

    /**
     * Get current duration without ending the tracker
     */
    getCurrentDuration(): number {
        return Date.now() - this.startTime;
    }
}

/**
 * Log levels configuration
 */
export const LOG_LEVELS = {
    FATAL: 60,
    ERROR: 50,
    WARN: 40,
    INFO: 30,
    DEBUG: 20,
    TRACE: 10
} as const;

/**
 * Get log level from environment or default to INFO
 */
export function getLogLevel(): string {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

    if (!validLevels.includes(level)) {
        console.warn(`Invalid LOG_LEVEL "${level}", defaulting to "info"`);
        return 'info';
    }

    return level;
}

/**
 * Redact sensitive information from logs
 */
export function redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'authorization',
        'api_key',
        'apiKey',
        'apiSecret',
        'privateKey',
        'accessToken',
        'refreshToken'
    ];

    const redacted = { ...data };

    for (const key of Object.keys(redacted)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
            redacted[key] = redactSensitiveData(redacted[key]);
        }
    }

    return redacted;
}

/**
 * Create child logger with correlation ID
 */
export function createRequestLogger(baseLogger: any, correlationId: string) {
    return baseLogger.child({ correlationId });
}

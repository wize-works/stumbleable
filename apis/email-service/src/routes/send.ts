import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { EmailQueue } from '../lib/queue.js';
import type { EmailType } from '../types.js';

const sendRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /api/send - Queue an email
    fastify.post('/send', async (request, reply) => {
        const schema = z.object({
            userId: z.string().uuid(),
            emailType: z.string(),
            recipientEmail: z.string().email(),
            templateData: z.record(z.string(), z.any()),
            scheduledAt: z.string().datetime().optional(),
        });

        try {
            const body = schema.parse(request.body);

            const scheduledAt = body.scheduledAt
                ? new Date(body.scheduledAt)
                : new Date();

            const emailId = await EmailQueue.enqueue(
                body.userId,
                body.emailType as EmailType,
                body.recipientEmail,
                body.templateData,
                scheduledAt
            );

            return reply.code(201).send({
                success: true,
                emailId,
                message: 'Email queued successfully',
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors,
                });
            }

            fastify.log.error('Failed to queue email:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to queue email',
                message: error.message,
            });
        }
    });
};

export default sendRoutes;

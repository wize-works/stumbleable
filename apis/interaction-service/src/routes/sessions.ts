import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

/**
 * Helper to resolve Clerk user ID to internal user UUID
 */
async function resolveUserId(clerkUserId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error || !data) {
        console.error('Failed to resolve user ID:', clerkUserId, error);
        return null;
    }

    return data.id;
}

// Validation schemas  
const StartSessionSchema = z.object({
    userId: z.string().min(1) // Accept Clerk user ID (will be resolved to UUID internally)
});

const UpdateSessionSchema = z.object({
    sessionId: z.string().uuid(),
    action: z.enum(['discovery', 'interaction'])
});

const EndSessionSchema = z.object({
    sessionId: z.string().uuid()
});

/**
 * Session analytics routes for real-time user tracking
 */
export async function sessionRoutes(fastify: FastifyInstance) {

    /**
     * Start a new user session
     * POST /sessions/start
     */
    fastify.post('/sessions/start', async (request, reply) => {
        // Debug log the incoming request
        console.log('Session start request body:', request.body);

        // Validate request body
        const body = StartSessionSchema.parse(request.body);
        const { userId: clerkUserId } = body;

        try {
            // Resolve Clerk user ID to internal UUID
            const userId = await resolveUserId(clerkUserId);
            if (!userId) {
                fastify.log.error({ clerkUserId }, 'User not found in database');
                return reply.status(404).send({ error: 'User not found' });
            }

            // Create session with internal user UUID
            const { data, error } = await supabase
                .from('user_sessions')
                .insert({
                    user_id: userId, // Internal database UUID
                    session_start: new Date().toISOString(),
                    interactions_count: 0,
                    discoveries_count: 0
                })
                .select()
                .single();

            if (error || !data) {
                fastify.log.error({ error }, 'Failed to create session');
                return reply.status(500).send({ error: 'Failed to start session' });
            }

            fastify.log.info({
                clerkUserId,
                userId,
                sessionId: data.id
            }, 'Session started successfully');

            return reply.send({
                sessionId: data.id,
                startTime: data.session_start
            });

        } catch (error) {
            fastify.log.error({ error }, 'Error starting session');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * Update session with real-time activity
     * POST /sessions/update
     */
    fastify.post('/sessions/update', async (request, reply) => {
        const body = UpdateSessionSchema.parse(request.body);
        const { sessionId, action } = body;

        try {
            // Update session counters directly in table
            // Direct operations provide better error handling than RPC for simple counter updates

            // First get the current session data
            const { data: currentSession, error: currentSessionError } = await supabase
                .from('user_sessions')
                .select('discoveries_count, interactions_count')
                .eq('id', sessionId)
                .single();

            if (currentSessionError || !currentSession) {
                fastify.log.error({ error: currentSessionError }, 'Failed to fetch current session for update');
                return reply.status(500).send({ error: 'Failed to update session' });
            }

            // Increment the appropriate counter
            const updateData = action === 'discovery'
                ? { discoveries_count: currentSession.discoveries_count + 1 }
                : { interactions_count: currentSession.interactions_count + 1 };

            const { error } = await supabase
                .from('user_sessions')
                .update(updateData)
                .eq('id', sessionId);

            if (error) {
                fastify.log.error({ error }, 'Failed to update session');
                return reply.status(500).send({ error: 'Failed to update session' });
            }

            // Get updated session data
            const { data: sessionData, error: sessionDataError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (sessionDataError || !sessionData) {
                fastify.log.error({ error: sessionDataError }, 'Failed to fetch updated session');
                return reply.status(500).send({ error: 'Failed to fetch session data' });
            }

            return reply.send({
                success: true,
                sessionId,
                discoveryCount: sessionData.discoveries_count,
                interactionCount: sessionData.interactions_count
            });

        } catch (error) {
            fastify.log.error({ error }, 'Error updating session');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * End user session
     * POST /sessions/end
     */
    fastify.post('/sessions/end', async (request, reply) => {
        const body = EndSessionSchema.parse(request.body);
        const { sessionId } = body;

        try {
            const { data, error } = await supabase
                .from('user_sessions')
                .update({
                    session_end: new Date().toISOString()
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error || !data) {
                fastify.log.error({ error }, 'Failed to end session');
                return reply.status(500).send({ error: 'Failed to end session' });
            }

            // Calculate session duration in minutes
            const startTime = new Date(data.session_start);
            const endTime = new Date(data.session_end);
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));

            fastify.log.info({
                sessionId,
                duration: durationMinutes,
                discoveries: data.discoveries_count,
                interactions: data.interactions_count
            }, 'Session ended');

            return reply.send({
                success: true,
                sessionDuration: durationMinutes,
                totalDiscoveries: data.discoveries_count,
                totalInteractions: data.interactions_count
            });

        } catch (error) {
            fastify.log.error({ error }, 'Error ending session');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * Get current session stats
     * GET /sessions/:sessionId
     */
    fastify.get('/sessions/:sessionId', async (request, reply) => {
        const params = z.object({
            sessionId: z.string().uuid()
        }).parse(request.params);

        const { sessionId } = params;

        try {
            const { data, error } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error || !data) {
                fastify.log.error({ error }, 'Failed to fetch session');
                return reply.status(404).send({ error: 'Session not found' });
            }

            // Calculate duration if session has ended
            let durationMinutes = null;
            if (data.session_end) {
                const startTime = new Date(data.session_start);
                const endTime = new Date(data.session_end);
                const durationMs = endTime.getTime() - startTime.getTime();
                durationMinutes = Math.round(durationMs / (1000 * 60));
            }

            return reply.send({
                sessionId: data.id,
                startTime: data.session_start,
                endTime: data.session_end,
                discoveryCount: data.discoveries_count,
                interactionCount: data.interactions_count,
                durationMinutes
            });

        } catch (error) {
            fastify.log.error({ error }, 'Error fetching session');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
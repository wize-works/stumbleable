import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// Report content schema
const reportContentSchema = z.object({
    discoveryId: z.string().uuid('Invalid discovery ID'),
    reason: z.enum(['spam', 'inappropriate', 'broken', 'offensive', 'copyright', 'other']),
    description: z.string().max(500).optional(),
    userId: z.string().uuid('Invalid user ID')
});

// Get reports schema
const getReportsSchema = z.object({
    status: z.enum(['pending', 'resolved', 'dismissed']).optional(),
    discoveryId: z.string().uuid().optional()
});

/**
 * Content reporting routes for user-generated reports
 */
export const reportsRoutes: FastifyPluginAsync = async (fastify) => {

    // Submit a content report
    fastify.post<{ Body: any }>('/reports', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        try {
            const validationResult = reportContentSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { discoveryId, reason, description, userId } = validationResult.data;

            // Check if discovery exists
            const { data: discovery, error: discoveryError } = await supabase
                .from('discoveries')
                .select('id, title, url')
                .eq('id', discoveryId)
                .single();

            if (discoveryError || !discovery) {
                return reply.status(404).send({
                    error: 'Discovery not found'
                });
            }

            // Check if user already reported this content
            const { data: existingReport, error: checkError } = await supabase
                .from('content_reports')
                .select('id')
                .eq('discovery_id', discoveryId)
                .eq('reported_by', userId)
                .single();

            if (existingReport) {
                return reply.status(409).send({
                    error: 'You have already reported this content'
                });
            }

            // Create the report
            const { data: report, error: reportError } = await supabase
                .from('content_reports')
                .insert({
                    discovery_id: discoveryId,
                    reported_by: userId,
                    reason,
                    description,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (reportError) {
                fastify.log.error(reportError, 'Error creating content report');
                return reply.status(500).send({
                    error: 'Failed to submit report'
                });
            }

            fastify.log.info({
                reportId: report.id,
                discoveryId,
                reason,
                userId
            }, 'Content report submitted');

            return reply.status(201).send({
                message: 'Report submitted successfully',
                reportId: report.id,
                status: 'pending'
            });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /reports');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get reports (for moderation interface)
    fastify.get<{ Querystring: any }>('/reports', async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
        try {
            const validationResult = getReportsSchema.safeParse(request.query);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid query parameters',
                    details: validationResult.error.errors
                });
            }

            const { status, discoveryId } = validationResult.data;

            let query = supabase
                .from('content_reports')
                .select(`
                    id,
                    reason,
                    description,
                    status,
                    created_at,
                    resolved_at,
                    content_id,
                    content (
                        id,
                        url,
                        title,
                        domain
                    )
                `)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            if (discoveryId) {
                query = query.eq('discovery_id', discoveryId);
            }

            const { data: reports, error } = await query.limit(50);

            if (error) {
                fastify.log.error(error, 'Error fetching content reports');
                return reply.status(500).send({
                    error: 'Failed to fetch reports'
                });
            }

            return reply.send({
                reports: reports || [],
                total: reports?.length || 0
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /reports');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Update report status (for moderators)
    fastify.patch<{
        Params: { reportId: string },
        Body: any
    }>('/reports/:reportId', async (request: FastifyRequest<{
        Params: { reportId: string },
        Body: any
    }>, reply: FastifyReply) => {
        try {
            const updateSchema = z.object({
                status: z.enum(['resolved', 'dismissed']),
                moderatorNotes: z.string().max(500).optional(),
                moderatorId: z.string().uuid('Invalid moderator ID')
            });

            const validationResult = updateSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { reportId } = request.params;
            const { status, moderatorNotes, moderatorId } = validationResult.data;

            // Update the report
            const { data: updatedReport, error: updateError } = await supabase
                .from('content_reports')
                .update({
                    status,
                    resolved_by: moderatorId,
                    resolved_at: new Date().toISOString(),
                    ...(moderatorNotes && { moderator_notes: moderatorNotes })
                })
                .eq('id', reportId)
                .select()
                .single();

            if (updateError) {
                fastify.log.error(updateError, 'Error updating content report');
                return reply.status(500).send({
                    error: 'Failed to update report'
                });
            }

            if (!updatedReport) {
                return reply.status(404).send({
                    error: 'Report not found'
                });
            }

            fastify.log.info({
                reportId,
                status,
                moderatorId
            }, 'Content report updated');

            return reply.send({
                message: 'Report updated successfully',
                report: updatedReport
            });

        } catch (error) {
            fastify.log.error(error, 'Error in PATCH /reports/:reportId');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get report statistics
    fastify.get('/reports/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get basic counts
            const { data: stats, error } = await supabase
                .from('content_reports')
                .select('status, reason, created_at');

            if (error) {
                fastify.log.error(error, 'Error fetching report stats');
                return reply.status(500).send({
                    error: 'Failed to fetch report statistics'
                });
            }

            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const statusCounts = {
                pending: 0,
                resolved: 0,
                dismissed: 0
            };

            const reasonCounts = {
                spam: 0,
                inappropriate: 0,
                broken: 0,
                offensive: 0,
                copyright: 0,
                other: 0
            };

            let recentReports = 0;

            stats?.forEach(report => {
                statusCounts[report.status as keyof typeof statusCounts]++;
                reasonCounts[report.reason as keyof typeof reasonCounts]++;

                if (new Date(report.created_at) > oneWeekAgo) {
                    recentReports++;
                }
            });

            return reply.send({
                total: stats?.length || 0,
                byStatus: statusCounts,
                byReason: reasonCounts,
                recentReports,
                weeklyTrend: Math.round((recentReports / (stats?.length || 1)) * 100)
            });

        } catch (error) {
            fastify.log.error(error, 'Error in GET /reports/stats');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};
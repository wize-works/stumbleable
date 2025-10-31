import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../lib/supabase.js';

/**
 * Admin routes for discovery service
 * Provides analytics and management endpoints
 */
export default async function adminRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/admin/topics-analytics
     * 
     * Get comprehensive analytics for all topics including:
     * - Content count per topic
     * - Quality scores
     * - Recent activity
     * - Data integrity checks
     * 
     * Uses PostgreSQL function get_topics_analytics() for efficient aggregation
     */
    fastify.get(
        '/admin/topics-analytics',
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                fastify.log.info('Fetching topics analytics via database function...');

                // Call PostgreSQL function that aggregates all stats in one query
                const { data: topicsStats, error: statsError } = await supabase
                    .rpc('get_topics_analytics');

                if (statsError) {
                    fastify.log.error({ error: statsError }, 'Failed to fetch topics analytics');
                    return reply.code(500).send({
                        error: 'Failed to fetch topics analytics',
                        details: statsError.message
                    });
                }

                if (!topicsStats || topicsStats.length === 0) {
                    fastify.log.warn('No topics found');
                    return reply.send({
                        topics: [],
                        totalContent: 0,
                        totalAssignments: 0,
                        emptyTopics: [],
                        dataQualityIssues: []
                    });
                }

                // Map database function results to API response format
                const topicsWithStats = topicsStats.map((row: any) => ({
                    id: row.topic_id,
                    name: row.topic_name,
                    description: row.topic_description,
                    color: row.topic_color,
                    contentCount: Number(row.junction_count),
                    junctionCount: Number(row.junction_count),
                    avgQuality: Number(row.avg_quality),
                    totalInteractions: Number(row.total_interactions),
                    recentAdditions7d: Number(row.recent_additions_7d),
                    recentAdditions30d: Number(row.recent_additions_30d)
                }));

                // Calculate data quality issues (junction vs JSONB)
                const dataQualityIssues = topicsStats
                    .filter((row: any) => {
                        const junctionCount = Number(row.junction_count);
                        const jsonbCount = Number(row.jsonb_count);
                        return junctionCount !== jsonbCount && jsonbCount > 0;
                    })
                    .map((row: any) => {
                        const junctionCount = Number(row.junction_count);
                        const jsonbCount = Number(row.jsonb_count);
                        return {
                            topic: row.topic_name,
                            junctionCount,
                            jsonbCount,
                            missing: jsonbCount - junctionCount
                        };
                    })
                    .sort((a: any, b: any) => Math.abs(b.missing) - Math.abs(a.missing));

                // Find empty topics
                const emptyTopics = topicsStats
                    .filter((row: any) => Number(row.junction_count) === 0)
                    .map((row: any) => row.topic_name);

                // Calculate totals
                const totalContent = topicsStats.reduce((sum: number, row: any) =>
                    sum + Number(row.junction_count), 0
                );

                const totalAssignments = topicsStats.reduce((sum: number, row: any) =>
                    sum + Number(row.junction_count), 0
                );

                fastify.log.info(`Processed ${topicsStats.length} topics, ${dataQualityIssues.length} quality issues`);

                return reply.send({
                    topics: topicsWithStats,
                    totalContent,
                    totalAssignments,
                    emptyTopics,
                    dataQualityIssues
                });

            } catch (error) {
                fastify.log.error({ error }, 'Error fetching topics analytics');
                return reply.code(500).send({
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    );
}

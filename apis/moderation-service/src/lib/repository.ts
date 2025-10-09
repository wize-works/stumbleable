import type {
    BulkReviewResult,
    ContentReport,
    DomainReputation,
    ListContentReportsParams,
    ListDomainReputationsParams,
    ListModerationQueueParams,
    ModerationAnalytics,
    ModerationQueueItem
} from '../types.js';
import { supabase } from './supabase.js';

export class ModerationRepository {
    // ========================================================================
    // MODERATION QUEUE METHODS
    // ========================================================================

    /**
     * List moderation queue items with filtering and pagination
     */
    async listModerationQueue(params: ListModerationQueueParams) {
        const { status = 'all', search, limit = 20, offset = 0 } = params;

        let query = supabase
            .from('moderation_queue')
            .select(`
                *,
                submitted_by_user:users!submitted_by(
                    id,
                    email,
                    full_name,
                    trust_level,
                    submissions_approved,
                    submissions_rejected
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Search by URL, title, or domain
        if (search) {
            query = query.or(`url.ilike.%${search}%,title.ilike.%${search}%,domain.ilike.%${search}%`);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to list moderation queue: ${error.message}`);
        }

        return {
            items: data || [],
            total: count || 0,
            limit,
            offset,
        };
    }

    /**
     * Get specific moderation queue item
     */
    async getModerationQueueItem(queueId: string): Promise<ModerationQueueItem | null> {
        const { data, error } = await supabase
            .from('moderation_queue')
            .select('*')
            .eq('id', queueId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to get moderation queue item: ${error.message}`);
        }

        return data;
    }

    /**
     * Review content (approve or reject)
     * Note: When approved, you must separately create the discovery in the discoveries table
     */
    async reviewContent(
        queueId: string,
        status: 'approved' | 'rejected',
        moderatorId: string,
        notes?: string
    ): Promise<ModerationQueueItem> {
        const now = new Date().toISOString();

        // Update the moderation queue item
        const { data, error } = await supabase
            .from('moderation_queue')
            .update({
                status,
                moderated_by: moderatorId,
                moderated_at: now,
                moderator_notes: notes,
            })
            .eq('id', queueId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to review content: ${error.message}`);
        }

        // If approved, create the discovery
        if (status === 'approved' && data) {
            try {
                await this.createDiscoveryFromQueueItem(data);
            } catch (createError) {
                // Log error but don't fail the review
                console.error('Failed to create discovery from queue item:', createError);
                // Update queue item to indicate discovery creation failed
                await supabase
                    .from('moderation_queue')
                    .update({
                        moderator_notes: `${notes || ''}\n[ERROR: Failed to create discovery: ${createError instanceof Error ? createError.message : 'Unknown error'}]`
                    })
                    .eq('id', queueId);
            }
        }

        return data;
    }

    /**
     * Create discovery from approved moderation queue item
     */
    private async createDiscoveryFromQueueItem(item: any): Promise<void> {
        // Check if discovery already exists
        const { data: existing } = await supabase
            .from('discoveries')
            .select('id')
            .eq('url', item.url)
            .single();

        if (existing) {
            console.log('Discovery already exists for URL:', item.url);
            return;
        }

        // Auto-classify topics based on URL and content
        const topics = this.classifyContent(item.url, item.title, item.description || '');

        // Create the discovery
        const { error } = await supabase
            .from('discoveries')
            .insert({
                url: item.url,
                title: item.title,
                description: item.description,
                domain: item.domain,
                topics: topics,
                read_time: Math.max(1, Math.floor((item.title.length + (item.description?.length || 0)) / 200)),
                submitted_at: item.created_at,
                submitted_by: item.submitted_by,
                // Image and favicon would need to be captured separately if not already done
                created_at: new Date().toISOString()
            });

        if (error) {
            throw new Error(`Failed to create discovery: ${error.message}`);
        }
    }

    /**
     * Simple topic classification (copy from submit route logic)
     */
    private classifyContent(url: string, title: string, description: string): string[] {
        const content = `${url} ${title} ${description}`.toLowerCase();
        const topics: string[] = [];

        const topicKeywords: Record<string, string[]> = {
            'technology': ['tech', 'software', 'computer', 'programming', 'code'],
            'science': ['science', 'research', 'study', 'discovery'],
            'business': ['business', 'finance', 'market', 'economy'],
            'culture': ['art', 'film', 'culture', 'creative'],
            'education': ['learn', 'education', 'course', 'tutorial'],
        };

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
                topics.push(topic);
            }
        });

        return topics.length > 0 ? topics.slice(0, 3) : ['general'];
    }

    /**
     * Bulk review content (approve or reject multiple items)
     */
    async bulkReviewContent(
        queueIds: string[],
        status: 'approved' | 'rejected',
        moderatorId: string,
        notes?: string
    ): Promise<BulkReviewResult> {
        const results: BulkReviewResult = {
            approved: 0,
            rejected: 0,
            failed: [],
        };

        for (const queueId of queueIds) {
            try {
                await this.reviewContent(queueId, status, moderatorId, notes);
                if (status === 'approved') {
                    results.approved!++;
                } else {
                    results.rejected!++;
                }
            } catch (error) {
                results.failed.push(queueId);
            }
        }

        return results;
    }

    /**
     * Get moderation analytics
     */
    async getModerationAnalytics(): Promise<ModerationAnalytics> {
        // Get all moderation queue items
        const { data: allItems, error: allError } = await supabase
            .from('moderation_queue')
            .select('*');

        if (allError) {
            throw new Error(`Failed to get moderation analytics: ${allError.message}`);
        }

        // Calculate statistics
        const totalPending = allItems?.filter(i => i.status === 'pending').length || 0;
        const totalApproved = allItems?.filter(i => i.status === 'approved').length || 0;
        const totalRejected = allItems?.filter(i => i.status === 'rejected').length || 0;
        const totalReviewed = totalApproved + totalRejected;

        // Calculate average review time
        const reviewedItems = allItems?.filter(i => i.reviewed_at) || [];
        let avgReviewTime: number | null = null;
        if (reviewedItems.length > 0) {
            const totalTime = reviewedItems.reduce((sum, item) => {
                const created = new Date(item.created_at).getTime();
                const reviewed = new Date(item.reviewed_at!).getTime();
                return sum + (reviewed - created);
            }, 0);
            avgReviewTime = Math.round(totalTime / reviewedItems.length / (1000 * 60 * 60)); // Convert to hours
        }

        // Get report statistics
        const { data: reports, error: reportsError } = await supabase
            .from('content_reports')
            .select('status');

        if (reportsError) {
            throw new Error(`Failed to get report statistics: ${reportsError.message}`);
        }

        const totalReports = reports?.length || 0;
        const resolvedReports = reports?.filter(r => r.status === 'resolved' || r.status === 'dismissed').length || 0;
        const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;

        return {
            totalPending,
            totalReviewed,
            totalApproved,
            totalRejected,
            avgReviewTime,
            totalReports,
            resolvedReports,
            pendingReports,
        };
    }

    // ========================================================================
    // CONTENT REPORTS METHODS
    // ========================================================================

    /**
     * List content reports with filtering and pagination
     * Enriched with content details, engagement metrics, reporter history, and domain reputation
     */
    async listContentReports(params: ListContentReportsParams) {
        const { status = 'all', discoveryId, limit = 20, offset = 0 } = params;

        let query = supabase
            .from('content_reports')
            .select(`
                *,
                reported_by_user:users!content_reports_reported_by_fkey(
                    id,
                    email,
                    full_name,
                    role
                ),
                resolved_by_user:users!content_reports_resolved_by_fkey(
                    id,
                    email,
                    full_name
                ),
                content!content_reports_content_id_fkey(
                    id,
                    url,
                    title,
                    description,
                    domain,
                    image_url,
                    reading_time_minutes,
                    topics,
                    published_at,
                    created_at
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by status
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by content ID
        if (discoveryId) {
            query = query.eq('content_id', discoveryId);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: reports, error, count } = await query;

        if (error) {
            throw new Error(`Failed to list content reports: ${error.message}`);
        }

        // Enrich reports with additional context
        const enrichedReports = await Promise.all(
            (reports || []).map(async (report) => {
                try {
                    // Get engagement metrics for the content
                    const { data: metrics } = await supabase
                        .from('content_metrics')
                        .select('views_count, likes_count, saves_count, shares_count')
                        .eq('content_id', report.content_id)
                        .maybeSingle();

                    // Get domain reputation
                    const { data: domainRep } = await supabase
                        .from('domain_reputation')
                        .select('trust_score, total_approved, total_rejected, is_blacklisted')
                        .eq('domain', report.content?.domain)
                        .maybeSingle();

                    // Get reporter's history
                    const { data: reporterStats } = await supabase
                        .from('content_reports')
                        .select('id, status')
                        .eq('reported_by', report.reported_by);

                    const reporterTotalReports = reporterStats?.length || 0;
                    const reporterResolvedReports = reporterStats?.filter(r => r.status === 'resolved').length || 0;
                    const reporterDismissedReports = reporterStats?.filter(r => r.status === 'dismissed').length || 0;

                    // Get similar reports for this content
                    const { data: similarReports } = await supabase
                        .from('content_reports')
                        .select('id, reported_by, reason, status')
                        .eq('content_id', report.content_id)
                        .neq('id', report.id)
                        .limit(10);

                    return {
                        ...report,
                        engagement: metrics || { views_count: 0, likes_count: 0, saves_count: 0, shares_count: 0 },
                        domain_reputation: domainRep || null,
                        reporter_history: {
                            total_reports: reporterTotalReports,
                            resolved_reports: reporterResolvedReports,
                            dismissed_reports: reporterDismissedReports,
                            accuracy_rate: reporterTotalReports > 0
                                ? Math.round((reporterResolvedReports / reporterTotalReports) * 100)
                                : 0
                        },
                        similar_reports: similarReports || [],
                        similar_reports_count: similarReports?.length || 0
                    };
                } catch (enrichError) {
                    // If enrichment fails, return report with basic data
                    console.error('Failed to enrich report:', enrichError);
                    return {
                        ...report,
                        engagement: { views_count: 0, likes_count: 0, saves_count: 0, shares_count: 0 },
                        domain_reputation: null,
                        reporter_history: { total_reports: 0, resolved_reports: 0, dismissed_reports: 0, accuracy_rate: 0 },
                        similar_reports: [],
                        similar_reports_count: 0
                    };
                }
            })
        );

        return {
            reports: enrichedReports,
            total: count || 0,
            limit,
            offset,
        };
    }

    /**
     * Get specific content report
     */
    async getContentReport(reportId: string): Promise<ContentReport | null> {
        const { data, error } = await supabase
            .from('content_reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to get content report: ${error.message}`);
        }

        return data;
    }

    /**
     * Resolve content report
     * If dismissed (false report), reactivates the content
     * If resolved (confirmed issue), content stays quarantined
     */
    async resolveContentReport(
        reportId: string,
        status: 'resolved' | 'dismissed',
        resolvedBy: string,
        notes?: string
    ): Promise<ContentReport> {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('content_reports')
            .update({
                status,
                resolved_by: resolvedBy,
                resolved_at: now,
                resolution_notes: notes,
                updated_at: now,
            })
            .eq('id', reportId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to resolve content report: ${error.message}`);
        }

        // If dismissed (false alarm), check if there are other pending reports
        // Only reactivate if this was the last pending report
        if (status === 'dismissed') {
            const { data: otherPendingReports } = await supabase
                .from('content_reports')
                .select('id')
                .eq('content_id', data.content_id)
                .eq('status', 'pending')
                .limit(1);

            // No other pending reports - safe to reactivate
            if (!otherPendingReports || otherPendingReports.length === 0) {
                await supabase
                    .from('content')
                    .update({ is_active: true })
                    .eq('id', data.content_id);
            }
        }
        // If resolved (confirmed issue), content stays quarantined (is_active = false)

        return data;
    }

    /**
     * Create content report (user-facing)
     * Automatically quarantines content until moderator review
     */
    async reportContent(
        contentId: string,
        contentType: 'discovery' | 'submission',
        reportedBy: string,
        reason: string,
        description?: string
    ): Promise<ContentReport> {
        // Create the report
        const { data, error } = await supabase
            .from('content_reports')
            .insert({
                content_id: contentId,
                content_type: contentType,
                reported_by: reportedBy,
                reason,
                description,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            throw error; // Let the route handler deal with unique constraint violations
        }

        // Immediately quarantine the content to prevent further circulation
        // This protects users from potentially harmful content (porn, offensive, etc.)
        await supabase
            .from('content')
            .update({ is_active: false })
            .eq('id', contentId);

        return data;
    }

    // ========================================================================
    // DOMAIN REPUTATION METHODS
    // ========================================================================

    /**
     * List domain reputations with filtering and pagination
     */
    async listDomainReputations(params: ListDomainReputationsParams) {
        const { search, minScore, maxScore, blacklistedOnly, limit = 50, offset = 0 } = params;

        let query = supabase
            .from('domain_reputation')
            .select('*', { count: 'exact' })
            .order('trust_score', { ascending: false });

        // Search by domain
        if (search) {
            query = query.ilike('domain', `%${search}%`);
        }

        // Filter by score range
        if (minScore !== undefined) {
            query = query.gte('trust_score', minScore);
        }
        if (maxScore !== undefined) {
            query = query.lte('trust_score', maxScore);
        }

        // Filter blacklisted only
        if (blacklistedOnly) {
            query = query.eq('is_blacklisted', true);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to list domain reputations: ${error.message}`);
        }

        return {
            domains: data || [],
            total: count || 0,
            limit,
            offset,
        };
    }

    /**
     * Get specific domain reputation
     */
    async getDomainReputation(domain: string): Promise<DomainReputation | null> {
        const { data, error } = await supabase
            .from('domain_reputation')
            .select('*')
            .eq('domain', domain)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw new Error(`Failed to get domain reputation: ${error.message}`);
        }

        return data;
    }

    /**
     * Update domain reputation
     */
    async updateDomainReputation(
        domain: string,
        score: number,
        notes?: string
    ): Promise<DomainReputation> {
        const now = new Date().toISOString();

        // Check if domain exists
        const existing = await this.getDomainReputation(domain);

        if (existing) {
            // Update existing
            const { data, error } = await supabase
                .from('domain_reputation')
                .update({
                    trust_score: score,
                    notes: notes || existing.notes,
                    last_reviewed: now,
                    updated_at: now,
                })
                .eq('domain', domain)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to update domain reputation: ${error.message}`);
            }

            return data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('domain_reputation')
                .insert({
                    domain,
                    trust_score: score,
                    notes,
                    last_reviewed: now,
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create domain reputation: ${error.message}`);
            }

            return data;
        }
    }

    // ========================================================================
    // ROLE CHECKING METHODS
    // ========================================================================

    /**
     * Get user role by Clerk user ID
     * Used for authorization checks
     */
    async getUserRole(clerkUserId: string): Promise<string | null> {
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (error || !user) return null;
        return user.role;
    }

    /**
     * Check if user has required role or higher
     * Role hierarchy: admin > moderator > user
     */
    async checkUserRole(clerkUserId: string, requiredRole: 'user' | 'moderator' | 'admin'): Promise<boolean> {
        const userRole = await this.getUserRole(clerkUserId);
        if (!userRole) return false;

        const roleHierarchy: Record<string, number> = {
            user: 1,
            moderator: 2,
            admin: 3,
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }
}

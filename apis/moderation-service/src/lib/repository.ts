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
            .select('*', { count: 'exact' })
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
     */
    async reviewContent(
        queueId: string,
        status: 'approved' | 'rejected',
        moderatorId: string,
        notes?: string
    ): Promise<ModerationQueueItem> {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('moderation_queue')
            .update({
                status,
                reviewed_by: moderatorId,
                reviewed_at: now,
                review_notes: notes,
                updated_at: now,
            })
            .eq('id', queueId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to review content: ${error.message}`);
        }

        return data;
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
     */
    async listContentReports(params: ListContentReportsParams) {
        const { status = 'all', discoveryId, limit = 20, offset = 0 } = params;

        let query = supabase
            .from('content_reports')
            .select('*', { count: 'exact' })
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

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to list content reports: ${error.message}`);
        }

        return {
            reports: data || [],
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

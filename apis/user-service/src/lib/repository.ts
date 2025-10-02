import { Topic, User } from '../types';
import { supabase } from './supabase';

/**
 * User repository for managing user data and preferences
 * Uses Supabase for persistent storage
 */

export class UserRepository {
    /**
     * Get user by Clerk user ID
     */
    async getUserById(clerkUserId: string): Promise<User | null> {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                user_preferences (
                    wildness,
                    preferred_topics,
                    blocked_domains
                )
            `)
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (error || !user) return null;

        const preferences = user.user_preferences?.[0];

        return {
            id: user.id, // Return internal database UUID, not Clerk user ID
            email: user.email,
            preferredTopics: preferences?.preferred_topics || ['technology', 'culture', 'science'],
            wildness: preferences?.wildness || 50,
            role: user.role || 'user',
            guidelinesAcceptedAt: user.guidelines_accepted_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }

    /**
     * Create a new user with default preferences
     */
    async createUser(clerkUserId: string, preferences?: { preferredTopics?: string[]; wildness?: number }): Promise<User> {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                clerk_user_id: clerkUserId,
            })
            .select()
            .single();

        if (userError || !userData) {
            throw new Error(`Failed to create user: ${userError?.message}`);
        }

        // Create user preferences
        const { error: prefsError } = await supabase
            .from('user_preferences')
            .insert({
                user_id: userData.id,
                wildness: preferences?.wildness || 50,
                preferred_topics: preferences?.preferredTopics || ['technology', 'culture', 'science'],
                blocked_domains: [],
            });

        if (prefsError) {
            throw new Error(`Failed to create user preferences: ${prefsError.message}`);
        }

        return {
            id: userData.id, // Return internal database UUID, not Clerk user ID
            preferredTopics: preferences?.preferredTopics || ['technology', 'culture', 'science'],
            wildness: preferences?.wildness || 50,
            role: 'user', // New users always start as 'user' role
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
        };
    }

    /**
     * Update user preferences
     */
    async updateUserPreferences(
        clerkUserId: string,
        updates: { preferredTopics?: string[]; wildness?: number }
    ): Promise<User | null> {
        // First get the user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (userError || !user) return null;

        // Update preferences
        const updateData: any = {};
        if (updates.preferredTopics) updateData.preferred_topics = updates.preferredTopics;
        if (updates.wildness !== undefined) updateData.wildness = updates.wildness;
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
            .from('user_preferences')
            .update(updateData)
            .eq('user_id', user.id);

        if (updateError) {
            throw new Error(`Failed to update preferences: ${updateError.message}`);
        }

        // Return updated user
        return await this.getUserById(clerkUserId);
    }

    /**
     * Accept community guidelines (sets timestamp)
     */
    async acceptGuidelines(clerkUserId: string): Promise<User | null> {
        // First get the user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (userError || !user) return null;

        // Update guidelines acceptance timestamp
        const { error: updateError } = await supabase
            .from('users')
            .update({
                guidelines_accepted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            throw new Error(`Failed to accept guidelines: ${updateError.message}`);
        }

        // Return updated user
        return await this.getUserById(clerkUserId);
    }



    /**
     * Get all available topics
     */
    async getAvailableTopics(): Promise<Topic[]> {
        const { data: topics, error } = await supabase
            .from('topics')
            .select('*')
            .order('name');

        if (error) {
            throw new Error(`Failed to get topics: ${error.message}`);
        }

        return topics.map(topic => ({
            id: topic.name.toLowerCase(),
            name: topic.name,
            category: topic.description || 'General'
        }));
    }

    /**
     * Validate topic IDs
     */
    async validateTopics(topicIds: string[]): Promise<{ valid: string[]; invalid: string[] }> {
        const { data: topics, error } = await supabase
            .from('topics')
            .select('name');

        if (error) {
            throw new Error(`Failed to validate topics: ${error.message}`);
        }

        const validTopicNames = new Set(topics.map(t => t.name.toLowerCase()));

        const valid = topicIds.filter(id => validTopicNames.has(id.toLowerCase()));
        const invalid = topicIds.filter(id => !validTopicNames.has(id.toLowerCase()));

        return { valid, invalid };
    }

    /**
     * Delete user (for cleanup)
     */
    async deleteUser(clerkUserId: string): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('clerk_user_id', clerkUserId);

        return !error;
    }

    /**
     * Get user count (for admin/stats)
     */
    async getUserCount(): Promise<number> {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            throw new Error(`Failed to get user count: ${error.message}`);
        }

        return count || 0;
    }

    /**
     * Get user role by Clerk user ID
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

    /**
     * Update user role (admin only operation)
     */
    async updateUserRole(clerkUserId: string, newRole: 'user' | 'moderator' | 'admin'): Promise<boolean> {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (userError || !user) return false;

        const { error } = await supabase
            .from('users')
            .update({
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        return !error;
    }

    /**
     * Create a deletion request with 30-day grace period
     */
    async createDeletionRequest(clerkUserId: string, userEmail: string): Promise<any> {
        // Calculate scheduled deletion date (30 days from now)
        const scheduledDeletionAt = new Date();
        scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

        const { data, error } = await supabase
            .from('deletion_requests')
            .insert({
                clerk_user_id: clerkUserId,
                user_email: userEmail,
                requested_at: new Date().toISOString(),
                scheduled_deletion_at: scheduledDeletionAt.toISOString(),
                status: 'pending'
            })
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Failed to create deletion request: ${error?.message}`);
        }

        return {
            id: data.id,
            requestedAt: data.requested_at,
            scheduledDeletionAt: data.scheduled_deletion_at,
            status: data.status
        };
    }

    /**
     * Soft delete user (deactivate account but keep data during grace period)
     */
    async softDeleteUser(clerkUserId: string, deletionRequestId: string): Promise<boolean> {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (userError || !user) return false;

        const { error } = await supabase
            .from('users')
            .update({
                deleted_at: new Date().toISOString(),
                deletion_request_id: deletionRequestId,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        return !error;
    }

    /**
     * Cancel deletion request and restore account
     */
    async cancelDeletionRequest(clerkUserId: string): Promise<User | null> {
        // Get user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, deletion_request_id')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (userError || !user || !user.deletion_request_id) return null;

        // Update deletion request status
        const { error: requestError } = await supabase
            .from('deletion_requests')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: 'User requested cancellation',
                updated_at: new Date().toISOString()
            })
            .eq('id', user.deletion_request_id);

        if (requestError) {
            throw new Error(`Failed to cancel deletion request: ${requestError.message}`);
        }

        // Restore user account (remove soft delete)
        const { error: restoreError } = await supabase
            .from('users')
            .update({
                deleted_at: null,
                deletion_request_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (restoreError) {
            throw new Error(`Failed to restore user account: ${restoreError.message}`);
        }

        // Return updated user
        return await this.getUserById(clerkUserId);
    }

    /**
     * Get deletion request for a user
     */
    async getDeletionRequest(clerkUserId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('deletion_requests')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .eq('status', 'pending')
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            requestedAt: data.requested_at,
            scheduledDeletionAt: data.scheduled_deletion_at,
            status: data.status
        };
    }

    /**
     * Get pending deletion requests (for background job processing)
     */
    async getPendingDeletions(): Promise<any[]> {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('deletion_requests')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_deletion_at', now);

        if (error) {
            throw new Error(`Failed to get pending deletions: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Complete deletion (hard delete user and all data)
     */
    async completeDeletion(deletionRequestId: string): Promise<boolean> {
        // Get the deletion request
        const { data: request, error: requestError } = await supabase
            .from('deletion_requests')
            .select('clerk_user_id')
            .eq('id', deletionRequestId)
            .single();

        if (requestError || !request) return false;

        // Get user id
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', request.clerk_user_id)
            .single();

        if (userError || !user) return false;

        // Delete user (cascades to preferences due to foreign key)
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

        if (deleteError) return false;

        // Mark deletion request as completed
        const { error: completeError } = await supabase
            .from('deletion_requests')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', deletionRequestId);

        return !completeError;
    }

    // ============================================================================
    // ADMIN METHODS FOR DELETION REQUEST MANAGEMENT
    // ============================================================================

    /**
     * List deletion requests with filtering and pagination (admin only)
     */
    async listDeletionRequests(params: {
        status?: 'pending' | 'cancelled' | 'completed';
        search?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ requests: any[]; total: number }> {
        let query = supabase
            .from('deletion_requests')
            .select('*, users!inner(email, full_name, username)', { count: 'exact' });

        // Filter by status
        if (params.status) {
            query = query.eq('status', params.status);
        }

        // Search by email or user ID
        if (params.search) {
            query = query.or(`clerk_user_id.ilike.%${params.search}%,user_email.ilike.%${params.search}%`);
        }

        // Filter by date range
        if (params.startDate) {
            query = query.gte('requested_at', params.startDate);
        }
        if (params.endDate) {
            query = query.lte('requested_at', params.endDate);
        }

        // Pagination
        const limit = params.limit || 20;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1).order('requested_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to list deletion requests: ${error.message}`);
        }

        return {
            requests: data || [],
            total: count || 0
        };
    }

    /**
     * Get deletion request by ID with full details (admin only)
     */
    async getDeletionRequestById(requestId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('deletion_requests')
            .select(`
                *,
                users!inner(
                    email,
                    full_name,
                    username,
                    created_at,
                    last_sign_in_at
                )
            `)
            .eq('id', requestId)
            .single();

        if (error || !data) return null;

        // Calculate days remaining
        const now = new Date();
        const scheduledDate = new Date(data.scheduled_deletion_at);
        const daysRemaining = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
            ...data,
            daysRemaining: Math.max(0, daysRemaining)
        };
    }

    /**
     * Admin cancel deletion request
     */
    async adminCancelDeletion(
        requestId: string,
        adminUserId: string,
        reason: string
    ): Promise<any | null> {
        // Get the deletion request
        const { data: request, error: requestError } = await supabase
            .from('deletion_requests')
            .select('clerk_user_id, status')
            .eq('id', requestId)
            .single();

        if (requestError || !request) return null;

        // Check if request is pending
        if (request.status !== 'pending') {
            return null;
        }

        // Update deletion request
        const { error: updateError } = await supabase
            .from('deletion_requests')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: `Admin cancelled: ${reason} (by ${adminUserId})`,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) {
            throw new Error(`Failed to cancel deletion request: ${updateError.message}`);
        }

        // Get user and restore account
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', request.clerk_user_id)
            .single();

        if (!userError && user) {
            await supabase
                .from('users')
                .update({
                    deleted_at: null,
                    deletion_request_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
        }

        // Return updated request
        return await this.getDeletionRequestById(requestId);
    }

    /**
     * Extend grace period for deletion request (admin only)
     */
    async extendGracePeriod(
        requestId: string,
        additionalDays: number,
        adminUserId: string,
        reason: string
    ): Promise<any | null> {
        // Get current deletion request
        const { data: request, error: requestError } = await supabase
            .from('deletion_requests')
            .select('scheduled_deletion_at, status')
            .eq('id', requestId)
            .single();

        if (requestError || !request) return null;

        // Check if request is pending
        if (request.status !== 'pending') {
            return null;
        }

        // Calculate new scheduled deletion date
        const currentScheduled = new Date(request.scheduled_deletion_at);
        currentScheduled.setDate(currentScheduled.getDate() + additionalDays);

        // Update deletion request
        const { error: updateError } = await supabase
            .from('deletion_requests')
            .update({
                scheduled_deletion_at: currentScheduled.toISOString(),
                cancellation_reason: `Grace period extended by ${additionalDays} days: ${reason} (by admin ${adminUserId})`,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) {
            throw new Error(`Failed to extend grace period: ${updateError.message}`);
        }

        // Return updated request
        return await this.getDeletionRequestById(requestId);
    }

    /**
     * Add admin note to deletion request
     */
    async addDeletionRequestNote(
        requestId: string,
        adminUserId: string,
        note: string
    ): Promise<any | null> {
        // Get current request to append note
        const { data: request, error: requestError } = await supabase
            .from('deletion_requests')
            .select('cancellation_reason')
            .eq('id', requestId)
            .single();

        if (requestError || !request) return null;

        // Append note to cancellation_reason field (repurposed as notes field)
        const timestamp = new Date().toISOString();
        const existingNotes = request.cancellation_reason || '';
        const newNote = `\n[${timestamp}] Admin ${adminUserId}: ${note}`;
        const updatedNotes = existingNotes + newNote;

        const { error: updateError } = await supabase
            .from('deletion_requests')
            .update({
                cancellation_reason: updatedNotes,
                updated_at: timestamp
            })
            .eq('id', requestId);

        if (updateError) {
            throw new Error(`Failed to add note: ${updateError.message}`);
        }

        return {
            note: newNote,
            addedAt: timestamp,
            addedBy: adminUserId
        };
    }

    /**
     * Get deletion analytics (admin only)
     */
    async getDeletionAnalytics(): Promise<any> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get all deletion requests
        const { data: allRequests, error: allError } = await supabase
            .from('deletion_requests')
            .select('*');

        if (allError) {
            throw new Error(`Failed to get deletion analytics: ${allError.message}`);
        }

        // Get requests in last 30 days
        const { data: recentRequests, error: recentError } = await supabase
            .from('deletion_requests')
            .select('*')
            .gte('requested_at', thirtyDaysAgo.toISOString());

        if (recentError) {
            throw new Error(`Failed to get recent deletion requests: ${recentError.message}`);
        }

        // Calculate statistics
        const total = allRequests?.length || 0;
        const pending = allRequests?.filter(r => r.status === 'pending').length || 0;
        const cancelled = allRequests?.filter(r => r.status === 'cancelled').length || 0;
        const completed = allRequests?.filter(r => r.status === 'completed').length || 0;

        const recentTotal = recentRequests?.length || 0;
        const last7Days = recentRequests?.filter(r => 
            new Date(r.requested_at) >= sevenDaysAgo
        ).length || 0;

        // Calculate cancellation rate
        const totalProcessed = cancelled + completed;
        const cancellationRate = totalProcessed > 0 ? (cancelled / totalProcessed) * 100 : 0;

        // Get average time to cancellation
        const cancelledRequests = allRequests?.filter(r => r.status === 'cancelled' && r.cancelled_at) || [];
        let avgTimeToCancellation = 0;
        if (cancelledRequests.length > 0) {
            const totalTime = cancelledRequests.reduce((sum, req) => {
                const requested = new Date(req.requested_at).getTime();
                const cancelled = new Date(req.cancelled_at).getTime();
                return sum + (cancelled - requested);
            }, 0);
            avgTimeToCancellation = Math.round(totalTime / cancelledRequests.length / (1000 * 60 * 60 * 24)); // Convert to days
        }

        return {
            total,
            byStatus: {
                pending,
                cancelled,
                completed
            },
            recentActivity: {
                last30Days: recentTotal,
                last7Days
            },
            cancellationRate: Math.round(cancellationRate * 10) / 10, // Round to 1 decimal
            avgDaysToCancellation: avgTimeToCancellation
        };
    }
}
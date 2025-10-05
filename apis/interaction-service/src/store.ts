import { supabase } from './lib/supabase';
import { Interaction, InteractionStats, SavedDiscovery } from './types';

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

/**
 * Interaction storage using Supabase
 * Handles user interactions, saves, and analytics
 */
class InteractionStore {
    /**
     * Record a user interaction
     */
    async recordInteraction(
        discoveryId: string,
        action: Interaction['action'],
        clerkUserId?: string,
        timeOnPage?: number
    ): Promise<Interaction> {
        // Resolve Clerk user ID to internal UUID
        const userId = clerkUserId ? await resolveUserId(clerkUserId) : null;
        // Map frontend actions to database types
        const typeMapping: Record<string, string> = {
            'up': 'like',
            'down': 'skip',
            'save': 'save',
            'unsave': 'save', // We'll handle unsave separately
            'share': 'share',
            'skip': 'skip',
            'view': 'view'
        };

        const dbType = typeMapping[action] || action;

        // Handle unsave logic first (remove from saved_content)
        if (action === 'unsave' && userId) {
            const { error: unsaveError } = await supabase
                .from('saved_content')
                .delete()
                .match({ user_id: userId, content_id: discoveryId });

            if (unsaveError) {
                console.error('Error unsaving item:', unsaveError);
            }

            // Return a synthetic interaction for unsave since we don't store these
            return {
                id: `unsave-${Date.now()}`,
                discoveryId,
                action: 'unsave' as Interaction['action'],
                at: Date.now(),
            };
        }

        // Record interaction (save actions will trigger saved_content creation via DB trigger)
        // For 'view' type, handle duplicate gracefully (user already viewed this content)
        if (dbType === 'view' && userId) {
            // Check if view already exists
            const { data: existingView } = await supabase
                .from('user_interactions')
                .select('id, created_at')
                .match({
                    user_id: userId,
                    content_id: discoveryId,
                    type: 'view'
                })
                .single();

            if (existingView) {
                // View already recorded, return existing record
                return {
                    id: existingView.id,
                    discoveryId,
                    action: action as Interaction['action'],
                    at: new Date(existingView.created_at).getTime(),
                };
            }
        }

        const { data: interactionData, error: interactionError } = await supabase
            .from('user_interactions')
            .insert({
                content_id: discoveryId,
                type: dbType,
                user_id: userId || null,
                time_spent_seconds: timeOnPage ? Math.round(timeOnPage) : null,
                metadata: {}
            })
            .select()
            .single();

        if (interactionError) {
            // If it's a duplicate key error for views, that's okay - just return a synthetic response
            if (interactionError.code === '23505' && dbType === 'view') {
                console.log('View already recorded for user:', userId, 'content:', discoveryId);
                return {
                    id: `view-${Date.now()}`,
                    discoveryId,
                    action: action as Interaction['action'],
                    at: Date.now(),
                };
            }

            console.error('Error recording interaction:', {
                error: interactionError,
                code: interactionError.code,
                message: interactionError.message,
                details: interactionError.details,
                hint: interactionError.hint,
                discoveryId,
                action,
                dbType,
                userId,
                timeOnPage
            });
            throw new Error(`Failed to record interaction: ${interactionError.message || 'Unknown error'}`);
        }

        return {
            id: interactionData.id,
            discoveryId: interactionData.content_id,
            action: action as Interaction['action'], // Return the original action
            at: new Date(interactionData.created_at).getTime(),
        };
    }

    /**
     * Update analytics summary for a discovery
     * This is now handled by database triggers, but we keep this method for backwards compatibility
     */
    private async updateAnalyticsSummary(discoveryId: string, action: string): Promise<void> {
        // Analytics are now updated automatically by database triggers
        // This method is kept for backwards compatibility but does nothing
        return Promise.resolve();
    }

    /**
     * Get interaction stats for a discovery
     */
    async getStats(discoveryId: string): Promise<InteractionStats> {
        const { data, error } = await supabase
            .from('content_metrics')
            .select('*')
            .eq('content_id', discoveryId)
            .single();

        if (error || !data) {
            return { up: 0, down: 0, saved: false, shares: 0 };
        }

        return {
            up: data.likes_count || 0,
            down: data.skip_count || 0, // Using skip_count as down votes
            saved: false, // This would need user context to determine
            shares: data.shares_count || 0
        };
    }

    /**
     * Check if a discovery is saved by a user
     */
    async isSaved(discoveryId: string, clerkUserId: string): Promise<boolean> {
        // Resolve Clerk user ID to internal UUID
        const userId = await resolveUserId(clerkUserId);
        if (!userId) return false;
        const { data, error } = await supabase
            .from('saved_content')
            .select('id')
            .match({ user_id: userId, content_id: discoveryId })
            .single();

        return !error && !!data;
    }

    /**
     * Get all saved discoveries for a user
     */
    async getSaved(clerkUserId: string): Promise<SavedDiscovery[]> {
        // Resolve Clerk user ID to internal UUID
        const userId = await resolveUserId(clerkUserId);
        if (!userId) {
            console.error('Failed to resolve user ID for saved content:', clerkUserId);
            return [];
        }
        const { data, error } = await supabase
            .from('saved_content')
            .select('content_id, created_at')
            .eq('user_id', userId)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved items:', error);
            return [];
        }

        return data?.map(item => ({
            discoveryId: item.content_id,
            savedAt: new Date(item.created_at).getTime()
        })) || [];
    }

    /**
     * Get all interactions for analytics
     */
    async getAllInteractions(): Promise<Interaction[]> {
        const { data, error } = await supabase
            .from('user_interactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000); // Limit for performance

        if (error) {
            console.error('Error fetching interactions:', error);
            return [];
        }

        return data?.map(item => ({
            id: item.id,
            discoveryId: item.content_id,
            action: item.type as Interaction['action'],
            at: new Date(item.created_at).getTime()
        })) || [];
    }

    /**
     * Get interactions for a specific discovery
     */
    async getInteractionsForDiscovery(discoveryId: string): Promise<Interaction[]> {
        const { data, error } = await supabase
            .from('user_interactions')
            .select('*')
            .eq('content_id', discoveryId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching interactions for discovery:', error);
            return [];
        }

        return data?.map(item => ({
            id: item.id,
            discoveryId: item.content_id,
            action: item.type as Interaction['action'],
            at: new Date(item.created_at).getTime()
        })) || [];
    }
}

export const interactionStore = new InteractionStore();
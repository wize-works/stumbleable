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
            preferredTopics: preferences?.preferred_topics || ['technology', 'culture', 'science'],
            wildness: preferences?.wildness || 50,
            role: user.role || 'user',
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
}
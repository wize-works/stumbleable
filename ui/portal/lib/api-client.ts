/**
 * API client for Stumbleable backend services
 * Handles all HTTP communication with Discovery and Interaction services
 */

import { Discovery, Interaction } from '@/data/types';

// Configuration
const DISCOVERY_API_URL = process.env.NEXT_PUBLIC_DISCOVERY_API_URL || 'http://localhost:7001';
const INTERACTION_API_URL = process.env.NEXT_PUBLIC_INTERACTION_API_URL || 'http://localhost:7002';
const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:7003';
const MODERATION_API_URL = process.env.NEXT_PUBLIC_MODERATION_API_URL || 'http://localhost:7005';
const EMAIL_API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:7006';
const CRAWLER_API_URL = process.env.NEXT_PUBLIC_CRAWLER_API_URL || 'http://localhost:7004';
const DISCOVERY_API = `${DISCOVERY_API_URL}/api`;
const INTERACTION_API = `${INTERACTION_API_URL}/api`; // Direct access to service endpoints
const USER_API = `${USER_API_URL}/api`;
const MODERATION_API = `${MODERATION_API_URL}/api`;
const EMAIL_API = `${EMAIL_API_URL}/api`;
const CRAWLER_API = `${CRAWLER_API_URL}/api`;

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Generic API request helper with authentication
async function apiRequest<T>(
    url: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
    };

    // Only set Content-Type if there's a body
    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    // Add Clerk JWT token if provided
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        headers,
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            let errorDetails = null;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                errorDetails = errorData.details || errorData;
            } catch {
                // If we can't parse the error response, use the generic message
            }

            throw new ApiError(response.status, errorMessage, errorDetails);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or other errors
        throw new ApiError(
            0,
            `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

// Discovery API types
interface NextDiscoveryRequest {
    wildness: number;
    seenIds: string[];
}

interface NextDiscoveryResponse {
    discovery: Discovery;
    score: number;
    reason: string;
    resetRequired?: boolean;
}

interface TrendingResponse {
    discoveries: Discovery[];
    count: number;
}

/**
 * Discovery Service API
 */
export class DiscoveryAPI {
    /**
     * Get the next discovery for a user
     */
    static async getNext(params: {
        wildness: number;
        seenIds: Set<string>;
        token: string;
    }): Promise<NextDiscoveryResponse> {
        const request: NextDiscoveryRequest = {
            wildness: params.wildness,
            seenIds: Array.from(params.seenIds),
        };

        const response = await apiRequest<NextDiscoveryResponse>(
            `${DISCOVERY_API}/next`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            params.token
        );

        // Log the reason for debugging (can be removed in production)
        console.log(`Discovery selected: ${response.discovery.title}`);
        console.log(`Reason: ${response.reason}`);
        console.log(`Score: ${response.score}`);

        return response;
    }

    /**
     * Get trending discoveries (public endpoint, no auth required)
     */
    static async getTrending(token?: string): Promise<Discovery[]> {
        const response = await apiRequest<TrendingResponse>(`${DISCOVERY_API}/trending`, {}, token);
        return response.discoveries;
    }

    /**
     * Get a specific discovery by ID (for shared links and deep linking)
     */
    static async getById(params: {
        id: string;
        token: string;
    }): Promise<NextDiscoveryResponse> {
        const response = await apiRequest<NextDiscoveryResponse>(
            `${DISCOVERY_API}/content/${params.id}`,
            {},
            params.token
        );

        console.log(`Discovery loaded by ID: ${response.discovery.title}`);
        return response;
    }

    /**
     * Explore discoveries with optional topic filtering
     */
    static async explore(params: {
        topic?: string;
        limit?: number;
        offset?: number;
        sortBy?: 'recent' | 'popular' | 'quality';
        token?: string;
    }): Promise<{
        discoveries: Discovery[];
        pagination: {
            limit: number;
            offset: number;
            total: number;
            hasMore: boolean;
        };
        filters: {
            topic: string | null;
            sortBy: string;
        };
    }> {
        const queryParams = new URLSearchParams();
        if (params.topic) queryParams.append('topic', params.topic);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);

        const url = `${DISCOVERY_API}/explore${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return await apiRequest(url, {}, params.token);
    }
}

/**
 * Interaction Service API
 */
export class InteractionAPI {
    private static savedCache = new Set<string>(); // Client-side cache for saved items

    /**
     * Record user feedback
     */
    static async recordFeedback(discoveryId: string, action: Interaction['action'], token: string, timeOnPage?: number): Promise<void> {
        const response = await apiRequest<{ success: boolean; interaction: any; stats: any }>(
            `${INTERACTION_API}/feedback`,
            {
                method: 'POST',
                body: JSON.stringify({
                    discoveryId,
                    action,
                    ...(timeOnPage !== undefined && { timeOnPage })
                }),
            },
            token
        );

        console.log(`Recorded ${action} for discovery ${discoveryId}${timeOnPage ? ` (${timeOnPage}s)` : ''}:`, response);

        // Update local cache for save actions
        if (action === 'save') {
            if (this.savedCache.has(discoveryId)) {
                this.savedCache.delete(discoveryId);
            } else {
                this.savedCache.add(discoveryId);
            }
        }
    }

    /**
     * Get saved discoveries with full details
     */
    static async getSaved(token: string): Promise<Discovery[]> {
        const response = await apiRequest<{ success: boolean; saved: { discoveryId: string; savedAt: number }[] }>(
            `${INTERACTION_API}/saved`,
            {},
            token
        );
        const savedItems = response.saved;

        // Update cache
        this.savedCache.clear();
        savedItems.forEach(item => this.savedCache.add(item.discoveryId));

        // Fetch full discovery details for each saved item
        const savedDiscoveries: Discovery[] = [];

        for (const item of savedItems) {
            try {
                const discovery = await apiRequest<{ discovery: Discovery }>(
                    `${DISCOVERY_API}/content/${item.discoveryId}`,
                    {},
                    token
                );
                savedDiscoveries.push(discovery.discovery);
            } catch (error) {
                console.error(`Error fetching discovery ${item.discoveryId}:`, error);
                // Continue with other items if one fails
            }
        }

        return savedDiscoveries;
    }

    /**
     * Check if a discovery is saved (synchronous for immediate UI response)
     */
    static isSaved(discoveryId: string): boolean {
        // Use cached value for immediate UI response
        return this.savedCache.has(discoveryId);
    }

    /**
     * Initialize saved cache by fetching all saved items
     */
    static async initializeSavedCache(token: string): Promise<void> {
        try {
            await this.getSaved(token);
        } catch (error) {
            console.error('Error initializing saved cache:', error);
            // Continue with empty cache if there's an error
        }
    }

    /**
     * Get analytics summary
     */
    static async getAnalyticsSummary(token: string): Promise<{
        totalInteractions: number;
        byAction: Record<string, number>;
        savedCount: number;
    }> {
        const response = await apiRequest<{
            success: boolean;
            summary: {
                totalInteractions: number;
                byAction: Record<string, number>;
                savedCount: number;
            };
        }>(`${INTERACTION_API}/analytics/summary`, {}, token);
        return response.summary;
    }

    /**
     * Get recent interactions
     */
    static async getRecentInteractions(token: string): Promise<Interaction[]> {
        const response = await apiRequest<{
            success: boolean;
            interactions: Interaction[];
        }>(`${INTERACTION_API}/analytics/recent`, {}, token);
        return response.interactions;
    }

    /**
     * Get interaction stats for a discovery
     */
    static async getStats(discoveryId: string, token: string): Promise<{ up: number; down: number; saved: boolean; shares: number }> {
        const response = await apiRequest<{ success: boolean; stats: { up: number; down: number; saved: boolean; shares: number } }>(
            `${INTERACTION_API}/stats/${discoveryId}`,
            {},
            token
        );
        return response.stats;
    }

    /**
     * Check if a discovery is saved (async - updates cache)
     */
    static async checkSaved(discoveryId: string, token: string): Promise<boolean> {
        const response = await apiRequest<{ success: boolean; isSaved: boolean }>(
            `${INTERACTION_API}/saved/${discoveryId}`,
            {},
            token
        );
        const isSaved = response.isSaved;

        // Update cache
        if (isSaved) {
            this.savedCache.add(discoveryId);
        } else {
            this.savedCache.delete(discoveryId);
        }

        return isSaved;
    }
}

/**
 * User Service API
 */
export class UserAPI {
    /**
     * Create user after Clerk authentication (called once after signup)
     */
    static async createUser(userId: string, token: string, userData?: {
        email?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        imageUrl?: string;
        preferredTopics?: string[];
        wildness?: number;
    }): Promise<{ id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string }> {
        const response = await apiRequest<{ user: { id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string } }>(
            `${USER_API}/users`,
            {
                method: 'POST',
                body: JSON.stringify({ userId, userData }),
            },
            token
        );
        return response.user;
    }

    /**
     * Get existing user profile (does not create if missing)
     */
    static async getUser(userId: string, token: string): Promise<{ id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string }> {
        const response = await apiRequest<{ user: { id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string } }>(
            `${USER_API}/users/${userId}`,
            {},
            token
        );
        return response.user;
    }

    /**
     * Initialize user with default preferences (called during first visit)
     */
    static async initializeUser(userId: string, token: string): Promise<{ id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string }> {
        try {
            // First try to get existing user
            return await this.getUser(userId, token);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                // User doesn't exist, create with defaults
                return await this.createUser(userId, token, {
                    preferredTopics: ['technology', 'culture', 'science'],
                    wildness: 35
                });
            }
            throw error;
        }
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(
        userId: string,
        updates: { preferredTopics?: string[]; wildness?: number },
        token: string
    ): Promise<{ id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string }> {
        const response = await apiRequest<{ user: { id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string } }>(
            `${USER_API}/users/${userId}/preferences`,
            {
                method: 'PUT',
                body: JSON.stringify(updates),
            },
            token
        );
        return response.user;
    }

    /**
     * Accept community guidelines
     */
    static async acceptGuidelines(userId: string, token: string): Promise<{ id: string; guidelinesAcceptedAt: string }> {
        const response = await apiRequest<{ user: { id: string; guidelinesAcceptedAt: string } }>(
            `${USER_API}/users/${userId}/accept-guidelines`,
            {
                method: 'PUT',
            },
            token
        );
        return response.user;
    }

    /**
     * Get available topics
     */
    static async getTopics(token: string): Promise<Array<{ id: string; name: string; category?: string }>> {
        const response = await apiRequest<{ topics: Array<{ id: string; name: string; category?: string }> }>(
            `${USER_API}/topics`,
            {},
            token
        );
        return response.topics;
    }

    /**
     * Check if user has required role
     */
    static async checkRole(token: string, requiredRole: 'user' | 'moderator' | 'admin'): Promise<{
        userId: string;
        role: string;
        hasAccess: boolean;
        requiredRole: string;
    }> {
        const response = await apiRequest<{
            userId: string;
            role: string;
            hasAccess: boolean;
            requiredRole: string;
        }>(
            `${USER_API}/roles/check?required=${requiredRole}`,
            {},
            token
        );
        return response;
    }

    /**
     * Get current user's role
     */
    static async getMyRole(token: string): Promise<{ userId: string; role: 'user' | 'moderator' | 'admin' }> {
        const response = await apiRequest<{ userId: string; role: 'user' | 'moderator' | 'admin' }>(
            `${USER_API}/roles/me`,
            {},
            token
        );
        return response;
    }

    /**
     * Update user role (admin only)
     */
    static async updateRole(
        userId: string,
        newRole: 'user' | 'moderator' | 'admin',
        token: string
    ): Promise<{ success: boolean; userId: string; newRole: string }> {
        const response = await apiRequest<{ success: boolean; userId: string; newRole: string }>(
            `${USER_API}/roles/${userId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            },
            token
        );
        return response;
    }

    /**
     * Get user analytics (admin only)
     */
    static async getUserAnalytics(token: string): Promise<{
        analytics: {
            totalUsers: number;
            activeUsers7Days: number;
            activeUsers30Days: number;
            newUsersToday: number;
            newUsers7Days: number;
            newUsers30Days: number;
            usersByRole: {
                user: number;
                moderator: number;
                admin: number;
            };
        };
    }> {
        const response = await apiRequest<{
            analytics: {
                totalUsers: number;
                activeUsers7Days: number;
                activeUsers30Days: number;
                newUsersToday: number;
                newUsers7Days: number;
                newUsers30Days: number;
                usersByRole: {
                    user: number;
                    moderator: number;
                    admin: number;
                };
            };
        }>(
            `${USER_API}/admin/users/analytics`,
            {},
            token
        );
        return response;
    }

    /**
     * Get recent users (admin only)
     */
    static async getRecentUsers(days: number, token: string): Promise<{
        users: Array<{
            id: string;
            email: string;
            full_name?: string;
            created_at: string;
            role?: string;
        }>;
    }> {
        const response = await apiRequest<{
            users: Array<{
                id: string;
                email: string;
                full_name?: string;
                created_at: string;
                role?: string;
            }>;
        }>(
            `${USER_API}/admin/users/recent?days=${days}`,
            {},
            token
        );
        return response;
    }

    /**
     * Request account deletion (starts 30-day grace period)
     */
    static async requestDeletion(userId: string, token: string): Promise<{
        deletionRequest: {
            id: string;
            requestedAt: string;
            scheduledDeletionAt: string;
            status: string;
        };
        message: string;
    }> {
        const response = await apiRequest<{
            deletionRequest: {
                id: string;
                requestedAt: string;
                scheduledDeletionAt: string;
                status: string;
            };
            message: string;
        }>(
            `${USER_API}/users/${userId}/deletion-request`,
            {
                method: 'POST',
            },
            token
        );
        return response;
    }

    /**
     * Cancel deletion request (restore account during grace period)
     */
    static async cancelDeletion(userId: string, token: string): Promise<{
        message: string;
        user: { id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string };
    }> {
        const response = await apiRequest<{
            message: string;
            user: { id: string; preferredTopics: string[]; wildness: number; guidelinesAcceptedAt?: string };
        }>(
            `${USER_API}/users/${userId}/cancel-deletion`,
            {
                method: 'POST',
            },
            token
        );
        return response;
    }

    /**
     * Get deletion request status
     */
    static async getDeletionStatus(userId: string, token: string): Promise<{
        deletionRequest: {
            id: string;
            requestedAt: string;
            scheduledDeletionAt: string;
            status: string;
        };
    } | null> {
        try {
            const response = await apiRequest<{
                deletionRequest: {
                    id: string;
                    requestedAt: string;
                    scheduledDeletionAt: string;
                    status: string;
                };
            }>(
                `${USER_API}/users/${userId}/deletion-request`,
                {},
                token
            );
            return response;
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }
}

/**
 * Admin API for managing deletion requests and user accounts
 */
export class AdminAPI {
    /**
     * List deletion requests with filters and pagination
     */
    static async listDeletionRequests(
        filters: {
            status?: 'pending' | 'cancelled' | 'completed' | 'all';
            search?: string;
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        },
        token: string
    ): Promise<{ requests: any[]; total: number; limit: number; offset: number }> {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        const response = await apiRequest<{ requests: any[]; total: number; limit: number; offset: number }>(
            `${USER_API}/admin/deletion-requests?${params.toString()}`,
            {},
            token
        );
        return response;
    }

    /**
     * Get detailed deletion request by ID
     */
    static async getDeletionRequest(requestId: string, token: string): Promise<{ request: any }> {
        const response = await apiRequest<{ request: any }>(
            `${USER_API}/admin/deletion-requests/${requestId}`,
            {},
            token
        );
        return response;
    }

    /**
     * Admin cancel deletion request
     */
    static async cancelDeletionRequest(
        requestId: string,
        reason: string,
        token: string
    ): Promise<{ message: string; request: any }> {
        const response = await apiRequest<{ message: string; request: any }>(
            `${USER_API}/admin/deletion-requests/${requestId}/cancel`,
            {
                method: 'POST',
                body: JSON.stringify({ reason }),
            },
            token
        );
        return response;
    }

    /**
     * Extend grace period for deletion request
     */
    static async extendGracePeriod(
        requestId: string,
        additionalDays: number,
        reason: string,
        token: string
    ): Promise<{ message: string; request: any }> {
        const response = await apiRequest<{ message: string; request: any }>(
            `${USER_API}/admin/deletion-requests/${requestId}/extend`,
            {
                method: 'POST',
                body: JSON.stringify({ additionalDays, reason }),
            },
            token
        );
        return response;
    }

    /**
     * Add note to deletion request
     */
    static async addNote(
        requestId: string,
        note: string,
        token: string
    ): Promise<{ message: string; note: any }> {
        const response = await apiRequest<{ message: string; note: any }>(
            `${USER_API}/admin/deletion-requests/${requestId}/notes`,
            {
                method: 'POST',
                body: JSON.stringify({ note }),
            },
            token
        );
        return response;
    }

    /**
     * Get deletion analytics summary
     */
    static async getDeletionAnalytics(token: string): Promise<{ analytics: any }> {
        const response = await apiRequest<{ analytics: any }>(
            `${USER_API}/admin/deletion-requests/analytics/summary`,
            {},
            token
        );
        return response;
    }
}

/**
 * Lists Service API (H3: Lists & Collections)
 */
export interface UserList {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    emoji?: string;
    color?: string;
    is_public: boolean;
    is_collaborative: boolean;
    is_quest: boolean;
    quest_config?: any;
    item_count: number;
    view_count: number;
    follower_count: number;
    created_at: string;
    updated_at: string;
}

export interface ListItem {
    id: string;
    list_id: string;
    content_id: string;
    user_id: string;
    position: number;
    notes?: string;
    is_checkpoint: boolean;
    checkpoint_order?: number;
    added_at: string;
    content?: Discovery;
}

export class ListsAPI {
    /**
     * Get user's lists
     */
    static async getUserLists(userId: string, token: string): Promise<{ lists: UserList[] }> {
        return apiRequest<{ lists: UserList[] }>(
            `${USER_API}/lists?userId=${userId}`,
            {},
            token
        );
    }

    /**
     * Get public lists
     */
    static async getPublicLists(
        limit: number = 20,
        offset: number = 0,
        search?: string
    ): Promise<{ lists: UserList[]; total: number; offset: number; limit: number }> {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        return apiRequest<{ lists: UserList[]; total: number; offset: number; limit: number }>(
            `${USER_API}/lists/public?limit=${limit}&offset=${offset}${searchParam}`
        );
    }

    /**
     * Get user's followed lists
     */
    static async getFollowedLists(userId: string, token: string): Promise<{ lists: any[] }> {
        return apiRequest<{ lists: any[] }>(
            `${USER_API}/lists/followed?userId=${userId}`,
            {},
            token
        );
    }

    /**
     * Get a specific list with items
     */
    static async getList(
        listId: string,
        token?: string
    ): Promise<{ list: UserList & { list_items: ListItem[] } }> {
        return apiRequest<{ list: UserList & { list_items: ListItem[] } }>(
            `${USER_API}/lists/${listId}`,
            {},
            token
        );
    }

    /**
     * Create a new list
     */
    static async createList(
        userId: string,
        data: {
            title: string;
            description?: string;
            emoji?: string;
            color?: string;
            isPublic?: boolean;
            isCollaborative?: boolean;
            isQuest?: boolean;
            questConfig?: any;
        },
        token: string
    ): Promise<{ list: UserList }> {
        return apiRequest<{ list: UserList }>(
            `${USER_API}/lists`,
            {
                method: 'POST',
                body: JSON.stringify({ userId, ...data }),
            },
            token
        );
    }

    /**
     * Update a list
     */
    static async updateList(
        listId: string,
        data: Partial<{
            title: string;
            description: string;
            emoji: string;
            color: string;
            isPublic: boolean;
            isCollaborative: boolean;
        }>,
        token: string
    ): Promise<{ list: UserList }> {
        return apiRequest<{ list: UserList }>(
            `${USER_API}/lists/${listId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            },
            token
        );
    }

    /**
     * Toggle list visibility (public/private)
     */
    static async toggleVisibility(
        listId: string,
        isPublic: boolean,
        token: string
    ): Promise<{ list: UserList }> {
        return apiRequest<{ list: UserList }>(
            `${USER_API}/lists/${listId}/visibility`,
            {
                method: 'POST',
                body: JSON.stringify({ isPublic }),
            },
            token
        );
    }

    /**
     * Delete a list
     */
    static async deleteList(listId: string, token: string): Promise<{ success: boolean }> {
        return apiRequest<{ success: boolean }>(
            `${USER_API}/lists/${listId}`,
            {
                method: 'DELETE',
            },
            token
        );
    }

    /**
     * Add item to list
     */
    static async addItemToList(
        listId: string,
        data: {
            contentId: string;
            notes?: string;
            position?: number;
        },
        token: string
    ): Promise<{ item: ListItem }> {
        return apiRequest<{ item: ListItem }>(
            `${INTERACTION_API}/lists/${listId}/items`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        );
    }

    /**
     * Remove item from list
     */
    static async removeItemFromList(
        listId: string,
        itemId: string,
        token: string
    ): Promise<{ success: boolean }> {
        return apiRequest<{ success: boolean }>(
            `${INTERACTION_API}/lists/${listId}/items/${itemId}`,
            {
                method: 'DELETE',
            },
            token
        );
    }

    /**
     * Follow a public list
     */
    static async followList(
        listId: string,
        userId: string,
        token: string,
        notifyOnNewItems: boolean = false
    ): Promise<{ follow: any }> {
        return apiRequest<{ follow: any }>(
            `${USER_API}/lists/${listId}/follow`,
            {
                method: 'POST',
                body: JSON.stringify({ userId, notifyOnNewItems }),
            },
            token
        );
    }

    /**
     * Unfollow a list
     */
    static async unfollowList(
        listId: string,
        userId: string,
        token: string
    ): Promise<{ success: boolean }> {
        return apiRequest<{ success: boolean }>(
            `${USER_API}/lists/${listId}/follow?userId=${userId}`,
            {
                method: 'DELETE',
            },
            token
        );
    }

    /**
     * Add collaborator to list
     */
    static async addCollaborator(
        listId: string,
        data: {
            userId: string;
            canAddItems?: boolean;
            canRemoveItems?: boolean;
            canEditList?: boolean;
        },
        token: string
    ): Promise<{ collaborator: any }> {
        return apiRequest<{ collaborator: any }>(
            `${USER_API}/lists/${listId}/collaborators`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        );
    }

    /**
     * Remove collaborator from list
     */
    static async removeCollaborator(
        listId: string,
        userId: string,
        token: string
    ): Promise<{ success: boolean }> {
        return apiRequest<{ success: boolean }>(
            `${USER_API}/lists/${listId}/collaborators/${userId}`,
            {
                method: 'DELETE',
            },
            token
        );
    }
}

/**
 * Moderation API Types
 */
export interface ModerationQueueItem {
    id: string;
    discovery_id: string;
    url: string;
    title: string;
    description?: string;
    domain: string;
    issues?: string[];
    confidence_score?: number;
    status: 'pending' | 'approved' | 'rejected' | 'reviewing';
    submitted_by: string;
    submitted_by_user?: {
        id: string;
        email: string;
        full_name?: string;
    };
    reviewed_by?: string;
    reviewed_by_user?: {
        id: string;
        email: string;
        full_name?: string;
    };
    moderator_notes?: string;
    created_at: string;
    reviewed_at?: string;
}

export interface ContentReport {
    id: string;
    content_id: string;
    content_type?: 'discovery' | 'submission';
    reported_by: string;
    reported_by_user?: {
        id: string;
        email: string;
        full_name?: string;
        role?: string;
    };
    reason: 'spam' | 'inappropriate' | 'broken-link' | 'misleading' | 'copyright' | 'other';
    description?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    resolved_by?: string;
    resolved_by_user?: {
        id: string;
        email: string;
        full_name?: string;
    };
    resolution_notes?: string;
    created_at: string;
    resolved_at?: string;
    updated_at?: string;
    content?: {
        id: string;
        url: string;
        title: string;
        description?: string;
        domain: string;
        image_url?: string;
        reading_time_minutes?: number;
        topics?: string[];
        published_at?: string;
        created_at?: string;
    };
    engagement?: {
        views_count: number;
        likes_count: number;
        saves_count: number;
        shares_count: number;
    };
    domain_reputation?: {
        trust_score: number;
        total_approved: number;
        total_rejected: number;
        is_blacklisted: boolean;
    } | null;
    reporter_history?: {
        total_reports: number;
        resolved_reports: number;
        dismissed_reports: number;
        accuracy_rate: number;
    };
    similar_reports?: Array<{
        id: string;
        reported_by: string;
        reason: string;
        status: string;
    }>;
    similar_reports_count?: number;
}

export interface DomainReputation {
    domain: string;
    reputation_score: number;
    total_submissions: number;
    approved_count: number;
    rejected_count: number;
    flagged_count: number;
    moderator_notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ModerationAnalytics {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    avgReviewTime: number | null;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
}

/**
 * Moderation API - Content moderation, reports, and domain management
 */
export class ModerationAPI {
    /**
     * List moderation queue items
     */
    static async listModerationQueue(
        filters: {
            status?: 'pending' | 'approved' | 'rejected' | 'reviewing' | 'all';
            search?: string;
            limit?: number;
            offset?: number;
        },
        token: string
    ): Promise<{
        items: ModerationQueueItem[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        return apiRequest<{
            items: ModerationQueueItem[];
            total: number;
            limit: number;
            offset: number;
        }>(
            `${MODERATION_API}/moderation/queue?${params.toString()}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Get specific moderation queue item
     */
    static async getModerationQueueItem(
        queueId: string,
        token: string
    ): Promise<{ item: ModerationQueueItem }> {
        return apiRequest<{ item: ModerationQueueItem }>(
            `${MODERATION_API}/moderation/queue/${queueId}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Review content (approve or reject)
     */
    static async reviewContent(
        queueId: string,
        status: 'approved' | 'rejected',
        moderatorNotes: string | undefined,
        token: string
    ): Promise<{ success: boolean; item: ModerationQueueItem }> {
        return apiRequest<{ success: boolean; item: ModerationQueueItem }>(
            `${MODERATION_API}/moderation/queue/${queueId}/review`,
            {
                method: 'POST',
                body: JSON.stringify({ status, moderatorNotes }),
            },
            token
        );
    }

    /**
     * Bulk approve content
     */
    static async bulkApprove(
        queueIds: string[],
        moderatorNotes: string | undefined,
        token: string
    ): Promise<{ success: boolean; approved: number; failed: number }> {
        return apiRequest<{
            success: boolean;
            approved: number;
            failed: number;
        }>(
            `${MODERATION_API}/moderation/queue/bulk-approve`,
            {
                method: 'POST',
                body: JSON.stringify({ queueIds, moderatorNotes }),
            },
            token
        );
    }

    /**
     * Bulk reject content
     */
    static async bulkReject(
        queueIds: string[],
        moderatorNotes: string | undefined,
        token: string
    ): Promise<{ success: boolean; rejected: number; failed: number }> {
        return apiRequest<{
            success: boolean;
            rejected: number;
            failed: number;
        }>(
            `${MODERATION_API}/moderation/queue/bulk-reject`,
            {
                method: 'POST',
                body: JSON.stringify({ queueIds, moderatorNotes }),
            },
            token
        );
    }

    /**
     * Get moderation analytics
     */
    static async getModerationAnalytics(
        token: string
    ): Promise<{ analytics: ModerationAnalytics }> {
        return apiRequest<{ analytics: ModerationAnalytics }>(
            `${MODERATION_API}/moderation/analytics`,
            { method: 'GET' },
            token
        );
    }

    /**
     * List content reports
     */
    static async listContentReports(
        filters: {
            status?: 'pending' | 'resolved' | 'dismissed' | 'all';
            discoveryId?: string;
            limit?: number;
            offset?: number;
        },
        token: string
    ): Promise<{
        reports: ContentReport[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.discoveryId) params.append('discoveryId', filters.discoveryId);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        return apiRequest<{
            reports: ContentReport[];
            total: number;
            limit: number;
            offset: number;
        }>(
            `${MODERATION_API}/moderation/reports?${params.toString()}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Get specific content report
     */
    static async getContentReport(
        reportId: string,
        token: string
    ): Promise<{ report: ContentReport }> {
        return apiRequest<{ report: ContentReport }>(
            `${MODERATION_API}/moderation/reports/${reportId}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Resolve content report
     */
    static async resolveReport(
        reportId: string,
        status: 'resolved' | 'dismissed',
        notes: string | undefined,
        token: string
    ): Promise<{ success: boolean; report: ContentReport }> {
        return apiRequest<{ success: boolean; report: ContentReport }>(
            `${MODERATION_API}/moderation/reports/${reportId}/resolve`,
            {
                method: 'POST',
                body: JSON.stringify({ status, notes }),
            },
            token
        );
    }

    /**
     * Report content (user-facing)
     */
    static async reportContent(
        contentId: string,
        reason: 'spam' | 'inappropriate' | 'broken' | 'offensive' | 'copyright' | 'other',
        description: string | undefined,
        token: string,
        contentType: 'discovery' | 'submission' = 'discovery'
    ): Promise<{ success: boolean; report: ContentReport }> {
        return apiRequest<{ success: boolean; report: ContentReport }>(
            `${MODERATION_API}/moderation/report`,
            {
                method: 'POST',
                body: JSON.stringify({ contentId, contentType, reason, description }),
            },
            token
        );
    }

    /**
     * List domain reputations
     */
    static async listDomainReputations(
        filters: {
            search?: string;
            minScore?: number;
            maxScore?: number;
            limit?: number;
            offset?: number;
        },
        token: string
    ): Promise<{
        domains: DomainReputation[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.minScore !== undefined) params.append('minScore', filters.minScore.toString());
        if (filters.maxScore !== undefined) params.append('maxScore', filters.maxScore.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        return apiRequest<{
            domains: DomainReputation[];
            total: number;
            limit: number;
            offset: number;
        }>(
            `${MODERATION_API}/moderation/domains?${params.toString()}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Get specific domain reputation
     */
    static async getDomainReputation(
        domain: string,
        token: string
    ): Promise<{ reputation: DomainReputation }> {
        return apiRequest<{ reputation: DomainReputation }>(
            `${MODERATION_API}/moderation/domains/${encodeURIComponent(domain)}`,
            { method: 'GET' },
            token
        );
    }

    /**
     * Update domain reputation
     */
    static async updateDomainReputation(
        domain: string,
        score: number,
        notes: string | undefined,
        token: string
    ): Promise<{ success: boolean; reputation: DomainReputation }> {
        return apiRequest<{ success: boolean; reputation: DomainReputation }>(
            `${MODERATION_API}/moderation/domains/${encodeURIComponent(domain)}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ score, notes }),
            },
            token
        );
    }
}

/**
 * Email Service API Types
 */
export interface EmailPreferences {
    user_id: string;
    welcome_email: boolean;
    weekly_trending: boolean;
    weekly_new: boolean;
    saved_digest: boolean;
    submission_updates: boolean;
    re_engagement: boolean;
    account_notifications: boolean;
    unsubscribed_all: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Email Service API - Manage email preferences and notifications
 */
export class EmailAPI {
    /**
     * Get user's email preferences
     */
    static async getPreferences(userId: string, token: string): Promise<EmailPreferences> {
        const response = await apiRequest<{ preferences: EmailPreferences }>(
            `${EMAIL_API}/preferences/${userId}`,
            {},
            token
        );
        return response.preferences;
    }

    /**
     * Update user's email preferences
     */
    static async updatePreferences(
        userId: string,
        preferences: Partial<Omit<EmailPreferences, 'user_id' | 'created_at' | 'updated_at'>>,
        token: string
    ): Promise<EmailPreferences> {
        const response = await apiRequest<{ preferences: EmailPreferences }>(
            `${EMAIL_API}/preferences/${userId}`,
            {
                method: 'PUT',
                body: JSON.stringify(preferences),
            },
            token
        );
        return response.preferences;
    }

    /**
     * Unsubscribe from all emails (one-click unsubscribe)
     */
    static async unsubscribeAll(userId: string, token?: string): Promise<{ success: boolean; message: string }> {
        const response = await apiRequest<{ success: boolean; message: string }>(
            `${EMAIL_API}/preferences/${userId}/unsubscribe`,
            {
                method: 'POST',
            },
            token
        );
        return response;
    }

    /**
     * Resubscribe to emails
     */
    static async resubscribe(userId: string, token: string): Promise<{ success: boolean; message: string }> {
        const response = await apiRequest<{ success: boolean; message: string }>(
            `${EMAIL_API}/preferences/${userId}/resubscribe`,
            {
                method: 'POST',
            },
            token
        );
        return response;
    }
}

/**
 * Crawler Service API Types
 */
export interface CrawlerSource {
    id: string;
    name: string;
    type: 'rss' | 'sitemap' | 'web';
    url: string;
    domain: string;
    crawl_frequency_hours: number;
    topics: string[];
    enabled: boolean;
    created_at: string;
    updated_at: string;
    last_crawled_at?: string;
    next_crawl_at?: string;
}

export interface CrawlerJob {
    id: string;
    source_id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
    items_found: number;
    items_submitted: number;
    items_failed: number;
    error_message?: string;
}

/**
 * Crawler Service API - RSS feeds, sitemaps, and website crawling
 */
export class CrawlerAPI {
    /**
     * Get all crawler sources
     */
    static async getSources(token: string): Promise<CrawlerSource[]> {
        const response = await apiRequest<{ sources: CrawlerSource[] }>(
            `${CRAWLER_API}/sources`,
            {},
            token
        );
        return response.sources;
    }

    /**
     * Get a specific crawler source
     */
    static async getSource(sourceId: string, token: string): Promise<CrawlerSource> {
        const response = await apiRequest<{ source: CrawlerSource }>(
            `${CRAWLER_API}/sources/${sourceId}`,
            {},
            token
        );
        return response.source;
    }

    /**
     * Create a new crawler source
     */
    static async createSource(data: {
        name: string;
        type: 'rss' | 'sitemap' | 'web';
        url: string;
        crawl_frequency_hours: number;
        topics: string[];
        enabled: boolean;
    }, token: string): Promise<CrawlerSource> {
        const response = await apiRequest<{ source: CrawlerSource }>(
            `${CRAWLER_API}/sources`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        );
        return response.source;
    }

    /**
     * Update a crawler source
     */
    static async updateSource(
        sourceId: string,
        data: Partial<{
            name: string;
            type: 'rss' | 'sitemap' | 'web';
            url: string;
            crawl_frequency_hours: number;
            topics: string[];
            enabled: boolean;
        }>,
        token: string
    ): Promise<CrawlerSource> {
        const response = await apiRequest<{ source: CrawlerSource }>(
            `${CRAWLER_API}/sources/${sourceId}`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            },
            token
        );
        return response.source;
    }

    /**
     * Delete a crawler source
     */
    static async deleteSource(sourceId: string, token: string): Promise<void> {
        await apiRequest<{ success: boolean }>(
            `${CRAWLER_API}/sources/${sourceId}`,
            {
                method: 'DELETE',
            },
            token
        );
    }

    /**
     * Trigger manual crawl for a source
     */
    static async triggerCrawl(sourceId: string, token: string): Promise<CrawlerJob> {
        const response = await apiRequest<{ job: CrawlerJob; message: string }>(
            `${CRAWLER_API}/crawl/${sourceId}`,
            {
                method: 'POST',
            },
            token
        );
        return response.job;
    }

    /**
     * Get all crawler jobs
     */
    static async getJobs(token: string): Promise<CrawlerJob[]> {
        const response = await apiRequest<{ jobs: CrawlerJob[] }>(
            `${CRAWLER_API}/jobs`,
            {},
            token
        );
        return response.jobs;
    }

    /**
     * Get jobs for a specific source
     */
    static async getJobsForSource(sourceId: string, token: string): Promise<CrawlerJob[]> {
        const response = await apiRequest<{ jobs: CrawlerJob[] }>(
            `${CRAWLER_API}/jobs?source_id=${sourceId}`,
            {},
            token
        );
        return response.jobs;
    }

    /**
     * Get a specific crawler job
     */
    static async getJob(jobId: string, token: string): Promise<CrawlerJob> {
        const response = await apiRequest<{ job: CrawlerJob }>(
            `${CRAWLER_API}/jobs/${jobId}`,
            {},
            token
        );
        return response.job;
    }

    /**
     * Auto-discover feeds and sitemaps for a website (placeholder - not implemented yet)
     */
    static async autoDiscover(url: string): Promise<{
        feeds: Array<{ url: string; type: string; title?: string }>;
        sitemaps: Array<{ url: string; type: string }>;
    }> {
        // TODO: Implement autodiscover endpoint in crawler service
        return {
            feeds: [],
            sitemaps: []
        };
    }

    /**
     * Get metadata enhancement status
     */
    static async getEnhancementStatus(token: string): Promise<{
        total_content: number;
        needs_enhancement: number;
        already_scraped: number;
        has_image: number;
        has_author: number;
        has_content: number;
        has_word_count: number;
    }> {
        const response = await apiRequest<{
            total_content: number;
            needs_enhancement: number;
            already_scraped: number;
            has_image: number;
            has_author: number;
            has_content: number;
            has_word_count: number;
        }>(
            `${CRAWLER_API}/enhance/status`,
            {},
            token
        );
        return response;
    }

    /**
     * Enhance metadata for content records
     */
    static async enhanceMetadata(data: {
        contentIds?: string[];
        batchSize?: number;
        forceRescrape?: boolean;
    }, token: string): Promise<{
        message: string;
        processed: number;
        enhanced: number;
        results: Array<{
            id: string;
            url: string;
            status: string;
            fieldsAdded?: string[];
        }>;
    }> {
        const response = await apiRequest<{
            message: string;
            processed: number;
            enhanced: number;
            results: Array<{
                id: string;
                url: string;
                status: string;
                fieldsAdded?: string[];
            }>;
        }>(
            `${CRAWLER_API}/enhance/metadata`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        );
        return response;
    }

    /**
     * Batch upload CSV file with content URLs
     */
    static async batchUpload(file: File, token: string): Promise<{
        success: boolean;
        summary: {
            totalRows: number;
            processed: number;
            succeeded: number;
            failed: number;
        };
        results: Array<{
            row: number;
            url: string;
            success: boolean;
            contentId?: string;
            error?: string;
        }>;
    }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${CRAWLER_API}/admin/batch-upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                response.status,
                errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                errorData
            );
        }

        return await response.json();
    }

    /**
     * Get batch upload history
     */
    static async getBatchHistory(token: string): Promise<{
        success: boolean;
        items: Array<{
            id: string;
            url: string;
            title: string;
            created_at: string;
            status: string;
        }>;
    }> {
        const response = await apiRequest<{
            success: boolean;
            items: Array<{
                id: string;
                url: string;
                title: string;
                created_at: string;
                status: string;
            }>;
        }>(
            `${CRAWLER_API}/admin/batch-history`,
            {},
            token
        );
        return response;
    }
}

/**
 * Health check for API services
 */
export async function checkServiceHealth(): Promise<{
    discovery: boolean;
    interaction: boolean;
    user: boolean;
    moderation: boolean;
    email: boolean;
    crawler: boolean;
}> {
    try {
        const discoveryHealthy = await fetch(`${DISCOVERY_API_URL}/health`).then(() => true).catch(() => false);
        const interactionHealthy = await fetch(`${INTERACTION_API_URL}/health`).then(() => true).catch(() => false);
        const userHealthy = await fetch(`${USER_API_URL}/health`).then(() => true).catch(() => false);
        const moderationHealthy = await fetch(`${MODERATION_API_URL}/health`).then(() => true).catch(() => false);
        const emailHealthy = await fetch(`${EMAIL_API_URL}/health`).then(() => true).catch(() => false);
        const crawlerHealthy = await fetch(`${CRAWLER_API_URL}/health`).then(() => true).catch(() => false);

        return {
            discovery: discoveryHealthy,
            interaction: interactionHealthy,
            user: userHealthy,
            moderation: moderationHealthy,
            email: emailHealthy,
            crawler: crawlerHealthy,
        };
    } catch {
        return {
            discovery: false,
            interaction: false,
            user: false,
            moderation: false,
            email: false,
            crawler: false,
        };
    }
}
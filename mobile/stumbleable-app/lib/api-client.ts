/**
 * API client for Stumbleable Mobile App
 * Handles all HTTP communication with backend services
 */

// Service URLs - these should be configurable for different environments
const DISCOVERY_API_URL = process.env.EXPO_PUBLIC_DISCOVERY_API_URL || 'http://localhost:7001';
const INTERACTION_API_URL = process.env.EXPO_PUBLIC_INTERACTION_API_URL || 'http://localhost:7002';
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || 'http://localhost:7003';

// All services expose their API at /api endpoint
const DISCOVERY_API = `${DISCOVERY_API_URL}/api`;
const INTERACTION_API = `${INTERACTION_API_URL}/api`;
const USER_API = `${USER_API_URL}/api`;

// Debug logging for API URLs
console.log('[API] Service URLs configured:', {
    DISCOVERY_API_URL,
    INTERACTION_API_URL,
    USER_API_URL,
    DISCOVERY_API,
    INTERACTION_API,
    USER_API
});

// Core types matching the backend services
export type Discovery = {
    id: string;
    url: string;
    title: string;
    description?: string;
    image?: string;
    imageStoragePath?: string;
    faviconUrl?: string;
    domain: string;
    topics: string[];
    readingTime?: number;
    createdAt?: string;
    quality?: number;
    allowsFraming?: boolean;
};

export type Interaction = {
    id: string;
    discoveryId: string;
    action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'unskip' | 'unlike' | 'share' | 'view';
    at: number;
};

export type User = {
    id: string;
    preferredTopics: string[];
    wildness: number;
    guidelinesAcceptedAt?: string;
};

export type Topic = {
    id: string;
    name: string;
};

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
    console.log(`[API] Making request to: ${url}`);

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

    console.log(`[API] Request config:`, {
        url,
        method: config.method || 'GET',
        headers: { ...headers, Authorization: token ? '[REDACTED]' : undefined }
    });

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
            console.error(`[API] API Error: ${error.status} - ${error.message}`, error.details);
            throw error;
        }

        // Network or other errors
        console.error(`[API] Network Error:`, error);
        console.error(`[API] URL that failed: ${url}`);
        console.error(`[API] Request details:`, { method: config.method || 'GET', headers: config.headers });

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

/**
 * Network test utilities
 */
export class NetworkTest {
    /**
     * Test basic connectivity to API endpoints
     */
    static async testConnectivity(): Promise<{
        discovery: boolean;
        interaction: boolean;
        user: boolean;
        errors: string[];
    }> {
        const results = { discovery: false, interaction: false, user: false, errors: [] as string[] };

        // Test discovery API
        try {
            const response = await fetch(`${DISCOVERY_API_URL}/health`);
            results.discovery = response.ok;
            if (!response.ok) {
                results.errors.push(`Discovery API health check failed: ${response.status}`);
            }
        } catch (error) {
            results.errors.push(`Discovery API network error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Test interaction API  
        try {
            const response = await fetch(`${INTERACTION_API_URL}/health`);
            results.interaction = response.ok;
            if (!response.ok) {
                results.errors.push(`Interaction API health check failed: ${response.status}`);
            }
        } catch (error) {
            results.errors.push(`Interaction API network error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Test user API
        try {
            const response = await fetch(`${USER_API_URL}/health`);
            results.user = response.ok;
            if (!response.ok) {
                results.errors.push(`User API health check failed: ${response.status}`);
            }
        } catch (error) {
            results.errors.push(`User API network error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        return results;
    }
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

        console.log(`[API] Discovery selected: ${response.discovery.title}`);
        console.log(`[API] Reason: ${response.reason}`);
        console.log(`[API] Score: ${response.score}`);

        return response;
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

        console.log(`[API] Discovery loaded by ID: ${response.discovery.title}`);
        return response;
    }

    /**
     * Get trending discoveries (public endpoint, no auth required)
     */
    static async getTrending(token?: string): Promise<Discovery[]> {
        const response = await apiRequest<{ discoveries: Discovery[]; count: number }>(
            `${DISCOVERY_API}/trending`,
            {},
            token
        );
        return response.discoveries;
    }
}

/**
 * Interaction Service API
 */
export class InteractionAPI {
    private static savedCache = new Set<string>(); // Client-side cache for saved items
    private static likedCache = new Set<string>(); // Client-side cache for liked items
    private static skippedCache = new Set<string>(); // Client-side cache for skipped items

    /**
     * Record user feedback
     */
    static async recordFeedback(
        discoveryId: string,
        action: Interaction['action'],
        token: string,
        timeOnPage?: number
    ): Promise<void> {
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

        console.log(`[API] Recorded ${action} for discovery ${discoveryId}${timeOnPage ? ` (${timeOnPage}s)` : ''}:`, response);

        // Update local caches based on action
        if (action === 'save') {
            if (this.savedCache.has(discoveryId)) {
                this.savedCache.delete(discoveryId);
            } else {
                this.savedCache.add(discoveryId);
            }
        } else if (action === 'up') {
            if (this.likedCache.has(discoveryId)) {
                this.likedCache.delete(discoveryId);
            } else {
                this.likedCache.add(discoveryId);
                // Liking removes skip
                this.skippedCache.delete(discoveryId);
            }
        } else if (action === 'unlike') {
            this.likedCache.delete(discoveryId);
        } else if (action === 'down' || action === 'skip') {
            if (this.skippedCache.has(discoveryId)) {
                this.skippedCache.delete(discoveryId);
            } else {
                this.skippedCache.add(discoveryId);
                // Skipping removes like
                this.likedCache.delete(discoveryId);
            }
        } else if (action === 'unskip') {
            this.skippedCache.delete(discoveryId);
        } else if (action === 'unsave') {
            this.savedCache.delete(discoveryId);
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
        return this.savedCache.has(discoveryId);
    }

    /**
     * Check if a discovery is liked (synchronous for immediate UI response)
     */
    static isLiked(discoveryId: string): boolean {
        return this.likedCache.has(discoveryId);
    }

    /**
     * Check if a discovery is skipped (synchronous for immediate UI response)
     */
    static isSkipped(discoveryId: string): boolean {
        return this.skippedCache.has(discoveryId);
    }

    /**
     * Get user's interaction states (liked and skipped content)
     */
    static async getInteractionStates(token: string): Promise<{
        likedIds: string[];
        skippedIds: string[];
    }> {
        const response = await apiRequest<{
            success: boolean;
            likedIds: string[];
            skippedIds: string[];
        }>(
            `${INTERACTION_API}/interactions/states`,
            {},
            token
        );

        return {
            likedIds: response.likedIds,
            skippedIds: response.skippedIds,
        };
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
     * Initialize interaction caches by fetching user's liked and skipped content
     */
    static async initializeInteractionCaches(token: string): Promise<void> {
        try {
            const states = await this.getInteractionStates(token);

            // Update caches
            this.likedCache.clear();
            states.likedIds.forEach(id => this.likedCache.add(id));

            this.skippedCache.clear();
            states.skippedIds.forEach(id => this.skippedCache.add(id));

            console.log(`[API] Initialized interaction caches: ${states.likedIds.length} liked, ${states.skippedIds.length} skipped`);
        } catch (error) {
            console.error('Error initializing interaction caches:', error);
            // Continue with empty caches if there's an error
        }
    }
}

/**
 * User Service API
 */
export class UserAPI {
    /**
     * Get existing user profile (does not create if missing)
     */
    static async getUser(userId: string, token: string): Promise<User> {
        const response = await apiRequest<{ user: User }>(
            `${USER_API}/users/${userId}`,
            {},
            token
        );
        return response.user;
    }

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
    }): Promise<User> {
        const response = await apiRequest<{ user: User }>(
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
     * Initialize user with default preferences (called during first visit)
     */
    static async initializeUser(userId: string, token: string): Promise<User> {
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
    ): Promise<User> {
        const response = await apiRequest<{ user: User }>(
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
     * Get available topics
     */
    static async getTopics(token: string): Promise<Topic[]> {
        const response = await apiRequest<{ topics: Topic[] }>(
            `${USER_API}/topics`,
            {},
            token
        );
        return response.topics;
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
}

/**
 * Moderation API (simplified for mobile reporting)
 */
export class ModerationAPI {
    /**
     * Report content (user-facing)
     */
    static async reportContent(
        contentId: string,
        reason: 'spam' | 'inappropriate' | 'broken' | 'offensive' | 'copyright' | 'other',
        description: string | undefined,
        token: string
    ): Promise<{ success: boolean; report: any }> {
        const MODERATION_API_URL = process.env.EXPO_PUBLIC_MODERATION_API_URL || 'http://localhost:7005';
        const MODERATION_API = `${MODERATION_API_URL}/api`;

        return await apiRequest<{ success: boolean; report: any }>(
            `${MODERATION_API}/moderation/report`,
            {
                method: 'POST',
                body: JSON.stringify({
                    contentId,
                    contentType: 'discovery',
                    reason,
                    description
                }),
            },
            token
        );
    }
}

/**
 * Lists Service API (simplified for mobile)
 */
export interface UserList {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    emoji?: string;
    color?: string;
    is_public: boolean;
    item_count: number;
    created_at: string;
    updated_at: string;
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
     * Add item to list
     */
    static async addItemToList(
        listId: string,
        data: {
            contentId: string;
            notes?: string;
        },
        token: string
    ): Promise<{ item: any }> {
        return apiRequest<{ item: any }>(
            `${INTERACTION_API}/lists/${listId}/items`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            token
        );
    }
}
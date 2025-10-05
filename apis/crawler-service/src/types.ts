/**
 * Core data types for Discovery Service
 */

export interface Topic {
    id: string;            // slug
    name: string;
}

export interface Discovery {
    id: string;
    url: string;
    title: string;
    description?: string;
    image?: string;  // External image URL (fallback)
    imageStoragePath?: string;  // Supabase Storage path (preferred)
    faviconUrl?: string;  // Stored favicon URL
    domain: string;
    topics: string[];      // topic ids
    readingTime?: number;     // minutes
    createdAt?: string;    // ISO
    quality?: number;      // 0..1 baseline
    allowsFraming?: boolean;  // whether content allows iframe embedding
}

export interface User {
    id: string;                // Database UUID
    clerkUserId?: string;      // Clerk user ID for reference
    preferredTopics: string[];  // topic ids
    wildness: number;          // 0-100
    blockedDomains?: string[];  // domains to exclude
    engagementHistory?: {
        likeRate: number;
        saveRate: number;
        skipRate: number;
    };
    totalDiscoveries?: number;
    mostActiveHour?: number;    // 0-23
}

export interface DiscoveryRequest {
    userId: string;
    wildness: number;
    seenIds: string[];
}

export interface DiscoveryResponse {
    discovery: Discovery;
    score: number;
    reason: string;
}

export interface TrendingResponse {
    discoveries: Discovery[];
    count: number;
}

export interface ScoredCandidate {
    discovery: Discovery;
    score: number;
    debug: {
        ageDays: number;
        freshness: number;
        similarity: number;
        quality: number;
    };
}
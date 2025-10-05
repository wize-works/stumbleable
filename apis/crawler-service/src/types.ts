/**
 * Core data types for Crawler Service and Discovery Service
 */

// Crawler-specific types
export interface CrawlerSource {
    id: string;
    name: string;
    type: 'rss' | 'sitemap' | 'web';
    url: string;
    domain: string;
    enabled: boolean;
    crawl_frequency_hours: number;
    last_crawled_at?: string;
    next_crawl_at?: string;
    topics?: string[];
    metadata?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface CrawlerJob {
    id: string;
    source_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    items_found: number;
    items_submitted: number;
    items_failed: number;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
    metadata?: Record<string, any>;
    created_at?: string;
}

export interface RobotsTxtRules {
    isAllowed: (url: string, userAgent?: string) => boolean;
    getCrawlDelay: (userAgent?: string) => number;
    getSitemaps: () => string[];
}

export interface RSSItem {
    title?: string;
    link?: string;
    description?: string;
    content?: string;
    contentSnippet?: string;
    pubDate?: string;
    creator?: string;
    categories?: string[];
}

export interface SitemapItem {
    url: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
}

// Discovery Service types
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
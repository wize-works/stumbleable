/**
 * Type definitions for Crawler Service
 */

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
    created_at: string;
    updated_at: string;
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
    created_at: string;
}

export interface CrawlerHistory {
    id: string;
    source_id: string;
    job_id: string;
    url: string;
    title?: string;
    discovered_at: string;
    submitted: boolean;
    submission_status?: 'approved' | 'rejected' | 'pending_review';
    error_message?: string;
}

export interface CrawlerStats {
    id: string;
    source_id: string;
    total_crawls: number;
    total_items_found: number;
    total_items_submitted: number;
    total_items_approved: number;
    total_items_rejected: number;
    success_rate: number;
    last_updated: string;
}

export interface RobotsTxtRules {
    isAllowed: (url: string, userAgent?: string) => boolean;
    getCrawlDelay: (userAgent?: string) => number;
    getSitemaps: () => string[];
}

export interface RSSItem {
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
    categories?: string[];
}

export interface SitemapItem {
    url: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
}

/**
 * Core data types for Stumbleable
 */

export type Topic = {
    id: string;            // slug
    name: string;
};

export type Discovery = {
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
    allowsFraming?: boolean;  // whether content can be embedded in iframe (null=unknown, true=allows, false=blocks)
};

export type Interaction = {
    id: string;
    discoveryId: string;
    action: 'up' | 'down' | 'save' | 'skip' | 'share';
    at: number;            // Date.now()
};

export type User = {
    id: string;
    preferredTopics: string[];  // topic ids with weights
    wildness: number;          // 0-100 default
};

export type FeedbackStats = {
    up: number;
    down: number;
    saved: boolean;
};
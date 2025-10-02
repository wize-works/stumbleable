import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PerformanceTracker } from './logger';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

// Base Supabase client
const baseSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

/**
 * Enhanced Supabase client with performance tracking
 */
class EnhancedSupabaseClient {
    private client: SupabaseClient;
    private logger: any;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    /**
     * Set logger instance for performance tracking
     */
    setLogger(logger: any) {
        this.logger = logger;
    }

    /**
     * Get the underlying Supabase client
     */
    get base() {
        return this.client;
    }

    /**
     * Execute a query with performance tracking
     */
    async query<T>(
        operation: string,
        queryFn: () => Promise<T>,
        metadata: Record<string, any> = {}
    ): Promise<T> {
        const tracker = new PerformanceTracker(operation, metadata);

        try {
            const result = await queryFn();

            if (this.logger) {
                tracker.endAndLog(this.logger);
            }

            return result;
        } catch (error) {
            const duration = tracker.end();

            if (this.logger) {
                this.logger.error({
                    operation,
                    duration,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    ...metadata
                }, `Database query failed: ${operation}`);
            }

            throw error;
        }
    }

    /**
     * Direct access to Supabase methods with tracking
     */
    from(table: string) {
        return this.client.from(table);
    }

    rpc(fn: string, params?: any) {
        return this.client.rpc(fn, params);
    }
}

export const supabase = new EnhancedSupabaseClient(baseSupabase);

// Export the base client for direct access when needed
export const supabaseClient = baseSupabase;

export type Database = {
    public: {
        Tables: {
            content: {
                Row: {
                    id: string;
                    url: string;
                    title: string;
                    description: string | null;
                    domain: string;
                    image_url: string | null;
                    author: string | null;
                    published_at: string | null;
                    reading_time: number | null;
                    quality_score: number;
                    freshness_score: number;
                    trending_score: number;
                    topics: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    url: string;
                    title: string;
                    description?: string | null;
                    domain: string;
                    image_url?: string | null;
                    author?: string | null;
                    published_at?: string | null;
                    reading_time?: number | null;
                    quality_score?: number;
                    freshness_score?: number;
                    trending_score?: number;
                    topics?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    url?: string;
                    title?: string;
                    description?: string | null;
                    domain?: string;
                    image_url?: string | null;
                    author?: string | null;
                    published_at?: string | null;
                    reading_time?: number | null;
                    quality_score?: number;
                    freshness_score?: number;
                    trending_score?: number;
                    topics?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
            };
            discovery_sources: {
                Row: {
                    id: string;
                    name: string;
                    base_url: string;
                    source_type: string;
                    is_active: boolean;
                    last_crawled_at: string | null;
                    crawl_frequency_hours: number;
                    quality_weight: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    base_url: string;
                    source_type: string;
                    is_active?: boolean;
                    last_crawled_at?: string | null;
                    crawl_frequency_hours?: number;
                    quality_weight?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    base_url?: string;
                    source_type?: string;
                    is_active?: boolean;
                    last_crawled_at?: string | null;
                    crawl_frequency_hours?: number;
                    quality_weight?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            trending_content: {
                Row: {
                    id: string;
                    content_id: string;
                    time_window: string;
                    interaction_count: number;
                    like_count: number;
                    share_count: number;
                    save_count: number;
                    trending_score: number;
                    calculated_at: string;
                };
                Insert: {
                    id?: string;
                    content_id: string;
                    time_window: string;
                    interaction_count?: number;
                    like_count?: number;
                    share_count?: number;
                    save_count?: number;
                    trending_score?: number;
                    calculated_at?: string;
                };
                Update: {
                    id?: string;
                    content_id?: string;
                    time_window?: string;
                    interaction_count?: number;
                    like_count?: number;
                    share_count?: number;
                    save_count?: number;
                    trending_score?: number;
                    calculated_at?: string;
                };
            };
            topics: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    color: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    color?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    color?: string;
                    created_at?: string;
                };
            };
        };
    };
};
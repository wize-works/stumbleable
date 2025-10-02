import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

// Session-related types for RPC responses
export interface SessionStartResponse {
    id: string;
    session_start: string;
}

export interface SessionDetailsResponse {
    id: string;
    session_start: string;
    session_end: string | null;
    discoveries_count: number;
    interactions_count: number;
}

export interface SessionEndResponse {
    session_start: string;
    session_end: string;
    discoveries_count: number;
    interactions_count: number;
}

// Database types for Interaction service
export interface Database {
    public: {
        Tables: {
            interactions: {
                Row: {
                    id: string;
                    user_id: string | null;
                    content_id: string;
                    action: 'up' | 'down' | 'save' | 'unsave' | 'share' | 'skip';
                    created_at: string;
                    metadata: Record<string, any> | null;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    content_id: string;
                    action: 'up' | 'down' | 'save' | 'unsave' | 'share' | 'skip';
                    created_at?: string;
                    metadata?: Record<string, any> | null;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    content_id?: string;
                    action?: 'up' | 'down' | 'save' | 'unsave' | 'share' | 'skip';
                    created_at?: string;
                    metadata?: Record<string, any> | null;
                };
            };
            saved_items: {
                Row: {
                    id: string;
                    user_id: string;
                    content_id: string;
                    created_at: string;
                    list_id: string | null;
                    notes: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content_id: string;
                    created_at?: string;
                    list_id?: string | null;
                    notes?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content_id?: string;
                    created_at?: string;
                    list_id?: string | null;
                    notes?: string | null;
                };
            };
            analytics_summary: {
                Row: {
                    id: string;
                    content_id: string;
                    total_views: number;
                    total_likes: number;
                    total_dislikes: number;
                    total_saves: number;
                    total_shares: number;
                    last_updated: string;
                };
                Insert: {
                    id?: string;
                    content_id: string;
                    total_views?: number;
                    total_likes?: number;
                    total_dislikes?: number;
                    total_saves?: number;
                    total_shares?: number;
                    last_updated?: string;
                };
                Update: {
                    id?: string;
                    content_id?: string;
                    total_views?: number;
                    total_likes?: number;
                    total_dislikes?: number;
                    total_saves?: number;
                    total_shares?: number;
                    last_updated?: string;
                };
            };
            user_sessions: {
                Row: {
                    id: string;
                    user_id: string; // This now accepts Clerk user IDs (not UUIDs)
                    session_start: string;
                    session_end: string | null;
                    interactions_count: number;
                    discoveries_count: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string; // This now accepts Clerk user IDs (not UUIDs)
                    session_start?: string;
                    session_end?: string | null;
                    interactions_count?: number;
                    discoveries_count?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    session_start?: string;
                    session_end?: string | null;
                    interactions_count?: number;
                    discoveries_count?: number;
                    created_at?: string;
                };
            };
        };
        Functions: {
            create_user_session: {
                Args: {
                    p_user_id: string;
                };
                Returns: {
                    id: string;
                    session_start: string;
                };
            };
            increment_session_counter: {
                Args: {
                    session_id: string;
                    counter_type: 'discovery' | 'interaction';
                };
                Returns: null;
            };
            end_user_session: {
                Args: {
                    p_session_id: string;
                };
                Returns: {
                    session_start: string;
                    session_end: string;
                    discoveries_count: number;
                    interactions_count: number;
                };
            };
            get_session_details: {
                Args: {
                    p_session_id: string;
                };
                Returns: {
                    id: string;
                    session_start: string;
                    session_end: string | null;
                    discoveries_count: number;
                    interactions_count: number;
                };
            };
        };
    };
}

// Create Supabase client (using any type for now to avoid complex type issues)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Using ANON_KEY env var but it contains service_role key

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    clerk_user_id: string;
                    email: string | null;
                    username: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    clerk_user_id: string;
                    email?: string | null;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    clerk_user_id?: string;
                    email?: string | null;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            user_preferences: {
                Row: {
                    id: string;
                    user_id: string;
                    wildness: number;
                    preferred_topics: string[];
                    blocked_domains: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    wildness?: number;
                    preferred_topics?: string[];
                    blocked_domains?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    wildness?: number;
                    preferred_topics?: string[];
                    blocked_domains?: string[];
                    created_at?: string;
                    updated_at?: string;
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
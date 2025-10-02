import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

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
            moderation_queue: {
                Row: {
                    id: string;
                    content_id: string;
                    content_type: 'discovery' | 'submission';
                    title: string;
                    url: string;
                    domain: string;
                    description: string | null;
                    submitted_by: string | null;
                    status: 'pending' | 'approved' | 'rejected';
                    priority: 'low' | 'normal' | 'high' | 'urgent';
                    reviewed_by: string | null;
                    reviewed_at: string | null;
                    review_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    content_id: string;
                    content_type: 'discovery' | 'submission';
                    title: string;
                    url: string;
                    domain: string;
                    description?: string | null;
                    submitted_by?: string | null;
                    status?: 'pending' | 'approved' | 'rejected';
                    priority?: 'low' | 'normal' | 'high' | 'urgent';
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    review_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    content_id?: string;
                    content_type?: 'discovery' | 'submission';
                    title?: string;
                    url?: string;
                    domain?: string;
                    description?: string | null;
                    submitted_by?: string | null;
                    status?: 'pending' | 'approved' | 'rejected';
                    priority?: 'low' | 'normal' | 'high' | 'urgent';
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    review_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            content_reports: {
                Row: {
                    id: string;
                    content_id: string;
                    content_type: 'discovery' | 'submission';
                    reported_by: string;
                    reason: string;
                    description: string | null;
                    status: 'pending' | 'resolved' | 'dismissed';
                    resolved_by: string | null;
                    resolved_at: string | null;
                    resolution_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    content_id: string;
                    content_type: 'discovery' | 'submission';
                    reported_by: string;
                    reason: string;
                    description?: string | null;
                    status?: 'pending' | 'resolved' | 'dismissed';
                    resolved_by?: string | null;
                    resolved_at?: string | null;
                    resolution_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    content_id?: string;
                    content_type?: 'discovery' | 'submission';
                    reported_by?: string;
                    reason?: string;
                    description?: string | null;
                    status?: 'pending' | 'resolved' | 'dismissed';
                    resolved_by?: string | null;
                    resolved_at?: string | null;
                    resolution_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            domain_reputation: {
                Row: {
                    id: string;
                    domain: string;
                    trust_score: number;
                    total_approved: number;
                    total_rejected: number;
                    is_blacklisted: boolean;
                    blacklist_reason: string | null;
                    notes: string | null;
                    last_reviewed: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    domain: string;
                    trust_score?: number;
                    total_approved?: number;
                    total_rejected?: number;
                    is_blacklisted?: boolean;
                    blacklist_reason?: string | null;
                    notes?: string | null;
                    last_reviewed?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    domain?: string;
                    trust_score?: number;
                    total_approved?: number;
                    total_rejected?: number;
                    is_blacklisted?: boolean;
                    blacklist_reason?: string | null;
                    notes?: string | null;
                    last_reviewed?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
};

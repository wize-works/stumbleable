import type { Discovery } from '../types.js';
import { EmailQueue } from './queue.js';
import { supabase } from './supabase.js';

const DISCOVERY_SERVICE_URL = process.env.DISCOVERY_SERVICE_URL || 'http://localhost:7001';

/**
 * Email Scheduler
 * Handles scheduled email jobs (weekly trending, weekly new, etc.)
 */
export class EmailScheduler {
    /**
     * Send weekly trending discoveries email to all opted-in users
     */
    static async sendWeeklyTrending(): Promise<void> {
        console.log('📊 Starting weekly trending email job...');

        try {
            // Get top 5 trending discoveries from past 7 days
            const discoveries = await this.getTrendingDiscoveries();

            if (discoveries.length === 0) {
                console.log('⚠️  No trending discoveries found');
                return;
            }

            // Get all users who opted in to weekly trending emails
            const { data: users, error } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('weekly_trending', true)
                .eq('unsubscribed_all', false);

            if (error) {
                console.error('Failed to fetch opted-in users:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('⚠️  No users opted in to weekly trending emails');
                return;
            }

            console.log(`📧 Queuing weekly trending emails for ${users.length} users...`);

            // Get week date range
            const weekEnd = new Date();
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            // Queue emails for all users
            let queued = 0;
            for (const user of users) {
                // Get user email
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', user.user_id)
                    .single();

                if (!userData?.email) continue;

                try {
                    await EmailQueue.enqueue(
                        user.user_id,
                        'weekly-trending',
                        userData.email,
                        {
                            discoveries,
                            weekStart: weekStart.toISOString(),
                            weekEnd: weekEnd.toISOString(),
                        }
                    );
                    queued++;
                } catch (error) {
                    console.error(`Failed to queue email for user ${user.user_id}:`, error);
                }
            }

            console.log(`✅ Queued ${queued} weekly trending emails`);
        } catch (error) {
            console.error('❌ Weekly trending job failed:', error);
        }
    }

    /**
     * Send weekly new discoveries email to all opted-in users
     */
    static async sendWeeklyNew(): Promise<void> {
        console.log('✨ Starting weekly new discoveries email job...');

        try {
            // Get 5 newest discoveries from past 7 days
            const discoveries = await this.getNewDiscoveries();

            if (discoveries.length === 0) {
                console.log('⚠️  No new discoveries found');
                return;
            }

            // Get all users who opted in to weekly new emails
            const { data: users, error } = await supabase
                .from('email_preferences')
                .select('user_id')
                .eq('weekly_new', true)
                .eq('unsubscribed_all', false);

            if (error) {
                console.error('Failed to fetch opted-in users:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('⚠️  No users opted in to weekly new emails');
                return;
            }

            console.log(`📧 Queuing weekly new emails for ${users.length} users...`);

            // Get week date range
            const weekEnd = new Date();
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            // Queue emails for all users
            let queued = 0;
            for (const user of users) {
                // Get user email
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', user.user_id)
                    .single();

                if (!userData?.email) continue;

                try {
                    await EmailQueue.enqueue(
                        user.user_id,
                        'weekly-new',
                        userData.email,
                        {
                            discoveries,
                            weekStart: weekStart.toISOString(),
                            weekEnd: weekEnd.toISOString(),
                        }
                    );
                    queued++;
                } catch (error) {
                    console.error(`Failed to queue email for user ${user.user_id}:`, error);
                }
            }

            console.log(`✅ Queued ${queued} weekly new emails`);
        } catch (error) {
            console.error('❌ Weekly new job failed:', error);
        }
    }

    /**
     * Get top trending discoveries from past 7 days
     */
    private static async getTrendingDiscoveries(): Promise<Discovery[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Query discoveries with engagement metrics
        const { data, error } = await supabase
            .from('discoveries')
            .select('id, url, title, description, image_url, domain, topics')
            .gte('created_at', sevenDaysAgo.toISOString())
            .eq('status', 'approved')
            .is('deleted_at', null)
            .order('like_count', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Failed to fetch trending discoveries:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get newest discoveries from past 7 days
     */
    private static async getNewDiscoveries(): Promise<Discovery[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('discoveries')
            .select('id, url, title, description, image_url, domain, topics')
            .gte('approved_at', sevenDaysAgo.toISOString())
            .eq('status', 'approved')
            .is('deleted_at', null)
            .order('approved_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Failed to fetch new discoveries:', error);
            return [];
        }

        return data || [];
    }
}

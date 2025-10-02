import cron from 'node-cron';
import type { ContentMetrics } from './scoring';
import { calculateTrendingScore } from './scoring';
import { supabase } from './supabase';

/**
 * Trending Content Calculator
 * Runs periodically to update trending_content table
 */
export class TrendingCalculator {
    private cronJob: cron.ScheduledTask | null = null;
    private isRunning = false;

    /**
     * Start the trending calculator cron job
     * Runs every 15 minutes by default
     */
    start(schedule: string = '*/15 * * * *') {
        if (this.cronJob) {
            console.log('⚠️  Trending calculator already running');
            return;
        }

        console.log('🚀 Starting trending calculator...');

        // Run immediately on startup
        this.calculateTrending().catch(err => {
            console.error('Error in initial trending calculation:', err);
        });

        // Schedule periodic updates
        this.cronJob = cron.schedule(schedule, async () => {
            await this.calculateTrending();
        });

        console.log(`✓ Trending calculator started (schedule: ${schedule})`);
    }

    /**
     * Stop the trending calculator
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('✓ Trending calculator stopped');
        }
    }

    /**
     * Calculate trending scores and update database
     */
    private async calculateTrending(): Promise<void> {
        if (this.isRunning) {
            console.log('⏭️  Trending calculation already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            console.log('📊 Calculating trending content...');

            // Get all content with metrics
            const { data: content, error: contentError } = await supabase
                .from('content')
                .select(`
                    id,
                    created_at,
                    content_metrics (
                        views_count,
                        likes_count,
                        saves_count,
                        shares_count,
                        skip_count,
                        engagement_rate
                    )
                `)
                .eq('is_active', true);

            if (contentError) {
                throw new Error(`Failed to fetch content: ${contentError.message}`);
            }

            if (!content || content.length === 0) {
                console.log('No content found for trending calculation');
                return;
            }

            const now = new Date();
            const timeWindows: Array<{ window: 'hour' | 'day' | 'week'; name: string }> = [
                { window: 'hour', name: '1h' },
                { window: 'day', name: '24h' },
                { window: 'week', name: '7d' }
            ];

            // Calculate trending scores for each time window
            for (const { window, name } of timeWindows) {
                const trendingItems = content
                    .map(item => {
                        const metrics = Array.isArray(item.content_metrics)
                            ? item.content_metrics[0]
                            : item.content_metrics;

                        if (!metrics) {
                            return null;
                        }

                        const createdAt = new Date(item.created_at);
                        const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

                        const contentMetrics: ContentMetrics = {
                            views_count: metrics.views_count || 0,
                            likes_count: metrics.likes_count || 0,
                            saves_count: metrics.saves_count || 0,
                            shares_count: metrics.shares_count || 0,
                            skip_count: metrics.skip_count || 0,
                            engagement_rate: metrics.engagement_rate || 0
                        };

                        const trendingScore = calculateTrendingScore(contentMetrics, ageDays, window);

                        return {
                            content_id: item.id,
                            time_window: name,
                            interaction_count:
                                contentMetrics.likes_count +
                                contentMetrics.saves_count +
                                contentMetrics.shares_count,
                            like_count: contentMetrics.likes_count,
                            share_count: contentMetrics.shares_count,
                            save_count: contentMetrics.saves_count,
                            trending_score: trendingScore,
                            calculated_at: now.toISOString()
                        };
                    })
                    .filter(item => item !== null && item.trending_score > 0.05) // Only keep items with meaningful scores
                    .sort((a, b) => (b?.trending_score || 0) - (a?.trending_score || 0))
                    .slice(0, 100); // Keep top 100 per window

                if (trendingItems.length === 0) {
                    console.log(`No trending items for window: ${name}`);
                    continue;
                }

                // Delete old entries for this time window
                const { error: deleteError } = await supabase
                    .from('trending_content')
                    .delete()
                    .eq('time_window', name);

                if (deleteError) {
                    console.error(`Error deleting old trending data for ${name}:`, deleteError);
                    continue;
                }

                // Insert new trending data
                const { error: insertError } = await supabase
                    .from('trending_content')
                    .insert(trendingItems);

                if (insertError) {
                    console.error(`Error inserting trending data for ${name}:`, insertError);
                } else {
                    console.log(`✓ Updated ${trendingItems.length} trending items for ${name} window`);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✓ Trending calculation completed in ${duration}ms`);

        } catch (error) {
            console.error('Error calculating trending content:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Manually trigger trending calculation
     */
    async calculate(): Promise<void> {
        await this.calculateTrending();
    }
}

// Export singleton instance
export const trendingCalculator = new TrendingCalculator();

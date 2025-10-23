import cron from 'node-cron';
import { CrawlerEngine } from './crawler';

/**
 * Job Scheduler for periodic crawling
 */
export class CrawlerScheduler {
    private engine: CrawlerEngine;
    private tasks: Map<string, cron.ScheduledTask> = new Map();
    private isRunning = false;

    constructor() {
        this.engine = new CrawlerEngine();
    }

    /**
     * Signal cancellation for a running crawl
     */
    signalCancellation(sourceId: string): void {
        this.engine.requestCancellation(sourceId);
    }

    /**
     * Start the scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }

        console.log('Starting crawler scheduler...');
        this.isRunning = true;

        // Clean up any orphaned running jobs from previous service runs
        this.cleanupOrphanedJobs();

        // Run every 15 minutes to check for sources due for crawling
        const task = cron.schedule('*/15 * * * *', async () => {
            console.log('Checking for sources due for crawling...');
            await this.runDueCrawls();
        });

        this.tasks.set('main', task);
        console.log('✓ Crawler scheduler started (runs every 15 minutes)');

        // Run immediately on start
        this.runDueCrawls();
    }

    /**
     * Stop the scheduler
     */
    stop() {
        console.log('Stopping crawler scheduler...');
        this.tasks.forEach(task => task.stop());
        this.tasks.clear();
        this.isRunning = false;
        console.log('✓ Crawler scheduler stopped');
    }

    /**
     * Clean up orphaned running jobs from previous service runs
     */
    private async cleanupOrphanedJobs() {
        try {
            const { supabase } = await import('./supabase');

            // Find all jobs that are still marked as "running"
            const { data: orphanedJobs, error } = await supabase
                .from('crawler_jobs')
                .select('id, source_id, started_at')
                .eq('status', 'running');

            if (error) {
                console.error('Error checking for orphaned jobs:', error);
                return;
            }

            if (!orphanedJobs || orphanedJobs.length === 0) {
                console.log('✓ No orphaned jobs found');
                return;
            }

            console.log(`Found ${orphanedJobs.length} orphaned job(s) from previous runs, marking as failed...`);

            // Mark all orphaned jobs as failed
            const { error: updateError } = await supabase
                .from('crawler_jobs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: 'Job interrupted by service restart'
                })
                .eq('status', 'running');

            if (updateError) {
                console.error('Error cleaning up orphaned jobs:', updateError);
            } else {
                console.log(`✓ Cleaned up ${orphanedJobs.length} orphaned job(s)`);
            }
        } catch (error) {
            console.error('Error in cleanupOrphanedJobs:', error);
        }
    }

    /**
     * Run crawls for all due sources
     */
    private async runDueCrawls() {
        try {
            const sources = await this.engine.getSourcesDue();

            if (sources.length === 0) {
                console.log('No sources due for crawling');
                return;
            }

            console.log(`Found ${sources.length} sources due for crawling`);

            for (const source of sources) {
                try {
                    console.log(`Starting crawl for: ${source.name}`);
                    const job = await this.engine.crawlSource(source);
                    console.log(`✓ Completed crawl for ${source.name}: ${job.items_submitted} submitted, ${job.items_failed} failed`);
                } catch (error) {
                    console.error(`✗ Failed to crawl ${source.name}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in runDueCrawls:', error);
        }
    }

    /**
     * Manually trigger a crawl for a specific source
     */
    async triggerCrawl(sourceId: string) {
        const { supabase } = await import('./supabase');

        const { data: source, error } = await supabase
            .from('crawler_sources')
            .select('*')
            .eq('id', sourceId)
            .single();

        if (error || !source) {
            throw new Error(`Source not found: ${sourceId}`);
        }

        console.log(`Manually triggering crawl for: ${source.name}`);
        return await this.engine.crawlSource(source);
    }
}

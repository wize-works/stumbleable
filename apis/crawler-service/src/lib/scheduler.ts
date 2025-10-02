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
     * Start the scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }

        console.log('Starting crawler scheduler...');
        this.isRunning = true;

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

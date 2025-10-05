import { CrawlerJob, CrawlerSource } from '../types';
import { RobotsService } from './robots';
import { RSSService } from './rss';
import { SitemapService } from './sitemap';
import { supabase } from './supabase';

const DISCOVERY_SERVICE_URL = process.env.DISCOVERY_SERVICE_URL || 'http://localhost:7001';
const MAX_CONCURRENT_CRAWLS = parseInt(process.env.MAX_CONCURRENT_CRAWLS || '5');
const CRAWLER_SERVICE_URL = process.env.CRAWLER_SERVICE_URL || 'http://localhost:7004';
const AUTO_ENHANCE_METADATA = process.env.AUTO_ENHANCE_METADATA !== 'false'; // Default: true

/**
 * Main Crawler Engine
 */
export class CrawlerEngine {
    private robotsService: RobotsService;
    private rssService: RSSService;
    private sitemapService: SitemapService;
    private activeCrawls = new Set<string>();
    private domainDelays = new Map<string, number>();

    constructor() {
        this.robotsService = new RobotsService();
        this.rssService = new RSSService();
        this.sitemapService = new SitemapService();
    }

    /**
     * Crawl a source and discover content
     */
    async crawlSource(source: CrawlerSource): Promise<CrawlerJob> {
        // Check if already crawling
        if (this.activeCrawls.has(source.id)) {
            throw new Error(`Source ${source.id} is already being crawled`);
        }

        // Check concurrent limit
        if (this.activeCrawls.size >= MAX_CONCURRENT_CRAWLS) {
            throw new Error('Maximum concurrent crawls reached');
        }

        this.activeCrawls.add(source.id);

        // Create job
        const { data: job, error: jobError } = await supabase
            .from('crawler_jobs')
            .insert({
                source_id: source.id,
                status: 'running',
                started_at: new Date().toISOString(),
                items_found: 0,
                items_submitted: 0,
                items_failed: 0
            })
            .select()
            .single();

        if (jobError || !job) {
            this.activeCrawls.delete(source.id);
            throw new Error(`Failed to create crawler job: ${jobError?.message}`);
        }

        try {
            let items: Array<{ url: string; title?: string; description?: string }> = [];

            // Crawl based on source type
            switch (source.type) {
                case 'rss':
                    items = await this.crawlRSS(source);
                    break;
                case 'sitemap':
                    items = await this.crawlSitemap(source);
                    break;
                case 'web':
                    items = await this.crawlWebsite(source);
                    break;
            }

            console.log(`Found ${items.length} items from ${source.name}`);

            // Update job with found items
            await supabase
                .from('crawler_jobs')
                .update({ items_found: items.length })
                .eq('id', job.id);

            // Submit items to discovery service
            const results = await this.submitItems(source, job.id, items);

            // Trigger metadata enhancement for newly submitted content (non-blocking)
            if (results.newContentIds.length > 0) {
                console.log(`Triggering metadata enhancement for ${results.newContentIds.length} new items`);
                this.enhanceMetadata(results.newContentIds).catch((error: Error) => {
                    console.error('Background metadata enhancement failed:', error);
                });
            }

            // Update job as completed
            await supabase
                .from('crawler_jobs')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    items_submitted: results.submitted,
                    items_failed: results.failed
                })
                .eq('id', job.id);

            // Update source last crawled time
            const nextCrawl = new Date();
            nextCrawl.setHours(nextCrawl.getHours() + source.crawl_frequency_hours);

            await supabase
                .from('crawler_sources')
                .update({
                    last_crawled_at: new Date().toISOString(),
                    next_crawl_at: nextCrawl.toISOString()
                })
                .eq('id', source.id);

            this.activeCrawls.delete(source.id);

            return { ...job, status: 'completed', items_found: items.length, items_submitted: results.submitted, items_failed: results.failed };

        } catch (error) {
            console.error(`Error crawling source ${source.id}:`, error);

            // Mark job as failed
            await supabase
                .from('crawler_jobs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: error instanceof Error ? error.message : 'Unknown error'
                })
                .eq('id', job.id);

            this.activeCrawls.delete(source.id);

            throw error;
        }
    }

    /**
     * Crawl RSS feed
     */
    private async crawlRSS(source: CrawlerSource): Promise<Array<{ url: string; title?: string; description?: string }>> {
        const items = await this.rssService.parseFeed(source.url);

        return items
            .filter(item => item.link) // Filter out items without URLs
            .map(item => ({
                url: item.link!,
                title: item.title,
                description: item.description
            }));
    }

    /**
     * Crawl sitemap
     */
    private async crawlSitemap(source: CrawlerSource): Promise<Array<{ url: string; title?: string; description?: string }>> {
        const items = await this.sitemapService.parseSitemap(source.url);

        // Filter to recent items (last 30 days)
        const recentItems = this.sitemapService.filterByRecency(items, 30);

        return recentItems.map(item => ({
            url: item.url,
            title: undefined,
            description: undefined
        }));
    }

    /**
     * Crawl website (discover feeds/sitemaps)
     */
    private async crawlWebsite(source: CrawlerSource): Promise<Array<{ url: string; title?: string; description?: string }>> {
        const domain = new URL(source.url).hostname;

        // Try to discover RSS feeds
        const feeds = await this.rssService.discoverFeeds(source.url);
        if (feeds.length > 0) {
            console.log(`Discovered ${feeds.length} RSS feeds for ${domain}`);
            // Use first feed
            const items = await this.rssService.parseFeed(feeds[0]);
            return items
                .filter(item => item.link) // Filter out items without URLs
                .map(item => ({
                    url: item.link!,
                    title: item.title,
                    description: item.description
                }));
        }

        // Try to discover sitemaps
        const sitemaps = await this.sitemapService.discoverSitemaps(domain);
        if (sitemaps.length > 0) {
            console.log(`Discovered ${sitemaps.length} sitemaps for ${domain}`);
            const items = await this.sitemapService.parseSitemap(sitemaps[0]);
            return items.map(item => ({
                url: item.url,
                title: undefined,
                description: undefined
            }));
        }

        // Fallback: No feeds or sitemaps found, just return the homepage itself
        console.log(`No feeds or sitemaps found for ${domain}, using homepage as content`);
        return [{
            url: source.url,
            title: undefined, // Will be fetched during metadata enhancement
            description: undefined
        }];
    }

    /**
     * Submit items to discovery service
     */
    private async submitItems(
        source: CrawlerSource,
        jobId: string,
        items: Array<{ url: string; title?: string; description?: string }>
    ): Promise<{ submitted: number; failed: number; newContentIds: string[] }> {
        let submitted = 0;
        let failed = 0;
        const newContentIds: string[] = [];

        const crawlDelay = await this.robotsService.getCrawlDelay(source.domain);

        for (const item of items) {
            // Check if content already exists in the content table
            const { data: existingContent } = await supabase
                .from('content')
                .select('id')
                .eq('url', item.url)
                .single();

            if (existingContent) {
                console.log(`Skipping already submitted URL: ${item.url}`);
                continue;
            }

            // Check robots.txt
            const allowed = await this.robotsService.isAllowed(item.url);
            if (!allowed) {
                console.log(`Robots.txt disallows crawling: ${item.url}`);
                continue;
            }

            // Respect crawl delay
            await this.delay(crawlDelay);

            try {
                // Extract domain from URL
                const urlObj = new URL(item.url);
                const domain = urlObj.hostname;

                // Insert directly into content table
                const { data: content, error: insertError } = await supabase
                    .from('content')
                    .insert({
                        url: item.url,
                        title: item.title || 'Untitled',
                        description: item.description,
                        domain: domain,
                        topics: source.topics || [],
                        is_active: true // Content is active by default, moderation handled separately
                        // Note: source_id references 'sources' table, not 'crawler_sources'
                        // Crawler source tracking is done via crawler_history table
                    })
                    .select()
                    .single();

                if (insertError) {
                    throw insertError;
                }

                // Track the new content ID for metadata enhancement
                if (content?.id) {
                    newContentIds.push(content.id);
                }

                // Record in history
                await supabase.from('crawler_history').insert({
                    source_id: source.id,
                    job_id: jobId,
                    url: item.url,
                    title: item.title,
                    discovered_at: new Date().toISOString(),
                    submitted: true,
                    submission_status: 'approved', // Content inserted successfully
                    error_message: undefined
                });

                submitted++;
            } catch (error) {
                console.error(`Error submitting ${item.url}:`, error);
                failed++;

                await supabase.from('crawler_history').insert({
                    source_id: source.id,
                    job_id: jobId,
                    url: item.url,
                    title: item.title,
                    discovered_at: new Date().toISOString(),
                    submitted: false,
                    error_message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return { submitted, failed, newContentIds };
    }

    /**
     * Trigger metadata enhancement for newly crawled content
     */
    private async enhanceMetadata(contentIds: string[]): Promise<void> {
        if (!AUTO_ENHANCE_METADATA) {
            console.log('Auto-enhancement disabled, skipping metadata extraction');
            return;
        }

        if (contentIds.length === 0) {
            return;
        }

        try {
            console.log(`Starting automatic metadata enhancement for ${contentIds.length} items`);

            const response = await fetch(`${CRAWLER_SERVICE_URL}/api/enhance/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contentIds,
                    batchSize: contentIds.length, // Process all items
                    forceRescrape: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Enhancement API returned ${response.status}: ${errorText}`);
            }

            const result = await response.json() as { enhanced: number; processed: number };
            console.log(`Metadata enhancement completed: ${result.enhanced}/${result.processed} items enhanced`);

        } catch (error) {
            console.error('Failed to trigger automatic metadata enhancement:', error);
            // Don't throw - this is a background task and shouldn't fail the crawl
        }
    }

    /**
     * Delay helper for rate limiting
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get sources that need to be crawled
     */
    async getSourcesDue(): Promise<CrawlerSource[]> {
        const { data, error } = await supabase
            .from('crawler_sources')
            .select('*')
            .eq('enabled', true)
            .or(`next_crawl_at.is.null,next_crawl_at.lte.${new Date().toISOString()}`);

        if (error) {
            console.error('Error fetching due sources:', error);
            return [];
        }

        return data || [];
    }
}

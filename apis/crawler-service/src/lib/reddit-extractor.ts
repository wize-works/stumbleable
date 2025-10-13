import { load } from 'cheerio';
import Parser from 'rss-parser';
import { supabase } from './supabase';

export interface RedditRSSItem {
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
    categories?: string[];
}

export interface ExtractedLink {
    originalUrl: string;
    extractedUrl: string;
    title: string;
    subreddit: string;
    extractionContext: {
        postTitle: string;
        postDescription?: string;
        postAuthor?: string;
        postDate?: string;
    };
    priority: number;
}

/**
 * Reddit Link Extractor - extracts external links from Reddit RSS feeds
 */
export class RedditLinkExtractor {
    private parser: Parser;

    constructor() {
        this.parser = new Parser({
            timeout: 15000,
            headers: this.getRedditHeaders()
        });
    }

    /**
     * Get Reddit-compatible headers to avoid 403 blocks
     */
    private getRedditHeaders(): Record<string, string> {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        };
    }

    /**
     * Fetch Reddit RSS with proper headers to avoid 403
     */
    private async fetchRedditRSS(feedUrl: string): Promise<any> {
        const headers = this.getRedditHeaders();

        console.log(`🔄 Fetching Reddit RSS with browser headers: ${feedUrl}`);

        const response = await fetch(feedUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const xmlText = await response.text();

        // Use rss-parser to parse the XML text
        const parser = new Parser();
        return await parser.parseString(xmlText);
    }

    /**
     * Extract external links from a Reddit RSS feed
     */
    async extractLinksFromFeed(feedUrl: string, sourceId: string): Promise<ExtractedLink[]> {
        try {
            console.log(`🔍 Extracting links from Reddit RSS: ${feedUrl}`);

            // Use custom fetch for Reddit RSS to avoid 403
            const feed = await this.fetchRedditRSS(feedUrl);
            const subreddit = this.extractSubreddit(feedUrl);
            const allLinks: ExtractedLink[] = [];

            for (const item of feed.items) {
                if (!item.link) continue;

                // Extract external links from the post content (skip Reddit URLs)
                const externalLinks = await this.extractExternalLinks(item, subreddit);
                allLinks.push(...externalLinks);
            }

            // Store extracted links in queue
            await this.storeExtractedLinks(allLinks, sourceId);

            console.log(`✅ Extracted ${allLinks.length} links from ${feedUrl}`);
            return allLinks;

        } catch (error) {
            console.error(`❌ Error extracting links from ${feedUrl}:`, error);
            throw new Error(`Failed to extract Reddit links: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extract external links from a Reddit post item
     */
    private async extractExternalLinks(item: any, subreddit: string): Promise<ExtractedLink[]> {
        const links: ExtractedLink[] = [];
        const content = item.content || '';  // Use full content, not contentSnippet

        if (!content) return links;

        // Use cheerio to parse HTML content and extract links
        const $ = load(content);
        const foundUrls = new Set<string>();

        // Extract from anchor tags (this is the main source for Reddit external links)
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('http') && !this.isRedditUrl(href)) {
                foundUrls.add(href);
            }
        });

        // Extract from image sources (if they're external)
        $('img[src]').each((_, element) => {
            const src = $(element).attr('src');
            if (src && src.startsWith('http') && !this.isRedditUrl(src) && this.isExternalContentSite(src)) {
                foundUrls.add(src);
            }
        });

        // Filter and create ExtractedLink objects
        for (const url of foundUrls) {
            if (this.isExternalContentSite(url)) {
                const link: ExtractedLink = {
                    originalUrl: item.link, // Reddit post URL for reference
                    extractedUrl: url,      // Actual external URL to crawl
                    title: `${item.title || 'Reddit Post'} (via r/${subreddit})`,
                    subreddit,
                    extractionContext: {
                        postTitle: item.title || '',
                        postDescription: item.contentSnippet || '',
                        postAuthor: item.author || item.creator || '',
                        postDate: item.pubDate || item.isoDate || ''
                    },
                    priority: 8 // Higher priority for external content
                };

                links.push(link);
            }
        }

        return links;
    }

    /**
     * Store extracted links in the queue for processing
     */
    private async storeExtractedLinks(links: ExtractedLink[], sourceId: string): Promise<void> {
        const linksToInsert = links.map(link => ({
            source_id: sourceId,
            original_url: link.originalUrl,
            extracted_url: link.extractedUrl,
            title: link.title,
            subreddit: link.subreddit,
            extraction_context: link.extractionContext,
            priority: link.priority,
            status: 'pending' as const,
            created_at: new Date().toISOString()
        }));

        if (linksToInsert.length === 0) return;

        try {
            // Use upsert to handle duplicates gracefully
            for (const linkData of linksToInsert) {
                const { error } = await supabase
                    .from('extracted_links_queue')
                    .upsert(linkData, {
                        onConflict: 'extracted_url',
                        ignoreDuplicates: true
                    });

                if (error && !error.message.includes('duplicate')) {
                    console.error('Error storing extracted link:', error);
                }
            }

            console.log(`📝 Stored ${linksToInsert.length} extracted links in queue`);
        } catch (error) {
            console.error('Error storing extracted links:', error);
            throw error;
        }
    }

    /**
     * Extract subreddit name from Reddit RSS URL
     */
    private extractSubreddit(redditUrl: string): string {
        try {
            const url = new URL(redditUrl);
            const match = url.pathname.match(/\/r\/([^\/]+)/);
            return match ? match[1] : 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Check if a URL is an external content site (not social media, ads, etc.)
     */
    private isExternalContentSite(url: string): boolean {
        try {
            const domain = new URL(url).hostname.toLowerCase();

            // Filter out blocked domains
            const blockedDomains = [
                // Social media
                'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
                'youtube.com', 'tiktok.com', 'linkedin.com', 'snapchat.com',
                'discord.com', 'telegram.org',

                // E-commerce
                'amazon.com', 'ebay.com', 'alibaba.com', 'shopify.com',
                'etsy.com', 'walmart.com',

                // URL shorteners
                'bit.ly', 'tinyurl.com', 'shorturl.at', 't.co', 'goo.gl',
                'ow.ly', 'buff.ly', 'cutt.ly',

                // Ad networks and tracking
                'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
                'outbrain.com', 'taboola.com', 'adsystem.com',

                // File sharing (can be spammy)
                'dropbox.com', 'drive.google.com', 'mega.nz', 'mediafire.com',

                // Reddit domains
                'reddit.com', 'redd.it', 'redditgifts.com',

                // Low-quality content farms
                'clickhole.com', 'theonion.com', 'buzzfeed.com',

                // Adult content
                'pornhub.com', 'xvideos.com', 'xhamster.com'
            ];

            return !blockedDomains.some(blocked =>
                domain === blocked || domain.endsWith(`.${blocked}`)
            );
        } catch {
            return false;
        }
    }

    /**
     * Check if a URL is a Reddit URL
     */
    private isRedditUrl(url: string): boolean {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            return domain.includes('reddit.com') || domain.includes('redd.it');
        } catch {
            return false;
        }
    }

    /**
     * Get pending extracted links from queue
     */
    async getPendingExtractedLinks(limit: number = 50): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('extracted_links_queue')
                .select('*')
                .eq('status', 'pending')
                .order('priority', { ascending: false })
                .order('created_at', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('Error fetching pending extracted links:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getPendingExtractedLinks:', error);
            return [];
        }
    }

    /**
     * Mark extracted link as processed
     */
    async markExtractedLinkAsProcessed(linkId: string, status: 'processed' | 'failed' | 'duplicate', errorMessage?: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('extracted_links_queue')
                .update({
                    status,
                    processed_at: new Date().toISOString(),
                    error_message: errorMessage
                })
                .eq('id', linkId);

            if (error) {
                console.error('Error marking extracted link as processed:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error in markExtractedLinkAsProcessed:', error);
            throw error;
        }
    }
}
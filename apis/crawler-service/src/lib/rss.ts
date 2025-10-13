import Parser from 'rss-parser';
import { RSSItem } from '../types';

/**
 * RSS/Atom Feed Parser
 */
export class RSSService {
    private parser: Parser;

    constructor() {
        this.parser = new Parser({
            timeout: 15000,
            headers: this.getHeaders()
        });
    }

    /**
     * Get appropriate headers for different sites
     */
    private getHeaders(url?: string): Record<string, string> {
        const isReddit = url?.includes('reddit.com');

        if (isReddit) {
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

        return {
            'User-Agent': process.env.CRAWLER_USER_AGENT || 'Mozilla/5.0 (compatible; Stumbleable-Bot/1.0; +https://stumbleable.com/bot)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9'
        };
    }

    /**
     * Parse an RSS/Atom feed and extract items
     */
    async parseFeed(feedUrl: string): Promise<RSSItem[]> {
        try {
            // For Reddit URLs, use custom fetch with proper headers
            if (feedUrl.includes('reddit.com')) {
                const feed = await this.fetchRedditRSS(feedUrl);
                return this.parseRedditFeedData(feed);
            }

            const feed = await this.parser.parseURL(feedUrl);

            const items: RSSItem[] = feed.items.map((item) => ({
                title: item.title || 'Untitled',
                link: item.link || '',
                description: this.cleanDescription(item.contentSnippet || item.content || item.description),
                pubDate: item.pubDate || item.isoDate,
                author: item.creator || item.author,
                categories: item.categories || []
            }));

            // Filter out items without links
            return items.filter(item => item.link);
        } catch (error) {
            console.error(`Error parsing RSS feed ${feedUrl}:`, error);
            throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch Reddit RSS with proper headers to avoid 403
     */
    private async fetchRedditRSS(feedUrl: string): Promise<any> {
        const headers = this.getHeaders(feedUrl);

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
        const Parser = require('rss-parser');
        const parser = new Parser();
        return await parser.parseString(xmlText);
    }

    /**
     * Parse Reddit feed data into RSSItem format
     */
    private parseRedditFeedData(feed: any): RSSItem[] {
        if (!feed || !feed.items) {
            return [];
        }

        const items: RSSItem[] = feed.items.map((item: any) => ({
            title: item.title || 'Untitled',
            link: item.link || '',
            description: this.cleanDescription(item.contentSnippet || item.content || item.description),
            pubDate: item.pubDate || item.isoDate,
            author: item.creator || item.author,
            categories: item.categories || []
        }));

        // Filter out items without links
        return items.filter(item => item.link);
    }

    /**
     * Clean HTML from description
     */
    private cleanDescription(text?: string): string | undefined {
        if (!text) return undefined;

        // Remove HTML tags
        let cleaned = text.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        cleaned = cleaned
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');

        // Truncate to reasonable length
        if (cleaned.length > 500) {
            cleaned = cleaned.substring(0, 497) + '...';
        }

        return cleaned.trim();
    }

    /**
     * Discover RSS feeds on a website
     */
    async discoverFeeds(websiteUrl: string): Promise<string[]> {
        try {
            const response = await fetch(websiteUrl, {
                headers: this.getHeaders(websiteUrl),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            const feeds: string[] = [];

            // Look for RSS feed links in HTML
            const rssLinkRegex = /<link[^>]*type=['"]application\/(rss|atom)\+xml['"][^>]*href=['"]([^'"]+)['"][^>]*>/gi;
            let match;

            while ((match = rssLinkRegex.exec(html)) !== null) {
                const feedUrl = match[2];
                // Make absolute URL
                const absoluteUrl = new URL(feedUrl, websiteUrl).toString();
                feeds.push(absoluteUrl);
            }

            // Common RSS feed URLs to try
            const commonPaths = ['/feed', '/rss', '/rss.xml', '/feed.xml', '/atom.xml'];
            const baseUrl = new URL(websiteUrl);

            for (const path of commonPaths) {
                const testUrl = `${baseUrl.protocol}//${baseUrl.hostname}${path}`;
                if (!feeds.includes(testUrl)) {
                    try {
                        const testResponse = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
                        if (testResponse.ok && testResponse.headers.get('content-type')?.includes('xml')) {
                            feeds.push(testUrl);
                        }
                    } catch {
                        // Ignore errors for common path checks
                    }
                }
            }

            return [...new Set(feeds)]; // Remove duplicates
        } catch (error) {
            console.error(`Error discovering feeds for ${websiteUrl}:`, error);
            return [];
        }
    }
}

import Parser from 'rss-parser';
import { RSSItem } from '../types';

/**
 * RSS/Atom Feed Parser
 */
export class RSSService {
    private parser: Parser;

    constructor() {
        this.parser = new Parser({
            timeout: 10000,
            headers: {
                'User-Agent': process.env.CRAWLER_USER_AGENT || 'Stumbleable-Bot/1.0'
            }
        });
    }

    /**
     * Parse an RSS/Atom feed and extract items
     */
    async parseFeed(feedUrl: string): Promise<RSSItem[]> {
        try {
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
                headers: {
                    'User-Agent': process.env.CRAWLER_USER_AGENT || 'Stumbleable-Bot/1.0'
                },
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

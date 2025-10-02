import Sitemapper from 'sitemapper';
import { SitemapItem } from '../types';

/**
 * Sitemap Parser
 */
export class SitemapService {
    private sitemapper: Sitemapper;

    constructor() {
        this.sitemapper = new Sitemapper({
            url: '',
            timeout: 15000,
            requestHeaders: {
                'User-Agent': process.env.CRAWLER_USER_AGENT || 'Stumbleable-Bot/1.0'
            }
        });
    }

    /**
     * Parse a sitemap and extract URLs
     */
    async parseSitemap(sitemapUrl: string): Promise<SitemapItem[]> {
        try {
            const { sites } = await this.sitemapper.fetch(sitemapUrl);

            return sites.map((url: string) => ({
                url,
                lastmod: undefined,
                changefreq: undefined,
                priority: undefined
            }));
        } catch (error) {
            console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
            throw new Error(`Failed to parse sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Discover sitemaps from robots.txt or common locations
     */
    async discoverSitemaps(domain: string): Promise<string[]> {
        const sitemaps: string[] = [];
        const baseUrl = `https://${domain}`;

        // Common sitemap locations
        const commonPaths = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/sitemap-index.xml',
            '/sitemap1.xml',
            '/sitemaps/sitemap.xml'
        ];

        for (const path of commonPaths) {
            const sitemapUrl = `${baseUrl}${path}`;
            try {
                const response = await fetch(sitemapUrl, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    sitemaps.push(sitemapUrl);
                }
            } catch {
                // Ignore errors for discovery
            }
        }

        return sitemaps;
    }

    /**
     * Filter sitemap URLs by recency
     */
    filterByRecency(items: SitemapItem[], daysOld: number = 30): SitemapItem[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return items.filter(item => {
            if (!item.lastmod) return true; // Include if no date
            const lastmod = new Date(item.lastmod);
            return lastmod >= cutoffDate;
        });
    }
}

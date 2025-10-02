import robotsParser from 'robots-parser';
import { RobotsTxtRules } from '../types';

const USER_AGENT = process.env.CRAWLER_USER_AGENT || 'Stumbleable-Bot/1.0';

/**
 * Robots.txt Parser - respects robots.txt rules and crawl delays
 */
export class RobotsService {
    private cache: Map<string, { rules: any; expiresAt: number }> = new Map();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Fetch and parse robots.txt for a domain
     */
    async getRobotRules(domain: string): Promise<RobotsTxtRules> {
        const robotsUrl = `https://${domain}/robots.txt`;

        // Check cache
        const cached = this.cache.get(domain);
        if (cached && cached.expiresAt > Date.now()) {
            return this.createRulesInterface(cached.rules);
        }

        try {
            const response = await fetch(robotsUrl, {
                headers: {
                    'User-Agent': USER_AGENT
                },
                signal: AbortSignal.timeout(5000)
            });

            let robotsTxt = '';
            if (response.ok) {
                robotsTxt = await response.text();
            }

            const rules = robotsParser(robotsUrl, robotsTxt);

            // Cache the rules
            this.cache.set(domain, {
                rules,
                expiresAt: Date.now() + this.CACHE_TTL
            });

            return this.createRulesInterface(rules);
        } catch (error) {
            console.error(`Error fetching robots.txt for ${domain}:`, error);
            // If we can't fetch robots.txt, assume we're allowed but be conservative
            const defaultRules = robotsParser(robotsUrl, '');
            return this.createRulesInterface(defaultRules);
        }
    }

    /**
     * Create a standardized rules interface
     */
    private createRulesInterface(rules: any): RobotsTxtRules {
        return {
            isAllowed: (url: string, userAgent: string = USER_AGENT) => {
                return rules.isAllowed(url, userAgent) !== false;
            },
            getCrawlDelay: (userAgent: string = USER_AGENT) => {
                const delay = rules.getCrawlDelay(userAgent);
                return delay ? delay * 1000 : parseInt(process.env.DEFAULT_CRAWL_DELAY_MS || '1000');
            },
            getSitemaps: () => {
                return rules.getSitemaps() || [];
            }
        };
    }

    /**
     * Check if a URL is allowed to be crawled
     */
    async isAllowed(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const rules = await this.getRobotRules(domain);
            return rules.isAllowed(url);
        } catch (error) {
            console.error(`Error checking robots.txt for ${url}:`, error);
            return false;
        }
    }

    /**
     * Get crawl delay for a domain
     */
    async getCrawlDelay(domain: string): Promise<number> {
        const rules = await this.getRobotRules(domain);
        return rules.getCrawlDelay();
    }

    /**
     * Get sitemaps declared in robots.txt
     */
    async getSitemaps(domain: string): Promise<string[]> {
        const rules = await this.getRobotRules(domain);
        return rules.getSitemaps();
    }
}

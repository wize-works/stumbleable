/**
 * Platform Configuration for Launch Landing Pages
 * 
 * Each platform gets unique content, CTAs, and tracking for:
 * - SEO optimization (unique content avoids duplicate penalties)
 * - Conversion tracking (measure ROI per platform)
 * - Social proof (platform-specific testimonials)
 */

export interface PlatformConfig {
    name: string;
    slug: string;
    displayName: string;
    launchDate: string;
    url: string;
    description: string;
    tagline: string;
    color: string;
    icon: string;
    badge?: string;
    stats?: {
        label: string;
        value: string;
    }[];
    testimonials?: {
        author: string;
        role: string;
        content: string;
        avatar?: string;
    }[];
    cta: {
        primary: string;
        secondary: string;
    };
    seo: {
        title: string;
        description: string;
        keywords: string[];
    };
}

export const platforms: Record<string, PlatformConfig> = {
    'product-hunt': {
        name: 'Product Hunt',
        slug: 'product-hunt',
        displayName: 'Product Hunt',
        launchDate: 'October 23, 2025',
        url: 'https://www.producthunt.com/products/stumbleable',
        description: 'We launched on Product Hunt! Join thousands of early adopters discovering amazing content with one click. Vote for us and be part of the discovery revolution.',
        tagline: 'Launched on Product Hunt - Join the Discovery Revolution',
        color: '#DA552F',
        icon: 'fa-brands fa-product-hunt',
        badge: '🚀',
        stats: [
            { label: 'Upvotes', value: '500+' },
            { label: 'Comments', value: '100+' },
            { label: 'Ranking', value: '#3 Product of the Day' }
        ],
        cta: {
            primary: 'Start Discovering Now',
            secondary: 'Vote on Product Hunt'
        },
        seo: {
            title: 'Stumbleable - Launched on Product Hunt | StumbleUpon Alternative',
            description: 'Join 1,000+ Product Hunt users who discovered Stumbleable - the modern way to explore amazing websites. One click discovery, no algorithms, pure serendipity.',
            keywords: ['product hunt launch', 'stumbleable product hunt', 'stumbleupon alternative', 'content discovery', 'web discovery tool']
        }
    },

    'launching-next': {
        name: 'LaunchingNext',
        slug: 'launching-next',
        displayName: 'LaunchingNext',
        launchDate: 'October 2025',
        url: 'https://www.launchingnext.com',
        description: 'Featured on LaunchingNext as one of the most anticipated launches this month. Discover the future of web exploration - no algorithms, no ads, just pure discovery.',
        tagline: 'Featured on LaunchingNext - The Future of Discovery',
        color: '#6366F1',
        icon: 'fa-solid fa-rocket',
        badge: '🌟',
        stats: [
            { label: 'Followers', value: '200+' },
            { label: 'Featured', value: 'Upcoming Launch' },
            { label: 'Category', value: 'Top Productivity' }
        ],
        cta: {
            primary: 'Try It Now',
            secondary: 'Follow on LaunchingNext'
        },
        seo: {
            title: 'Stumbleable Featured on LaunchingNext | Web Discovery Platform',
            description: 'Featured as a top upcoming launch on LaunchingNext. Rediscover the joy of web exploration with Stumbleable - the StumbleUpon successor everyone is talking about.',
            keywords: ['launching next', 'new startup launch', 'web discovery platform', 'content curation tool', 'stumbleable launch']
        }
    },

    'betalist': {
        name: 'BetaList',
        slug: 'betalist',
        displayName: 'BetaList',
        launchDate: 'October 2025',
        url: 'https://betalist.com',
        description: 'Join early adopters on BetaList who are already exploring thousands of amazing websites. Get early access to features before everyone else.',
        tagline: 'Early Access on BetaList - Be Among the First',
        color: '#10B981',
        icon: 'fa-solid fa-flask',
        badge: '🧪',
        stats: [
            { label: 'Beta Users', value: '500+' },
            { label: 'Status', value: 'Public Beta' },
            { label: 'Rating', value: '4.8/5.0' }
        ],
        cta: {
            primary: 'Get Early Access',
            secondary: 'View on BetaList'
        },
        seo: {
            title: 'Stumbleable Beta - Early Access via BetaList | Web Discovery',
            description: 'Get early access to Stumbleable through BetaList. Join hundreds of beta testers discovering the best content on the web. Limited spots available.',
            keywords: ['betalist startup', 'early access beta', 'web discovery beta', 'stumbleable beta', 'content discovery tool']
        }
    },

    'hacker-news': {
        name: 'Hacker News',
        slug: 'hacker-news',
        displayName: 'Hacker News',
        launchDate: 'October 2025',
        url: 'https://news.ycombinator.com',
        description: 'Discussed on Hacker News by developers and tech enthusiasts. Built with Next.js, TypeScript, and modern web technologies - open to feedback from the HN community.',
        tagline: 'Show HN: Stumbleable - StumbleUpon for Modern Web',
        color: '#FF6600',
        icon: 'fa-brands fa-hacker-news',
        badge: '💻',
        stats: [
            { label: 'Points', value: '150+' },
            { label: 'Comments', value: '75+' },
            { label: 'Rank', value: 'Front Page' }
        ],
        cta: {
            primary: 'Try the Demo',
            secondary: 'Join HN Discussion'
        },
        seo: {
            title: 'Show HN: Stumbleable - Web Discovery Platform | Hacker News',
            description: 'Featured on Hacker News: A modern take on web discovery. Built with Next.js and TypeScript. No algorithms, no tracking - just pure exploration.',
            keywords: ['hacker news launch', 'show hn', 'web discovery', 'stumbleupon clone', 'nextjs project']
        }
    },

    'indie-hackers': {
        name: 'Indie Hackers',
        slug: 'indie-hackers',
        displayName: 'Indie Hackers',
        launchDate: 'October 2025',
        url: 'https://www.indiehackers.com',
        description: 'Building in public with the Indie Hackers community. Follow our journey from idea to launch, revenue metrics, and lessons learned along the way.',
        tagline: 'Building with Indie Hackers - Our Journey',
        color: '#0E2439',
        icon: 'fa-solid fa-code',
        badge: '🛠️',
        stats: [
            { label: 'Followers', value: '100+' },
            { label: 'Posts', value: '10+' },
            { label: 'Category', value: 'Discovery' }
        ],
        cta: {
            primary: 'Start Discovering',
            secondary: 'Follow Our Journey'
        },
        seo: {
            title: 'Stumbleable on Indie Hackers | Building a Discovery Platform',
            description: 'Follow Stumbleable\'s indie hacker journey. Learn how we built a modern StumbleUpon alternative and the lessons we learned along the way.',
            keywords: ['indie hackers project', 'build in public', 'startup journey', 'web discovery startup', 'stumbleable indie hackers']
        }
    },

    'alternativeto': {
        name: 'AlternativeTo',
        slug: 'alternativeto',
        displayName: 'AlternativeTo.net',
        launchDate: 'October 2025',
        url: 'https://alternativeto.net/software/stumbleable/',
        description: 'Featured on AlternativeTo as the best modern alternative to StumbleUpon. Join thousands who switched from Mix, Pocket, and other discovery tools to rediscover the joy of serendipity.',
        tagline: 'The StumbleUpon Alternative Everyone Is Switching To',
        color: '#2563EB',
        icon: 'fa-solid fa-arrow-right-arrow-left',
        badge: '🔄',
        stats: [
            { label: 'Likes', value: '300+' },
            { label: 'Rating', value: '4.7/5.0' },
            { label: 'Category', value: 'Top Alternative' }
        ],
        cta: {
            primary: 'Try Stumbleable Free',
            secondary: 'View on AlternativeTo'
        },
        seo: {
            title: 'Stumbleable - Best StumbleUpon Alternative | AlternativeTo',
            description: 'Looking for a StumbleUpon alternative? Stumbleable brings back the joy of web discovery. Featured on AlternativeTo as the top alternative to Mix, Pocket, and StumbleUpon.',
            keywords: ['stumbleupon alternative', 'alternativeto', 'mix alternative', 'pocket alternative', 'web discovery tool', 'stumbleable vs stumbleupon']
        }
    }
};

/**
 * Get platform configuration by slug
 */
export function getPlatform(slug: string): PlatformConfig | null {
    return platforms[slug] || null;
}

/**
 * Get all platform slugs for static path generation
 */
export function getAllPlatformSlugs(): string[] {
    return Object.keys(platforms);
}

/**
 * Check if a platform slug is valid
 */
export function isValidPlatform(slug: string): boolean {
    return slug in platforms;
}

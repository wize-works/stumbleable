/**
 * Platform Configuration for Launch Landing Pages
 * 
 * Now powered by the Content Service API - platforms are managed in Supabase
 * Admin users can add/edit platforms without code deployments
 */

import { ContentAPI, type LaunchPlatform } from '@/lib/api-client';

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
    badgeIcon?: string;
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

/**
 * Transform API platform data to PlatformConfig format
 */
function transformPlatform(platform: LaunchPlatform): PlatformConfig {
    // Transform stats object to array format
    const stats = platform.stats ? Object.entries(platform.stats).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize first letter
        value
    })) : undefined;

    // Transform testimonials to match expected format
    const testimonials = platform.testimonials?.map(t => ({
        author: t.author,
        role: t.role,
        content: t.text,
        avatar: undefined
    }));

    return {
        name: platform.name,
        slug: platform.slug,
        displayName: platform.display_name,
        launchDate: platform.launch_date,
        url: platform.url,
        description: platform.description,
        tagline: platform.tagline,
        color: platform.color,
        icon: platform.icon,
        badgeIcon: platform.badge_icon,
        stats,
        testimonials,
        cta: {
            primary: platform.cta_primary,
            secondary: platform.cta_secondary
        },
        seo: {
            title: platform.seo_title,
            description: platform.seo_description,
            keywords: platform.seo_keywords
        }
    };
}

/**
 * Get platform configuration by slug (async - fetches from API)
 */
export async function getPlatform(slug: string): Promise<PlatformConfig | null> {
    try {
        const platform = await ContentAPI.getPlatformBySlug(slug);
        return transformPlatform(platform);
    } catch (error) {
        console.error(`Error fetching platform ${slug}:`, error);
        return null;
    }
}

/**
 * Get all platform slugs for static path generation (async - fetches from API)
 */
export async function getAllPlatformSlugs(): Promise<string[]> {
    try {
        return await ContentAPI.getPlatformSlugs();
    } catch (error) {
        console.error('Error fetching platform slugs:', error);
        return [];
    }
}

/**
 * Check if a platform slug is valid (async - checks against API)
 */
export async function isValidPlatform(slug: string): Promise<boolean> {
    try {
        const platform = await ContentAPI.getPlatformBySlug(slug);
        return !!platform;
    } catch (error) {
        return false;
    }
}

/**
 * Get all platforms (async - fetches from API)
 */
export async function getAllPlatforms(): Promise<PlatformConfig[]> {
    try {
        const platforms = await ContentAPI.getAllPlatforms();
        return platforms.map(transformPlatform);
    } catch (error) {
        console.error('Error fetching all platforms:', error);
        return [];
    }
}

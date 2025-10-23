import { MetadataRoute } from 'next';
import { getAllPlatformSlugs } from './(marketing)/launch/platform-config';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stumbleable.com';

    // Get all launch platform slugs dynamically
    const platformSlugs = getAllPlatformSlugs();

    return [
        // Homepage
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        // Main Features
        {
            url: `${baseUrl}/stumble`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        // Launch Platform Pages (High Priority for SEO & Conversions)
        {
            url: `${baseUrl}/launch`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        ...platformSlugs.map((slug) => ({
            url: `${baseUrl}/launch/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
        })),
        {
            url: `${baseUrl}/submit`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/lists`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/saved`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/analytics`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        // Information Pages
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/guidelines`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        // User Features (Auth Required - Lower Priority)
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/onboarding`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        // Data Rights Pages
        {
            url: `${baseUrl}/data-export`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/data-deletion`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        // Authentication Pages (Lowest Priority)
        {
            url: `${baseUrl}/sign-in`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/sign-up`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];
}

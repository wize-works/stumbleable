import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stumbleable.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/_next/',
                    '/sign-in',
                    '/sign-up',
                    '/onboarding',
                    '/dashboard',
                    '/data-export',
                    '/data-deletion',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

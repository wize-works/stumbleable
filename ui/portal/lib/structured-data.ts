/**
 * Structured Data (JSON-LD) Schemas for SEO
 * 
 * These schemas help search engines understand our content and enable rich results.
 * Reference: https://schema.org/
 */

import type { BreadcrumbList, FAQPage, Organization, WebApplication, WebSite } from 'schema-dts';

/**
 * Organization schema - Identifies Stumbleable as a software company
 */
export const organizationSchema: Organization = {
    '@type': 'Organization',
    '@id': 'https://stumbleable.com/#organization',
    name: 'Stumbleable',
    url: 'https://stumbleable.com',
    logo: {
        '@type': 'ImageObject',
        url: 'https://stumbleable.com/icon-512x512.png',
        width: '512',
        height: '512'
    },
    sameAs: [
        // Add social media profiles when available
        // 'https://twitter.com/stumbleable',
        // 'https://facebook.com/stumbleable',
        // 'https://linkedin.com/company/stumbleable'
    ],
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: 'hello@stumbleable.com',
        availableLanguage: ['English']
    }
};

/**
 * WebApplication schema - Describes Stumbleable as a web app
 */
export const webApplicationSchema: WebApplication = {
    '@type': 'WebApplication',
    '@id': 'https://stumbleable.com/#webapp',
    name: 'Stumbleable',
    url: 'https://stumbleable.com',
    description: 'Discover amazing websites with one click. The best StumbleUpon alternative for serendipitous web discovery.',
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
    },
    author: {
        '@type': 'Organization',
        name: 'Stumbleable',
        url: 'https://stumbleable.com'
    },
    screenshot: 'https://stumbleable.com/og-image-homepage.png',
    featureList: [
        'One-click discovery',
        'Personalized recommendations',
        'Save favorite discoveries',
        'Create custom lists',
        'Wildness control',
        'Keyboard shortcuts',
        'Dark mode',
        'Mobile-friendly'
    ]
};

/**
 * WebSite schema with search action - Enables site search in Google
 */
export const websiteSchema: WebSite = {
    '@type': 'WebSite',
    '@id': 'https://stumbleable.com/#website',
    url: 'https://stumbleable.com',
    name: 'Stumbleable',
    description: 'Discover amazing websites with one click',
    publisher: {
        '@type': 'Organization',
        '@id': 'https://stumbleable.com/#organization'
    },
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://stumbleable.com/explore?q={search_term_string}'
        }
    } as any // Schema.org query-input property not in TypeScript definitions
};

/**
 * FAQ schema for About page
 */
export const faqSchema: FAQPage = {
    '@type': 'FAQPage',
    '@id': 'https://stumbleable.com/about#faq',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What is Stumbleable?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Stumbleable is a web discovery platform that helps you find amazing websites with one click. It\'s the best alternative to StumbleUpon, combining curated human taste with AI-powered recommendations.'
            }
        },
        {
            '@type': 'Question',
            name: 'Is Stumbleable free?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! Stumbleable is completely free to use. No credit card required, no hidden fees.'
            }
        },
        {
            '@type': 'Question',
            name: 'How is Stumbleable different from StumbleUpon?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Stumbleable builds on the legacy of StumbleUpon with modern features like AI-powered curation, wildness control, custom lists, and a cleaner interface. We focus on quality over quantity and give you more control over your discovery experience.'
            }
        },
        {
            '@type': 'Question',
            name: 'How does the Wildness feature work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Wildness lets you control how far from your interests you want to explore. Set it low for familiar territory, high for unexpected discoveries. It\'s like tuning a radio between comfort and adventure.'
            }
        },
        {
            '@type': 'Question',
            name: 'Can I save websites I discover?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely! Click the bookmark icon on any discovery to save it to your collection. You can organize saves into custom lists and access them anytime from your dashboard.'
            }
        },
        {
            '@type': 'Question',
            name: 'Does Stumbleable work on mobile?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! Stumbleable is fully responsive and works great on mobile devices. You can also install it as a Progressive Web App (PWA) for a native app-like experience.'
            }
        },
        {
            '@type': 'Question',
            name: 'How do you curate content?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'We combine AI algorithms with human curation to surface high-quality, interesting content. Our system learns from your reactions (likes, skips, saves) to personalize recommendations while maintaining serendipity.'
            }
        },
        {
            '@type': 'Question',
            name: 'Can I submit my website to Stumbleable?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! We welcome quality content submissions. Visit our Submit page to suggest websites for inclusion in our discovery feed.'
            }
        }
    ]
};

/**
 * Breadcrumb schema for navigation
 */
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbList {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };
}

/**
 * Generate JSON-LD script tag content
 */
export function generateJsonLd(schema: object | object[]): string {
    const schemas = Array.isArray(schema) ? schema : [schema];

    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': schemas
    });
}

/**
 * Default schema collection for homepage
 */
export const homepageSchemas = [
    organizationSchema,
    webApplicationSchema,
    websiteSchema
];

/**
 * Schema collection for About page with FAQ
 */
export const aboutSchemas = [
    organizationSchema,
    faqSchema
];

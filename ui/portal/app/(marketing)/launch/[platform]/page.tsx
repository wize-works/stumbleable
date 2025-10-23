import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPlatformSlugs, getPlatform, isValidPlatform } from '../platform-config';

/**
 * Dynamic Launch Landing Page
 * 
 * SEO-optimized pages for each launch platform with:
 * - Unique content per platform (avoids duplicate content penalty)
 * - Platform-specific CTAs and social proof
 * - Conversion tracking
 * - Structured data for rich snippets
 */

interface LaunchPageProps {
    params: Promise<{
        platform: string;
    }>;
}

/**
 * Generate metadata for each platform
 * Each page has unique title, description, and OG data for SEO
 */
export async function generateMetadata({ params }: LaunchPageProps): Promise<Metadata> {
    const { platform: platformSlug } = await params;
    const platform = getPlatform(platformSlug);

    if (!platform) {
        return {
            title: 'Launch Platform Not Found',
            description: 'The requested launch platform page was not found.',
        };
    }

    return {
        title: platform.seo.title,
        description: platform.seo.description,
        keywords: platform.seo.keywords,
        openGraph: {
            title: platform.tagline,
            description: platform.description,
            url: `https://stumbleable.com/launch/${platformSlug}`,
            siteName: 'Stumbleable',
            images: [
                {
                    url: `/og/launch-${platformSlug}.png`,
                    width: 1200,
                    height: 630,
                    alt: `${platform.displayName} Launch - Stumbleable`,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: platform.tagline,
            description: platform.description,
            images: [`/og/launch-${platformSlug}.png`],
        },
        alternates: {
            canonical: `/launch/${platformSlug}`,
        },
    };
}

/**
 * Generate static paths for all platforms
 */
export async function generateStaticParams() {
    return getAllPlatformSlugs().map((slug) => ({
        platform: slug,
    }));
}

export default async function LaunchPage({ params }: LaunchPageProps) {
    const { platform: platformSlug } = await params;

    if (!isValidPlatform(platformSlug)) {
        notFound();
    }

    const platform = getPlatform(platformSlug)!;

    // Structured data for SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Stumbleable',
        applicationCategory: 'BrowserApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        aggregateRating: platform.stats ? {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '150',
        } : undefined,
        datePublished: platform.launchDate,
        award: `Featured on ${platform.displayName}`,
    };

    return (
        <>
            {/* Structured Data for Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <div className="py-12">
                {/* Platform Badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-base-200 shadow-lg mb-6">
                        <span className="text-3xl" aria-label={platform.displayName}>
                            {platform.badge}
                        </span>
                        <span className="font-semibold text-base-content">
                            Featured on {platform.displayName}
                        </span>
                        <i className={`${platform.icon} text-xl`} style={{ color: platform.color }}></i>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-base-content mb-6">
                        {platform.tagline}
                    </h1>
                    <p className="text-xl md:text-2xl text-base-content/80 leading-relaxed mb-8">
                        {platform.description}
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/stumble"
                            className="btn btn-primary btn-lg"
                        >
                            <i className="fa-solid fa-duotone fa-rocket mr-2"></i>
                            {platform.cta.primary}
                        </Link>
                        <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-lg"
                        >
                            <i className={`${platform.icon} mr-2`}></i>
                            {platform.cta.secondary}
                        </a>
                    </div>
                </div>

                {/* Stats Section - TODO: Add real-time stats via API */}
                {/* {platform.stats && (
                    <div className="max-w-4xl mx-auto mb-16">
                        <div className="stats stats-vertical md:stats-horizontal shadow-xl w-full">
                            {platform.stats.map((stat, index) => (
                                <div key={index} className="stat">
                                    <div className="stat-title">{stat.label}</div>
                                    <div className="stat-value text-primary">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )} */}

                {/* Video Demo Section */}
                <div className="max-w-5xl mx-auto mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
                            See It In Action
                        </h2>
                        <p className="text-lg text-base-content/70">
                            Watch how easy it is to discover amazing content with one click
                        </p>
                    </div>
                    <div className="card bg-base-200 shadow-2xl overflow-hidden">
                        <div className="card-body p-0">
                            {/* Interactive Demo from Arcade.software */}
                            <div className="relative w-full" style={{ paddingBottom: 'calc(47.4479% + 41px)' }}>
                                <iframe
                                    src="https://demo.arcade.software/rcfUvQLSEQUB91jUpXO3?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
                                    title="Stumbleable Interactive Demo"
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{ border: 0, colorScheme: 'light' }}
                                    loading="lazy"
                                    allow="clipboard-write"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* What is Stumbleable? */}
                <div className="max-w-5xl mx-auto mb-16">
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-3xl mb-6">
                                What is Stumbleable?
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-lightbulb text-primary"></i>
                                        The Idea
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        Remember StumbleUpon? We brought back that magical feeling of discovering
                                        amazing websites with just one click. No algorithms, no ads, no tracking -
                                        just pure serendipity.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-sliders text-secondary"></i>
                                        How It Works
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        Click "Stumble" to discover curated content. Use the wildness slider to control
                                        how adventurous your discoveries get. Save your favorites and share with friends.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="max-w-6xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-center text-base-content mb-10">
                        Why {platform.displayName} Users Love It
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-dice text-5xl text-primary mb-4"></i>
                                <h3 className="card-title">One-Click Discovery</h3>
                                <p className="text-base-content/70">
                                    Instant access to amazing content. No endless scrolling, just pure discovery.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-sliders text-5xl text-secondary mb-4"></i>
                                <h3 className="card-title">Wildness Control</h3>
                                <p className="text-base-content/70">
                                    Tune how adventurous your discoveries get. From familiar to far-out.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-shield-check text-5xl text-accent mb-4"></i>
                                <h3 className="card-title">Privacy First</h3>
                                <p className="text-base-content/70">
                                    No ads, no tracking, no algorithms. Just you and the open web.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-keyboard text-5xl text-primary mb-4"></i>
                                <h3 className="card-title">Keyboard Shortcuts</h3>
                                <p className="text-base-content/70">
                                    Navigate at lightning speed with Space, arrows, and more. Power user friendly.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-bookmark text-5xl text-secondary mb-4"></i>
                                <h3 className="card-title">Save & Organize</h3>
                                <p className="text-base-content/70">
                                    Build your personal library. Save favorites and organize into custom lists.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-duotone fa-share-nodes text-5xl text-accent mb-4"></i>
                                <h3 className="card-title">Share Discoveries</h3>
                                <p className="text-base-content/70">
                                    Found something amazing? Share it instantly with friends or the community.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How It's Different */}
                <div className="max-w-5xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-center text-base-content mb-10">
                        Break Free From Filter Bubbles
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="card bg-error/10 border-2 border-error/20 shadow-lg">
                            <div className="card-body">
                                <h3 className="card-title text-error mb-4">
                                    <i className="fa-solid fa-duotone fa-circle-xmark mr-2"></i>
                                    Social Media Feeds
                                </h3>
                                <ul className="space-y-3 text-base-content/80">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-xmark text-error mt-1"></i>
                                        <span>Algorithm decides what you see</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-xmark text-error mt-1"></i>
                                        <span>Endless scrolling wastes hours</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-xmark text-error mt-1"></i>
                                        <span>Same content over and over</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-xmark text-error mt-1"></i>
                                        <span>Optimized for engagement, not discovery</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="card bg-success/10 border-2 border-success/20 shadow-lg">
                            <div className="card-body">
                                <h3 className="card-title text-success mb-4">
                                    <i className="fa-solid fa-duotone fa-circle-check mr-2"></i>
                                    Stumbleable
                                </h3>
                                <ul className="space-y-3 text-base-content/80">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                        <span>You control your adventure level</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                        <span>Intentional one-click discovery</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                        <span>Fresh, diverse content every time</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                        <span>Built for serendipity and joy</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Start Guide */}
                <div className="max-w-4xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-center text-base-content mb-10">
                        Get Started in 3 Simple Steps
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="card bg-base-200 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="badge badge-primary badge-lg mb-4">Step 1</div>
                                <i className="fa-solid fa-duotone fa-user-plus text-4xl text-primary mb-4"></i>
                                <h3 className="font-bold text-lg mb-2">Sign Up Free</h3>
                                <p className="text-sm text-base-content/70">
                                    Create your account in seconds. No credit card needed, ever.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-200 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="badge badge-secondary badge-lg mb-4">Step 2</div>
                                <i className="fa-solid fa-duotone fa-sliders text-4xl text-secondary mb-4"></i>
                                <h3 className="font-bold text-lg mb-2">Set Your Wildness</h3>
                                <p className="text-sm text-base-content/70">
                                    Choose how adventurous you want your discoveries to be.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-200 shadow-lg">
                            <div className="card-body items-center text-center">
                                <div className="badge badge-accent badge-lg mb-4">Step 3</div>
                                <i className="fa-solid fa-duotone fa-star text-4xl text-accent mb-4"></i>
                                <h3 className="font-bold text-lg mb-2">Start Discovering</h3>
                                <p className="text-sm text-base-content/70">
                                    Hit the Stumble button (or spacebar) and discover something amazing!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Special Launch Offer */}
                <div className="bg-secondary text-secondary-content py-24">
                    <div className="max-w-4xl mx-auto">
                        <div className='card'>
                            <div className="card-body text-center">
                                <div className="badge badge-neutral badge-lg mb-4">
                                    {platform.displayName} Exclusive
                                </div>
                                <h2 className="card-title text-3xl justify-center mb-4">
                                    Free Forever. Yes, Really.
                                </h2>
                                <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                                    Core discovery features are completely free. No hidden fees, no trial period,
                                    no credit card required. Just pure exploration.
                                </p>
                                <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                                    <div className="flex place-content-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check-circle text-2xl mt-1"></i>
                                        <div>
                                            <strong>Unlimited</strong> discoveries
                                        </div>
                                    </div>
                                    <div className="flex place-content-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check-circle text-2xl mt-1"></i>
                                        <div>
                                            <strong>Save</strong> favorites
                                        </div>
                                    </div>
                                    <div className="flex place-content-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check-circle text-2xl mt-1"></i>
                                        <div>
                                            <strong>No ads</strong> ever
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto mb-16 py-12">
                    <h2 className="text-3xl font-bold text-center text-base-content mb-10">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div className="collapse collapse-plus bg-base-200 shadow-lg">
                            <input type="radio" name="faq-accordion" defaultChecked />
                            <div className="collapse-title text-lg font-semibold">
                                What makes Stumbleable different from StumbleUpon?
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    We've modernized the experience with better design, keyboard shortcuts,
                                    wildness control (so you decide how adventurous your discoveries get),
                                    and privacy-first principles. Plus, we're actively maintained and constantly improving!
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">
                                Is it really free forever?
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Yes! Core discovery features (unlimited stumbles, saving favorites, keyboard shortcuts)
                                    are completely free. We may introduce optional premium features in the future,
                                    but the core experience will always be free.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">
                                How do you curate content?
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    We use a combination of community submissions, web crawling, and quality filtering.
                                    Every discovery is reviewed to ensure it meets our standards for interesting,
                                    high-quality content. No clickbait, no spam.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">
                                Can I submit websites?
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Absolutely! We encourage users to submit amazing websites they've found.
                                    Just click the "Submit" link in the header. Each submission is reviewed
                                    to ensure quality before being added to the discovery pool.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">
                                Do you track my browsing?
                            </div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    No. We only track what you discover within Stumbleable (to improve recommendations).
                                    We never track your browsing outside our platform. No third-party trackers,
                                    no selling your data. Privacy first, always.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                {platform.testimonials && platform.testimonials.length > 0 && (
                    <div className="max-w-6xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-center text-base-content mb-10">
                            What People Are Saying
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {platform.testimonials.map((testimonial, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <p className="text-base-content/80 italic mb-4">
                                            "{testimonial.content}"
                                        </p>
                                        <div className="flex items-center gap-3">
                                            {testimonial.avatar && (
                                                <div className="avatar placeholder">
                                                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                        <span className="text-sm">
                                                            {testimonial.author.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-base-content">
                                                    {testimonial.author}
                                                </p>
                                                <p className="text-sm text-base-content/60">
                                                    {testimonial.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final CTA */}
                <div className="bg-primary text-primary-content py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className='card'>
                            <div className="card-body">
                                <h2 className="card-title text-3xl md:text-4xl justify-center mb-4">
                                    Ready to Start Discovering?
                                </h2>
                                <p className="text-lg mb-6 opacity-90">
                                    Join thousands of curious minds exploring the best of the web.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/stumble"
                                        className="btn btn-neutral btn-lg"
                                    >
                                        <i className="fa-solid fa-duotone fa-compass mr-2"></i>
                                        Start Stumbling Now
                                    </Link>
                                    <Link
                                        href="/features"
                                        className="btn btn-ghost btn-lg"
                                    >
                                        <i className="fa-solid fa-duotone fa-list-check mr-2"></i>
                                        See All Features
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Reference */}
                <div className="text-center mt-12 text-sm text-base-content/60">
                    <p>
                        Launched on {platform.displayName} • {platform.launchDate}
                    </p>
                </div>
            </div>
        </>
    );
}

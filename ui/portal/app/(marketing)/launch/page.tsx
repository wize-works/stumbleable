import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPlatforms } from './platform-config';

export const metadata: Metadata = {
    title: 'Launch Announcements | Stumbleable - Featured Across the Web',
    description: 'See where Stumbleable has been featured - Product Hunt, LaunchingNext, BetaList, Hacker News, and more. Join thousands discovering the web differently.',
    keywords: ['stumbleable launches', 'product hunt', 'startup launches', 'featured on', 'as seen on'],
    openGraph: {
        title: 'Stumbleable - Featured Across the Web',
        description: 'Discover where we\'ve launched and what people are saying about bringing back the joy of web discovery.',
        url: 'https://stumbleable.com/launch',
        siteName: 'Stumbleable',
        images: [
            {
                url: '/og/launch-featured.png',
                width: 1200,
                height: 630,
                alt: 'Stumbleable - Featured Across the Web',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
};

export default async function LaunchIndexPage() {
    const platformList = await getAllPlatforms();

    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="badge badge-primary badge-lg mb-6">
                    <i className="fa-solid fa-duotone fa-rocket mr-2"></i>
                    Launching Everywhere
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-base-content mb-6">
                    Featured Across the Web
                </h1>
                <p className="text-xl md:text-2xl text-base-content/80 leading-relaxed">
                    Join thousands discovering Stumbleable on leading launch platforms.
                    See where we've been featured and what the community is saying.
                </p>
            </div>

            {/* Platform Cards */}
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {platformList.map((platform) => (
                    <Link
                        key={platform.slug}
                        href={`/launch/${platform.slug}`}
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="card-body">
                            {/* Platform Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${platform.color}20` }}
                                >
                                    <i
                                        className={`${platform.icon} text-2xl`}
                                        style={{ color: platform.color }}
                                    ></i>
                                </div>
                                <div>
                                    <h2 className="card-title text-lg">
                                        {platform.displayName}
                                    </h2>
                                    <p className="text-xs text-base-content/60">
                                        {platform.launchDate}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-base-content/70 mb-4 line-clamp-3">
                                {platform.description}
                            </p>

                            {/* Stats */}
                            {platform.stats && (
                                <div className="flex gap-4 mb-4">
                                    {platform.stats.slice(0, 2).map((stat, index) => (
                                        <div key={index} className="flex-1">
                                            <div className="text-xs text-base-content/60">
                                                {stat.label}
                                            </div>
                                            <div className="text-sm font-bold text-primary">
                                                {stat.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* CTA */}
                            <div className="card-actions justify-end mt-2">
                                <span className="text-sm font-semibold text-primary flex items-center gap-2">
                                    View Launch
                                    <i className="fa-solid fa-arrow-right"></i>
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Why We're Launching */}
            <div className="max-w-4xl mx-auto mb-16">
                <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            <i className="fa-solid fa-duotone fa-heart text-error"></i>
                            Why We're Building Stumbleable
                        </h2>
                        <p className="text-base-content/80 leading-relaxed mb-4">
                            After StumbleUpon shut down in 2018, millions of people lost their favorite way
                            to discover the web. Social media algorithms show us the same content. Search engines
                            require knowing what to look for. We missed the serendipity.
                        </p>
                        <p className="text-base-content/80 leading-relaxed">
                            So we built Stumbleable to bring back that magic - but better. With modern design,
                            privacy-first principles, and community-driven curation. One click to discover
                            something amazing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="max-w-4xl mx-auto text-center">
                <div className="card bg-gradient-to-br from-primary via-secondary to-accent text-primary-content shadow-2xl">
                    <div className="card-body">
                        <h2 className="card-title text-3xl justify-center mb-4">
                            Ready to Discover?
                        </h2>
                        <p className="text-lg mb-6 opacity-90">
                            Join the community and start your discovery journey today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/stumble"
                                className="btn btn-neutral btn-lg"
                            >
                                <i className="fa-solid fa-duotone fa-dice mr-2"></i>
                                Start Stumbling
                            </Link>
                            <Link
                                href="/about"
                                className="btn btn-ghost btn-lg"
                            >
                                <i className="fa-solid fa-duotone fa-circle-info mr-2"></i>
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { DiscoveryPreviewCard, DiscoveryPreviewCardFallback, DiscoveryPreviewCardSkeleton } from '@/components/discovery-preview-card';
import { LavaLampBackground } from '@/components/lava-lamp-background';
import { RotatingText } from '@/components/rotating-text';
import { StructuredData } from '@/components/structured-data';
import type { Discovery } from '@/data/types';
import { DiscoveryAPI } from '@/lib/api-client';
import { homepageSchemas } from '@/lib/structured-data';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
    const [featuredDiscoveries, setFeaturedDiscoveries] = useState<Discovery[]>([]);
    const [loadingDiscoveries, setLoadingDiscoveries] = useState(true);

    useEffect(() => {
        async function fetchFeatured() {
            try {
                // Fetch top 3 trending discoveries for the landing page
                const discoveries = await DiscoveryAPI.getTrending();
                setFeaturedDiscoveries(discoveries.slice(0, 3));
            } catch (err) {
                console.error('Error fetching featured discoveries:', err);
                // Keep empty array on error - will show fallback
            } finally {
                setLoadingDiscoveries(false);
            }
        }

        fetchFeatured();
    }, []);

    return (
        <>
            <StructuredData schemas={homepageSchemas} />
            <div className="min-h-screen bg-base-100 overflow-hidden">
                {/* Hero Section with Lava Lamp Background */}
                <section className="relative pt-20 pb-32 px-4 overflow-hidden min-h-screen">
                    {/* Lava Lamp Background - contained within hero */}
                    <LavaLampBackground />
                    <div className="container mx-auto max-w-7xl relative z-10">
                        <div className="text-center space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary animate-fade-in">
                                <i className="fa-solid fa-duotone fa-sparkles"></i>
                                <span>Rediscover the joy of the internet</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-base-content leading-tight animate-slide-up">
                                One Click.
                                <br />
                                <RotatingText />
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl sm:text-2xl md:text-3xl text-base-content/70 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-100">
                                Break free from the algorithm. Stumble upon amazing content you never knew you needed.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up delay-200">
                                <Link
                                    href="/stumble"
                                    className="btn btn-primary btn-lg text-lg px-8 gap-2 shadow-2xl hover:shadow-primary/50 transform hover:scale-105 transition-all duration-300 group"
                                >
                                    <i className="fa-solid fa-duotone fa-shuffle group-hover:rotate-180 transition-transform duration-500"></i>
                                    Start Stumbling
                                </Link>
                                <Link
                                    href="/about"
                                    className="btn btn-ghost btn-lg text-lg px-8 gap-2 hover:bg-base-200"
                                >
                                    <i className="fa-solid fa-duotone fa-circle-question"></i>
                                    Learn More
                                </Link>
                            </div>

                            {/* Social Proof */}
                            <div className="pt-8 flex items-center justify-center gap-8 text-sm text-base-content/50 animate-fade-in delay-300">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check-circle text-success"></i>
                                    <span>No Infinite Scroll</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check-circle text-success"></i>
                                    <span>Algorithm-Free</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check-circle text-success"></i>
                                    <span>Pure Serendipity</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Demo Card */}
                        <div className="mt-20 max-w-5xl mx-auto animate-slide-up delay-400">
                            <div className="relative group">
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                                {/* Card */}
                                <div className="relative bg-base-100 rounded-3xl shadow-2xl overflow-hidden border border-base-300">
                                    <div className="p-8 sm:p-12">
                                        <div className="flex items-center justify-center mb-8">
                                            <button
                                                type="button"
                                                aria-label="Stumble featured discoveries"
                                                className="btn btn-circle btn-primary btn-lg shadow-xl group-hover:scale-110 transition-transform duration-300"
                                                onClick={async () => {
                                                    try {
                                                        setLoadingDiscoveries(true);
                                                        const discoveries = await DiscoveryAPI.getTrending();
                                                        const shuffled = [...discoveries].sort(() => Math.random() - 0.5);
                                                        setFeaturedDiscoveries(shuffled.slice(0, 3));
                                                    } catch (err) {
                                                        console.error('Error stumbling featured discoveries:', err);
                                                    } finally {
                                                        setLoadingDiscoveries(false);
                                                    }
                                                }}
                                                disabled={loadingDiscoveries}
                                                title="Stumble"
                                            >
                                                {loadingDiscoveries ? (
                                                    <span className="loading loading-spinner loading-sm text-base-100" />
                                                ) : (
                                                    <i className="fa-solid fa-duotone fa-shuffle text-2xl"></i>
                                                )}
                                            </button>
                                        </div>

                                        <div className="grid sm:grid-cols-3 gap-6">
                                            {/* Live discovery cards */}
                                            {loadingDiscoveries ? (
                                                // Loading skeletons
                                                <DiscoveryPreviewCardSkeleton count={3} />
                                            ) : featuredDiscoveries.length > 0 ? (
                                                // Real discoveries with images
                                                featuredDiscoveries.map((discovery, i) => (
                                                    <DiscoveryPreviewCard
                                                        key={discovery.id}
                                                        discovery={discovery}
                                                        index={i}
                                                    />
                                                ))
                                            ) : (
                                                // Fallback to static cards if no data
                                                <DiscoveryPreviewCardFallback />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Explore by Topic CTA */}
                <section className="relative py-16 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                    <div className="container mx-auto max-w-4xl">
                        <div className="card bg-base-100 shadow-2xl">
                            <div className="card-body items-center text-center p-8 sm:p-12">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                                    <i className="fa-solid fa-duotone fa-compass text-3xl text-base-100"></i>
                                </div>
                                <h2 className="card-title text-3xl sm:text-4xl mb-4">
                                    Prefer to Browse?
                                </h2>
                                <p className="text-base-content/70 text-lg mb-6 max-w-2xl">
                                    Explore discoveries by topic or filter by what interests you most. Take control of your discovery journey.
                                </p>
                                <Link
                                    href="/explore"
                                    className="btn btn-primary btn-lg gap-2"
                                >
                                    <i className="fa-solid fa-grid-2"></i>
                                    Explore by Topic
                                    <i className="fa-solid fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="relative py-20 px-4 bg-base-200/50">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                                How It Works
                            </h2>
                            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                                Three simple steps to endless discovery
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            {[
                                {
                                    number: '1',
                                    icon: 'fa-hand-pointer',
                                    title: 'Click the Button',
                                    description: 'One click (or press Space) to get a curated discovery from across the internet.'
                                },
                                {
                                    number: '2',
                                    icon: 'fa-heart',
                                    title: 'React & Refine',
                                    description: 'Like, skip, or save. Your reactions help personalize future discoveries.'
                                },
                                {
                                    number: '3',
                                    icon: 'fa-infinity',
                                    title: 'Keep Exploring',
                                    description: 'No end to the scroll. Every click is a new adventure waiting to happen.'
                                }
                            ].map((step, i) => (
                                <div key={i} className="relative">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        {/* Number Badge */}
                                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                                            {step.number}
                                        </div>

                                        {/* Icon */}
                                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-4xl text-primary-content shadow-xl transform hover:scale-110 hover:rotate-6 transition-all duration-300">
                                            <i className={`fa-solid fa-duotone ${step.icon}`}></i>
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-2xl font-bold text-base-content">
                                            {step.title}
                                        </h3>
                                        <p className="text-base-content/70">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="relative py-20 px-4">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                                Why Stumbleable?
                            </h2>
                            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                                Everything you need for the perfect discovery experience
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: 'fa-wand-magic-sparkles',
                                    title: 'Curated Randomness',
                                    description: 'Quality content from across the web, filtered for relevance and interest.',
                                    color: 'primary'
                                },
                                {
                                    icon: 'fa-sliders',
                                    title: 'Wildness Control',
                                    description: 'Adjust how adventurous you want to be. From safe to wild, you decide.',
                                    color: 'secondary'
                                },
                                {
                                    icon: 'fa-bolt-lightning',
                                    title: 'Lightning Fast',
                                    description: 'Keyboard shortcuts, instant reactions. No friction, just flow.',
                                    color: 'accent'
                                },
                                {
                                    icon: 'fa-bookmark',
                                    title: 'Save & Organize',
                                    description: 'Build collections of your favorite discoveries. Access them anytime.',
                                    color: 'primary'
                                },
                                {
                                    icon: 'fa-users',
                                    title: 'Community Lists',
                                    description: 'Explore curated trails created by other discoverers. Share your own.',
                                    color: 'secondary'
                                },
                                {
                                    icon: 'fa-shield-check',
                                    title: 'Safe & Respectful',
                                    description: 'Community-moderated content. Report anything inappropriate instantly.',
                                    color: 'accent'
                                }
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300"
                                >
                                    <div className="card-body">
                                        <div className={`text-5xl mb-4 text-${feature.color}`}>
                                            <i className={`fa-solid fa-duotone ${feature.icon}`}></i>
                                        </div>
                                        <h3 className="card-title text-xl">{feature.title}</h3>
                                        <p className="text-base-content/70">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial / Social Proof Section */}
                {/* <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="space-y-8">
                        <div className="text-6xl text-primary/20">
                            <i className="fa-solid fa-duotone fa-quote-left"></i>
                        </div>
                        <blockquote className="text-2xl sm:text-3xl md:text-4xl font-medium text-base-content leading-relaxed">
                            "Finally, a way to explore the internet without drowning in algorithms.
                            It's like the early web again—surprising, delightful, and actually fun."
                        </blockquote>
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-12">
                                    <span className="text-xl">JD</span>
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-base-content">Jane Discoverer</div>
                                <div className="text-sm text-base-content/60">Early Adopter</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

                {/* Final CTA Section */}
                <section className="relative py-32 px-4">
                    <div className="container mx-auto max-w-4xl text-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-base-content">
                                Ready to Start Your
                                <br />
                                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                    Discovery Journey?
                                </span>
                            </h2>
                            <p className="text-xl sm:text-2xl text-base-content/70 max-w-2xl mx-auto">
                                Join thousands of curious minds exploring the unexpected.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                                <Link
                                    href="/stumble"
                                    className="btn btn-primary btn-lg text-xl px-12 gap-3 shadow-2xl hover:shadow-primary/50 transform hover:scale-105 transition-all duration-300"
                                >
                                    <i className="fa-solid fa-duotone fa-shuffle"></i>
                                    Start Stumbling Now
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="btn btn-outline btn-lg text-xl px-12 gap-3"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                            <p className="text-sm text-base-content/50 pt-4">
                                No credit card required • Discovery free forever • No ads
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
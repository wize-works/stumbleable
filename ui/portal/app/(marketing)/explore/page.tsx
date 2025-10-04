'use client';

import type { Discovery } from '@/data/types';
import { DiscoveryAPI } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export default function ExplorePage() {
    const [trendingContent, setTrendingContent] = useState<Discovery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTrending() {
            try {
                setLoading(true);
                // Fetch trending content without requiring auth
                // The backend should allow public access to trending endpoint
                const discoveries = await DiscoveryAPI.getTrending('');
                setTrendingContent(discoveries);
            } catch (err) {
                console.error('Error fetching trending content:', err);
                setError('Unable to load trending content. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        fetchTrending();
    }, []);

    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Section */}
            <section className="relative py-16 px-4 overflow-hidden bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-4">
                        Explore <span className="text-accent">Trending</span> Discoveries
                    </h1>
                    <p className="text-xl text-base-content/70 max-w-3xl mx-auto mb-8">
                        See what the community is loving right now. These are the most popular
                        discoveries across all topics.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <a href="/sign-up" className="btn btn-accent btn-lg">
                            <i className="fa-solid fa-duotone fa-user-plus mr-2"></i>
                            Sign Up to Stumble
                        </a>
                        <a href="/features" className="btn btn-outline btn-lg">
                            <i className="fa-solid fa-duotone fa-sparkles mr-2"></i>
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* Trending Content */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-base-content">
                            <i className="fa-solid fa-duotone fa-fire text-accent mr-3"></i>
                            Trending Now
                        </h2>
                        <div className="text-sm text-base-content/60">
                            Updated hourly
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <span className="loading loading-spinner loading-lg text-accent"></span>
                        </div>
                    ) : error ? (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-duotone fa-triangle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    ) : trendingContent.length === 0 ? (
                        <div className="alert alert-info">
                            <i className="fa-solid fa-duotone fa-info-circle"></i>
                            <span>No trending content available yet. Check back soon!</span>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trendingContent.map((item) => {
                                // Use domain from Discovery object or extract from URL
                                const displayImage = item.imageStoragePath
                                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/discovery-images/${item.imageStoragePath}`
                                    : item.image;

                                return (
                                    <a
                                        key={item.id}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <figure className="relative h-48 overflow-hidden">
                                            {displayImage ? (
                                                <img
                                                    src={displayImage}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                                    <i className="fa-solid fa-duotone fa-image text-6xl text-base-content/30"></i>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 badge badge-accent badge-lg gap-2">
                                                <i className="fa-solid fa-duotone fa-fire"></i>
                                                Trending
                                            </div>
                                        </figure>
                                        <div className="card-body">
                                            <div className="text-sm text-base-content/60 mb-2">
                                                {item.domain}
                                            </div>
                                            <h3 className="card-title text-base-content hover:text-accent transition-colors">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-sm text-base-content/70 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {item.topics?.slice(0, 3).map((topic) => (
                                                    <span key={topic} className="badge badge-outline badge-sm capitalize">
                                                        {topic}
                                                    </span>
                                                ))}
                                                {item.readingTime && (
                                                    <span className="badge badge-ghost badge-sm">
                                                        <i className="fa-solid fa-duotone fa-clock mr-1"></i>
                                                        {item.readingTime} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Topic Highlights */}
            <section className="py-16 px-4 bg-base-200">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-base-content mb-12">
                        Explore by Topic
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { name: "Technology", icon: "fa-microchip", color: "primary" },
                            { name: "Science", icon: "fa-flask", color: "secondary" },
                            { name: "Art", icon: "fa-palette", color: "accent" },
                            { name: "Photography", icon: "fa-camera", color: "primary" },
                            { name: "Gaming", icon: "fa-gamepad", color: "secondary" },
                            { name: "Music", icon: "fa-music", color: "accent" },
                            { name: "Food", icon: "fa-utensils", color: "primary" },
                            { name: "Travel", icon: "fa-plane", color: "secondary" },
                            { name: "Nature", icon: "fa-tree", color: "accent" },
                            { name: "DIY", icon: "fa-hammer", color: "primary" },
                            { name: "Fitness", icon: "fa-dumbbell", color: "secondary" },
                            { name: "Writing", icon: "fa-pen-fancy", color: "accent" },
                        ].map((topic) => (
                            <button
                                key={topic.name}
                                className={`btn btn-outline btn-${topic.color} h-auto py-6 flex-col gap-2`}
                            >
                                <i className={`fa-solid fa-duotone ${topic.icon} text-3xl`}></i>
                                <span className="text-sm">{topic.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <a href="/sign-up" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-duotone fa-filter mr-2"></i>
                            Customize Your Topics
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <i className="fa-solid fa-duotone fa-globe text-4xl"></i>
                            </div>
                            <div className="stat-title">Total Discoveries</div>
                            <div className="stat-value text-primary">127K+</div>
                            <div className="stat-desc">Hand-curated content</div>
                        </div>

                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <i className="fa-solid fa-duotone fa-users text-4xl"></i>
                            </div>
                            <div className="stat-title">Active Users</div>
                            <div className="stat-value text-secondary">15K+</div>
                            <div className="stat-desc">Growing every day</div>
                        </div>

                        <div className="stat">
                            <div className="stat-figure text-accent">
                                <i className="fa-solid fa-duotone fa-heart text-4xl"></i>
                            </div>
                            <div className="stat-title">Reactions</div>
                            <div className="stat-value text-accent">2.4M+</div>
                            <div className="stat-desc">And counting!</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-base-content mb-6">
                        Ready for Your Personalized Feed?
                    </h2>
                    <p className="text-xl text-base-content/70 mb-8">
                        These trending discoveries are just the beginning. Sign up to get personalized
                        recommendations based on your unique interests.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <a href="/sign-up" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-duotone fa-rocket mr-2"></i>
                            Start Discovering
                        </a>
                        <a href="/how-it-works" className="btn btn-outline btn-lg">
                            <i className="fa-solid fa-duotone fa-circle-question mr-2"></i>
                            How It Works
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

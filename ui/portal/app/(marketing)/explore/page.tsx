'use client';

import { DiscoveryPreviewCard, DiscoveryPreviewCardSkeleton } from '@/components/discovery-preview-card';
import type { Discovery } from '@/data/types';
import { DiscoveryAPI, UserAPI } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Topic = {
    id: string;
    name: string;
    category?: string;
};

type SortOption = 'recent' | 'popular' | 'quality';

function ExploreContent() {
    const searchParams = useSearchParams();
    const { getToken } = useAuth();

    const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [selectedTopic, setSelectedTopic] = useState<string | null>(
        searchParams.get('topic')
    );
    const [sortBy, setSortBy] = useState<SortOption>(
        (searchParams.get('sortBy') as SortOption) || 'recent'
    );
    const [pagination, setPagination] = useState({
        limit: 24,
        offset: 0,
        total: 0,
        hasMore: false
    });

    // Fetch topics on mount
    useEffect(() => {
        async function fetchTopics() {
            try {
                const token = await getToken();
                if (!token) return;

                const fetchedTopics = await UserAPI.getTopics(token);
                setTopics(fetchedTopics);
            } catch (error) {
                console.error('Error fetching topics:', error);
            }
        }
        fetchTopics();
    }, [getToken]);

    // Fetch discoveries when filters change
    useEffect(() => {
        async function fetchDiscoveries() {
            try {
                setLoading(true);
                const token = await getToken();

                const result = await DiscoveryAPI.explore({
                    topic: selectedTopic || undefined,
                    limit: 24,
                    offset: 0,
                    sortBy,
                    token: token || undefined
                });

                setDiscoveries(result.discoveries);
                setPagination(result.pagination);
            } catch (error) {
                console.error('Error fetching discoveries:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDiscoveries();
    }, [selectedTopic, sortBy, getToken]);

    // Load more discoveries
    async function loadMore() {
        try {
            setLoadingMore(true);
            const token = await getToken();

            const result = await DiscoveryAPI.explore({
                topic: selectedTopic || undefined,
                limit: 24,
                offset: pagination.offset + 24,
                sortBy,
                token: token || undefined
            });

            setDiscoveries(prev => [...prev, ...result.discoveries]);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Error loading more discoveries:', error);
        } finally {
            setLoadingMore(false);
        }
    }

    // Handle topic selection
    function handleTopicSelect(topicId: string | null) {
        setSelectedTopic(topicId);
        // Update URL
        const params = new URLSearchParams();
        if (topicId) params.set('topic', topicId);
        if (sortBy !== 'recent') params.set('sortBy', sortBy);
        const newUrl = `/explore${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newUrl);
    }

    // Handle sort change
    function handleSortChange(newSort: SortOption) {
        setSortBy(newSort);
        // Update URL
        const params = new URLSearchParams();
        if (selectedTopic) params.set('topic', selectedTopic);
        if (newSort !== 'recent') params.set('sortBy', newSort);
        const newUrl = `/explore${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newUrl);
    }

    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-base-300">
                <div className="container mx-auto px-4 py-12 sm:py-16">
                    <div className="max-w-4xl mx-auto text-center">
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
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters Section */}
                <div className="mb-8 space-y-6">
                    {/* Topic Filter */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
                                <i className="fa-solid fa-duotone fa-filter"></i>
                                Filter by Topic
                            </h2>
                            {selectedTopic && (
                                <button
                                    onClick={() => handleTopicSelect(null)}
                                    className="btn btn-ghost btn-xs"
                                >
                                    <i className="fa-solid fa-duotone fa-xmark"></i>
                                    Clear filter
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleTopicSelect(null)}
                                className={`btn ${!selectedTopic ? 'btn-primary' : 'btn-ghost'}`}
                            >
                                All Topics
                            </button>
                            {topics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => handleTopicSelect(topic.id)}
                                    className={`btn ${selectedTopic === topic.id ? 'btn-primary' : 'btn-ghost'}`}
                                >
                                    {topic.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                        <h2 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-duotone fa-arrow-down-short-wide"></i>
                            Sort By
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleSortChange('recent')}
                                className={`btn ${sortBy === 'recent' ? 'btn-secondary' : 'btn-ghost'}`}
                            >
                                <i className="fa-solid fa-duotone fa-clock"></i>
                                Most Recent
                            </button>
                            <button
                                onClick={() => handleSortChange('popular')}
                                className={`btn ${sortBy === 'popular' ? 'btn-secondary' : 'btn-ghost'}`}
                            >
                                <i className="fa-solid fa-duotone fa-fire"></i>
                                Most Popular
                            </button>
                            <button
                                onClick={() => handleSortChange('quality')}
                                className={`btn ${sortBy === 'quality' ? 'btn-secondary' : 'btn-ghost'}`}
                            >
                                <i className="fa-solid fa-duotone fa-star"></i>
                                Highest Quality
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <DiscoveryPreviewCardSkeleton count={8} />
                    </div>
                ) : discoveries.length > 0 ? (
                    <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {discoveries.map((discovery, i) => (
                                <DiscoveryPreviewCard
                                    key={discovery.id}
                                    discovery={discovery}
                                    index={i}
                                />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {pagination.hasMore && (
                            <div className="mt-12 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="btn btn-primary btn-lg"
                                >
                                    {loadingMore ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-duotone fa-angles-down"></i>
                                            Load More
                                            <span className="badge badge-ghost ml-2">
                                                {pagination.total - discoveries.length} remaining
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    // Empty State
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-6">
                            <i className="fa-solid fa-duotone fa-empty-set text-4xl text-base-content/30"></i>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">No discoveries found</h3>
                        <p className="text-base-content/60 mb-6">
                            {selectedTopic
                                ? `Try exploring other topics or clear the filter`
                                : `No content available yet`}
                        </p>
                        {selectedTopic && (
                            <button
                                onClick={() => handleTopicSelect(null)}
                                className="btn btn-primary"
                            >
                                <i className="fa-solid fa-duotone fa-grid-2"></i>
                                View All Topics
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-secondary/30">
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
                        <a href="/how-it-works" className="btn btn-outline btn-secondary btn-lg">
                            <i className="fa-solid fa-duotone fa-circle-question mr-2"></i>
                            How It Works
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        }>
            <ExploreContent />
        </Suspense>
    );
}

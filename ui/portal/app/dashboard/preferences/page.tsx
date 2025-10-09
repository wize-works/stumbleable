'use client';

import Breadcrumbs from '@/components/breadcrumbs';
import { useToaster } from '@/components/toaster';
import { ApiError, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Topic {
    id: string;
    name: string;
    category?: string;
}

export default function PreferencesPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const { showToast } = useToaster();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [wildness, setWildness] = useState(35);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [topicsPage, setTopicsPage] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);

    // Track original values to detect changes
    const [originalTopics, setOriginalTopics] = useState<string[]>([]);
    const [originalWildness, setOriginalWildness] = useState(35);

    // Pagination settings: 3 rows per page
    const TOPICS_PER_ROW_LG = 4;
    const ROWS_PER_PAGE = 3;
    const TOPICS_PER_PAGE = TOPICS_PER_ROW_LG * ROWS_PER_PAGE;

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load user preferences and available topics
    useEffect(() => {
        async function loadData() {
            if (!isSignedIn || !user?.id) return;

            try {
                const token = await getToken();
                if (!token) return;

                // Load topics and user preferences
                const [availableTopics, userData] = await Promise.all([
                    UserAPI.getTopics(token),
                    UserAPI.getUser(user.id, token)
                ]);

                setTopics(availableTopics);
                setSelectedTopics(userData.preferredTopics || []);
                setOriginalTopics(userData.preferredTopics || []);
                setWildness(userData.wildness);
                setOriginalWildness(userData.wildness);
            } catch (error) {
                console.error('Error loading preferences:', error);
                if (error instanceof ApiError) {
                    showToast(`Error: ${error.message}`, 'error');
                }
            } finally {
                setDataLoading(false);
            }
        }

        if (isLoaded && isSignedIn && user?.id) {
            loadData();
        }
    }, [isLoaded, isSignedIn, user?.id, getToken, showToast]);

    // Detect changes
    useEffect(() => {
        const topicsChanged = JSON.stringify(selectedTopics.sort()) !== JSON.stringify(originalTopics.sort());
        const wildnessChanged = wildness !== originalWildness;
        setHasChanges(topicsChanged || wildnessChanged);
    }, [selectedTopics, originalTopics, wildness, originalWildness]);

    const handleTopicToggle = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const handleSave = async () => {
        if (!user?.id || selectedTopics.length === 0) {
            showToast('Please select at least one topic', 'warning');
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            await UserAPI.updatePreferences(user.id, {
                preferredTopics: selectedTopics,
                wildness
            }, token);

            // Update original values
            setOriginalTopics(selectedTopics);
            setOriginalWildness(wildness);

            showToast('Preferences updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating preferences:', error);
            if (error instanceof ApiError) {
                showToast(`Error: ${error.message}`, 'error');
            } else {
                showToast('Failed to update preferences. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedTopics(originalTopics);
        setWildness(originalWildness);
        setTopicsPage(0);
        showToast('Changes discarded', 'info');
    };

    if (!isLoaded || dataLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading preferences...</span>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return null; // Will redirect
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Breadcrumbs items={[
                { label: 'Home', href: '/' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Preferences', href: '/dashboard/preferences' }
            ]} />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Discovery Preferences</h1>
                        <p className="text-base-content/70">
                            Customize your content discovery experience
                        </p>
                    </div>
                    {hasChanges && (
                        <div className="badge badge-warning gap-2">
                            <i className="fa-solid fa-duotone fa-circle-exclamation"></i>
                            Unsaved changes
                        </div>
                    )}
                </div>
            </div>

            {/* Topics Section */}
            <div className="card bg-base-200 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-duotone fa-grid-2 text-primary"></i>
                        Content Interests
                    </h2>
                    <p className="text-base-content/70 mb-6">
                        Select topics you're interested in. We'll use these to personalize your discoveries.
                    </p>

                    {/* Topic Count Badge */}
                    <div className="mb-4">
                        <div className="badge badge-lg badge-primary gap-2">
                            <i className="fa-solid fa-duotone fa-check-circle"></i>
                            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                        </div>
                    </div>

                    {/* Paginated Topics Grid */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 min-h-[280px]">
                            {topics
                                .slice(topicsPage * TOPICS_PER_PAGE, (topicsPage + 1) * TOPICS_PER_PAGE)
                                .map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => handleTopicToggle(topic.id)}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedTopics.includes(topic.id)
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-base-200 bg-base-100 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="font-medium capitalize">{topic.name}</div>
                                        <div className="text-sm text-base-content/60 mt-1">
                                            {topic.category}
                                        </div>
                                    </button>
                                ))}
                        </div>

                        {/* Pagination Controls */}
                        {topics.length > TOPICS_PER_PAGE && (
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setTopicsPage(prev => Math.max(0, prev - 1))}
                                    disabled={topicsPage === 0}
                                    className="btn btn-circle btn-ghost"
                                    aria-label="Previous page"
                                >
                                    <i className="fa-solid fa-duotone fa-duotone fa-chevron-left"></i>
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.ceil(topics.length / TOPICS_PER_PAGE) }).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setTopicsPage(index)}
                                            className={`btn btn-circle ${topicsPage === index ? 'btn-primary' : 'btn-ghost'}`}
                                            aria-label={`Go to page ${index + 1}`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setTopicsPage(prev => Math.min(Math.ceil(topics.length / TOPICS_PER_PAGE) - 1, prev + 1))}
                                    disabled={topicsPage >= Math.ceil(topics.length / TOPICS_PER_PAGE) - 1}
                                    className="btn btn-circle btn-ghost"
                                    aria-label="Next page"
                                >
                                    <i className="fa-solid fa-duotone fa-duotone fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Wildness Section */}
            <div className="card bg-base-200 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-duotone fa-dice text-primary"></i>
                        Discovery Wildness
                    </h2>
                    <p className="text-base-content/70 mb-6">
                        Control how adventurous your content recommendations are.
                    </p>

                    <div className="max-w-2xl">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-base-content/80">
                                    Wildness Level
                                </label>
                                <span className="badge badge-lg badge-primary">{wildness}%</span>
                            </div>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={wildness}
                            onChange={(e) => setWildness(Number(e.target.value))}
                            className="range range-primary w-full"
                        />

                        <div className="flex justify-between text-xs text-base-content/60 mt-2 mb-4">
                            <span>Conservative</span>
                            <span>Balanced</span>
                            <span>Adventurous</span>
                        </div>

                        <div className="alert bg-base-100 shadow-lg">
                            <i className={`fa-solid fa-duotone fa-duotone ${wildness < 30 ? 'fa-shield-check text-info' :
                                wildness >= 70 ? 'fa-rocket text-warning' :
                                    'fa-balance-scale text-success'
                                }`}></i>
                            <div>
                                <h3 className="font-bold">
                                    {wildness < 30 && "Conservative Mode"}
                                    {wildness >= 30 && wildness < 70 && "Balanced Mode"}
                                    {wildness >= 70 && "Adventurous Mode"}
                                </h3>
                                <p className="text-sm">
                                    {wildness < 30 && "You'll see content closely matching your selected interests"}
                                    {wildness >= 30 && wildness < 70 && "You'll see a good mix of familiar topics and new discoveries"}
                                    {wildness >= 70 && "You'll see adventurous discoveries beyond your usual interests"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
                <button
                    onClick={handleReset}
                    disabled={!hasChanges || loading}
                    className="btn btn-ghost"
                >
                    <i className="fa-solid fa-duotone fa-rotate-left"></i>
                    Discard Changes
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || loading || selectedTopics.length === 0}
                    className="btn btn-primary"
                >
                    {loading && <span className="loading loading-spinner"></span>}
                    <i className="fa-solid fa-duotone fa-save"></i>
                    Save Preferences
                </button>
            </div>
        </div>
    );
}

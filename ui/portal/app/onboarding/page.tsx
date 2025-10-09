'use client';

import { useToaster } from '@/components/toaster';
import { ApiError, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '../../components/ui/logo';

interface Topic {
    id: string;
    name: string;
    category?: string;
}

export default function OnboardingPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const { showToast } = useToaster();

    const [step, setStep] = useState(1);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
    const [wildness, setWildness] = useState(35);
    const [loading, setLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(true);
    const [topicsPage, setTopicsPage] = useState(0);

    // Pagination settings: 3 rows per page
    const TOPICS_PER_ROW_LG = 4; // Large screens (lg:grid-cols-4)
    const TOPICS_PER_ROW_MD = 3; // Medium screens (md:grid-cols-3)
    const ROWS_PER_PAGE = 3;
    const TOPICS_PER_PAGE = TOPICS_PER_ROW_LG * ROWS_PER_PAGE; // 12 topics per page on large screens

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load available topics and existing user preferences
    useEffect(() => {
        async function loadData() {
            if (!isSignedIn || !user?.id) return;

            try {
                const token = await getToken();
                if (!token) return;

                // Load topics and existing preferences in parallel
                const [availableTopics, existingUser] = await Promise.all([
                    UserAPI.getTopics(token),
                    UserAPI.getUser(user.id, token).catch(() => null) // Don't fail if user doesn't exist yet
                ]);

                setTopics(availableTopics);

                // If user has existing preferences, load them
                if (existingUser) {
                    console.log('Loading existing preferences:', existingUser);

                    // Pre-select user's preferred topics
                    if (existingUser.preferredTopics && existingUser.preferredTopics.length > 0) {
                        setSelectedTopics(existingUser.preferredTopics);
                    }

                    // Set user's wildness preference
                    if (existingUser.wildness !== undefined) {
                        setWildness(existingUser.wildness);
                    }

                    // Check if guidelines were already accepted
                    if (existingUser.guidelinesAcceptedAt) {
                        setGuidelinesAccepted(true);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setTopicsLoading(false);
            }
        }

        if (isLoaded && isSignedIn && user?.id) {
            loadData();
        }
    }, [isLoaded, isSignedIn, user?.id, getToken]);

    const handleTopicToggle = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToStep = (nextStep: number) => {
        setStep(nextStep);
        scrollToTop();
    };

    const handleComplete = async () => {
        if (!user?.id || selectedTopics.length === 0) return;

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // User should already exist in database from sign-up flow
            // Just accept guidelines and update preferences

            // Accept guidelines first
            if (guidelinesAccepted) {
                await UserAPI.acceptGuidelines(user.id, token);
            }

            // Update user preferences 
            await UserAPI.updatePreferences(user.id, {
                preferredTopics: selectedTopics,
                wildness
            }, token);

            // Show success message
            showToast('Preferences saved! Let\'s start discovering.', 'success');

            // Redirect to main app
            router.push('/stumble');
        } catch (error) {
            console.error('Error completing onboarding:', error);

            // No fallback user creation - user MUST exist from authentication flow
            // If user doesn't exist, this is a critical system error
            if (error instanceof ApiError && error.status === 404) {
                console.error('CRITICAL: User does not exist in database after authentication!');
                showToast('Critical error: User account not found. Please contact support.', 'error');
                return;
            }

            // Show a user-friendly error message for other errors
            showToast('There was an error saving your preferences. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/stumble');
    };

    if (!isLoaded || topicsLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">
                        {!isLoaded ? 'Loading...' : 'Loading topics...'}
                    </span>
                </div>
            </div>
        );
    } if (!isSignedIn) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Redirecting to sign in...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex justify-center">Welcome to <Logo textMode='full' textSize='xxl' /></h1>
                    <p className="text-lg text-base-content/70">
                        Let's personalize your discovery experience
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-2xl mx-auto mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-base-content/60">Step {step} of 3</span>
                        <span className="text-sm text-base-content/60">{Math.round((step / 3) * 100)}% complete</span>
                    </div>
                    <progress className="progress progress-primary w-full" value={step} max="3"></progress>
                </div>

                <div className="max-w-4xl mx-auto">
                    {step === 1 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-4">Choose Your Interests</h2>
                            <p className="text-base-content/70 mb-8">
                                Select topics that interest you. We'll use these to find amazing content you'll love.
                            </p>

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
                                                    : 'border-base-300 hover:border-primary/50'
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
                                            <i className="fa-solid fa-duotone fa-chevron-left"></i>
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
                                            <i className="fa-solid fa-duotone fa-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleSkip}
                                    className="btn btn-ghost"
                                >
                                    Skip for now
                                </button>

                                <div className="text-sm text-base-content/60">
                                    {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                                </div>

                                <button
                                    onClick={() => goToStep(2)}
                                    disabled={selectedTopics.length === 0}
                                    className="btn btn-primary"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-4">Community Guidelines</h2>
                            <p className="text-base-content/70 mb-8">
                                To keep Stumbleable welcoming and safe, we ask all members to follow our community guidelines.
                            </p>

                            <div className="max-w-2xl mx-auto mb-8">
                                {/* Condensed Guidelines */}
                                <div className="bg-base-200 rounded-lg p-6 text-left space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            <i className="fa-solid fa-duotone fa-check-circle text-success"></i>
                                            What We Encourage
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                            <li>Quality, interesting content</li>
                                            <li>Thoughtful curation and lists</li>
                                            <li>Respectful interactions</li>
                                            <li>Diverse perspectives</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            <i className="fa-solid fa-duotone fa-ban text-error"></i>
                                            What We Don't Allow
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                            <li>Hate speech or harassment</li>
                                            <li>Violence or harmful content</li>
                                            <li>Spam or manipulation</li>
                                            <li>Illegal content</li>
                                            <li>Adult or explicit content</li>
                                            <li>Deliberate misinformation</li>
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-base-300">
                                        <a
                                            href="/guidelines"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link link-primary text-sm flex items-center gap-2 justify-center"
                                        >
                                            <i className="fa-solid fa-duotone fa-arrow-up-right-from-square"></i>
                                            Read Full Community Guidelines
                                        </a>
                                    </div>
                                </div>

                                {/* Acceptance Checkbox */}
                                <div className="mt-6">
                                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-base-100 rounded-lg border-2 border-base-300 hover:border-primary transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={guidelinesAccepted}
                                            onChange={(e) => setGuidelinesAccepted(e.target.checked)}
                                            className="checkbox checkbox-primary mt-1"
                                        />
                                        <span className="text-left">
                                            I have read and agree to follow the Stumbleable Community Guidelines.
                                            I understand that violations may result in content removal or account suspension.
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => goToStep(1)}
                                    className="btn btn-ghost"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={() => goToStep(3)}
                                    disabled={!guidelinesAccepted}
                                    className="btn btn-primary"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-4">Set Your Exploration Level</h2>
                            <p className="text-base-content/70 mb-8">
                                How adventurous do you want your discoveries to be?
                            </p>

                            <div className="max-w-md mx-auto mb-8">
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-base-content/80">
                                        Wildness: {wildness}%
                                    </label>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={wildness}
                                    onChange={(e) => setWildness(Number(e.target.value))}
                                    className="range range-primary w-full"
                                />

                                <div className="flex justify-between text-xs text-base-content/60 mt-2">
                                    <span>Conservative</span>
                                    <span>Balanced</span>
                                    <span>Adventurous</span>
                                </div>

                                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                    <p className="text-sm">
                                        {wildness < 30 && "You'll see content closely matching your interests"}
                                        {wildness >= 30 && wildness < 70 && "You'll see a good mix of familiar and new content"}
                                        {wildness >= 70 && "You'll see adventurous discoveries outside your usual interests"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => goToStep(2)}
                                    className="btn btn-ghost"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={handleSkip}
                                    className="btn btn-ghost"
                                >
                                    Skip for now
                                </button>

                                <button
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading && <span className="loading loading-spinner"></span>}
                                    Start Discovering!
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
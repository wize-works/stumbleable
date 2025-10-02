'use client';

import { useToaster } from '@/components/toaster';
import { UserAPI } from '@/lib/api-client';
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

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load available topics
    useEffect(() => {
        async function loadTopics() {
            if (!isSignedIn) return;

            try {
                const token = await getToken();
                if (!token) return;

                const availableTopics = await UserAPI.getTopics(token);
                setTopics(availableTopics);
            } catch (error) {
                console.error('Error loading topics:', error);
            } finally {
                setTopicsLoading(false);
            }
        }

        if (isLoaded && isSignedIn) {
            loadTopics();
        }
    }, [isLoaded, isSignedIn, getToken]);

    const handleTopicToggle = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const handleComplete = async () => {
        if (!user?.id || selectedTopics.length === 0) return;

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // Accept guidelines first
            if (guidelinesAccepted) {
                await UserAPI.acceptGuidelines(user.id, token);
            }

            // Update user preferences (user already exists from sign-up or first visit)
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
            // Show a user-friendly error message
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
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
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

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                                {topics.map((topic) => (
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
                                    onClick={() => setStep(2)}
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
                                    onClick={() => setStep(1)}
                                    className="btn btn-ghost"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={() => setStep(3)}
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
                                    onClick={() => setStep(2)}
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
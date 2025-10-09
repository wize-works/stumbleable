'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DiscoveryCard } from '../../components/discovery-card';
import { EmptyState } from '../../components/empty-state';
import { Discovery } from '../../data/types';
import { InteractionAPI } from '../../lib/api-client';

export default function SavedPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const [savedDiscoveries, setSavedDiscoveries] = useState<Discovery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load saved discoveries
    useEffect(() => {
        async function loadSavedDiscoveries() {
            if (!isSignedIn || !user?.id) return;

            try {
                setLoading(true);
                setError(null);

                const token = await getToken();
                if (!token) {
                    setError('Authentication required. Please sign in again.');
                    return;
                }

                // Get saved discoveries using Clerk authentication in the API
                const discoveries = await InteractionAPI.getSaved(token);
                setSavedDiscoveries(discoveries);
            } catch (err) {
                console.error('Error loading saved discoveries:', err);
                setError('Failed to load saved discoveries. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        if (isLoaded && isSignedIn && user?.id) {
            loadSavedDiscoveries();
        }
    }, [isLoaded, isSignedIn, user?.id]);

    // Show loading state while authentication is being checked
    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    // If not signed in, this will be handled by the redirect useEffect
    if (!isSignedIn || !user) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Redirecting to sign in...</span>
                </div>
            </div>
        );
    }

    // Show loading state while saved discoveries are being loaded
    if (loading) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-center mb-8">Saved Discoveries</h1>
                    <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="loading loading-spinner loading-xl text-primary"></div>
                            <span className="text-lg">Loading your saved discoveries...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-center mb-8">Saved Discoveries</h1>
                    <EmptyState
                        illustration="search"
                        title="Failed to load saved discoveries"
                        description={error}
                        action={{
                            label: 'Try Again',
                            href: '/saved'
                        }}
                    />
                </div>
            </div>
        );
    }

    // Show empty state
    if (savedDiscoveries.length === 0) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-center mb-8">Saved Discoveries</h1>

                    <EmptyState
                        illustration="bookmark"
                        title="No saved discoveries yet"
                        description="Start stumbling and save discoveries you want to revisit later. Use the Save button or press 'S' on any discovery."
                        action={{
                            label: 'Start Stumbling',
                            href: '/stumble'
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Saved Discoveries</h1>
                    <p className="text-base-content/60">
                        {savedDiscoveries.length} item{savedDiscoveries.length !== 1 ? 's' : ''} saved
                    </p>
                </div>

                <div className="grid gap-6 max-w-4xl mx-auto">
                    {savedDiscoveries.map((discovery) => (
                        <DiscoveryCard
                            key={discovery.id}
                            discovery={discovery}
                            showTrending={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
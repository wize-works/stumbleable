'use client';

import Breadcrumbs from '@/components/breadcrumbs';
import { Interaction } from '@/data/types';
import { InteractionAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AnalyticsSummary {
    totalInteractions: number;
    byAction: Record<string, number>;
    savedCount: number;
}

export default function AnalyticsPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load analytics data
    useEffect(() => {
        async function loadAnalytics() {
            if (!isSignedIn || !user?.id) return;

            try {
                setLoading(true);
                setError(null);

                const token = await getToken();
                if (!token) {
                    setError('Authentication required. Please sign in again.');
                    return;
                }

                const [summaryData, recentData] = await Promise.all([
                    InteractionAPI.getAnalyticsSummary(token),
                    InteractionAPI.getRecentInteractions(token),
                ]);

                setSummary(summaryData);
                setRecentInteractions(recentData);
            } catch (err) {
                console.error('Error loading analytics:', err);
                setError('Failed to load analytics. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        if (isLoaded && isSignedIn && user?.id) {
            loadAnalytics();
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

    // Show loading state while analytics are being loaded
    if (loading) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <Breadcrumbs items={[
                        { label: 'Home', href: '/' },
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Analytics', href: '/dashboard/analytics' }
                    ]} />
                    <h1 className="text-3xl font-bold text-center mb-8">Analytics</h1>
                    <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="loading loading-spinner loading-xl text-primary"></div>
                            <span className="text-lg">Loading analytics...</span>
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
                    <Breadcrumbs items={[
                        { label: 'Home', href: '/' },
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Analytics', href: '/dashboard/analytics' }
                    ]} />
                    <h1 className="text-3xl font-bold text-center mb-8">Analytics</h1>
                    <div className="text-center">
                        <div className="text-xl text-error mb-4">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'up': return 'fa-solid fa-duotone fa-thumbs-up text-success';
            case 'down': return 'fa-solid fa-duotone fa-thumbs-down text-error';
            case 'save': return 'fa-solid fa-duotone fa-bookmark text-warning';
            case 'share': return 'fa-solid fa-duotone fa-share text-info';
            case 'skip': return 'fa-solid fa-duotone fa-forward text-base-content';
            default: return 'fa-solid fa-duotone fa-question text-base-content';
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'up': return 'Liked';
            case 'down': return 'Disliked';
            case 'save': return 'Saved';
            case 'share': return 'Shared';
            case 'skip': return 'Skipped';
            default: return action;
        }
    };

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Analytics', href: '/dashboard/analytics' }
                ]} />

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                    <p className="text-base-content/60">Your interaction statistics and history</p>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body text-center">
                                <h2 className="card-title justify-center">Total Interactions</h2>
                                <div className="text-4xl font-bold text-primary">{summary.totalInteractions}</div>
                            </div>
                        </div>

                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body text-center">
                                <h2 className="card-title justify-center">Saved Items</h2>
                                <div className="text-4xl font-bold text-warning">{summary.savedCount}</div>
                            </div>
                        </div>

                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body text-center">
                                <h2 className="card-title justify-center">Likes</h2>
                                <div className="text-4xl font-bold text-success">{summary.byAction.up || 0}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Breakdown */}
                {summary && (
                    <div className="card bg-base-200 shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Actions Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(summary.byAction).map(([action, count]) => (
                                    <div key={action} className="text-center">
                                        <div className="text-2xl mb-2">
                                            <i className={getActionIcon(action)}></i>
                                        </div>
                                        <div className="font-semibold">{getActionLabel(action)}</div>
                                        <div className="text-2xl font-bold">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Interactions */}
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title mb-4">Recent Interactions</h2>
                        {recentInteractions.length === 0 ? (
                            <div className="text-center text-base-content/60 py-8">
                                No interactions yet. Start stumbling to see your activity here!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>Discovery</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInteractions.map((interaction) => (
                                            <tr key={interaction.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <i className={getActionIcon(interaction.action)}></i>
                                                        <span>{getActionLabel(interaction.action)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <code className="text-sm">{interaction.discoveryId}</code>
                                                </td>
                                                <td>{formatDateTime(interaction.at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
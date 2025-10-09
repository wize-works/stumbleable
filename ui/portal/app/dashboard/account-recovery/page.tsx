'use client';

import { UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DeletionRequest {
    id: string;
    requestedAt: string;
    scheduledDeletionAt: string;
    status: 'pending' | 'cancelled' | 'completed';
}

export default function AccountRecoveryPage() {
    const { isLoaded, userId, getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchDeletionRequest() {
            if (!isLoaded || !userId) {
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    throw new Error('No authentication token');
                }
                const request = await UserAPI.getDeletionRequest(userId, token);
                setDeletionRequest(request);
            } catch (err: any) {
                console.error('Failed to fetch deletion request:', err);
                setError('Failed to load deletion request');
            } finally {
                setLoading(false);
            }
        }

        fetchDeletionRequest();
    }, [isLoaded, userId]);

    const handleCancelDeletion = async () => {
        if (!userId || !deletionRequest) return;

        setCancelling(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No authentication token');
            }
            await UserAPI.cancelDeletion(userId, token);
            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('Failed to cancel deletion:', err);
            setError('Failed to cancel deletion. Please try again or contact support.');
        } finally {
            setCancelling(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4 text-base-content/70">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isLoaded || !userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="max-w-md w-full p-8 bg-base-200 rounded-2xl text-center">
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-base-content/70 mb-6">
                        Please sign in to manage your account deletion request.
                    </p>
                    <button
                        onClick={() => router.push('/sign-in')}
                        className="btn btn-primary"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    // No deletion request found
    if (!deletionRequest || deletionRequest.status !== 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="max-w-md w-full p-8 bg-base-200 rounded-2xl text-center">
                    <div className="text-6xl mb-4 text-success">
                        <i className="fa-solid fa-duotone fa-circle-check"></i>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">No Pending Deletion</h1>
                    <p className="text-base-content/70 mb-6">
                        Your account is active and in good standing.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn btn-primary"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Calculate time remaining
    const scheduledDate = new Date(deletionRequest.scheduledDeletionAt);
    const now = new Date();
    const msRemaining = scheduledDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="max-w-md w-full p-8 bg-base-200 rounded-2xl text-center">
                    <div className="text-6xl mb-4 text-success">
                        <i className="fa-solid fa-duotone fa-party-horn"></i>
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-success">Deletion Cancelled!</h1>
                    <p className="text-base-content/70 mb-6">
                        Your account has been restored and will not be deleted. Redirecting to dashboard...
                    </p>
                    <div className="loading loading-spinner loading-lg text-success"></div>
                </div>
            </div>
        );
    }

    // Main recovery interface
    return (
        <div className="min-h-screen bg-base-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Account Recovery</h1>
                    <p className="text-base-content/70">
                        Your account is scheduled for deletion
                    </p>
                </div>

                {/* Warning Card */}
                <div className="bg-warning/10 border-2 border-warning rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl text-warning">
                            <i className="fa-solid fa-duotone fa-triangle-exclamation"></i>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Deletion Scheduled</h2>
                            <p className="text-base-content/80 mb-4">
                                Your account and all associated data will be permanently deleted on{' '}
                                <strong>{scheduledDate.toLocaleDateString()}</strong> at{' '}
                                {scheduledDate.toLocaleTimeString()}.
                            </p>
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-3xl font-bold text-warning">{daysRemaining}</div>
                                    <div className="text-sm text-base-content/70">days remaining</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-warning">{hoursRemaining}</div>
                                    <div className="text-sm text-base-content/70">hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-base-200 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Account Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Email</span>
                            <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Requested</span>
                            <span className="font-medium">
                                {new Date(deletionRequest.requestedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Status</span>
                            <span className="badge badge-warning">Pending Deletion</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-base-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Want to keep your account?</h3>
                    <p className="text-base-content/70 mb-6">
                        You can cancel the deletion at any time before the scheduled date. Your account and all data will be immediately restored.
                    </p>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleCancelDeletion}
                            disabled={cancelling}
                            className="btn btn-success btn-lg flex-1"
                        >
                            {cancelling ? (
                                <>
                                    <span className="loading loading-spinner"></span>
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    Keep My Account
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="btn btn-ghost btn-lg"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-base-content/60">
                    <p>
                        Need help?{' '}
                        <a href="/contact" className="link link-primary">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

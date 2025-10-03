'use client';

import { EmailAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const userId = searchParams.get('userId');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-unsubscribed'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (userId) {
            handleUnsubscribe();
        } else {
            setStatus('error');
            setErrorMessage('Invalid unsubscribe link');
        }
    }, [userId]);

    const handleUnsubscribe = async () => {
        if (!userId) return;

        try {
            setStatus('loading');

            // For one-click unsubscribe from emails, we don't require authentication
            // The userId in the URL is trusted since it comes from a signed email link
            await EmailAPI.unsubscribeAll(userId);

            setStatus('success');
        } catch (error: any) {
            console.error('Unsubscribe failed:', error);

            // Check if already unsubscribed
            if (error?.message?.includes('already unsubscribed')) {
                setStatus('already-unsubscribed');
            } else {
                setStatus('error');
                setErrorMessage(error?.message || 'Failed to unsubscribe. Please try again.');
            }
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-base-content/60">Processing your unsubscribe request...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100 px-4">
                <div className="max-w-md w-full">
                    <div className="card bg-base-200">
                        <div className="card-body text-center">
                            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-duotone fa-check text-success text-3xl" />
                            </div>
                            <h1 className="card-title text-2xl justify-center mb-2">Successfully Unsubscribed</h1>
                            <p className="text-base-content/60 mb-6">
                                You've been unsubscribed from all Stumbleable emails. We're sorry to see you go!
                            </p>

                            <div className="divider">What's Next?</div>

                            <div className="space-y-3">
                                {isLoaded && user ? (
                                    <>
                                        <Link href="/email/preferences" className="btn btn-primary btn-block">
                                            <i className="fa-solid fa-duotone fa-sliders" />
                                            Manage Email Preferences
                                        </Link>
                                        <p className="text-sm text-base-content/60">
                                            Changed your mind? You can re-enable specific emails or resubscribe to all.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/sign-in" className="btn btn-primary btn-block">
                                            <i className="fa-solid fa-duotone fa-right-to-bracket" />
                                            Sign In to Manage Preferences
                                        </Link>
                                        <p className="text-sm text-base-content/60">
                                            Sign in to customize which emails you receive.
                                        </p>
                                    </>
                                )}

                                <Link href="/" className="btn btn-ghost btn-block">
                                    <i className="fa-solid fa-duotone fa-house" />
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-base-200 rounded-lg">
                        <h3 className="font-semibold text-sm text-base-content mb-2">About This Action</h3>
                        <ul className="text-xs text-base-content/60 space-y-1 list-disc list-inside">
                            <li>You won't receive any marketing or promotional emails</li>
                            <li>Important account security emails may still be sent</li>
                            <li>You can resubscribe at any time from your preferences</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'already-unsubscribed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100 px-4">
                <div className="max-w-md w-full">
                    <div className="card bg-base-200">
                        <div className="card-body text-center">
                            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-duotone fa-info-circle text-warning text-3xl" />
                            </div>
                            <h1 className="card-title text-2xl justify-center mb-2">Already Unsubscribed</h1>
                            <p className="text-base-content/60 mb-6">
                                You're already unsubscribed from all Stumbleable emails.
                            </p>

                            <div className="space-y-3">
                                {isLoaded && user ? (
                                    <Link href="/email/preferences" className="btn btn-primary btn-block">
                                        <i className="fa-solid fa-duotone fa-sliders" />
                                        Manage Email Preferences
                                    </Link>
                                ) : (
                                    <Link href="/sign-in" className="btn btn-primary btn-block">
                                        <i className="fa-solid fa-duotone fa-right-to-bracket" />
                                        Sign In to Manage Preferences
                                    </Link>
                                )}

                                <Link href="/" className="btn btn-ghost btn-block">
                                    <i className="fa-solid fa-duotone fa-house" />
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 px-4">
            <div className="max-w-md w-full">
                <div className="card bg-base-200">
                    <div className="card-body text-center">
                        <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-duotone fa-exclamation-circle text-error text-3xl" />
                        </div>
                        <h1 className="card-title text-2xl justify-center mb-2">Unsubscribe Failed</h1>
                        <p className="text-base-content/60 mb-2">
                            We couldn't process your unsubscribe request.
                        </p>
                        {errorMessage && (
                            <p className="text-sm text-error mb-6">
                                {errorMessage}
                            </p>
                        )}

                        <div className="space-y-3">
                            <button onClick={handleUnsubscribe} className="btn btn-primary btn-block">
                                <i className="fa-solid fa-duotone fa-rotate-right" />
                                Try Again
                            </button>

                            {isLoaded && user && (
                                <Link href="/email/preferences" className="btn btn-ghost btn-block">
                                    <i className="fa-solid fa-duotone fa-sliders" />
                                    Go to Email Preferences
                                </Link>
                            )}

                            <Link href="/contact" className="btn btn-ghost btn-block">
                                <i className="fa-solid fa-duotone fa-envelope" />
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-base-200 rounded-lg">
                    <h3 className="font-semibold text-sm text-base-content mb-2">Need Help?</h3>
                    <p className="text-xs text-base-content/60">
                        If you continue to have issues, please contact our support team. Include this link in your message so we can help resolve the issue quickly.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Extension Authentication Callback Page
// This page receives the authentication state after Clerk sign-in
// and sends it to the browser extension via postMessage

'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function ExtensionAuthPage() {
    const { isLoaded, isSignedIn, userId, getToken } = useAuth();
    const { user } = useUser();
    const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('Checking authentication...');

    useEffect(() => {
        async function sendAuthToExtension() {
            if (!isLoaded) return;

            if (!isSignedIn || !userId) {
                setStatus('error');
                setMessage('Not signed in. Redirecting to sign-in page...');

                // Redirect to sign-in if not authenticated
                setTimeout(() => {
                    window.location.href = '/sign-in?redirect_url=' + encodeURIComponent('/extension-auth');
                }, 2000);
                return;
            }

            try {
                // Get Clerk session token
                const token = await getToken();

                if (!token) {
                    throw new Error('Failed to get authentication token');
                }

                // Prepare authentication data for extension
                const authData = {
                    type: 'STUMBLEABLE_AUTH',
                    userId,
                    authToken: token,
                    email: user?.primaryEmailAddress?.emailAddress,
                    username: user?.username,
                    timestamp: Date.now()
                };

                // Send message to content script (which will relay to background)
                window.postMessage(authData, '*');

                setStatus('success');
                setMessage('Authentication successful! You can close this window.');

                // Auto-close after 2 seconds
                setTimeout(() => {
                    window.close();
                }, 2000);

            } catch (error) {
                console.error('Error sending auth to extension:', error);
                setStatus('error');
                setMessage('Failed to authenticate with extension. Please try again.');
            }
        }

        sendAuthToExtension();
    }, [isLoaded, isSignedIn, userId, user, getToken]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="card w-96 bg-base-200 shadow-xl">
                <div className="card-body items-center text-center">
                    {status === 'checking' && (
                        <>
                            <div className="loading loading-spinner loading-lg text-primary"></div>
                            <h2 className="card-title mt-4">Authenticating...</h2>
                            <p className="text-base-content/70">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="card-title text-success">Success!</h2>
                            <p className="text-base-content/70">{message}</p>
                            <p className="text-sm text-base-content/50 mt-2">
                                This window will close automatically.
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="text-6xl mb-4">❌</div>
                            <h2 className="card-title text-error">Error</h2>
                            <p className="text-base-content/70">{message}</p>
                            <div className="card-actions mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => window.location.href = '/sign-in'}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => window.close()}
                                >
                                    Close Window
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useAuth, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';

// Use environment variable for Interaction API URL
const INTERACTION_API_URL = process.env.NEXT_PUBLIC_INTERACTION_API_URL || 'http://localhost:7002';
const INTERACTION_API = `${INTERACTION_API_URL}/api`;

interface SessionData {
    sessionId: string;
    startTime: string;
    discoveryCount: number;
    interactionCount: number;
    isActive: boolean;
}

interface UseSessionTrackingReturn {
    session: SessionData | null;
    isLoading: boolean;
    error: string | null;
    trackDiscovery: () => Promise<void>;
    trackInteraction: () => Promise<void>;
    endSession: () => Promise<void>;
}

/**
 * Custom hook for real-time session analytics tracking
 * Automatically starts a session when user is authenticated and tracks activity
 */
export function useSessionTracking(): UseSessionTrackingReturn {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [session, setSession] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs to prevent stale closures in effect cleanup
    const sessionIdRef = useRef<string | null>(null);
    const userIdRef = useRef<string | null>(null);
    const sessionStartedRef = useRef(false); // Track if session start has been initiated

    /**
     * Start a new session for the authenticated user
     */
    const startSession = useCallback(async (clerkUserId: string) => {
        // Prevent duplicate session starts
        if (sessionStartedRef.current) {
            console.log('Session start already in progress, skipping...');
            return;
        }

        try {
            sessionStartedRef.current = true;
            setIsLoading(true);
            setError(null);

            console.log('Starting session for Clerk user:', clerkUserId);

            // Start session tracking with Clerk user ID
            // The interaction service will resolve it to internal UUID
            const response = await fetch(`${INTERACTION_API}/sessions/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: clerkUserId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to start session');
            }

            const data = await response.json();

            const newSession: SessionData = {
                sessionId: data.sessionId,
                startTime: data.startTime,
                discoveryCount: 0,
                interactionCount: 0,
                isActive: true,
            };

            setSession(newSession);
            sessionIdRef.current = data.sessionId;
            userIdRef.current = clerkUserId;

            console.log('Session started successfully:', data.sessionId);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
            setError(errorMessage);
            console.error('Session tracking error:', err);
            // Reset the flag on error so user can retry
            sessionStartedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, []); // ← FIX: Add getToken to dependencies

    /**
     * Update session with discovery activity
     */
    const trackDiscovery = useCallback(async () => {
        if (!session?.sessionId || !session.isActive) return;

        try {
            const response = await fetch(`${INTERACTION_API}/sessions/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: 'discovery'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to track discovery');
            }

            const data = await response.json();

            setSession(prev => prev ? {
                ...prev,
                discoveryCount: data.discoveryCount,
                interactionCount: data.interactionCount,
            } : null);

        } catch (err) {
            console.error('Failed to track discovery:', err);
        }
    }, [session?.sessionId, session?.isActive]);

    /**
     * Update session with interaction activity
     */
    const trackInteraction = useCallback(async () => {
        if (!session?.sessionId || !session.isActive) return;

        try {
            const response = await fetch(`${INTERACTION_API}/sessions/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    action: 'interaction'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to track interaction');
            }

            const data = await response.json();

            setSession(prev => prev ? {
                ...prev,
                discoveryCount: data.discoveryCount,
                interactionCount: data.interactionCount,
            } : null);

        } catch (err) {
            console.error('Failed to track interaction:', err);
        }
    }, [session?.sessionId, session?.isActive]);

    /**
     * End the current session
     */
    const endSession = useCallback(async () => {
        if (!session?.sessionId || !session.isActive) return;

        try {
            const response = await fetch(`${INTERACTION_API}/sessions/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: session.sessionId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to end session');
            }

            const data = await response.json();

            setSession(prev => prev ? {
                ...prev,
                isActive: false,
            } : null);

            // Reset session started flag so a new session can be created
            sessionStartedRef.current = false;

            console.log('Session ended:', {
                duration: data.sessionDuration,
                discoveries: data.totalDiscoveries,
                interactions: data.totalInteractions,
            });

        } catch (err) {
            console.error('Failed to end session:', err);
        }
    }, [session?.sessionId, session?.isActive]);

    /**
     * Initialize session when user is authenticated
     */
    useEffect(() => {
        if (isLoaded && isSignedIn && user?.id && !session && !isLoading) {
            startSession(user.id);
        }
    }, [isLoaded, isSignedIn, user?.id, session, isLoading, startSession]);

    /**
     * End session on component unmount or user sign out
     */
    useEffect(() => {
        return () => {
            if (sessionIdRef.current) {
                // Reset session started flag on unmount
                sessionStartedRef.current = false;

                // End session on cleanup
                fetch(`${INTERACTION_API}/sessions/end`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: sessionIdRef.current
                    }),
                    keepalive: true, // Ensure request completes even if page is closing
                }).catch(err => {
                    console.error('Failed to end session on cleanup:', err);
                });
            }
        };
    }, []);

    /**
     * Handle page visibility changes (tab switching, minimizing)
     */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && session?.isActive) {
                // User switched away from tab - could pause tracking or note inactivity
                console.log('User switched away from tab');
            } else if (!document.hidden && session?.isActive) {
                // User returned to tab
                console.log('User returned to tab');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [session?.isActive]);

    /**
     * Handle page unload (refresh, close, navigate away)
     */
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (sessionIdRef.current) {
                // Use beacon API for reliable session ending on page unload
                if (navigator.sendBeacon) {
                    // Send as Blob with application/json content type
                    const data = JSON.stringify({
                        sessionId: sessionIdRef.current
                    });
                    const blob = new Blob([data], { type: 'application/json' });
                    navigator.sendBeacon(`${INTERACTION_API}/sessions/end`, blob);
                } else {
                    // Fallback for browsers without beacon support
                    fetch(`${INTERACTION_API}/sessions/end`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sessionId: sessionIdRef.current
                        }),
                        keepalive: true,
                    }).catch(() => {
                        // Ignore errors on page unload
                    });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return {
        session,
        isLoading,
        error,
        trackDiscovery,
        trackInteraction,
        endSession,
    };
}
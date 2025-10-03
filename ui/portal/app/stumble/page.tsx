'use client';

import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { useToaster } from '@/components/toaster';
import { WildnessControl } from '@/components/wildness-control';
import { Discovery, Interaction } from '@/data/types';
import { ApiError, DiscoveryAPI, InteractionAPI, UserAPI } from '@/lib/api-client';
import { useOnboardingCheck } from '@/lib/use-onboarding';
import { useSessionTracking } from '@/lib/use-session-tracking';
import { useSwipe } from '@/lib/use-swipe';
import { useUserInitialization } from '@/lib/use-user-initialization';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DiscoveryCard } from '../../components/discovery-card';
import { DiscoveryDetailsBar } from '../../components/discovery-details-bar';
import { ReactionBar } from '../../components/reaction-bar';

export default function StumblePage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const [currentDiscovery, setCurrentDiscovery] = useState<Discovery | null>(null);
    const [wildness, setWildness] = useState(35); // default wildness
    const seenIdsRef = useRef(new Set<string>());
    const [loading, setLoading] = useState(false);
    const [userDataLoaded, setUserDataLoaded] = useState(false);
    const [initialDiscoveryLoaded, setInitialDiscoveryLoaded] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [authFailed, setAuthFailed] = useState(false);
    const [discoveryReason, setDiscoveryReason] = useState<string>('');
    const [iframeError, setIframeError] = useState(false);
    const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
    const iframeLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const iframeLoadedRef = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { showToast } = useToaster();

    // Session tracking for real-time analytics
    const { session, trackDiscovery, trackInteraction } = useSessionTracking();

    // Ensure user exists in database (redirects to onboarding if not)
    const { userExists, isLoading: userInitLoading, error: userInitError } = useUserInitialization();

    // Check if user needs onboarding
    const { needsOnboarding, loading: onboardingLoading } = useOnboardingCheck();

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Redirect to onboarding if needed
    useEffect(() => {
        if (isLoaded && isSignedIn && !onboardingLoading && needsOnboarding) {
            router.push('/onboarding');
        }
    }, [isLoaded, isSignedIn, onboardingLoading, needsOnboarding, router]);

    // Load user data from user service
    useEffect(() => {
        async function loadUserData() {
            if (!user?.id) return;

            try {
                const token = await getToken();
                if (!token) {
                    console.error('No authentication token available');
                    setUserDataLoaded(true);
                    return;
                }

                // User should already exist from authentication flow - no fallback creation
                const userData = await UserAPI.getUser(user.id, token);
                setWildness(userData.wildness);

                // Initialize saved cache for better UX
                await InteractionAPI.initializeSavedCache(token);

                setUserDataLoaded(true);
            } catch (error) {
                console.error('Error loading user data:', error);

                // Check if it's an authentication error
                if (error instanceof ApiError && error.status === 401) {
                    console.error('Authentication failed - stopping retry attempts');
                    setAuthFailed(true);
                    setUserDataLoaded(true);
                    showToast('Authentication failed. Please sign out and sign back in.', 'error');
                    return;
                }

                // If user doesn't exist (404), this is a critical system error
                if (error instanceof ApiError && error.status === 404) {
                    console.error('CRITICAL: User not found in database after authentication!');
                    setAuthFailed(true);
                    setUserDataLoaded(true);
                    showToast('Critical error: User account not found. Please sign out and sign back in.', 'error');
                    return;
                }

                // Use defaults only for service unavailability, not missing users
                setUserDataLoaded(true);
                if (error instanceof ApiError) {
                    showToast(`Warning: ${error.message}. Using default preferences.`, 'warning');
                }
            }
        }

        if (isLoaded && isSignedIn && user?.id && !userDataLoaded && !authFailed) {
            loadUserData();
        }
    }, [isLoaded, isSignedIn, user?.id, userDataLoaded, authFailed]);

    // Swipe gesture support
    const swipeRef = useSwipe({
        onSwipeLeft: () => !loading && currentDiscovery && handleReaction('down'), // Skip
        onSwipeRight: () => !loading && currentDiscovery && handleReaction('up'), // Like
        onSwipeUp: () => !loading && currentDiscovery && handleReaction('save'), // Save
        onSwipeDown: () => !loading && handleStumble(), // Next
    }, {
        threshold: 80, // Require more distance for accidental swipes
        trackMouse: false, // Only touch gestures
    });

    // Load/save wildness from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('stumbleable-wildness');
        if (saved) {
            setWildness(Number(saved));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('stumbleable-wildness', wildness.toString());

        // Sync wildness changes to user service (debounced)
        const timeoutId = setTimeout(async () => {
            if (user?.id && userDataLoaded) {
                try {
                    const token = await getToken();
                    if (!token) {
                        console.error('No authentication token available');
                        return;
                    }

                    await UserAPI.updatePreferences(user.id, { wildness }, token);
                } catch (error) {
                    console.error('Error updating wildness:', error);
                    // Don't show error toast for this, it's not critical
                }
            }
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timeoutId);
    }, [wildness, user?.id, userDataLoaded]);

    const handleStumble = useCallback(async () => {
        if (!user?.id) {
            showToast('Please sign in to continue', 'error');
            return;
        }

        setLoading(true);

        try {
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 200));

            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                return;
            }

            const response = await DiscoveryAPI.getNext({
                wildness,
                seenIds: seenIdsRef.current,
                token
            });

            setCurrentDiscovery(response.discovery);
            setDiscoveryReason(response.reason);
            seenIdsRef.current.add(response.discovery.id);

            // Check if we know this content blocks iframe embedding from database
            if (response.discovery.allowsFraming === false) {
                console.log('[Stumble] Content known to block iframes - showing warning:', response.discovery.domain);
                setIframeError(true);
                iframeLoadedRef.current = false;
                // Still try to load iframe, but warning will persist
            } else {
                // Reset iframe error state for new discovery ONLY if not known to block
                setIframeError(false);
                iframeLoadedRef.current = false;
            }

            // Clear any existing timeout
            if (iframeLoadTimeoutRef.current) {
                clearTimeout(iframeLoadTimeoutRef.current);
            }

            // Simple timeout-based detection for unknown sites
            // If onLoad fires within timeout, we assume success
            // If timeout fires first, we show the warning (might be blocked)
            // Once warning is set, it stays for this discovery
            if (response.discovery.allowsFraming !== false) {
                iframeLoadTimeoutRef.current = setTimeout(() => {
                    if (!iframeLoadedRef.current) {
                        console.warn('[Stumble] Iframe did not load within 3 seconds - showing warning:', response.discovery.domain);
                        setIframeError(true);
                    }
                }, 3000);
            }            // Track discovery for session analytics
            await trackDiscovery();

            // Update saved state for the new discovery
            setIsSaved(InteractionAPI.isSaved(response.discovery.id));

            // Mark initial discovery as loaded if this is the first one
            if (!initialDiscoveryLoaded) {
                setInitialDiscoveryLoaded(true);
            }
        } catch (error) {
            console.error('Error getting next discovery:', error);
            if (error instanceof ApiError) {
                showToast(`Error: ${error.message}`, 'error');
            } else {
                showToast('Failed to load next discovery. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id, wildness, showToast, initialDiscoveryLoaded]);

    // Load initial discovery when user is ready and user data is loaded
    useEffect(() => {
        if (isLoaded && isSignedIn && user?.id && userDataLoaded && !initialDiscoveryLoaded) {
            handleStumble();
        }

        // Cleanup timeout on unmount
        return () => {
            if (iframeLoadTimeoutRef.current) {
                clearTimeout(iframeLoadTimeoutRef.current);
            }
        };
    }, [isLoaded, isSignedIn, user?.id, userDataLoaded, initialDiscoveryLoaded, handleStumble]);

    const handleReaction = async (action: Interaction['action']) => {
        if (!currentDiscovery) return;

        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                return;
            }

            await InteractionAPI.recordFeedback(currentDiscovery.id, action, token);

            // Track interaction for session analytics
            await trackInteraction();

            // Update saved state for save actions
            if (action === 'save') {
                const newSavedState = InteractionAPI.isSaved(currentDiscovery.id);
                setIsSaved(newSavedState);
            }

            // Show toast feedback
            const messages: Record<Interaction['action'], string> = {
                up: 'Liked!',
                down: 'Skipped!',
                save: isSaved ? 'Removed from saved' : 'Saved!',
                share: 'Link copied!',
                skip: 'Skipped!',
            };

            showToast(messages[action], action === 'up' ? 'success' : action === 'down' ? 'info' : action === 'save' ? 'warning' : 'info');

            // Handle share action
            if (action === 'share') {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(currentDiscovery.url);
                } else {
                    // Fallback for older browsers
                    showToast('Copy the URL manually: ' + currentDiscovery.url, 'info', 5000);
                }
            }

            // Auto-advance on like/skip
            if (action === 'up' || action === 'down') {
                setTimeout(() => {
                    handleStumble();
                }, 400);
            }
        } catch (error) {
            console.error('Error recording feedback:', error);
            if (error instanceof ApiError) {
                showToast(`Error: ${error.message}`, 'error');
            } else {
                showToast('Failed to record feedback. Please try again.', 'error');
            }
        }
    };

    // Show loading state while authentication or onboarding is being checked
    if (!isLoaded || onboardingLoading) {
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

    // Show loading state while user data is being loaded
    if (!userDataLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Setting up your preferences...</span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={swipeRef}
            className="h-screen flex flex-col bg-base-100 overflow-hidden touch-pan-y"
        >
            {/* Top Controls Bar */}
            <div className="flex-none bg-base-100 border-b border-base-300 px-3 sm:px-4 py-2 sm:py-3 z-20">
                <div className="flex items-center justify-between max-w-full">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        {currentDiscovery && (
                            <>
                                <div className="badge badge-neutral text-xs shrink-0 flex items-center gap-1.5">
                                    {currentDiscovery.faviconUrl && (
                                        <img
                                            src={currentDiscovery.faviconUrl}
                                            alt=""
                                            width={12}
                                            height={12}
                                            className="inline-block"
                                            onError={(e) => {
                                                // Hide favicon if it fails to load
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    {currentDiscovery.domain}
                                </div>
                                <h2 className="font-semibold text-sm sm:text-base truncate min-w-0 flex-1">
                                    {currentDiscovery.title}
                                </h2>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-none">
                        <WildnessControl
                            value={wildness}
                            onChange={setWildness}
                            className="hidden lg:flex bg-transparent shadow-none p-2"
                        />

                        {currentDiscovery && (
                            <a
                                href={currentDiscovery.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs sm:btn-sm btn-ghost touch-manipulation"
                                title="Open in new tab"
                            >
                                <i className="fa-solid fa-duotone fa-external-link text-xs sm:text-sm"></i>
                            </a>
                        )}
                    </div>
                </div>

                {/* Discovery Rationale */}
                {discoveryReason && (
                    <div className="mt-2 px-1">
                        <p className="text-xs text-base-content/60 italic">
                            Why you're seeing this: {discoveryReason}
                        </p>
                    </div>
                )}
            </div>

            {/* Full-Screen Iframe */}
            <div className="flex-1 relative bg-base-100 overflow-auto">
                {currentDiscovery && (
                    <>
                        <iframe
                            ref={iframeRef}
                            key={currentDiscovery.id}
                            src={currentDiscovery.url}
                            className="w-full h-full border-0"
                            title={currentDiscovery.title}
                            loading="eager"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                            referrerPolicy="strict-origin-when-cross-origin"
                            onLoad={() => {
                                console.log('[Stumble] ✓ Iframe onLoad fired:', currentDiscovery.domain);

                                // Mark as successfully loaded
                                iframeLoadedRef.current = true;

                                // Clear timeout - onLoad fired before timeout, so no warning needed
                                // BUT: Don't clear error if already set (from database or previous timeout)
                                if (iframeLoadTimeoutRef.current) {
                                    clearTimeout(iframeLoadTimeoutRef.current);
                                    iframeLoadTimeoutRef.current = null;
                                }

                                // Only clear error if not from database knowledge
                                if (currentDiscovery.allowsFraming !== false && !iframeError) {
                                    // Successfully loaded before timeout, no error to clear
                                    console.log('[Stumble] ✓ Iframe loaded successfully within timeout');
                                }
                            }}
                            onError={() => {
                                console.error('[Stumble] ✗ Iframe onError fired:', currentDiscovery.domain);
                                // Note: onError typically fires for network failures, not HTTP error codes like 404
                                // A 404 page with HTML content will still load in the iframe and trigger onLoad
                                // Set error indicator to suggest viewing Discovery Card
                                iframeLoadedRef.current = false;
                                setIframeError(true);
                            }}
                        />

                        {/* Mobile Swipe Hints */}
                        <div className="absolute inset-x-0 bottom-20 sm:bottom-24 pointer-events-none z-10 md:hidden">
                            <div className="text-center">
                                <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 mx-auto inline-block">
                                    <p className="text-white text-xs">
                                        Swipe ← Skip • → Like • ↑ Save • ↓ Next
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Discovery Card Modal */}
            {showDiscoveryModal && currentDiscovery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowDiscoveryModal(false)}>
                    <div className="bg-base-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between z-10">
                            <h3 className="text-xl font-bold">Discovery Details</h3>
                            <button
                                onClick={() => setShowDiscoveryModal(false)}
                                className="btn btn-ghost btn-circle btn-sm"
                            >
                                <i className="fa-solid fa-duotone fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            {iframeError && (
                                <div className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-warning">
                                        <i className="fa-solid fa-duotone fa-triangle-exclamation text-xl"></i>
                                        <p className="text-sm font-medium">
                                            This site may not be displaying correctly in the frame. Use the details below or open directly.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <DiscoveryCard
                                discovery={currentDiscovery}
                                reason={discoveryReason}
                                showTrending={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 bg-base-100/95 backdrop-blur-sm flex items-center justify-center z-30">
                    <div className="flex flex-col items-center gap-4">
                        <div className="loading loading-spinner loading-xl text-primary"></div>
                        <div className="text-center">
                            <div className="text-xl font-semibold mb-1">Finding your next discovery...</div>
                            {currentDiscovery && (
                                <div className="text-sm text-base-content/60">
                                    Loading {currentDiscovery.domain}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Initial loading state */}
            {!currentDiscovery && loading && (
                <div className="absolute inset-0 bg-base-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="loading loading-spinner loading-xl text-primary"></div>
                        <span className="text-xl">Preparing your first discovery...</span>
                    </div>
                </div>
            )}

            {/* Discovery Details Bar - Mini bar above ReactionBar */}
            {currentDiscovery && (
                <DiscoveryDetailsBar
                    hasError={iframeError}
                    onOpenModal={() => setShowDiscoveryModal(true)}
                />
            )}

            <ReactionBar
                onReaction={handleReaction}
                onStumble={handleStumble}
                isSaved={isSaved}
                disabled={loading || !currentDiscovery}
                discoveryId={currentDiscovery?.id}
                onAddedToList={(listId, listTitle) => {
                    showToast(`Added to "${listTitle}"`, 'success');
                }}
            />

            {/* Mobile/Tablet Wildness Control */}
            <div className="lg:hidden fixed top-16 sm:top-20 left-3 right-3 z-30">
                <div className="bg-base-100/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-base-300">
                    <WildnessControl
                        value={wildness}
                        onChange={setWildness}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcuts
                onStumble={handleStumble}
                onLike={() => handleReaction('up')}
                onSkip={() => handleReaction('down')}
                onSave={() => handleReaction('save')}
                onShare={() => handleReaction('share')}
                disabled={loading || !currentDiscovery}
            />
        </div >
    );
}
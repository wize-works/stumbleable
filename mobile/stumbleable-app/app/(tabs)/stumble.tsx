import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { DiscoveryCard, DiscoveryWithReason } from "../../components/DiscoveryCard";
import { ReactionBar } from "../../components/ReactionBar";
import { ApiError, DiscoveryAPI, Interaction, InteractionAPI, NetworkTest, User, UserAPI } from "../../lib/api-client";
import { useTheme } from "../../lib/ThemeProvider";
import { useUniversalStyles } from "../../lib/useThemedStyles";

export default function StumbleScreen() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { theme } = useTheme();
    const styles = useUniversalStyles();

    const [currentDiscovery, setCurrentDiscovery] = useState<DiscoveryWithReason | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [wildness, setWildness] = useState(35); // default wildness
    const [isLoading, setIsLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [webViewError, setWebViewError] = useState(false);
    const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
    const [modalDismissedForDiscovery, setModalDismissedForDiscovery] = useState<string | null>(null);
    const [discoveryReason, setDiscoveryReason] = useState<string>('');
    const [userReactions, setUserReactions] = useState({
        liked: false,
        saved: false,
        skipped: false
    });

    // Track time spent on each discovery for engagement metrics
    const discoveryViewStartTimeRef = useRef<number | null>(null);
    const webViewLoadedRef = useRef(false);
    const webViewLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seenIdsRef = useRef(new Set<string>());

    // Auto-open discovery card modal when WebView error is detected
    // But respect user's choice if they manually closed it for this discovery
    React.useEffect(() => {
        if (webViewError && currentDiscovery && !showDiscoveryModal) {
            // Check if user has dismissed modal for this specific discovery
            if (modalDismissedForDiscovery === currentDiscovery.id) {
                return; // User closed it, don't reopen
            }

            // Small delay to let the error banner be visible first
            const timeoutId = setTimeout(() => {
                setShowDiscoveryModal(true);
            }, 800); // Show modal after error banner is visible

            return () => clearTimeout(timeoutId);
        }
    }, [webViewError, currentDiscovery, showDiscoveryModal, modalDismissedForDiscovery]);

    // Initialize user data and load first discovery
    useEffect(() => {
        async function initializeUser() {
            if (!user?.id) return;

            try {
                setInitializing(true);
                const token = await getToken();
                if (!token) {
                    Alert.alert('Authentication Error', 'Please sign in again');
                    return;
                }

                // Test API connectivity first
                console.log('[Stumble] Testing API connectivity...');
                const connectivity = await NetworkTest.testConnectivity();
                console.log('[Stumble] Connectivity results:', connectivity);

                if (!connectivity.discovery || !connectivity.user || !connectivity.interaction) {
                    console.error('[Stumble] API connectivity issues:', connectivity.errors);
                    Alert.alert(
                        'Connection Error',
                        `Cannot connect to services: ${connectivity.errors.join(', ')}`
                    );
                    return;
                }

                // Initialize or get user data
                const userProfile = await UserAPI.initializeUser(user.id, token);
                setUserData(userProfile);
                setWildness(userProfile.wildness);

                // Initialize caches for better UX
                await InteractionAPI.initializeSavedCache(token);
                await InteractionAPI.initializeInteractionCaches(token);

                // Load first discovery
                await loadNextDiscovery(token, userProfile.wildness);

                setInitializing(false);
            } catch (error) {
                console.error('Error initializing user:', error);
                setInitializing(false);

                if (error instanceof ApiError) {
                    Alert.alert(
                        'API Error',
                        `Failed to initialize: ${error.message}\n\nStatus: ${error.status}`,
                        [
                            { text: 'Retry', onPress: () => setInitializing(true) },
                            { text: 'OK' }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Network Error',
                        `Failed to initialize. Please check your connection.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        [
                            { text: 'Retry', onPress: () => setInitializing(true) },
                            { text: 'OK' }
                        ]
                    );
                }
            }
        }

        if (user?.id && initializing) {
            initializeUser();
        }
    }, [user?.id, initializing]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (webViewLoadTimeoutRef.current) {
                clearTimeout(webViewLoadTimeoutRef.current);
            }
        };
    }, []);

    const loadNextDiscovery = async (token: string, currentWildness?: number) => {
        try {
            const response = await DiscoveryAPI.getNext({
                wildness: currentWildness || wildness,
                seenIds: seenIdsRef.current,
                token
            });

            const discoveryWithReason: DiscoveryWithReason = {
                ...response.discovery,
                reason: response.reason
            };

            setCurrentDiscovery(discoveryWithReason);
            setDiscoveryReason(response.reason);
            seenIdsRef.current.add(response.discovery.id);

            // Reset modal dismissal state for new discovery
            setModalDismissedForDiscovery(null);

            // Check if we know this content blocks WebView embedding from database
            if (response.discovery.allowsFraming === false) {
                console.log('[Stumble] Content known to block WebView - showing warning:', response.discovery.domain);
                setWebViewError(true);
                webViewLoadedRef.current = false;
            } else {
                // Reset WebView error state for new discovery ONLY if not known to block
                setWebViewError(false);
                webViewLoadedRef.current = false;
            }

            // Clear any existing timeout
            if (webViewLoadTimeoutRef.current) {
                clearTimeout(webViewLoadTimeoutRef.current);
            }

            // Timeout-based detection for unknown sites
            if (response.discovery.allowsFraming !== false) {
                webViewLoadTimeoutRef.current = setTimeout(() => {
                    if (!webViewLoadedRef.current) {
                        console.warn('[Stumble] WebView did not load within 3 seconds - showing warning:', response.discovery.domain);
                        setWebViewError(true);
                    }
                }, 3000);
            }

            // Record view interaction for metrics tracking
            try {
                await InteractionAPI.recordFeedback(response.discovery.id, 'view', token);
            } catch (error) {
                console.error('Error recording view:', error);
            }

            // Update reaction state for the new discovery
            setUserReactions({
                liked: InteractionAPI.isLiked(response.discovery.id),
                saved: InteractionAPI.isSaved(response.discovery.id),
                skipped: InteractionAPI.isSkipped(response.discovery.id)
            });

            // Start tracking time on new discovery
            discoveryViewStartTimeRef.current = Date.now();

        } catch (error) {
            console.error('Error loading discovery:', error);
            if (error instanceof ApiError) {
                Alert.alert(
                    'API Error',
                    `Failed to load discovery: ${error.message}\n\nStatus: ${error.status}`,
                    [
                        { text: 'Retry', onPress: () => loadNextDiscovery(token, wildness) },
                        { text: 'OK' }
                    ]
                );
            } else {
                Alert.alert(
                    'Network Error',
                    `Failed to load discovery. Please check your connection.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    [
                        { text: 'Retry', onPress: () => loadNextDiscovery(token, wildness) },
                        { text: 'OK' }
                    ]
                );
            }
        }
    };

    const handleStumble = useCallback(async () => {
        if (!user?.id) {
            Alert.alert('Authentication Required', 'Please sign in to continue');
            return;
        }

        setIsLoading(true);

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Authentication Error', 'Please sign in again');
                return;
            }

            await loadNextDiscovery(token);
        } catch (error) {
            console.error('Error stumbling:', error);
            Alert.alert('Error', 'Failed to load next discovery');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, wildness]);

    const handleReaction = useCallback(async (action: 'up' | 'down' | 'save' | 'share') => {
        if (!currentDiscovery || !user?.id) return;

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Authentication Error', 'Please sign in again');
                return;
            }

            // Calculate time spent on page (in seconds)
            const timeOnPage = discoveryViewStartTimeRef.current
                ? (Date.now() - discoveryViewStartTimeRef.current) / 1000
                : undefined;

            // Handle toggles: if already liked/saved/skipped, send unlike/unsave/unskip instead
            let actualAction: Interaction['action'] = action;
            if (action === 'save' && userReactions.saved) {
                actualAction = 'unsave';
            } else if (action === 'up' && userReactions.liked) {
                actualAction = 'unlike';
            } else if (action === 'down' && userReactions.skipped) {
                actualAction = 'unskip';
            }

            await InteractionAPI.recordFeedback(currentDiscovery.id, actualAction, token, timeOnPage);

            // Update local state based on actual action
            if (action === 'save' || actualAction === 'unsave') {
                const newSavedState = InteractionAPI.isSaved(currentDiscovery.id);
                setUserReactions(prev => ({ ...prev, saved: newSavedState }));
            } else if (action === 'up' || actualAction === 'unlike') {
                const newLikedState = InteractionAPI.isLiked(currentDiscovery.id);
                const newSkippedState = InteractionAPI.isSkipped(currentDiscovery.id);
                setUserReactions(prev => ({ ...prev, liked: newLikedState, skipped: newSkippedState }));
            } else if (action === 'down' || actualAction === 'unskip') {
                const newLikedState = InteractionAPI.isLiked(currentDiscovery.id);
                const newSkippedState = InteractionAPI.isSkipped(currentDiscovery.id);
                setUserReactions(prev => ({ ...prev, liked: newLikedState, skipped: newSkippedState }));
            }

            // Handle share action
            if (action === 'share') {
                // TODO: Implement native sharing
                console.log('Share URL:', currentDiscovery.url);
                Alert.alert('Shared!', 'Link copied to clipboard');
            }

            // Auto-advance only on skip (not on unskip, and not on like)
            if ((action === 'down') && actualAction !== 'unskip') {
                setTimeout(() => {
                    handleStumble();
                }, 400);
            }

        } catch (error) {
            console.error('Error recording reaction:', error);
            if (error instanceof ApiError) {
                Alert.alert('Error', `Failed to record reaction: ${error.message}`);
            } else {
                Alert.alert('Error', 'Failed to record reaction');
            }
        }
    }, [currentDiscovery, user?.id, userReactions, handleStumble]);

    const handleAddToList = useCallback(async () => {
        if (!currentDiscovery || !user?.id) return;

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Authentication Error', 'Please sign in again');
                return;
            }

            // TODO: Show list selection modal and implement add to list API call
            console.log(`User wants to add discovery ${currentDiscovery.id} to a list`);
            Alert.alert('Add to List', 'List selection feature coming soon!');
        } catch (error) {
            console.error('Error adding to list:', error);
            Alert.alert('Error', 'Failed to add to list');
        }
    }, [currentDiscovery, user?.id]);

    const handleReport = useCallback(async () => {
        if (!currentDiscovery || !user?.id) return;

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Authentication Error', 'Please sign in again');
                return;
            }

            // TODO: Show report reason modal and implement report API call
            console.log(`User wants to report discovery ${currentDiscovery.id}`);
            Alert.alert(
                'Report Content',
                'Would you like to report this content as inappropriate?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Report',
                        style: 'destructive',
                        onPress: () => {
                            Alert.alert('Reported', 'Thank you for your report. We will review this content.');
                            // Auto-stumble to next content after reporting
                            setTimeout(() => {
                                handleStumble();
                            }, 1000);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error reporting content:', error);
            Alert.alert('Error', 'Failed to report content');
        }
    }, [currentDiscovery, user?.id, handleStumble]); const handleWebViewError = useCallback(() => {
        console.error('[Stumble] ❌ WebView onError fired:', currentDiscovery?.domain);
        // Note: onError typically fires for network failures, not HTTP error codes like 404
        // A 404 page with HTML content will still load in the WebView and trigger onLoadEnd
        // Set error indicator to suggest viewing Discovery Card
        webViewLoadedRef.current = false;
        setWebViewError(true);
    }, [currentDiscovery]);

    const handleWebViewLoadEnd = useCallback(() => {
        console.log('[Stumble] ✅ WebView onLoadEnd fired:', currentDiscovery?.domain);

        // Mark as successfully loaded
        webViewLoadedRef.current = true;

        // Clear timeout - onLoadEnd fired before timeout, so no warning needed
        // BUT: Don't clear error if already set (from database or previous timeout)
        if (webViewLoadTimeoutRef.current) {
            clearTimeout(webViewLoadTimeoutRef.current);
            webViewLoadTimeoutRef.current = null;
        }

        // Only clear error if not from database knowledge
        if (currentDiscovery?.allowsFraming !== false && !webViewError) {
            // Successfully loaded before timeout, no error to clear
            console.log('[Stumble] ✅ WebView loaded successfully within timeout');
        }
    }, [currentDiscovery, webViewError]);

    const handleCloseModal = useCallback(() => {
        if (currentDiscovery) {
            // Track that user dismissed the modal for this discovery
            setModalDismissedForDiscovery(currentDiscovery.id);
        }
        setShowDiscoveryModal(false);
    }, [currentDiscovery]);

    // Show initialization loading
    if (initializing) {
        return (
            <SafeAreaView style={[styles.container, { flex: 1 }]}>
                <View style={[styles.initialLoading, { backgroundColor: theme.colors.base100 }]}>
                    <Text style={[styles.loadingTitle, { color: theme.colors.baseContent }]}>
                        Setting up your discovery experience...
                    </Text>
                    <Text style={[styles.loadingSubtitle, { color: theme.colors.placeholder }]}>
                        Connecting to your personalized content
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { flex: 1 }]}>
            <View style={{ flex: 1 }}>
                {/* Top Controls Bar */}
                {currentDiscovery && (
                    <View style={[
                        styles.topControlsBar,
                        {
                            backgroundColor: theme.colors.base100,
                            borderBottomColor: theme.colors.border,
                        }
                    ]}>
                        <View style={styles.topControlsContent}>
                            {/* Domain Badge */}
                            <View style={[
                                styles.domainBadge,
                                { backgroundColor: theme.colors.neutral }
                            ]}>
                                <Text style={[
                                    styles.domainText,
                                    { color: theme.colors.neutralContent }
                                ]}>
                                    {currentDiscovery.domain}
                                </Text>
                            </View>

                            {/* Title */}
                            <Text
                                style={[
                                    styles.discoveryTitle,
                                    { color: theme.colors.baseContent }
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {currentDiscovery.title}
                            </Text>
                        </View>

                        {/* Discovery Rationale */}
                        {discoveryReason && (
                            <Text style={[
                                styles.discoveryReason,
                                { color: theme.colors.placeholder }
                            ]}>
                                Why you're seeing this: {discoveryReason}
                            </Text>
                        )}
                    </View>
                )}

                {/* Full-Screen WebView */}
                <View style={{ flex: 1 }}>
                    {currentDiscovery && !isLoading ? (
                        <WebView
                            source={{ uri: currentDiscovery.url }}
                            style={{ flex: 1 }}
                            onError={handleWebViewError}
                            onHttpError={handleWebViewError}
                            onLoadEnd={handleWebViewLoadEnd}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={[styles.webViewLoading, { backgroundColor: theme.colors.base100 }]}>
                                    <Text style={[styles.loadingText, { color: theme.colors.baseContent }]}>
                                        Loading {currentDiscovery.domain}...
                                    </Text>
                                </View>
                            )}
                            // Security and functionality settings
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsBackForwardNavigationGestures={false}
                            scalesPageToFit={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        /* Initial Loading State */
                        <View style={[styles.initialLoading, { backgroundColor: theme.colors.base100 }]}>
                            <Text style={[styles.loadingTitle, { color: theme.colors.baseContent }]}>
                                {isLoading ? 'Finding your next discovery...' : 'Tap Stumble to discover!'}
                            </Text>
                            {isLoading && (
                                <Text style={[styles.loadingSubtitle, { color: theme.colors.placeholder }]}>
                                    Preparing amazing content for you
                                </Text>
                            )}
                        </View>
                    )}

                    {/* WebView Error Flash Indicator */}
                    {webViewError && currentDiscovery && (
                        <Pressable
                            onPress={() => setShowDiscoveryModal(true)}
                            style={[
                                styles.webViewErrorBanner,
                                { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning }
                            ]}
                        >
                            <Text style={[styles.errorBannerText, { color: theme.colors.baseContent }]}>
                                ⚠️ Content may not display properly. Tap for details.
                            </Text>
                            <View style={[styles.viewDetailsButton, { backgroundColor: theme.colors.warning }]}>
                                <Text style={[styles.viewDetailsButtonText, { color: 'white' }]}>
                                    View Details
                                </Text>
                            </View>
                        </Pressable>
                    )}
                </View>

                {/* Loading Overlay */}
                {isLoading && (
                    <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.base100 + 'F0' }]}>
                        <Text style={[styles.loadingOverlayText, { color: theme.colors.baseContent }]}>
                            🔄 Finding your next discovery...
                        </Text>
                        {currentDiscovery && (
                            <Text style={[styles.loadingOverlaySubtext, { color: theme.colors.placeholder }]}>
                                Loading {currentDiscovery.domain}
                            </Text>
                        )}
                    </View>
                )}

                {/* Discovery Card Modal */}
                <Modal
                    visible={showDiscoveryModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={handleCloseModal}
                >
                    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.base100 }]}>
                        {/* Modal Header */}
                        <View style={[
                            styles.modalHeader,
                            { borderBottomColor: theme.colors.border }
                        ]}>
                            <Text style={[styles.stumbleModalTitle, { color: theme.colors.baseContent }]}>
                                Discovery Details
                            </Text>
                            <Pressable
                                onPress={handleCloseModal}
                                style={[styles.closeButton, { backgroundColor: theme.colors.base200 }]}
                            >
                                <Text style={[styles.closeButtonText, { color: theme.colors.baseContent }]}>
                                    ✕
                                </Text>
                            </Pressable>
                        </View>

                        {/* Modal Content */}
                        <View style={styles.modalContent}>
                            {currentDiscovery && (
                                <DiscoveryCard
                                    discovery={currentDiscovery}
                                    showReason={true}
                                    hasWebViewError={webViewError}
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* Floating Reaction Bar */}
                <ReactionBar
                    isSaved={userReactions.saved}
                    isLiked={userReactions.liked}
                    isSkipped={userReactions.skipped}
                    onReaction={handleReaction}
                    onStumble={handleStumble}
                    onAddToList={handleAddToList}
                    onReport={handleReport}
                    discoveryId={currentDiscovery?.id}
                    discoveryTitle={currentDiscovery?.title}
                    discoveryUrl={currentDiscovery?.url}
                    disabled={isLoading}
                />
            </View>
        </SafeAreaView>
    );
}


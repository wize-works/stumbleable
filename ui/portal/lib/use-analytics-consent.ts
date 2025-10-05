'use client';

import { useEffect, useState } from 'react';

type AnalyticsConsent = {
    hasConsent: boolean;
    isLoading: boolean;
};

/**
 * Hook to check if user has consented to analytics tracking
 */
export function useAnalyticsConsent(): AnalyticsConsent {
    const [state, setState] = useState<AnalyticsConsent>({
        hasConsent: false,
        isLoading: true,
    });

    useEffect(() => {
        const checkConsent = () => {
            try {
                const stored = localStorage.getItem('cookie-consent');
                if (stored) {
                    const consent = JSON.parse(stored);
                    setState({
                        hasConsent: consent.analytics === true,
                        isLoading: false,
                    });
                } else {
                    // No consent given yet
                    setState({
                        hasConsent: false,
                        isLoading: false,
                    });
                }
            } catch (e) {
                console.error('Error checking analytics consent:', e);
                setState({
                    hasConsent: false,
                    isLoading: false,
                });
            }
        };

        // Check on mount
        checkConsent();

        // Listen for consent changes
        const handleConsentChange = () => checkConsent();
        window.addEventListener('cookieConsentChanged', handleConsentChange);

        return () => {
            window.removeEventListener('cookieConsentChanged', handleConsentChange);
        };
    }, []);

    return state;
}

/**
 * Hook to check if user has consented to preference cookies
 */
export function usePreferencesConsent(): AnalyticsConsent {
    const [state, setState] = useState<AnalyticsConsent>({
        hasConsent: false,
        isLoading: true,
    });

    useEffect(() => {
        const checkConsent = () => {
            try {
                const stored = localStorage.getItem('cookie-consent');
                if (stored) {
                    const consent = JSON.parse(stored);
                    setState({
                        hasConsent: consent.preferences === true,
                        isLoading: false,
                    });
                } else {
                    // No consent given yet
                    setState({
                        hasConsent: false,
                        isLoading: false,
                    });
                }
            } catch (e) {
                console.error('Error checking preferences consent:', e);
                setState({
                    hasConsent: false,
                    isLoading: false,
                });
            }
        };

        // Check on mount
        checkConsent();

        // Listen for consent changes
        const handleConsentChange = () => checkConsent();
        window.addEventListener('cookieConsentChanged', handleConsentChange);

        return () => {
            window.removeEventListener('cookieConsentChanged', handleConsentChange);
        };
    }, []);

    return state;
}

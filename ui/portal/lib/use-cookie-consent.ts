'use client';

import { useEffect, useState } from 'react';

export type CookieConsentStatus = {
    given: boolean;
    essential: boolean;
    analytics: boolean;
    preferences: boolean;
    timestamp?: string;
};

export function useCookieConsent() {
    const [consent, setConsent] = useState<CookieConsentStatus>({
        given: false,
        essential: true,
        analytics: false,
        preferences: false,
    });

    useEffect(() => {
        const stored = localStorage.getItem('cookie-consent');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setConsent({
                    given: true,
                    essential: true, // Always true
                    analytics: parsed.analytics ?? false,
                    preferences: parsed.preferences ?? false,
                    timestamp: parsed.timestamp,
                });
            } catch (error) {
                console.error('Error parsing cookie consent:', error);
            }
        }
    }, []);

    const updateConsent = (updates: Partial<Omit<CookieConsentStatus, 'given' | 'essential'>>) => {
        const newConsent = {
            essential: true,
            analytics: updates.analytics ?? consent.analytics,
            preferences: updates.preferences ?? consent.preferences,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
        setConsent({
            given: true,
            ...newConsent,
        });
    };

    const resetConsent = () => {
        localStorage.removeItem('cookie-consent');
        setConsent({
            given: false,
            essential: true,
            analytics: false,
            preferences: false,
        });
    };

    return {
        consent,
        updateConsent,
        resetConsent,
        hasAnalytics: consent.analytics,
        hasPreferences: consent.preferences,
    };
}

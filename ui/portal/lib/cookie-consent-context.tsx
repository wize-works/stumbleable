'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export type CookieConsentStatus = {
    given: boolean;
    essential: boolean;
    analytics: boolean;
    preferences: boolean;
    timestamp?: string;
};

type CookieConsentContextType = {
    consent: CookieConsentStatus;
    updateConsent: (updates: Partial<Omit<CookieConsentStatus, 'given' | 'essential'>>) => void;
    resetConsent: () => void;
    hasAnalytics: boolean;
    hasPreferences: boolean;
    canUseLocalStorage: (key: string) => boolean;
    setPreferenceCookie: (key: string, value: string) => void;
    getPreferenceCookie: (key: string) => string | null;
    removePreferenceCookie: (key: string) => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

// Define which localStorage keys are for what purpose
const PREFERENCE_KEYS = [
    'theme',
    'wildness',
    'language',
    'email-preferences',
];

const ANALYTICS_KEYS = [
    'analytics-id',
    'session-id',
];

export function CookieConsentProvider({ children }: { children: ReactNode }) {
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
                const newConsent = {
                    given: true,
                    essential: true,
                    analytics: parsed.analytics ?? false,
                    preferences: parsed.preferences ?? false,
                    timestamp: parsed.timestamp,
                };
                setConsent(newConsent);

                // Clean up non-consented data
                cleanupNonConsentedData(newConsent);
            } catch (error) {
                console.error('Error parsing cookie consent:', error);
            }
        }
    }, []);

    const cleanupNonConsentedData = (consentStatus: CookieConsentStatus) => {
        // If analytics not consented, remove analytics data
        if (!consentStatus.analytics) {
            ANALYTICS_KEYS.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`Failed to remove analytics key: ${key}`, e);
                }
            });
        }

        // If preferences not consented, remove preference data (except consent itself)
        if (!consentStatus.preferences) {
            PREFERENCE_KEYS.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`Failed to remove preference key: ${key}`, e);
                }
            });
        }
    };

    const updateConsent = (updates: Partial<Omit<CookieConsentStatus, 'given' | 'essential'>>) => {
        const newConsent = {
            essential: true,
            analytics: updates.analytics ?? consent.analytics,
            preferences: updates.preferences ?? consent.preferences,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
        const fullConsent = {
            given: true,
            ...newConsent,
        };
        setConsent(fullConsent);

        // Clean up data if consent was revoked
        cleanupNonConsentedData(fullConsent);
    };

    const resetConsent = () => {
        // Don't clean up data on reset - let them choose again
        localStorage.removeItem('cookie-consent');
        setConsent({
            given: false,
            essential: true,
            analytics: false,
            preferences: false,
        });
    };

    const canUseLocalStorage = (key: string): boolean => {
        // Cookie consent itself is always allowed
        if (key === 'cookie-consent') return true;

        // Essential cookies are always allowed
        // (add your essential keys here)
        const essentialKeys = ['clerk-db-jwt', 'clerk-session', '__session'];
        if (essentialKeys.some(k => key.includes(k))) return true;

        // Check if it's a preference key
        if (PREFERENCE_KEYS.includes(key)) {
            return consent.preferences;
        }

        // Check if it's an analytics key
        if (ANALYTICS_KEYS.includes(key)) {
            return consent.analytics;
        }

        // Default: allow if consent given (essential)
        return consent.essential;
    };

    const setPreferenceCookie = (key: string, value: string) => {
        if (!consent.preferences) {
            console.warn(`Cannot set preference cookie "${key}" - user has not consented to preference cookies`);
            return;
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Failed to set preference cookie: ${key}`, e);
        }
    };

    const getPreferenceCookie = (key: string): string | null => {
        if (!consent.preferences && !PREFERENCE_KEYS.includes(key)) {
            console.warn(`Cannot get preference cookie "${key}" - user has not consented to preference cookies`);
            return null;
        }
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error(`Failed to get preference cookie: ${key}`, e);
            return null;
        }
    };

    const removePreferenceCookie = (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Failed to remove preference cookie: ${key}`, e);
        }
    };

    return (
        <CookieConsentContext.Provider
            value={{
                consent,
                updateConsent,
                resetConsent,
                hasAnalytics: consent.analytics,
                hasPreferences: consent.preferences,
                canUseLocalStorage,
                setPreferenceCookie,
                getPreferenceCookie,
                removePreferenceCookie,
            }}
        >
            {children}
        </CookieConsentContext.Provider>
    );
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
}

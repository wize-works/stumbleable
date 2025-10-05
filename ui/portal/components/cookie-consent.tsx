'use client';

import { ConsentAwareStorage } from '@/lib/consent-aware-storage';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ConsentPreferences = {
    essential: boolean; // Always true
    analytics: boolean;
    preferences: boolean;
};

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        essential: true,
        analytics: true,
        preferences: true,
    });

    useEffect(() => {
        // Check if user has already made a choice
        const consentGiven = localStorage.getItem('cookie-consent');
        if (!consentGiven) {
            // Small delay for better UX
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveConsent = (prefs: ConsentPreferences) => {
        localStorage.setItem('cookie-consent', JSON.stringify({
            ...prefs,
            timestamp: new Date().toISOString(),
        }));

        // Clean up any non-consented cookies/storage
        ConsentAwareStorage.cleanupNonConsented();

        // Dispatch custom event so other components can react
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
            detail: prefs
        }));

        setShowBanner(false);
        setShowSettings(false);
    };

    const acceptAll = () => {
        saveConsent({
            essential: true,
            analytics: true,
            preferences: true,
        });
    };

    const acceptEssentialOnly = () => {
        saveConsent({
            essential: true,
            analytics: false,
            preferences: false,
        });
    };

    const saveCustomPreferences = () => {
        saveConsent(preferences);
    };

    if (!showBanner) {
        return null;
    }

    return (
        <>
            {/* Cookie Banner */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
                <div className="container mx-auto max-w-6xl">
                    <div className="bg-base-200 rounded-2xl shadow-2xl border-2 border-base-300">
                        <div className="p-6 sm:p-8">
                            {!showSettings ? (
                                // Simple Banner View
                                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <i className="fa-solid fa-duotone fa-cookie-bite text-3xl text-primary mt-1"></i>
                                            <div>
                                                <h3 className="text-xl font-bold text-base-content mb-2">
                                                    We Value Your Privacy
                                                </h3>
                                                <p className="text-base-content/80 leading-relaxed">
                                                    We use cookies to enhance your browsing experience, remember your preferences,
                                                    and analyze site traffic. By clicking "Accept All," you consent to our use of cookies.
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/cookies"
                                            className="link link-primary text-sm inline-flex items-center gap-1"
                                        >
                                            Learn more about cookies
                                            <i className="fa-solid fa-duotone fa-arrow-right text-xs"></i>
                                        </Link>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                        <button
                                            onClick={acceptEssentialOnly}
                                            className="btn btn-ghost btn-lg"
                                        >
                                            Essential Only
                                        </button>
                                        <button
                                            onClick={() => setShowSettings(true)}
                                            className="btn btn-outline btn-lg"
                                        >
                                            <i className="fa-solid fa-duotone fa-sliders mr-2"></i>
                                            Customize
                                        </button>
                                        <button
                                            onClick={acceptAll}
                                            className="btn btn-primary btn-lg"
                                        >
                                            <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                            Accept All
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Detailed Settings View
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-base-content flex items-center gap-2">
                                            <i className="fa-solid fa-duotone fa-sliders text-primary"></i>
                                            Cookie Preferences
                                        </h3>
                                        <button
                                            onClick={() => setShowSettings(false)}
                                            className="btn btn-ghost btn-sm btn-circle"
                                            aria-label="Close settings"
                                        >
                                            <i className="fa-solid fa-duotone fa-xmark text-xl"></i>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Essential Cookies */}
                                        <div className="form-control">
                                            <label className="cursor-pointer">
                                                <div className="flex items-start gap-4 p-4 bg-base-300 rounded-xl">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        disabled
                                                        className="checkbox checkbox-primary mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-base-content">
                                                                Essential Cookies
                                                            </span>
                                                            <span className="badge badge-sm">Required</span>
                                                        </div>
                                                        <p className="text-sm text-base-content/70">
                                                            Necessary for the website to function. These cookies enable core features
                                                            like authentication, security, and session management.
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Preferences Cookies */}
                                        <div className="form-control">
                                            <label className="cursor-pointer">
                                                <div className="flex items-start gap-4 p-4 bg-base-300 rounded-xl">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences.preferences}
                                                        onChange={(e) => setPreferences({
                                                            ...preferences,
                                                            preferences: e.target.checked
                                                        })}
                                                        className="checkbox checkbox-primary mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-base-content mb-1">
                                                            Preference Cookies
                                                        </div>
                                                        <p className="text-sm text-base-content/70">
                                                            Remember your settings and choices, such as theme preferences,
                                                            wildness level, and language settings.
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Analytics Cookies */}
                                        <div className="form-control">
                                            <label className="cursor-pointer">
                                                <div className="flex items-start gap-4 p-4 bg-base-300 rounded-xl">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences.analytics}
                                                        onChange={(e) => setPreferences({
                                                            ...preferences,
                                                            analytics: e.target.checked
                                                        })}
                                                        className="checkbox checkbox-primary mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-base-content mb-1">
                                                            Analytics Cookies
                                                        </div>
                                                        <p className="text-sm text-base-content/70">
                                                            Help us understand how you use Stumbleable so we can improve
                                                            your experience. We collect anonymous usage statistics and performance data.
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <button
                                            onClick={acceptEssentialOnly}
                                            className="btn btn-ghost btn-lg flex-1"
                                        >
                                            Essential Only
                                        </button>
                                        <button
                                            onClick={saveCustomPreferences}
                                            className="btn btn-primary btn-lg flex-1"
                                        >
                                            <i className="fa-solid fa-duotone fa-save mr-2"></i>
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in" />
        </>
    );
}

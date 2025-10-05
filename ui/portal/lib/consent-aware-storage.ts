/**
 * Safe localStorage wrapper that respects cookie consent
 * Use this instead of direct localStorage access for non-essential data
 */

export class ConsentAwareStorage {
    private static getConsent() {
        try {
            const stored = localStorage.getItem('cookie-consent');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading cookie consent:', e);
        }
        return { analytics: false, preferences: false };
    }

    private static isEssential(key: string): boolean {
        // Essential keys that are always allowed
        const essentialKeys = [
            'cookie-consent',
            'clerk-db-jwt',
            'clerk-session',
            '__session',
            'csrf-token',
        ];
        return essentialKeys.some(k => key.includes(k));
    }

    private static isPreference(key: string): boolean {
        const preferenceKeys = [
            'theme',
            'wildness',
            'language',
            'email-preferences',
        ];
        return preferenceKeys.includes(key);
    }

    private static isAnalytics(key: string): boolean {
        const analyticsKeys = [
            'analytics-id',
            'session-id',
            'clarity',
            '_ga',
            '_gid',
        ];
        return analyticsKeys.some(k => key.includes(k));
    }

    /**
     * Set item in localStorage if consent allows
     */
    static setItem(key: string, value: string): boolean {
        const consent = this.getConsent();

        // Always allow essential
        if (this.isEssential(key)) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error(`Failed to set essential item: ${key}`, e);
                return false;
            }
        }

        // Check preference consent
        if (this.isPreference(key)) {
            if (!consent.preferences) {
                console.warn(`Cannot set preference item "${key}" - user has not consented`);
                return false;
            }
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error(`Failed to set preference item: ${key}`, e);
                return false;
            }
        }

        // Check analytics consent
        if (this.isAnalytics(key)) {
            if (!consent.analytics) {
                console.warn(`Cannot set analytics item "${key}" - user has not consented`);
                return false;
            }
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error(`Failed to set analytics item: ${key}`, e);
                return false;
            }
        }

        // Unknown category - require consent
        console.warn(`Unknown localStorage key category: ${key} - treating as non-essential`);
        return false;
    }

    /**
     * Get item from localStorage
     */
    static getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error(`Failed to get item: ${key}`, e);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     */
    static removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Failed to remove item: ${key}`, e);
        }
    }

    /**
     * Clear all non-essential items based on current consent
     */
    static cleanupNonConsented(): void {
        const consent = this.getConsent();

        try {
            const keys = Object.keys(localStorage);

            keys.forEach(key => {
                // Skip essential keys
                if (this.isEssential(key)) return;

                // Remove analytics if not consented
                if (this.isAnalytics(key) && !consent.analytics) {
                    localStorage.removeItem(key);
                    console.log(`Removed analytics item: ${key}`);
                }

                // Remove preferences if not consented
                if (this.isPreference(key) && !consent.preferences) {
                    localStorage.removeItem(key);
                    console.log(`Removed preference item: ${key}`);
                }
            });
        } catch (e) {
            console.error('Failed to cleanup non-consented items:', e);
        }
    }
}

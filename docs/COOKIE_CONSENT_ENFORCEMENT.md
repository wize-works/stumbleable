# Cookie Consent Enforcement Guide

## Overview

This guide explains how Stumbleable enforces user cookie preferences and how to properly integrate cookie consent checks in your code.

## 🔒 Cookie Categories

### Essential Cookies (Always Allowed)
- **Purpose**: Required for site to function
- **Examples**: Authentication (Clerk), CSRF tokens, session management
- **Storage Keys**: `clerk-db-jwt`, `clerk-session`, `__session`, `cookie-consent`
- **Enforcement**: Always allowed, no consent required

### Preference Cookies (Opt-in)
- **Purpose**: Remember user settings and choices
- **Examples**: Theme preference, wildness level, language
- **Storage Keys**: `theme`, `wildness`, `language`, `email-preferences`
- **Enforcement**: Only saved/read if user consents

### Analytics Cookies (Opt-in)
- **Purpose**: Track usage for improvements
- **Examples**: Page views, feature usage, performance metrics
- **Storage Keys**: `analytics-id`, `session-id`, `_ga`, `_gid`, `clarity`
- **Enforcement**: Only set if user consents

---

## 🛠️ How to Use

### Method 1: ConsentAwareStorage (Recommended)

Use `ConsentAwareStorage` instead of direct `localStorage` access:

```typescript
import { ConsentAwareStorage } from '@/lib/consent-aware-storage';

// ✅ CORRECT - Uses consent-aware storage
function saveUserTheme(theme: string) {
    const saved = ConsentAwareStorage.setItem('theme', theme);
    if (saved) {
        console.log('Theme saved successfully');
    } else {
        console.log('Theme not saved - user declined preference cookies');
    }
}

// ❌ WRONG - Direct localStorage access bypasses consent
function saveUserTheme(theme: string) {
    localStorage.setItem('theme', theme); // This ignores consent!
}
```

**API:**
```typescript
// Set item (returns true if saved, false if consent denied)
ConsentAwareStorage.setItem(key: string, value: string): boolean

// Get item (always works, but might return null)
ConsentAwareStorage.getItem(key: string): string | null

// Remove item
ConsentAwareStorage.removeItem(key: string): void

// Clean up non-consented items
ConsentAwareStorage.cleanupNonConsented(): void
```

### Method 2: Check Consent Before Action

Use hooks to check consent before performing actions:

```typescript
'use client';

import { useAnalyticsConsent, usePreferencesConsent } from '@/lib/use-analytics-consent';

function MyComponent() {
    const { hasConsent: hasAnalytics, isLoading: analyticsLoading } = useAnalyticsConsent();
    const { hasConsent: hasPreferences } = usePreferencesConsent();

    useEffect(() => {
        if (!analyticsLoading && hasAnalytics) {
            // Initialize analytics
            initializeGoogleAnalytics();
        }
    }, [hasAnalytics, analyticsLoading]);

    const handleSavePreference = (value: string) => {
        if (hasPreferences) {
            localStorage.setItem('my-preference', value);
        } else {
            // Optionally prompt user to enable preferences
            console.warn('Cannot save preference - consent not given');
        }
    };

    return <div>...</div>;
}
```

### Method 3: React to Consent Changes

Listen for consent changes in real-time:

```typescript
'use client';

import { useEffect } from 'react';

function AnalyticsProvider({ children }) {
    useEffect(() => {
        const handleConsentChange = (event: CustomEvent) => {
            const { analytics, preferences } = event.detail;
            
            if (analytics) {
                // Enable analytics
                initAnalytics();
            } else {
                // Disable and cleanup analytics
                disableAnalytics();
            }
        };

        window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener);
        
        return () => {
            window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener);
        };
    }, []);

    return <>{children}</>;
}
```

---

## 📋 Implementation Checklist

### For Preference Cookies

When implementing features that save user preferences:

- [ ] Import `ConsentAwareStorage` or `usePreferencesConsent`
- [ ] Check consent before saving to localStorage
- [ ] Add storage key to `PREFERENCE_KEYS` array in `consent-aware-storage.ts`
- [ ] Provide graceful degradation if consent denied (use session-only storage or don't persist)
- [ ] Test with preferences disabled
- [ ] Show user-friendly message if preference can't be saved

### For Analytics

When implementing analytics or tracking:

- [ ] Import `useAnalyticsConsent` hook
- [ ] Only initialize analytics if `hasConsent === true`
- [ ] Wait for `isLoading === false` before making decision
- [ ] Listen for `cookieConsentChanged` events to enable/disable dynamically
- [ ] Add analytics keys to `ANALYTICS_KEYS` array in `consent-aware-storage.ts`
- [ ] Clean up analytics data if consent revoked
- [ ] Test with analytics disabled

---

## 🎯 Real-World Examples

### Example 1: Theme Toggle with Consent

```typescript
// components/theme-toggle.tsx
'use client';

import { ConsentAwareStorage } from '@/lib/consent-aware-storage';
import { usePreferencesConsent } from '@/lib/use-analytics-consent';

export function ThemeToggle() {
    const { hasConsent } = usePreferencesConsent();
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Only persist if user consented
        if (hasConsent) {
            ConsentAwareStorage.setItem('theme', newTheme);
        }
    };

    return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

### Example 2: Analytics Initialization

```typescript
// components/analytics-provider.tsx
'use client';

import { useAnalyticsConsent } from '@/lib/use-analytics-consent';
import { useEffect } from 'react';

export function AnalyticsProvider({ children }) {
    const { hasConsent, isLoading } = useAnalyticsConsent();

    useEffect(() => {
        if (isLoading) return;

        if (hasConsent) {
            // Initialize Microsoft Clarity
            window.clarity?.('consent');
            
            // Initialize Google Analytics
            if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        } else {
            // Deny consent
            if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                });
            }
        }
    }, [hasConsent, isLoading]);

    return <>{children}</>;
}
```

### Example 3: Wildness Preference

```typescript
// components/wildness-control.tsx
'use client';

import { ConsentAwareStorage } from '@/lib/consent-aware-storage';
import { usePreferencesConsent } from '@/lib/use-analytics-consent';
import { useToaster } from './toaster';

export function WildnessControl() {
    const { hasConsent } = usePreferencesConsent();
    const { showToast } = useToaster();
    const [wildness, setWildness] = useState(50);

    const handleChange = (value: number) => {
        setWildness(value);
        
        if (hasConsent) {
            ConsentAwareStorage.setItem('wildness', value.toString());
            showToast('Wildness level saved!', 'success');
        } else {
            showToast('Wildness set for this session only', 'info');
        }
    };

    return (
        <div>
            <input 
                type="range" 
                value={wildness} 
                onChange={(e) => handleChange(Number(e.target.value))}
            />
            {!hasConsent && (
                <p className="text-sm text-warning">
                    Enable preference cookies to save this setting
                </p>
            )}
        </div>
    );
}
```

---

## 🧪 Testing Consent Enforcement

### Test Checklist

1. **Test with no consent**
   ```javascript
   localStorage.removeItem('cookie-consent');
   // Verify preferences aren't saved
   // Verify analytics not initialized
   ```

2. **Test with essential only**
   ```javascript
   localStorage.setItem('cookie-consent', JSON.stringify({
       essential: true,
       analytics: false,
       preferences: false,
       timestamp: new Date().toISOString()
   }));
   ```

3. **Test with full consent**
   ```javascript
   localStorage.setItem('cookie-consent', JSON.stringify({
       essential: true,
       analytics: true,
       preferences: true,
       timestamp: new Date().toISOString()
   }));
   ```

4. **Test consent revocation**
   - Accept all cookies
   - Save some preferences
   - Click "Manage Cookies" → "Essential Only"
   - Verify preference data is cleared

5. **Test cleanup on consent change**
   ```javascript
   // Should remove non-consented items
   ConsentAwareStorage.cleanupNonConsented();
   ```

---

## ⚠️ Common Pitfalls

### ❌ Don't Do This

```typescript
// Direct localStorage access
localStorage.setItem('theme', 'dark');

// Ignoring consent status
function savePreference() {
    localStorage.setItem('pref', 'value'); // Always saves
}

// Not handling consent denial
function trackEvent() {
    sendToAnalytics(event); // Sends regardless of consent
}
```

### ✅ Do This Instead

```typescript
// Use consent-aware storage
ConsentAwareStorage.setItem('theme', 'dark');

// Check consent first
function savePreference() {
    const saved = ConsentAwareStorage.setItem('pref', 'value');
    if (!saved) {
        console.log('Preference not saved - consent required');
    }
}

// Conditional analytics
function trackEvent() {
    const { hasConsent } = useAnalyticsConsent();
    if (hasConsent) {
        sendToAnalytics(event);
    }
}
```

---

## 📊 Monitoring Compliance

### Check Current Consent Status

```javascript
// In browser console
const consent = JSON.parse(localStorage.getItem('cookie-consent'));
console.log('Analytics:', consent.analytics);
console.log('Preferences:', consent.preferences);
```

### Check What's in localStorage

```javascript
// List all localStorage items
Object.keys(localStorage).forEach(key => {
    console.log(key, localStorage.getItem(key));
});
```

### Verify Cleanup Works

```javascript
// Revoke consent
localStorage.setItem('cookie-consent', JSON.stringify({
    essential: true,
    analytics: false,
    preferences: false,
    timestamp: new Date().toISOString()
}));

// Trigger cleanup
ConsentAwareStorage.cleanupNonConsented();

// Check that non-consented items are gone
Object.keys(localStorage).forEach(key => {
    console.log(key); // Should only see essential items
});
```

---

## 🔐 Adding New Cookie Categories

To add a new category (e.g., "marketing"):

1. **Update types** in `cookie-consent.tsx`:
   ```typescript
   type ConsentPreferences = {
       essential: boolean;
       analytics: boolean;
       preferences: boolean;
       marketing: boolean; // Add new
   };
   ```

2. **Update UI** in `cookie-consent.tsx`:
   Add new checkbox section

3. **Update storage** in `consent-aware-storage.ts`:
   ```typescript
   private static isMarketing(key: string): boolean {
       const marketingKeys = ['pixel', 'conversion', 'remarketing'];
       return marketingKeys.some(k => key.includes(k));
   }
   ```

4. **Update cleanup logic**:
   Add cleanup for marketing keys

5. **Create hook** if needed:
   ```typescript
   export function useMarketingConsent() { ... }
   ```

---

## 📚 Related Files

- `components/cookie-consent.tsx` - Main consent UI
- `lib/consent-aware-storage.ts` - Storage wrapper
- `lib/use-analytics-consent.ts` - Consent check hooks
- `lib/use-cookie-consent.ts` - Legacy hook (deprecated)
- `components/theme-toggle.tsx` - Example implementation
- `docs/COOKIE_CONSENT_IMPLEMENTATION.md` - Overview docs

---

**Last Updated**: October 4, 2025  
**Compliance**: GDPR, CCPA  
**Status**: ✅ Enforced

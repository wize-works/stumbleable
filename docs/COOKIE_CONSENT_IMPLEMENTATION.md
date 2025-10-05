# Cookie Consent Implementation

## Overview

A comprehensive, privacy-focused cookie consent banner has been added to Stumbleable. The implementation follows GDPR and privacy best practices with a beautiful, user-friendly interface.

## Features

### 🎨 User Experience
- **Elegant Design**: Matches Stumbleable's design system with smooth animations
- **Responsive**: Works perfectly on mobile, tablet, and desktop
- **Accessible**: Full keyboard navigation and ARIA labels
- **Non-intrusive**: Appears after 1 second delay for better UX
- **Backdrop**: Semi-transparent backdrop to focus attention

### 🔒 Privacy Controls
- **Three Cookie Categories**:
  - **Essential Cookies** (Always enabled): Required for authentication, security, and core functionality
  - **Preference Cookies** (Optional): Theme settings, wildness level, language preferences
  - **Analytics Cookies** (Optional): Anonymous usage statistics and performance data

- **Three Acceptance Options**:
  1. **Accept All**: Enable all cookie categories
  2. **Essential Only**: Only enable required cookies
  3. **Customize**: Fine-grained control over each category

### 💾 Persistent Storage
- Consent preferences saved to `localStorage`
- Includes timestamp for compliance tracking
- Only shows banner once until user clears preferences

## File Structure

```
ui/portal/
├── components/
│   ├── cookie-consent.tsx          # Main cookie consent banner component
│   └── footer.tsx                   # Updated with "Manage Cookies" button
├── lib/
│   └── use-cookie-consent.ts        # React hook for cookie consent management
├── app/
│   ├── layout.tsx                   # Integrated cookie consent
│   ├── globals.css                  # Added animations
│   └── cookies/
│       └── page.tsx                 # Cookie policy page
```

## Usage

### Basic Implementation

The cookie consent banner is automatically shown to first-time visitors. It's integrated into the root layout:

```tsx
// app/layout.tsx
import { CookieConsent } from '../components/cookie-consent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
```

### Using the Hook

To check consent status in your components:

```tsx
'use client';

import { useCookieConsent } from '@/lib/use-cookie-consent';

export function MyComponent() {
  const { consent, hasAnalytics, hasPreferences, updateConsent } = useCookieConsent();

  useEffect(() => {
    if (hasAnalytics) {
      // Initialize analytics
      console.log('Analytics enabled');
    }
  }, [hasAnalytics]);

  return (
    <div>
      {consent.given ? 'Consent given' : 'No consent yet'}
    </div>
  );
}
```

### Managing Cookies

Users can manage their cookie preferences in two ways:

1. **Footer Link**: Click "Manage Cookies" in the footer
2. **Cookie Policy Page**: Visit `/cookies` for detailed information

## LocalStorage Data Structure

```json
{
  "essential": true,
  "analytics": true,
  "preferences": true,
  "timestamp": "2025-10-04T12:00:00.000Z"
}
```

## Styling

Custom animations are defined in `globals.css`:

```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Accessibility

- ✅ Full keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels for screen readers
- ✅ Semantic HTML structure
- ✅ Clear, readable text
- ✅ High contrast buttons

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

## Compliance

### GDPR Compliance
- ✅ Clear consent mechanism
- ✅ Granular control over cookie categories
- ✅ Easy to withdraw consent
- ✅ Timestamp tracking
- ✅ Pre-checked boxes avoided (except essential)

### Best Practices
- ✅ Non-essential cookies disabled by default
- ✅ Clear cookie policy link
- ✅ Easy access to manage preferences
- ✅ Essential cookies clearly marked
- ✅ Transparent about data usage

## Testing

To test the cookie consent banner:

1. **First Visit**: Clear localStorage and refresh the page
   ```javascript
   localStorage.removeItem('cookie-consent');
   location.reload();
   ```

2. **Check Storage**: Verify consent data
   ```javascript
   JSON.parse(localStorage.getItem('cookie-consent'));
   ```

3. **Test Categories**: Toggle different categories and verify they're saved

4. **Test Footer**: Click "Manage Cookies" in footer to reset preferences

## Future Enhancements

Potential improvements for future iterations:

- [ ] Server-side consent tracking for logged-in users
- [ ] Integration with analytics platforms (Google Analytics, Mixpanel)
- [ ] A/B testing support
- [ ] Multi-language support
- [ ] Cookie audit/scanner tool
- [ ] Consent analytics dashboard
- [ ] Regional compliance variations (CCPA, etc.)

## Analytics Integration Example

When ready to integrate analytics:

```tsx
'use client';

import { useCookieConsent } from '@/lib/use-cookie-consent';
import { useEffect } from 'react';

export function AnalyticsProvider({ children }) {
  const { hasAnalytics } = useCookieConsent();

  useEffect(() => {
    if (hasAnalytics) {
      // Initialize Google Analytics
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    } else {
      // Disable analytics
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }, [hasAnalytics]);

  return <>{children}</>;
}
```

## Troubleshooting

### Banner not appearing
- Check if `cookie-consent` exists in localStorage
- Clear localStorage and refresh
- Check browser console for errors

### Preferences not saving
- Check browser localStorage permissions
- Verify no browser extensions blocking localStorage
- Check for JavaScript errors in console

### Styling issues
- Verify Tailwind/DaisyUI classes are working
- Check if custom animations are loaded
- Inspect element z-index conflicts

## Related Files

- **Cookie Policy**: `/app/cookies/page.tsx`
- **Privacy Policy**: `/app/privacy/page.tsx`
- **Footer**: `/components/footer.tsx`
- **Theme Styles**: `/app/styles/`

## Support

For questions or issues:
- Email: privacy@stumbleable.com
- Documentation: `/cookies`
- GitHub Issues: [Report a bug](https://github.com/stumbleable/stumbleable)

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0

# CSP & X-Frame-Options Iframe Fallback Implementation

## Overview
Implemented a graceful fallback system for the stumble page that displays a rich `DiscoveryCard` component when websites block iframe embedding via Content Security Policy (CSP) headers or X-Frame-Options headers.

## Problem
Many websites set security headers that prevent iframe embedding:
- **CSP**: `frame-ancestors 'self'` (modern method)
- **X-Frame-Options**: `SAMEORIGIN` or `DENY` (legacy method)

These blocks result in blank iframes or browser error messages, but the iframe's `onLoad` event still fires, making detection tricky.

**Important**: This fallback should ONLY trigger for actual CSP/X-Frame-Options blocks, not for pages that load successfully (even if they show 404 errors or other HTTP errors). A 404 page is still valuable content - users might discover related articles or navigate to other parts of the site.

## Solution
Added automatic detection and fallback rendering:

1. **Attempt iframe loading first** - Always try to load the site in an iframe
2. **Detect blocking via multiple methods**:
   - **10-second timeout** - Catches CSP violations that prevent `onLoad` from firing at all
   - **Post-load content check** - After `onLoad` fires, check if iframe actually has content:
     - Try to access `contentDocument` - if accessible and empty, it's blocked
     - If throws `SecurityError` - **this is GOOD**, means real cross-origin content loaded
     - If document exists but body is empty - it's blocked by X-Frame-Options
3. **Fallback to DiscoveryCard** - Show rich preview with metadata when iframe is completely blocked

### Why Two Detection Methods?

**CSP `frame-ancestors`** (modern):
- Prevents iframe from loading at all
- `onLoad` never fires
- Caught by 10-second timeout

**X-Frame-Options: SAMEORIGIN** (legacy):
- Allows iframe to load but displays error page
- `onLoad` DOES fire (with blank/error content)
- Caught by post-load content check

**Working cross-origin iframe** (normal):
- Loads successfully
- `onLoad` fires
- Throws `SecurityError` when checking contentDocument (this is normal browser security)
- We catch the error and consider it successful (don't show fallback)

## Implementation Details

### State Management
```typescript
const [iframeError, setIframeError] = useState(false);
const iframeLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### Detection Logic
When a new discovery is loaded:
1. Reset `iframeError` state to `false`
2. Clear any existing timeout
3. Set 5-second timeout to detect silent failures
4. If iframe loads successfully, clear the timeout
5. If iframe errors or timeout fires, set `iframeError` to `true`

### Rendering Logic
```tsx
{!iframeError ? (
  // Show iframe with timeout detection
  <iframe onLoad={clearTimeout} onError={setError} />
) : (
  // Show DiscoveryCard fallback
  <div className="overflow-y-auto">
    <div className="warning-banner">
      This site can't be displayed in a frame
    </div>
    <DiscoveryCard discovery={currentDiscovery} />
  </div>
)}
```

## User Experience

### When Iframe Works
- Full-screen iframe displays the website
- Mobile swipe hints appear at bottom
- Standard stumble experience

### When Iframe Fails (CSP Block)
- Warning banner explains why iframe isn't showing
- **DiscoveryCard displays rich preview:**
  - Full-size image (if available)
  - Domain badge
  - Title (links to site in new tab)
  - Description
  - Reading time and publish date
  - Topic tags
  - Discovery rationale ("Why you're seeing this")
  - Report content button
- Page becomes scrollable for longer content
- ReactionBar remains fixed at bottom
- User can click title to open site in new tab

## Benefits

### For Users
1. **Never see blank pages** - Always get meaningful content
2. **Rich context** - See all metadata about the discovery
3. **Easy access** - Click-through to open in new tab
4. **Consistent experience** - Same reaction buttons work

### For Platform
1. **Better engagement** - Users don't abandon on CSP errors
2. **Showcase metadata** - Display quality of discovery data
3. **Encourage submissions** - Shows importance of good metadata
4. **Future-proof** - Works as more sites adopt strict CSP

## Technical Notes

### Timeout Duration
- Set to **10 seconds** - balances between:
  - Avoiding false positives on slow-loading pages (including 404 pages)
  - Avoiding false positives on cross-origin iframes (normal browser security)
  - Quick enough fallback for truly blocked iframes
  - User experience (not too long waiting for genuinely blocked content)

### Detection Method
- **Only uses timeout** - no contentWindow access checking
- Cross-origin iframes (working correctly) will throw SecurityError if you try to access `contentWindow.location`
- This is normal browser security and doesn't mean the iframe is broken
- CSP-blocked iframes simply don't trigger `onLoad` at all
- Timeout catches the silent CSP failures

### Cleanup
- Timeout is cleared on:
  - Successful iframe load
  - Iframe error event
  - Component unmount
  - New discovery loaded

### Styling
- Fallback container has `overflow-y-auto` for scrolling
- Warning banner uses `bg-warning/10` with Font Awesome icon
- DiscoveryCard centered in max-w-3xl container
- Responsive padding (px-4 sm:px-6 md:px-8)

## Future Enhancements

### Potential Improvements
1. **Cache CSP failures** - Remember which domains block iframes
2. **Skip iframe attempt** - Go straight to DiscoveryCard for known blockers
3. **User preference** - Let users choose default rendering mode
4. **Performance metrics** - Track iframe success/failure rates
5. **Domain reputation** - Factor CSP compatibility into discovery algorithm

### API Enhancement
Could add `allowsFraming` field to discoveries:
```typescript
interface Discovery {
  // ... existing fields
  allowsFraming?: boolean; // null=unknown, true=allowed, false=blocked
}
```

## Testing

### Sites That Block Iframes (Test Cases)
**CSP frame-ancestors blocks:**
- https://techcrunch.com/
- https://twitter.com/
- https://facebook.com/

**X-Frame-Options: SAMEORIGIN blocks:**
- https://www.theguardian.com/
- https://github.com/
- https://linkedin.com/

**Should NOT trigger fallback:**
- 404 error pages (content still loads)
- Redirect pages (follows redirect in iframe)
- Slow-loading pages (eventually loads)
- Cross-origin pages with normal content (SecurityError is expected and good)

### Expected Behavior
1. Navigate to `/stumble`
2. If discovery is a blocked site:
   - Brief loading of iframe (< 5 seconds)
   - Automatic fallback to DiscoveryCard
   - Warning banner appears
   - Full metadata displayed
   - Clicking title opens new tab
   - All reaction buttons work

## Files Modified

### `ui/portal/app/stumble/page.tsx`
- Added imports: `DiscoveryCard` component
- Added state: `iframeError`, `iframeLoadTimeoutRef`
- Added timeout logic in `handleStumble` function
- Added cleanup in `useEffect` hook
- Modified rendering: Conditional iframe vs DiscoveryCard

### No Changes Needed
- `components/discovery-card.tsx` - Already has all needed features
- API services - No backend changes required
- Database - No schema changes needed

## Related Documentation
- [copilot-instructions.md](.github/copilot-instructions.md) - Font Awesome icon standards
- [ICON_USAGE_STANDARDS.md](docs/ICON_USAGE_STANDARDS.md) - Icon usage patterns
- [PRD.md](docs/prd.md) - H3 Lists & Collections features

---

**Status**: ✅ Complete and deployed
**Date**: September 30, 2025
**Feature**: H3 Enhancement (between H3.2 and H3.3)

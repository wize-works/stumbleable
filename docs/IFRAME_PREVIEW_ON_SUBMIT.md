# Iframe Preview on Submission Page

## Overview
Added live iframe preview functionality to the content submission page (`/submit`) to give users immediate feedback about whether a site will load properly before they submit it.

## Implementation Date
October 1, 2025

## Features

### 1. **Automatic URL Preview**
- **Debounced loading**: Preview loads 1 second after user stops typing URL
- **Real-time validation**: Only shows preview for valid URLs (http/https)
- **Auto-refresh**: Preview updates automatically when URL changes

### 2. **Loading States**
- **Loading spinner**: Shows while iframe is loading
- **Timeout detection**: 5-second timeout to detect blocked/slow sites
- **Success indicator**: Green badge appears when site loads successfully

### 3. **Error Handling**
- **CSP/X-Frame-Options detection**: Identifies sites that block embedding
- **User-friendly messaging**: Explains why preview might not be available
- **Graceful fallback**: Informs users they can still submit even if preview fails

### 4. **Visual Feedback**
Three distinct states:
1. **Loading**: Spinner with "Loading preview..." message
2. **Error**: Warning alert explaining the site may block embedding
3. **Success**: Green badge confirming successful load

## User Benefits

### Before Submission
Users can now:
- ✅ Verify the site actually loads and isn't broken
- ✅ See if the site blocks iframe embedding (CSP/X-Frame-Options)
- ✅ Get immediate feedback about URL validity
- ✅ Understand potential issues before submitting

### During Submission
- More confident submissions (user knows what they're submitting)
- Fewer failed submissions due to broken URLs
- Better user experience with visual feedback

## Technical Details

### State Management
```typescript
const [showPreview, setShowPreview] = useState(false);
const [previewLoading, setPreviewLoading] = useState(false);
const [iframeError, setIframeError] = useState(false);
const iframeRef = useRef<HTMLIFrameElement | null>(null);
const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### Debouncing Logic
- **1 second delay**: Prevents excessive iframe loads while typing
- **Cleanup on unmount**: Properly clears timeouts
- **Reset on URL change**: Clears previous state for new URLs

### Security
- **Sandboxed iframe**: Limited permissions for safety
- **Referrer policy**: `strict-origin-when-cross-origin`
- **Timeout protection**: 5-second maximum wait time

### Error Detection Methods
1. **onError event**: Catches network failures
2. **Timeout mechanism**: Detects sites that never load
3. **onLoad success**: Clears error state when successful

## UI/UX Considerations

### Preview Section
- **400px height**: Adequate preview size without overwhelming form
- **Rounded corners**: Consistent with site design language
- **Border styling**: Clear visual separation from form fields
- **Responsive positioning**: Works on desktop and mobile

### Informational Text
- **Helper text**: "See how the site loads before submitting"
- **Tip message**: "This preview shows you if the site will load properly for users"
- **Error explanation**: Clear reason why preview might fail

### Color Coding
- 🟢 **Success**: Green badge with check icon
- 🟡 **Warning**: Yellow alert for blocked/failed loads
- 🔵 **Loading**: Blue spinner during loading

## Integration with Existing System

### Consistent with Stumble Page
- Similar iframe implementation to `/stumble` page
- Matches error handling patterns
- Uses same CSP/X-Frame-Options detection approach

### Backend Coordination
- Backend already captures `allowsFraming` during metadata extraction
- Preview helps validate what backend will discover
- User sees same blocking behavior that end-users will experience

## Future Enhancements

### Potential Improvements
1. **Metadata extraction preview**: Show extracted title/description below iframe
2. **Topic classification preview**: Display auto-detected topics
3. **Screenshot fallback**: Generate screenshot when iframe blocked
4. **Browser compatibility check**: Warn about site-specific issues
5. **Performance metrics**: Show load time and resource counts

## Files Modified

### Main Changes
- `ui/portal/app/submit/page.tsx`: Added iframe preview section with state management

### Dependencies Added
- `useRef` hook: For iframe and timeout references
- Debouncing logic: For URL change detection

## Testing Recommendations

### Test Cases
1. ✅ Valid URL that loads successfully
2. ✅ Invalid URL format (should not show preview)
3. ✅ URL that blocks iframe embedding (CSP)
4. ✅ URL that times out (slow/unreachable)
5. ✅ Rapid URL changes (debouncing)
6. ✅ Empty URL field (should hide preview)

### Manual Testing
- Test with various websites (news, blogs, documentation)
- Test with known blockers (GitHub, Stack Overflow, etc.)
- Test mobile responsiveness
- Test loading spinner appears/disappears correctly
- Test success badge appears on successful load

## Related Documentation
- `CSP_IFRAME_FALLBACK.md`: Original iframe blocking detection system
- `TASKS_TODO.md`: Task tracking and feature completion
- `.github/copilot-instructions.md`: Project architecture guidelines

## Success Metrics
- Users can identify broken URLs before submission
- Users understand why some sites won't preview
- Fewer support requests about "why didn't my submission work"
- Improved submission success rate

---

**Status**: ✅ Implemented and tested
**Version**: 1.0
**Author**: Copilot with user guidance

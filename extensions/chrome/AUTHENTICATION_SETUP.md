# Extension Authentication Setup

## Overview

The Stumbleable Chrome extension now uses OAuth token exchange to authenticate users. This allows seamless authentication between the web app and the extension.

## How It Works

1. **User clicks "Sign In"** in the extension popup
2. **Opens `/extension-auth`** page in a new browser tab
3. **Clerk authenticates** the user (redirects to sign-in if needed)
4. **Page sends auth token** via `postMessage` to the content script
5. **Content script relays** the message to the background script
6. **Background script stores** the token in `chrome.storage.sync`
7. **Extension is now authenticated** and popup refreshes automatically

## File Changes

### New Files
- `ui/portal/app/extension-auth/page.tsx` - Auth callback page
- `extensions/chrome/AUTHENTICATION_SETUP.md` - This file

### Modified Files
- `extensions/chrome/src/background.ts` - Added `handleAuthCallback()` function
- `extensions/chrome/src/popup.ts` - Changed sign-in URL, added auth state listener
- `extensions/chrome/src/content.ts` - Added message relay for auth
- `extensions/chrome/manifest.json` - Added `notifications` permission

## Testing Instructions

### 1. Build the Extension

```bash
cd extensions/chrome
npm install
npm run build
```

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extensions/chrome/dist` folder
5. The extension icon should appear in your toolbar

### 3. Start Development Servers

Make sure all services are running:

```bash
# From project root
npm run dev
```

This starts:
- Frontend (Next.js): http://localhost:3000
- Discovery Service: http://localhost:7001
- Interaction Service: http://localhost:7002
- User Service: http://localhost:7003

### 4. Test Authentication Flow

1. **Click the extension icon** in Chrome toolbar
2. You should see "Sign in to start stumbling"
3. **Click "Sign In"** button
4. A new tab opens to `http://localhost:3000/extension-auth`
5. If not signed in, you'll be redirected to sign-in page
6. **Sign in with Clerk**
7. After sign-in, you're redirected back to `/extension-auth`
8. You should see "Authentication successful!" message
9. The tab closes automatically after 2 seconds
10. **Extension popup refreshes** and shows the stumble interface
11. You should see a Chrome notification: "Signed In!"

### 5. Verify Authentication

Open the extension popup again and verify:
- ✅ No longer shows "Sign in" prompt
- ✅ Shows stumble button and discovery interface
- ✅ Can load discoveries
- ✅ Can interact with content (like, skip, save)

### 6. Check Browser Console

For debugging, open:

**Background Script Console:**
1. Go to `chrome://extensions/`
2. Find Stumbleable extension
3. Click "service worker" link
4. Check console for logs:
   - "Background received auth callback"
   - "✅ Authentication stored successfully"

**Extension Popup Console:**
1. Right-click extension icon → "Inspect popup"
2. Check console for:
   - "Auth state changed, reloading popup..."
   - User data loading logs

**Page Console (extension-auth):**
1. Open `http://localhost:3000/extension-auth`
2. Check console for:
   - "Content script received auth message"
   - "Auth successfully sent to background script"

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User clicks "Sign In" in Extension Popup               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Opens http://localhost:3000/extension-auth in new tab  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Clerk checks auth state                                 │
│  - If not signed in → redirect to /sign-in              │
│  - If signed in → continue                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Page calls getToken() and creates auth message         │
│  window.postMessage({ type: 'STUMBLEABLE_AUTH', ... })  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Content Script (content.ts) receives message           │
│  - Validates origin (localhost:3000 or stumbleable.com) │
│  - Forwards to background script                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Background Script (background.ts) handles auth         │
│  - Stores userId, authToken in chrome.storage.sync     │
│  - Fetches user preferences from User Service          │
│  - Shows success notification                           │
│  - Broadcasts 'authStateChanged' message                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Extension Popup (popup.ts) receives message            │
│  - Reloads user data from storage                       │
│  - Loads discovery interface                            │
│  - User can now stumble!                                │
└─────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **Origin Validation**: Content script only accepts messages from:
   - `http://localhost:3000` (development)
   - `https://stumbleable.com` (production)

2. **Token Storage**: Auth tokens stored in `chrome.storage.sync`:
   - Encrypted by Chrome
   - Synced across user's devices
   - Only accessible to extension

3. **Message Type Checking**: All messages verified for `type: 'STUMBLEABLE_AUTH'`

4. **HTTPS Required**: Production uses HTTPS for all communication

## Troubleshooting

### Extension doesn't recognize sign-in

1. **Check console logs** in background script and page
2. **Verify origin** in content script matches your domain
3. **Clear extension storage**:
   ```javascript
   chrome.storage.sync.clear()
   ```
4. **Reload extension** in chrome://extensions/

### "Failed to get authentication token" error

1. Ensure Clerk is properly configured in Next.js app
2. Check that user is actually signed in
3. Verify Clerk middleware isn't blocking `/extension-auth`

### Content script not receiving messages

1. Check that content script is injected (manifest.json)
2. Verify the page origin matches allowed origins
3. Check browser console for content script logs

### Background script errors

1. Check service worker console in chrome://extensions/
2. Verify all API URLs are correct (DISCOVERY_API_URL, etc.)
3. Make sure services are running

## Production Deployment

Before deploying to production:

1. Update `allowedOrigins` in `content.ts`:
   ```typescript
   const allowedOrigins = [
       'https://stumbleable.com',
       'https://www.stumbleable.com'
   ];
   ```

2. Update API URLs in `background.ts`:
   ```typescript
   const API_BASE_URL = 'https://stumbleable.com';
   const DISCOVERY_API_URL = 'https://api.stumbleable.com/discovery';
   // etc...
   ```

3. Update manifest.json host_permissions:
   ```json
   "host_permissions": [
       "https://stumbleable.com/*",
       "https://api.stumbleable.com/*"
   ]
   ```

4. Test thoroughly in production environment

## Success Criteria

✅ User can sign in from extension
✅ Extension recognizes authenticated state
✅ Auth token is stored and persisted
✅ User preferences are loaded
✅ Extension can make authenticated API calls
✅ User stays signed in across browser restarts
✅ Auth syncs across user's Chrome instances

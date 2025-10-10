# 🔧 Extension Authentication Fix

## Problem Identified

The login button in the extension popup was opening `/sign-in` instead of `/extension-auth`, which broke the OAuth token exchange flow that allows the extension to capture authentication tokens.

## What Was Fixed

### 1. **Updated Login Button URL**
Changed from:
```typescript
chrome.tabs.create({ url: 'http://localhost:3000/sign-in' });
```

To:
```typescript
chrome.tabs.create({ url: 'http://localhost:3000/extension-auth' });
```

### 2. **Added Auth State Listener**
Added the `setupAuthListener()` function that was missing, which allows the popup to automatically refresh when authentication completes.

```typescript
function setupAuthListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'authStateChanged') {
            console.log('Auth state changed, reloading popup...');
            loadUserData().then(() => {
                if (userData.userId) {
                    loadNextDiscovery();
                }
            });
        }
    });
}
```

## How It Works Now

1. **User clicks "Sign In"** in extension popup
2. **Opens `/extension-auth`** in new tab
3. **If not signed in** → Clerk redirects to `/sign-in`
4. **User signs in** with Clerk
5. **Redirected back to `/extension-auth`**
6. **Page gets token** from Clerk's `getToken()`
7. **Sends via postMessage** to content script
8. **Content script relays** to background script
9. **Background script stores** token in `chrome.storage.sync`
10. **Background broadcasts** `authStateChanged` message
11. **Popup receives message** and reloads user data
12. **Extension now authenticated** ✅

## Testing the Fix

### Step 1: Rebuild Extension
```bash
cd extensions/chrome
npm run build
```

### Step 2: Reload Extension in Chrome
1. Go to `chrome://extensions/`
2. Click the refresh icon on Stumbleable extension
3. Or remove and re-add from `dist/` folder

### Step 3: Test Authentication Flow
1. Click the extension icon
2. You should see "Sign in to start stumbling!"
3. Click **"Sign In"** button
4. New tab opens to `http://localhost:3000/extension-auth`
5. If not signed in, redirected to sign-in page
6. Sign in with your Clerk account
7. Redirected back to `/extension-auth`
8. Should see "✅ Success! Authentication successful!"
9. Tab auto-closes after 2 seconds
10. **Extension popup should now show stumble interface**
11. Browser notification appears: "Signed In!"

### Step 4: Verify Storage
Open DevTools for background script:
1. Go to `chrome://extensions/`
2. Click "service worker" under Stumbleable
3. In console, run:
```javascript
chrome.storage.sync.get(['userId', 'authToken'], (data) => {
    console.log('Stored auth:', data);
});
```

You should see:
```javascript
{
  userId: "user_xxx",
  authToken: "xxx..."
}
```

## Debugging

### If authentication still doesn't work:

#### Check Console Logs

**Extension Background Script** (`chrome://extensions/` → service worker):
- "Background received auth callback: {...}"
- "✅ Authentication stored successfully"

**Extension Popup** (Right-click extension → Inspect popup):
- "Auth state changed, reloading popup..."
- User data loading logs

**Web Page Console** (F12 on `/extension-auth` page):
- "Content script received auth message"
- "Auth successfully sent to background script"

#### Common Issues

**1. Content script not injected**
- Check manifest.json has content_scripts for all URLs
- Reload the page after installing extension

**2. Origin mismatch**
- Verify `allowedOrigins` in content.ts includes your domain
- Check browser console for origin rejection messages

**3. Clerk token not available**
- Ensure user is actually signed in to Clerk
- Check Clerk configuration in Next.js app

**4. Storage not syncing**
- Check Chrome sync is enabled
- Try `chrome.storage.local` instead for testing

## Files Changed

- ✅ `extensions/chrome/src/popup.ts` - Fixed login URL & added auth listener
- ✅ Rebuilt extension dist files

## Next Steps

After confirming authentication works:
1. Test submission of current page
2. Test saving current page  
3. Verify keyboard shortcuts work
4. Test context menu actions
5. Confirm authentication persists across browser restarts

## Rollback (if needed)

If you need to revert:
```bash
cd extensions/chrome
git restore src/popup.ts
npm run build
```

Then reload extension in Chrome.

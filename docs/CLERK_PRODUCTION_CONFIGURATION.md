# Clerk Production Configuration

**Issue:** Production site redirecting to Clerk dev handshake endpoint  
**Root Cause:** Using test/development Clerk keys in production  
**Last Updated:** October 2, 2025

---

## 🚨 The Problem

When testing stumbleable.com on Sucuri.net, the site redirects to:

```
https://more-leopard-14.clerk.accounts.dev/v1/client/handshake?
  redirect_url=https://stumbleable.com/&
  __clerk_hs_reason=dev-browser-missing
```

**The key indicator:** `__clerk_hs_reason=dev-browser-missing`

This happens because:
1. **Development keys** (`pk_test_...`) trigger Clerk's dev-browser sync handshake
2. Clerk tries to sync session state between dev browser and production
3. Public routes still get processed by `clerkMiddleware`, triggering handshakes

---

## ✅ The Solution

### Step 0: Configure Custom Authentication Pages (REQUIRED - CRITICAL!)

**MOST IMPORTANT:** You must set environment variables to tell Clerk where your custom pages are!

**CRITICAL:** You must tell Clerk to use your custom sign-in/sign-up pages instead of hosted pages.

#### A. Set Environment Variables (CRITICAL - DO THIS FIRST! ✅)

According to [Clerk's official documentation](https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page), you **MUST** set these environment variables:

**For Kubernetes (in `k8s/base/configmap.yaml`):**
```yaml
# Clerk custom authentication pages
NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: "/onboarding"
```

**For local development (in `.env.local`):**
```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

**Without these environment variables, Clerk will default to using the Account Portal subdomain (`accounts.stumbleable.com`) for authentication!**

#### B. Update Your Code (Already Done ✅)

1. **Middleware configuration** (`middleware.ts`):
```typescript
export default clerkMiddleware(
    async (auth, req) => {
        if (isProtectedRoute(req)) {
            await auth.protect();
        }
    },
    {
        signInUrl: '/sign-in',
        signUpUrl: '/sign-up',
    }
);
```

2. **ClerkProvider configuration** (`app/layout.tsx`):
```typescript
<ClerkProvider
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/onboarding"
>
```

#### B. Configure Clerk Dashboard (DO THIS NOW)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your **Production** instance
3. Navigate to: **Paths** (or **Customization → Paths**)
4. Set the following URLs:

| Setting | Value | Why |
|---------|-------|-----|
| **Sign-in URL** | `/sign-in` | Your custom sign-in page |
| **Sign-up URL** | `/sign-up` | Your custom sign-up page |
| **After sign-in URL** | `/dashboard` | Where to redirect after login |
| **After sign-up URL** | `/onboarding` | Where to redirect after registration |

5. Under **Advanced Settings**:
   - Enable: ✅ **Use custom pages**
   - Disable: ❌ **Use Clerk hosted pages**

6. **Save Changes**

**Without this configuration, Clerk will redirect to `accounts.stumbleable.com` (hosted pages) instead of your custom pages!**

---

### Step 1: Use Production Clerk Keys (REQUIRED)

Production deployments should use **production Clerk credentials**:

1. **Development Instance** (for local dev):
   - Uses `pk_test_...` and `sk_test_...`
   - Domain: `localhost:3000`
   - Has dev-browser sync enabled

2. **Production Instance** (for stumbleable.com):
   - Uses `pk_live_...` and `sk_live_...`
   - Domain: `stumbleable.com`
   - No dev-browser sync

**Setup Production Instance:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new **Production** instance for Stumbleable
3. Configure production domain: `stumbleable.com`
4. Get production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`
5. Update GitHub secrets:
   ```powershell
   # Update GitHub secrets with production keys
   gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY -b "pk_live_..."
   gh secret set CLERK_SECRET_KEY -b "sk_live_..."
   ```

### Option 2: Configure Middleware to Skip Public Routes

Already implemented in `middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
    '/stumble(.*)',
    '/saved(.*)',
    '/lists(.*)',
    '/submit(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // Only protect specific routes
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});
```

**This ensures:**
- ✅ Homepage `/` is fully public (no Clerk interaction)
- ✅ Marketing pages are public
- ✅ Only protected routes require authentication
- ✅ No unnecessary handshakes on public pages

---

## 🔍 How to Verify

### Check Current Keys

```bash
# In production deployment
kubectl get secret stumbleable-secrets -n stumbleable -o jsonpath='{.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}' | base64 -d
```

**Expected:**
- ✅ `pk_live_...` (production)
- ❌ `pk_test_...` (development - wrong for production!)

### Test Public Routes

```bash
curl -I https://stumbleable.com/
```

**Expected:**
- ✅ Status: `200 OK`
- ✅ No redirect
- ❌ Status: `307` redirect to Clerk (indicates issue)

### Monitor Clerk Dashboard

1. Go to Clerk Dashboard → Your production instance
2. Check **Sessions** tab
3. Public visitors should NOT create sessions

---

## 📋 Deployment Checklist

### For Production Deployments:

- [ ] Created production Clerk instance
- [ ] Configured production domain in Clerk
- [ ] Updated GitHub secrets with `pk_live_` and `sk_live_` keys
- [ ] Updated Kubernetes secrets (or re-ran deploy workflow)
- [ ] Verified middleware only protects specific routes
- [ ] Tested homepage doesn't redirect to Clerk
- [ ] Tested protected routes still require authentication

### Environment Variable Configuration:

```yaml
# GitHub Secrets (for production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_live_... # NOT pk_test_
CLERK_SECRET_KEY: sk_live_...                   # NOT sk_test_
CLERK_WEBHOOK_SECRET: whsec_...

# Kubernetes Secrets (auto-created by workflow)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_live_...
CLERK_SECRET_KEY: sk_live_...
```

---

## 🎯 Key Differences: Dev vs Prod

| Feature | Development (`pk_test_`) | Production (`pk_live_`) |
|---------|--------------------------|-------------------------|
| **Dev Browser Sync** | ✅ Enabled | ❌ Disabled |
| **Handshake Redirects** | ⚠️ Happens on public routes | ✅ Only on sign-in |
| **Domain** | localhost:3000 | stumbleable.com |
| **Session Cookie** | `.clerk.accounts.dev` | `.stumbleable.com` |
| **User Pool** | Test users | Real users |

---

## 🐛 Troubleshooting

### Redirecting to accounts.stumbleable.com Instead of /sign-in?

**Symptom:** When accessing `/stumble` (protected route), you're redirected to:
```
https://accounts.stumbleable.com/sign-in?redirect_url=https://stumbleable.com/stumble
```

**Cause:** Clerk is using **hosted pages** instead of your **custom pages**.

**Fix:**
1. ✅ Verify code configuration (middleware & ClerkProvider) - see Step 0 above
2. ⚠️ **Configure Clerk Dashboard** (the missing step!):
   - Go to Dashboard → Paths
   - Set **Sign-in URL** to `/sign-in`
   - Set **Sign-up URL** to `/sign-up`
   - Enable "Use custom pages"
   - Save and **wait 1-2 minutes** for propagation
3. Clear browser cache and test again

**How to verify it's fixed:**
```bash
# Test protected route when not logged in
curl -I https://stumbleable.com/stumble

# Should redirect to (302):
Location: https://stumbleable.com/sign-in?redirect_url=...
# NOT to: https://accounts.stumbleable.com/...
```

---

### Still Getting Redirects After Using Production Keys?

1. **Clear browser cache and cookies**
   ```javascript
   // Chrome DevTools Console
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, 
       "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Check middleware matcher**
   - Ensure public routes aren't being caught
   - Verify `/` is accessible without authentication

3. **Verify Clerk configuration**
   - Production instance must have `stumbleable.com` as allowed domain
   - Check "Allowed redirect URLs" includes your domain

4. **Check ClerkProvider configuration**
   - Ensure no explicit `frontendApi` prop (uses keys automatically)
   - No custom `clerkJSUrl` pointing to dev

### Users Can't Sign In After Switching Keys

This is expected! Development and production instances have **separate user databases**.

**Options:**
1. **Migrate users** (Clerk supports user migration)
2. **Re-register users** in production instance
3. **Use same instance** for dev and prod (not recommended)

---

## 📚 References

- [Clerk Development vs Production](https://clerk.com/docs/deployments/environments)
- [Clerk Middleware Configuration](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Clerk Domain Configuration](https://clerk.com/docs/deployments/set-up-production)

---

## ✅ Summary

**The Fix:**
1. ✅ Use production Clerk keys (`pk_live_`, `sk_live_`) in production
2. ✅ Middleware configured to skip public routes
3. ✅ Public homepage won't trigger Clerk handshakes
4. ✅ Protected routes still require authentication

**Result:**
- No more redirects to `clerk.accounts.dev` on public pages
- Clean URLs for public visitors
- Proper authentication on protected pages
- Better SEO and security posture


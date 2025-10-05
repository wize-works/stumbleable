# Moderation Service 401 Authentication Fix

**Date**: October 4, 2025  
**Issue**: 401 Unauthorized errors when resolving content reports  
**Status**: ✅ **FIXED**

---

## 🐛 Problem

Users were getting 401 errors when trying to resolve content reports via the admin moderation page:

```
moderation [05:03:47 UTC] INFO: incoming request
    method: "POST"
    url: "/api/moderation/reports/ab13bcdb-83e2-4eb8-93d5-626f2918876c/resolve"
moderation [05:03:48 UTC] INFO: request completed
    res: { "statusCode": 401 }
```

---

## 🔍 Root Cause

The moderation service's Clerk authentication plugin wasn't properly initialized due to:

1. **Silent failure**: The service would start even if Clerk keys were missing
2. **Unclear error logging**: No indication that authentication was disabled
3. **Middleware confusion**: `getAuth(request)` returned null/undefined when Clerk wasn't registered

### Why It Happened

The original server setup code:

```typescript
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    await fastify.register(clerkPlugin, {...});
} else {
    console.warn('⚠️  Clerk not configured - authentication will not be available');
}
```

**Problems:**
- ❌ Service started successfully even without Clerk
- ❌ All authenticated endpoints returned 401
- ❌ No clear error message
- ❌ Environment variable issues weren't caught at startup

---

## ✅ Solution

### 1. Required Environment Variables

Changed Clerk initialization to **fail fast** if keys are missing:

```typescript
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

console.log('🔑 Clerk configuration:', {
    publishableKey: clerkPublishableKey ? `✅ Set (${clerkPublishableKey.substring(0, 20)}...)` : '❌ Missing',
    secretKey: clerkSecretKey ? `✅ Set (${clerkSecretKey.substring(0, 20)}...)` : '❌ Missing',
    envFile: process.env.NODE_ENV === 'production' ? 'Production' : 'Development (.env)'
});

if (!clerkPublishableKey || !clerkSecretKey) {
    console.error('❌ CRITICAL: Clerk keys not found!');
    console.error('   Please ensure .env file has:');
    console.error('   - CLERK_PUBLISHABLE_KEY=pk_test_...');
    console.error('   - CLERK_SECRET_KEY=sk_test_...');
    throw new Error('Clerk authentication keys are required');
}
```

**Benefits:**
- ✅ Service won't start without valid Clerk keys
- ✅ Clear error message with fix instructions
- ✅ Shows first 20 chars of keys for verification
- ✅ Indicates which environment (dev/prod)

### 2. Enhanced Auth Middleware Logging

Added detailed logging to help debug authentication issues:

```typescript
export async function requireModeratorRole(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const auth = getAuth(request);

    // Log auth details for debugging
    request.log.debug({ 
        hasAuth: !!auth,
        hasUserId: !!auth?.userId,
        hasAuthHeader: !!request.headers.authorization,
        authHeader: request.headers.authorization ? 'Bearer ...' : 'Missing'
    }, 'Auth check');

    if (!auth || !auth.userId) {
        request.log.warn({ 
            headers: {
                authorization: request.headers.authorization ? 'Present (Bearer ...)' : 'Missing',
                host: request.headers.host,
                origin: request.headers.origin
            },
            path: request.url,
            method: request.method
        }, 'Authentication failed - no auth or userId');
        
        return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }
    
    // ... rest of middleware
}
```

**Benefits:**
- ✅ Debug logs show auth state
- ✅ Warn logs show why authentication failed
- ✅ Headers logged (safely, without exposing tokens)
- ✅ Easier to diagnose 401 issues

---

## 🔒 Environment Variables Required

### Backend Services (Standard Names)

**File:** `apis/moderation-service/.env`

```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Critical Notes:**
- ✅ Use **standard names** (NOT `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- ✅ Backend services use `CLERK_PUBLISHABLE_KEY` directly
- ✅ Only frontend uses `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Service will **fail to start** if these are missing

### Frontend (Next.js)

**File:** `ui/portal/.env.local`

```bash
# Client-side (exposed to browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Server-side only
CLERK_SECRET_KEY=sk_test_...

# Service URLs
NEXT_PUBLIC_MODERATION_API_URL=http://localhost:7005
```

---

## 🧪 Testing the Fix

### 1. Check Service Startup

When starting the moderation service, you should see:

```
🔑 Clerk configuration:
  publishableKey: ✅ Set (pk_test_Y29tcGxld...)
  secretKey: ✅ Set (sk_test_Y29tcGxld...)
  envFile: Development (.env)
✅ Clerk plugin registered successfully
🚀 Moderation Service running on http://0.0.0.0:7005
```

### 2. If Keys Are Missing

You'll see:

```
🔑 Clerk configuration:
  publishableKey: ❌ Missing
  secretKey: ❌ Missing
❌ CRITICAL: Clerk keys not found!
   Please ensure .env file has:
   - CLERK_PUBLISHABLE_KEY=pk_test_...
   - CLERK_SECRET_KEY=sk_test_...
Error: Clerk authentication keys are required
```

**Service will not start!**

### 3. Test Report Resolution

1. Navigate to `/admin/moderation`
2. Click "Reports" tab
3. Select a pending report
4. Click "Resolve" or "Dismiss"
5. Should succeed with 200 response

### 4. Check Logs

If authentication still fails, check logs for:

```
WARN: Authentication failed - no auth or userId
  headers: {
    authorization: "Missing",
    host: "localhost:7005",
    origin: "http://localhost:3000"
  }
```

This indicates the frontend isn't sending the token.

---

## 🔄 Authentication Flow

### Correct Flow

```
Frontend (/admin/moderation)
  ↓ User clicks "Resolve Report"
  ↓ Gets token via useAuth().getToken()
  ↓ Sends POST to moderation service
  
Moderation Service
  ↓ Receives request with Authorization: Bearer <token>
  ↓ Clerk plugin extracts JWT
  ↓ getAuth(request) returns { userId, ... }
  ↓ Middleware checks role in database
  ↓ Request proceeds to handler
  ↓ Returns 200 with updated report
```

### Broken Flow (Before Fix)

```
Frontend
  ↓ Sends POST with token
  
Moderation Service (Clerk not registered!)
  ↓ getAuth(request) returns null
  ↓ Middleware returns 401
  ✗ Request never reaches handler
```

---

## 📋 Affected Endpoints

All moderation endpoints require authentication:

### Moderation Queue
- `GET /api/moderation/queue` - List queue items
- `GET /api/moderation/queue/:queueId` - Get specific item
- `POST /api/moderation/queue/:queueId/review` - Review content
- `POST /api/moderation/queue/bulk-approve` - Bulk approve
- `POST /api/moderation/queue/bulk-reject` - Bulk reject
- `GET /api/moderation/analytics` - Get analytics

### Content Reports
- `GET /api/moderation/reports` - List reports
- `GET /api/moderation/reports/:reportId` - Get specific report
- **`POST /api/moderation/reports/:reportId/resolve`** ← This was failing
- `POST /api/moderation/report` - Submit report (any auth user)

### Domain Reputation
- `GET /api/moderation/domains` - List domains
- `GET /api/moderation/domains/:domain` - Get specific domain
- `PATCH /api/moderation/domains/:domain` - Update reputation

---

## 🎯 Prevention

To prevent this issue in other services:

### 1. Make Authentication Required

```typescript
// ✅ GOOD - Fail fast if keys missing
if (!clerkPublishableKey || !clerkSecretKey) {
    throw new Error('Clerk authentication keys are required');
}

// ❌ BAD - Silent failure
if (clerkPublishableKey && clerkSecretKey) {
    await fastify.register(clerkPlugin, {...});
}
```

### 2. Log Configuration Details

```typescript
console.log('🔑 Clerk configuration:', {
    publishableKey: key ? `✅ Set (${key.substring(0, 20)}...)` : '❌ Missing',
    secretKey: secret ? `✅ Set (${secret.substring(0, 20)}...)` : '❌ Missing'
});
```

### 3. Add Debug Logging to Middleware

```typescript
request.log.debug({ 
    hasAuth: !!auth,
    hasUserId: !!auth?.userId,
    hasAuthHeader: !!request.headers.authorization
}, 'Auth check');
```

### 4. Use Standard Environment Variable Names

- ✅ `CLERK_PUBLISHABLE_KEY` for backend services
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for Next.js client-side only
- ❌ Don't mix naming conventions

---

## 📚 Related Documentation

- [Clerk Fastify Integration](https://clerk.com/docs/backend-requests/handling/fastify)
- [Environment Variable Standards](../.github/copilot-instructions.md#environment-variable--secret-naming-standards)
- [Service Authentication Patterns](../apis/user-service/README.md)

---

## ✅ Verification Checklist

- [x] Service won't start without Clerk keys
- [x] Startup logs show Clerk configuration status
- [x] Clerk plugin registration confirmed
- [x] Auth middleware logs debug information
- [x] Failed auth shows clear error messages
- [x] Report resolution returns 200 (not 401)
- [x] Other moderation endpoints work correctly
- [x] Documentation updated

---

**Status:** Fixed and deployed. All moderation endpoints now require proper Clerk authentication with clear error messages if misconfigured.

# Moderation Service Auth Middleware Fix

## Issue
When accessing `/admin/moderation`, the moderation service was throwing this error:
```
moderation [10:24:21 UTC] ERROR: Failed to check user role
moderation     reqId: "req-6"
moderation     userId: "user_33PGhUbW2lsixmS9EZC5VkKvAs6"
moderation     error: {}
```

## Root Cause
The moderation service's `requireModeratorRole` middleware had **two bugs**:

### Bug 1: Wrong Query Parameter Name
**Incorrect code:**
```typescript
const response = await fetch(`${userServiceUrl}/api/roles/check?userId=${userId}&requiredRole=moderator`);
```

**Problem:** 
- Moderation service was sending `requiredRole=moderator`
- User service expects `required=moderator` (not `requiredRole`)
- User service gets `userId` from Clerk JWT in Authorization header, not query params

### Bug 2: Missing Authorization Header
**Problem:**
- Moderation service wasn't forwarding the Authorization header to user-service
- User service endpoint `/api/roles/check` requires Clerk authentication
- Without the header, user-service couldn't authenticate the request

## Solution

Updated `apis/moderation-service/src/middleware/auth.ts`:

### 1. Fixed Query Parameter
Changed from:
```typescript
?userId=${userId}&requiredRole=moderator
```

To:
```typescript
?required=moderator
```

### 2. Forward Authorization Header
Added:
```typescript
const authHeader = request.headers.authorization;
if (!authHeader) {
    return reply.code(401).send({
        error: 'Unauthorized',
        message: 'No authorization header found',
    });
}

const response = await fetch(`${userServiceUrl}/api/roles/check?required=moderator`, {
    headers: {
        'Authorization': authHeader  // ← Forward the JWT token
    }
});
```

### 3. Improved Error Handling
Added:
- Better logging with actual error messages
- Proper handling of 401/403 responses
- More detailed error information for debugging
- Log success cases too for visibility

### 4. Better Response Parsing
Changed from:
```typescript
const result = await response.json() as { hasRole: boolean };
if (!result.hasRole) { ... }
```

To:
```typescript
const result = await response.json() as { hasAccess: boolean, role: string };
if (!result.hasAccess) { ... }
```

**Reason:** User service returns `hasAccess` not `hasRole`

## How It Works Now

### Request Flow
```
1. Frontend → Moderation Service
   POST /admin/moderation
   Authorization: Bearer <clerk-jwt>

2. Moderation Service → User Service
   GET /api/roles/check?required=moderator
   Authorization: Bearer <clerk-jwt> ← Forwarded!

3. User Service
   - Extracts userId from JWT
   - Checks user's role in database
   - Returns { hasAccess: true, role: 'moderator' }

4. Moderation Service
   - Validates hasAccess === true
   - Allows request to proceed
```

### User Service Endpoint
```typescript
GET /api/roles/check?required=moderator
Headers: Authorization: Bearer <jwt>

Response (200):
{
  "userId": "user_xxx",
  "role": "moderator",
  "hasAccess": true,
  "requiredRole": "moderator"
}

Response (403):
{
  "error": "User not found"
}
```

## Testing

### 1. Build the service
```powershell
cd apis/moderation-service
npm run build
# ✅ SUCCESS
```

### 2. Restart services
```powershell
# Stop current dev server (Ctrl+C)
npm run dev
```

### 3. Test the fix
1. Navigate to http://localhost:3000/admin/moderation
2. Should now load without "Failed to check user role" error
3. Check logs - should see "Role check passed" message

### Expected Logs
```
moderation [10:30:00 UTC] INFO: Role check passed
moderation     userId: "user_33PGhUbW2lsixmS9EZC5VkKvAs6"
moderation     role: "moderator"
```

## Files Changed
- `apis/moderation-service/src/middleware/auth.ts`
  - Fixed query parameter name
  - Added Authorization header forwarding
  - Improved error handling and logging
  - Fixed response property name (`hasAccess` not `hasRole`)

## Verification Checklist
- [x] TypeScript compiles successfully
- [ ] Moderation service starts without errors
- [ ] `/admin/moderation` page loads successfully
- [ ] User with moderator role can access dashboard
- [ ] User without moderator role gets 403 error
- [ ] Error logs show helpful messages (not empty objects)

## Related Documentation
- User Service: `apis/user-service/src/routes/roles.ts`
- Moderation Service: `apis/moderation-service/src/middleware/auth.ts`
- Role Check Endpoint: `GET /api/roles/check?required={role}`

---

**Status**: ✅ Fixed - Ready to test  
**Date**: October 2, 2025

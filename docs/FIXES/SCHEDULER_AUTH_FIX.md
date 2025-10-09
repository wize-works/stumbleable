# Scheduler Service Authentication Fix

## Issue
Users were getting 403 Forbidden errors when trying to access `/admin/scheduler` even when logged in as an admin.

## Root Cause
The `requireAdmin` middleware in `scheduler-service` was looking for the user's role in Clerk's session claims:
```typescript
// ❌ WRONG - Role is not stored in Clerk
const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
```

However, in the Stumbleable architecture, **user roles are stored in the Supabase database**, not in Clerk's session metadata. Clerk only handles authentication (verifying the user's identity), while authorization (checking permissions/roles) is done via database lookups.

## Solution
Updated the authentication middleware to fetch the user's role from the Supabase `users` table:

### Before (Incorrect)
```typescript
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    // @ts-ignore - Clerk adds auth to request
    const { sessionClaims } = request.auth || {};
    
    // ❌ Checking Clerk session claims (roles not stored here)
    const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    
    if (role !== 'admin' && role !== 'super_admin') {
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'Admin access required',
        });
    }
}
```

### After (Correct)
```typescript
import { getAuth } from '@clerk/fastify';
import { supabase } from '../lib/supabase';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    // Get Clerk user ID
    const auth = getAuth(request as any);
    
    if (!auth.isAuthenticated || !auth.userId) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    // ✅ Fetch user role from database
    const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('clerk_user_id', auth.userId)
        .single();

    if (error || !user) {
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'User not found or invalid role',
        });
    }

    // Check if user has admin role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'Admin access required',
        });
    }
}
```

## Architecture Pattern

### Stumbleable Authentication & Authorization Flow

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser   │─────▶│    Clerk     │      │   Supabase   │
│             │      │ (Authentication)    │  (Authorization)
└─────────────┘      └──────────────┘      └──────────────┘
                            │                       │
                            │                       │
                     1. Verify JWT              2. Check Role
                     2. Extract userId          3. Return user.role
                            │                       │
                            ▼                       ▼
                     ┌────────────────────────────────┐
                     │      Fastify API Service       │
                     │  (Discovery, User, Scheduler)  │
                     └────────────────────────────────┘
```

### Key Points

1. **Clerk** - Handles authentication only:
   - Issues JWT tokens
   - Verifies token validity
   - Provides `userId` (Clerk user ID)
   - Does **NOT** store roles/permissions

2. **Supabase** - Handles authorization:
   - Stores user records in `users` table
   - Each user has `clerk_user_id` and `role` fields
   - Services query database to check permissions

3. **API Services** - Enforce authorization:
   - Use `getAuth(request)` to verify authentication
   - Query Supabase to fetch user role
   - Allow/deny based on role requirements

## Files Changed

### `apis/scheduler-service/src/middleware/auth.ts`
- Added `import { getAuth } from '@clerk/fastify'`
- Added `import { supabase } from '../lib/supabase'`
- Updated `requireAuth()` to use `getAuth(request)`
- Updated `requireAdmin()` to query database for user role

## Database Schema

### `users` table (Supabase)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Role Hierarchy

- **user** (default) - Regular platform users
- **moderator** - Can review content, moderate submissions
- **admin** - Full administrative access
- **super_admin** - Reserved for future use

## Testing

### Verify Fix
1. Log in as admin user
2. Navigate to `/admin/scheduler`
3. Should see scheduler management page (no 403 error)

### Verify Database
```sql
-- Check your user's role
SELECT clerk_user_id, email, role 
FROM users 
WHERE clerk_user_id = 'your_clerk_user_id';

-- If role is not 'admin', update it
UPDATE users 
SET role = 'admin' 
WHERE clerk_user_id = 'your_clerk_user_id';
```

### API Test
```bash
# Get your Clerk token from browser DevTools (Network tab, Authorization header)
TOKEN="your_clerk_jwt_token"

# Test scheduler API
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:7007/api/jobs
```

Expected responses:
- **200 OK** - If user has admin role
- **401 Unauthorized** - If token is invalid
- **403 Forbidden** - If user exists but role is not admin

## Consistency with Other Services

This fix aligns scheduler-service with the existing pattern used in:

### User Service (`apis/user-service/src/routes/roles.ts`)
```typescript
const auth = getAuth(request as any);
const isAdmin = await repository.checkUserRole(auth.userId, 'admin');
```

### Other Services
All services that require role checks should:
1. Use `getAuth(request)` to get Clerk user ID
2. Query Supabase `users` table for role
3. Compare role against requirements
4. Allow/deny accordingly

## Common Mistakes to Avoid

❌ **Don't** store roles in Clerk metadata  
❌ **Don't** check `sessionClaims` for roles  
❌ **Don't** use `request.auth.userId` directly (use `getAuth(request)`)  
❌ **Don't** cache role checks (roles can change)  

✅ **Do** use `getAuth(request)` for authentication  
✅ **Do** query database for current role  
✅ **Do** handle database errors gracefully  
✅ **Do** log failures for debugging  

## Security Considerations

### Why Database Over Session Claims?

1. **Single Source of Truth** - Role changes take effect immediately
2. **Centralized Management** - Admins can change roles via user-service
3. **Audit Trail** - Role changes logged in database
4. **Flexibility** - Can add custom permissions beyond roles
5. **Security** - Can't be tampered with by client

### Performance Impact

Database query adds ~10-50ms latency to each admin request. For admin endpoints, this is acceptable because:
- Admin endpoints are not high-traffic
- Security is more important than milliseconds
- Can be optimized later with caching if needed

---

**Status**: ✅ **Fixed**  
**Last Updated**: October 8, 2025  
**Impact**: All admin endpoints in scheduler-service now properly check roles from database

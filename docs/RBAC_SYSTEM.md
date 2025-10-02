# Role-Based Access Control (RBAC) Implementation

## Overview

Stumbleable now uses a proper role-based access control system to manage user permissions. This replaces the previous insecure email-based admin checks with a database-backed role system.

## User Roles

### Role Hierarchy

1. **`user`** (default) - Regular users with standard access
   - Can stumble through content
   - Can like, skip, save, and share discoveries
   - Can report inappropriate content
   - Can view their own saved content and analytics

2. **`moderator`** - Content moderators
   - All user permissions
   - Can view and process the moderation queue
   - Can approve or reject submitted content
   - Can review and resolve content reports
   - **Cannot** promote users to moderator/admin roles

3. **`admin`** - System administrators
   - All moderator permissions
   - Can promote/demote users to any role
   - Full system access
   - Can manage other administrators

## Architecture

### Database Schema

```sql
-- User role enum
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Added to users table
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'user';
```

### Row Level Security (RLS)

All moderation-related tables now use role-based RLS policies:

```sql
-- Moderation queue: only moderators and admins
CREATE POLICY "Moderation queue viewable by moderators and admins" ON moderation_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_user_id = auth.uid()::text 
            AND users.role IN ('moderator', 'admin')
        )
    );

-- Content reports: users see their own, moderators see all
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_user_id = auth.uid()::text 
            AND (users.id = content_reports.reporter_id OR users.role IN ('moderator', 'admin'))
        )
    );
```

### API Endpoints

#### User Service: `/api/roles/*`

**GET `/api/roles/me`** - Get current user's role
```bash
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:7003/api/roles/me
```

Response:
```json
{
  "userId": "clerk_user_123",
  "role": "user"
}
```

**GET `/api/roles/check?required=moderator`** - Check if user has required role
```bash
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  "http://localhost:7003/api/roles/check?required=moderator"
```

Response:
```json
{
  "userId": "clerk_user_123",
  "role": "user",
  "hasAccess": false,
  "requiredRole": "moderator"
}
```

**PUT `/api/roles/:userId`** - Update user role (admin only)
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_ADMIN_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "moderator"}' \
  http://localhost:7003/api/roles/clerk_user_123
```

Response:
```json
{
  "success": true,
  "userId": "clerk_user_123",
  "newRole": "moderator"
}
```

### Frontend Integration

#### Client Components

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { UserAPI } from '@/lib/api-client';

function MyComponent() {
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const token = await getToken();
      if (token) {
        const roleData = await UserAPI.getMyRole(token);
        setUserRole(roleData.role);
      }
    };
    checkRole();
  }, [getToken]);

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || userRole === 'admin';

  // Render based on role...
}
```

#### Server Components

```typescript
import { auth } from '@clerk/nextjs/server';

async function checkModeratorAccess(userId: string): Promise<boolean> {
  const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:7003';
  const response = await fetch(`${USER_API_URL}/api/roles/check?required=moderator`, {
    headers: { 'Authorization': `Bearer ${userId}` }
  });
  
  if (!response.ok) return false;
  const data = await response.json();
  return data.hasAccess === true;
}

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) redirect('/sign-in');
  
  const hasAccess = await checkModeratorAccess(userId);
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  return <ProtectedContent />;
}
```

## Promoting Users

### Via SQL (Direct Database Access)

```sql
-- Promote user to moderator
UPDATE users 
SET role = 'moderator', updated_at = NOW() 
WHERE clerk_user_id = 'YOUR_CLERK_USER_ID';

-- Promote user to admin
UPDATE users 
SET role = 'admin', updated_at = NOW() 
WHERE clerk_user_id = 'YOUR_CLERK_USER_ID';

-- Demote user back to regular user
UPDATE users 
SET role = 'user', updated_at = NOW() 
WHERE clerk_user_id = 'YOUR_CLERK_USER_ID';
```

### Via API (Admin Only)

```typescript
import { UserAPI } from '@/lib/api-client';

async function promoteUser(clerkUserId: string, newRole: 'user' | 'moderator' | 'admin') {
  const token = await getToken(); // Admin's token
  
  try {
    const result = await UserAPI.updateRole(clerkUserId, newRole, token);
    console.log('User role updated:', result);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      console.error('Only admins can update roles');
    }
  }
}
```

### Via Supabase Dashboard

1. Go to your Supabase project
2. Navigate to Table Editor → `users`
3. Find the user by `clerk_user_id`
4. Edit the `role` field
5. Change to `moderator` or `admin`
6. Save changes

## Migration Guide

### Applying the Migration

```bash
# From project root
cd g:\code\@wizeworks\stumbleable

# Option 1: Using the migration script
node scripts/apply-roles-migration.js

# Option 2: Using Supabase CLI (if installed)
supabase migration up

# Option 3: Manually via Supabase Dashboard
# Copy contents of database/migrations/008_add_user_roles.sql
# Paste into SQL Editor and execute
```

### Testing After Migration

1. **Restart all services:**
```bash
npm run dev
```

2. **Check your role:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:7003/api/roles/me
```

3. **Try accessing moderation panel:**
- Visit: http://localhost:3000/admin/moderation
- Should see "Access Denied" if you're a regular user
- Promote yourself to moderator to access

4. **Promote yourself to moderator (for testing):**
```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'moderator' 
WHERE clerk_user_id = 'YOUR_CLERK_USER_ID';
```

## Security Considerations

### Defense in Depth

We implement multiple layers of security:

1. **Database RLS** - PostgreSQL policies prevent unauthorized data access
2. **API Middleware** - Services validate roles before processing requests
3. **Server Components** - Next.js pages check roles before rendering
4. **Client Components** - UI components verify roles for UX (not security)

### Best Practices

✅ **DO:**
- Always check roles on the server side
- Use RLS policies for database-level security
- Validate roles in API endpoints
- Log role changes for audit trails
- Use the role hierarchy (admin > moderator > user)

❌ **DON'T:**
- Rely solely on client-side role checks
- Hardcode admin emails or usernames
- Grant admin access by default
- Skip server-side validation
- Expose role management endpoints publicly

## Troubleshooting

### "Access Denied" on Moderation Panel

**Problem:** User should have access but sees "Access Denied"

**Solutions:**
1. Check user's role in database:
```sql
SELECT clerk_user_id, role FROM users WHERE clerk_user_id = 'YOUR_ID';
```

2. Verify API endpoint is reachable:
```bash
curl http://localhost:7003/api/roles/check?required=moderator
```

3. Check Clerk token is valid and being sent correctly

4. Restart services after migration:
```bash
npm run dev
```

### Role Not Updating

**Problem:** Changed role in database but UI still shows old role

**Solutions:**
1. Clear browser cache and cookies
2. Sign out and sign back in
3. Check API response:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:7003/api/roles/me
```

### Migration Fails

**Problem:** Error applying migration

**Solutions:**
1. Check Supabase connection:
```bash
npm run health
```

2. Verify environment variables are set:
```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY
```

3. Try applying manually via Supabase Dashboard SQL Editor

4. Check for existing `role` column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

## Future Enhancements

- [ ] Role-based rate limiting (admins get higher limits)
- [ ] Audit log for role changes
- [ ] Custom permissions per role (finer-grained control)
- [ ] Role expiration dates (temporary moderators)
- [ ] Role-based feature flags
- [ ] Admin dashboard for user management

## Related Files

- **Migration:** `database/migrations/008_add_user_roles.sql`
- **User Service Types:** `apis/user-service/src/types.ts`
- **User Repository:** `apis/user-service/src/lib/repository.ts`
- **Role Routes:** `apis/user-service/src/routes/roles.ts`
- **API Client:** `ui/portal/lib/api-client.ts`
- **Moderation Panel:** `ui/portal/components/moderation-panel.tsx`
- **Moderation Page:** `ui/portal/app/admin/moderation/page.tsx`

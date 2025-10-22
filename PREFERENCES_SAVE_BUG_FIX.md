# Preferences Save Bug Fix - Dashboard

## Problem Summary

When a logged-in user tried to update their preferences (topics and wildness) on the `/dashboard/preferences` page, the changes were not being saved. The frontend would show a success message, but refreshing the page showed the old values.

## Root Cause

The bug was in the **User Service repository** (`apis/user-service/src/lib/repository.ts`). 

The issue had two parts:

1. **Type mismatch in the `User` interface**: The `User` type definition says the `id` field should be the **Clerk user ID**:
   ```typescript
   export interface User {
       id: string; // Clerk user ID
       email?: string;
       preferredTopics: string[];
       wildness: number;
       // ...
   }
   ```

2. **Repository returning wrong ID**: However, the repository methods were returning the **internal database UUID** instead:
   ```typescript
   // ❌ WRONG - was returning internal UUID
   return {
       id: user.id,  // This is the internal database UUID
       email: user.email,
       preferredTopics: preferences?.preferred_topics || ['technology', 'culture', 'science'],
       wildness: preferences?.wildness || 50,
       // ...
   };
   ```

## How This Broke the Flow

### Expected Flow (What Should Happen)
1. Frontend calls: `UserAPI.getUser(clerkUserId)`
2. Backend returns: `{ user: { id: clerkUserId, ... } }`
3. Frontend calls: `UserAPI.updatePreferences(clerkUserId, {...})`
4. Backend calls: `repository.updateUserPreferences(clerkUserId, ...)`
5. Repository looks up user by: `clerk_user_id` ✅

### Actual Flow (What Was Breaking)
1. Frontend calls: `UserAPI.getUser(clerkUserId)`
2. Backend returns: `{ user: { id: <internal-uuid>, ... } }`
3. Frontend calls: `UserAPI.updatePreferences(<internal-uuid>, {...})`
4. Backend calls: `repository.updateUserPreferences(<internal-uuid>, ...)`
5. Repository tries to look up user by: `clerk_user_id = <internal-uuid>` ❌ **FAILS!**
6. User not found → preferences not updated

## Solution

Changed the repository methods to return the **Clerk user ID** instead of the internal database UUID:

### File: `apis/user-service/src/lib/repository.ts`

#### Change 1: `getUserById()` method (lines ~33-46)
```typescript
// ✅ FIXED - now returns Clerk user ID
return {
    id: user.clerk_user_id,  // Return Clerk user ID, not internal UUID
    email: user.email,
    preferredTopics: preferences?.preferred_topics || ['technology', 'culture', 'science'],
    wildness: preferences?.wildness || 50,
    role: user.role || 'user',
    guidelinesAcceptedAt: user.guidelines_accepted_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
};
```

#### Change 2: `createUser()` method (lines ~83-90)
```typescript
// ✅ FIXED - now returns Clerk user ID
return {
    id: clerkUserId,  // Return Clerk user ID, not internal UUID
    email: userData?.email,
    preferredTopics: userData?.preferredTopics || ['technology', 'culture', 'science'],
    wildness: userData?.wildness ?? 35,
    role: 'user',
    createdAt: newUser.created_at,
    updatedAt: newUser.updated_at,
};
```

## Affected Methods

The following methods now correctly return Clerk user IDs:
- `getUserById()` - Direct fix
- `createUser()` - Direct fix  
- `acceptGuidelines()` - Indirect fix (calls `getUserById()`)
- `cancelDeletionRequest()` - Indirect fix (calls `getUserById()`)

## Verification Checklist

After deploying this fix:

- [ ] Restart the `user-service`
- [ ] Navigate to `/dashboard/preferences` 
- [ ] Select a topic and/or change the wildness slider
- [ ] Click "Save Preferences"
- [ ] Should see "Preferences updated successfully!" message
- [ ] Refresh the page - changes should persist ✅
- [ ] Check browser network tab - PUT request to `/api/users/:id/preferences` should return 200 ✅
- [ ] Check backend logs - should show successful update with correct user ID

## Related Code

### Frontend: `ui/portal/app/dashboard/preferences/page.tsx`
- Uses `user.id` from Clerk hook ✅ (correct Clerk ID)
- Calls `UserAPI.getUser(user.id, token)` to fetch preferences ✅
- Calls `UserAPI.updatePreferences(user.id, {...}, token)` to save ✅

### Backend API Client: `ui/portal/lib/api-client.ts`
- `UserAPI.getUser()` - makes GET to `/api/users/:userId` ✅
- `UserAPI.updatePreferences()` - makes PUT to `/api/users/:userId/preferences` ✅

### Backend Route: `apis/user-service/src/routes/users.ts`
- PUT `/api/users/:userId/preferences` handler ✅ (expects Clerk user ID in path)

### Backend Repository: `apis/user-service/src/lib/repository.ts`
- `updateUserPreferences(clerkUserId, ...)` - now gets correct Clerk ID ✅

## Testing Recommendations

1. **Happy Path**: Update preferences → Save → Refresh → Verify persisted
2. **Edge Cases**:
   - Update only topics (keep wildness same)
   - Update only wildness (keep topics same)
   - Update both simultaneously
   - Test with multiple topics selected
   - Test wildness values at boundaries (0, 50, 100)

## Notes

- This bug only affected the preferences update endpoint
- Other user operations (get user, create user, accept guidelines) were also affected by returning wrong IDs, even though they might have worked in some scenarios
- The fix ensures consistency across all user-related operations

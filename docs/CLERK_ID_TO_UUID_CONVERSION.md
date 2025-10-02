# Clerk ID to Database UUID Conversion Fix

## Issue
The lists routes in the user-service API were receiving Clerk user IDs (format: `user_xxxxx`) from the frontend but were trying to use them directly as database UUIDs, causing PostgreSQL errors:

```
ERROR: invalid input syntax for type uuid: "user_33PGhUbW2lsixmS9EZC5VkKvAs6"
code: "22P02"
```

## Root Cause
- **Frontend**: Passes Clerk user ID (`user_xxxxx`) from authentication context
- **Database**: Stores users with internal UUID primary key (`id`)
- **Lists Routes**: Expected database UUID but received Clerk ID
- **Result**: Type mismatch causing database query failures

## Solution
Added automatic conversion from Clerk user ID to database UUID in all lists routes.

### Implementation Date
October 1, 2025

## Changes Made

### 1. Helper Function
Added `getDatabaseUserId()` helper function to convert Clerk IDs to database UUIDs:

```typescript
/**
 * Helper function to get database user ID from Clerk user ID
 * Returns null if user not found
 */
async function getDatabaseUserId(clerkUserId: string): Promise<string | null> {
    const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();

    if (error || !user) return null;
    return user.id;
}
```

### 2. Updated Routes
Modified all list routes to accept both Clerk IDs and database UUIDs:

#### Routes Modified:
- ✅ `GET /lists?userId=xxx` - Get user's lists
- ✅ `POST /lists` - Create new list
- ✅ `POST /lists/:id/collaborators` - Add collaborator
- ✅ `DELETE /lists/:id/collaborators/:userId` - Remove collaborator
- ✅ `POST /lists/:id/follow` - Follow a list
- ✅ `DELETE /lists/:id/follow?userId=xxx` - Unfollow a list
- ✅ `GET /lists/followed?userId=xxx` - Get followed lists

#### Conversion Pattern:
```typescript
// Convert Clerk user ID to database UUID if needed
let dbUserId = userId;

// Check if it's a Clerk ID (starts with "user_")
if (userId.startsWith('user_')) {
    const convertedId = await getDatabaseUserId(userId);
    if (!convertedId) {
        return reply.code(404).send({ error: 'User not found' });
    }
    dbUserId = convertedId;
}

// Use dbUserId in database queries
```

### 3. Schema Updates
Relaxed validation schemas to accept both ID formats:

```typescript
// Before: Strict UUID validation
userId: z.string().uuid()

// After: Accept any string (Clerk ID or UUID)
userId: z.string().min(1)  // Can be Clerk ID (user_xxx) or database UUID
```

#### Schemas Updated:
- `CreateListSchema` - userId field
- `AddCollaboratorSchema` - userId field

## Benefits

### 1. **Backward Compatible**
- Accepts both Clerk IDs (new) and database UUIDs (if used internally)
- No breaking changes to existing functionality

### 2. **Frontend Simplicity**
- Frontend can pass Clerk user ID directly from auth context
- No need for additional API calls to convert IDs

### 3. **Consistent Pattern**
- All lists routes now follow the same ID conversion pattern
- Matches the pattern used in other services

### 4. **Better Error Handling**
- Returns 404 with clear message if user not found
- Prevents cryptic database errors

## Architecture Context

### Database Schema
```
users table:
  - id (UUID, primary key) ← Database internal ID
  - clerk_user_id (TEXT) ← Clerk authentication ID
  
user_lists table:
  - user_id (UUID) ← References users.id
  
list_collaborators table:
  - user_id (UUID) ← References users.id
  
list_followers table:
  - user_id (UUID) ← References users.id
```

### ID Flow
```
1. User signs in via Clerk
   → Gets Clerk ID: user_33PGhUbW2lsixmS9EZC5VkKvAs6

2. Frontend makes API call with Clerk ID
   → GET /api/lists?userId=user_33PGhUbW2lsixmS9EZC5VkKvAs6

3. API converts Clerk ID to database UUID
   → Query: SELECT id FROM users WHERE clerk_user_id = 'user_33PGh...'
   → Result: a1b2c3d4-e5f6-7890-abcd-ef1234567890

4. API uses database UUID for queries
   → SELECT * FROM user_lists WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

## Testing Recommendations

### Test Cases
1. ✅ GET /lists with Clerk ID
2. ✅ GET /lists with database UUID (backward compatibility)
3. ✅ POST /lists with Clerk ID
4. ✅ Follow/unfollow with Clerk ID
5. ✅ Add/remove collaborator with Clerk ID
6. ✅ Error handling for non-existent user

### Manual Testing
```bash
# Test with Clerk ID
curl "http://localhost:7003/api/lists?userId=user_33PGhUbW2lsixmS9EZC5VkKvAs6"

# Should return lists without UUID error

# Test create list with Clerk ID
curl -X POST "http://localhost:7003/api/lists" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_33PGhUbW2lsixmS9EZC5VkKvAs6",
    "title": "My Test List",
    "isPublic": false
  }'
```

## Related Files
- `apis/user-service/src/routes/lists.ts` - Lists routes with ID conversion
- `apis/user-service/src/lib/repository.ts` - UserRepository with getUserById()
- `apis/user-service/src/routes/users.ts` - User routes pattern reference

## Future Considerations

### Potential Optimizations
1. **Caching**: Cache Clerk ID → UUID mappings to reduce database queries
2. **Middleware**: Create reusable middleware for ID conversion across all routes
3. **Type Safety**: Create union type for ClerkId | DatabaseUuid

### Example Middleware (Future Enhancement)
```typescript
async function convertClerkIdMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.query.userId || request.body.userId;
    if (userId?.startsWith('user_')) {
        const dbUserId = await getDatabaseUserId(userId);
        if (!dbUserId) {
            return reply.code(404).send({ error: 'User not found' });
        }
        // Attach to request for downstream use
        request.dbUserId = dbUserId;
    }
}
```

## Success Metrics
- ✅ No more UUID format errors in logs
- ✅ Lists API calls succeed with Clerk IDs
- ✅ User experience improved (no authentication errors)
- ✅ Consistent behavior across all list endpoints

---

**Status**: ✅ Implemented and tested
**Version**: 1.0
**Author**: Copilot with user guidance
**Related Issues**: Fixed PostgreSQL UUID type error for Clerk user IDs

# Supabase Foreign Key Ambiguity Fix

## Issue
When fetching a list by ID, Supabase PostgREST was returning an error due to ambiguous foreign key relationships:

```
ERROR: Could not embed because more than one relationship was found for 'list_collaborators' and 'users'
code: "PGRST201"
```

## Root Cause

The `list_collaborators` table has **two foreign key relationships** to the `users` table:

1. **`list_collaborators_user_id_fkey`**: Links `list_collaborators.user_id` → `users.id`
   - This is the **collaborator themselves**
   
2. **`list_collaborators_invited_by_fkey`**: Links `list_collaborators.invited_by` → `users.id`
   - This is the **person who invited** the collaborator

When using the generic `users(id, clerk_user_id)` in the query, Supabase doesn't know which relationship to follow.

## Solution

Explicitly specify which foreign key relationship to use by adding the constraint name:

### Before (Ambiguous):
```typescript
list_collaborators(
    *,
    users(id, clerk_user_id)  // ❌ Ambiguous - which FK?
)
```

### After (Explicit):
```typescript
list_collaborators(
    *,
    users!list_collaborators_user_id_fkey(id, clerk_user_id)  // ✅ Clear
)
```

## Implementation

### File Changed
`apis/user-service/src/routes/lists.ts`

### Route Fixed
`GET /lists/:id` - Get single list by ID

### Query Update
```typescript
const { data, error } = await supabase
    .from('user_lists')
    .select(`
        *,
        list_items(
            *,
            content(*)
        ),
        list_collaborators(
            *,
            users!list_collaborators_user_id_fkey(id, clerk_user_id)
        ),
        list_followers(count)
    `)
    .eq('id', id)
    .single();
```

## Supabase Foreign Key Hint Syntax

When you have multiple foreign keys between two tables, use this syntax:

```typescript
parent_table!foreign_key_constraint_name(columns)
```

### Examples:
```typescript
// Use the user_id foreign key
users!list_collaborators_user_id_fkey(id, clerk_user_id)

// Use the invited_by foreign key (if needed later)
users!list_collaborators_invited_by_fkey(id, clerk_user_id)
```

## Database Schema Context

```sql
CREATE TABLE list_collaborators (
    id UUID PRIMARY KEY,
    list_id UUID REFERENCES user_lists(id),
    user_id UUID REFERENCES users(id),           -- FK 1: The collaborator
    invited_by UUID REFERENCES users(id),        -- FK 2: Who invited them
    can_add_items BOOLEAN DEFAULT true,
    can_remove_items BOOLEAN DEFAULT false,
    can_edit_list BOOLEAN DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT now()
);
```

Two foreign keys to `users`:
- `list_collaborators_user_id_fkey`: The collaborator's user ID
- `list_collaborators_invited_by_fkey`: The inviter's user ID

## Benefits

✅ **No more ambiguity errors** - Supabase knows exactly which relationship to use
✅ **Correct data** - Returns the collaborator's user info, not the inviter's
✅ **Clear intent** - Code explicitly shows which relationship is being used
✅ **Maintainable** - Future developers understand the relationship being queried

## Related Error Messages

If you see these errors in your logs:

```
PGRST201: Could not embed because more than one relationship was found
PGRST202: Could not find foreign keys between these entities
```

**Solution**: Use the explicit foreign key constraint name syntax:
```typescript
table!constraint_name(columns)
```

## Finding Constraint Names

You can find constraint names in several ways:

1. **From Supabase error hints** (as shown in the error)
2. **From database schema**:
   ```sql
   SELECT constraint_name, table_name 
   FROM information_schema.table_constraints 
   WHERE table_name = 'list_collaborators';
   ```
3. **From Supabase dashboard** → Table → Foreign Keys section

## Testing

After this fix, the list detail page should load successfully without 500 errors:

```bash
# Should return 200 with list data
GET /api/lists/1c7c4425-84d0-4375-bb9a-40622fb1b530

# Response includes collaborators with correct user info
{
  "list": {
    "id": "...",
    "title": "My List",
    "list_collaborators": [
      {
        "id": "...",
        "user_id": "...",
        "users": {
          "id": "...",
          "clerk_user_id": "user_..."
        }
      }
    ]
  }
}
```

---

**Status**: ✅ Fixed
**Date**: October 1, 2025
**Impact**: List detail pages now load correctly

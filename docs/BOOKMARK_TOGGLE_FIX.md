# Bookmark Toggle Fix

## Issue
When users clicked the bookmark/save button on already-saved content, the system attempted to insert a duplicate record, causing a database constraint violation:

```
duplicate key value violates unique constraint "user_interactions_user_id_content_id_type_key"
```

## Root Cause
The save button was always sending a `save` action, regardless of whether the content was already saved. The database has a unique constraint on `(user_id, content_id, type)` to prevent duplicate interactions of the same type.

## Solution
Implemented proper toggle behavior for the bookmark/save button:

### Frontend Changes (`ui/portal/app/stumble/page.tsx`)

1. **Check saved state before sending action**:
   ```typescript
   let actualAction = action;
   if (action === 'save' && isSaved) {
       actualAction = 'unsave';
   }
   ```

2. **Update saved state after save/unsave**:
   ```typescript
   if (action === 'save' || actualAction === 'unsave') {
       const newSavedState = InteractionAPI.isSaved(currentDiscovery.id);
       setIsSaved(newSavedState);
   }
   ```

3. **Show appropriate toast message**:
   ```typescript
   save: actualAction === 'unsave' ? 'Removed from saved' : 'Saved!',
   unsave: 'Removed from saved',
   ```

### Backend Changes (`apis/interaction-service/src/store.ts`)

1. **Detect duplicate save attempts**:
   ```typescript
   if (dbType === 'save' && userId) {
       const { data: existingSave } = await supabase
           .from('user_interactions')
           .select('id')
           .match({
               user_id: userId,
               content_id: discoveryId,
               type: 'save'
           })
           .single();

       if (existingSave) {
           // Treat as unsave
       }
   }
   ```

2. **Auto-convert duplicate save to unsave**:
   If a save interaction already exists, automatically delete from `saved_content` and return an unsave response.

### Type Changes (`ui/portal/data/types.ts`)

Added `'unsave'` to the `Interaction` action type:
```typescript
action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'share' | 'view';
```

## Behavior

### Before Fix
1. User clicks bookmark on unsaved content → ✅ Content saved
2. User clicks bookmark on saved content → ❌ Error: duplicate key constraint violation

### After Fix
1. User clicks bookmark on unsaved content → ✅ Content saved, button shows filled/active state
2. User clicks bookmark on saved content → ✅ Content unsaved, button returns to outline state
3. User clicks bookmark again → ✅ Content saved again (toggle works both ways)

## User Experience

The bookmark button now works as expected:
- **First click**: Saves content (button fills with color)
- **Second click**: Unsaves content (button returns to outline)
- **Third click**: Saves again (toggle)
- Toast messages reflect the action: "Saved!" or "Removed from saved"

## Technical Details

### Database Constraints
The `user_interactions` table has a unique constraint:
```sql
CONSTRAINT user_interactions_user_id_content_id_type_key 
UNIQUE (user_id, content_id, type)
```

This prevents the same user from having multiple interactions of the same type on the same content.

### Toggle Logic
- Frontend tracks saved state in component state (`isSaved`)
- When user clicks save button, check current state first
- Send appropriate action (`save` or `unsave`)
- Backend gracefully handles both new saves and duplicate attempts
- Saved state updated after successful API call

### Error Prevention
- Frontend prevents duplicate saves by checking state first
- Backend provides additional safety by detecting duplicates
- Both layers ensure consistent behavior

## Testing

Test the toggle behavior:

1. **Save new content**:
   - Click bookmark on unsaved content
   - Should see "Saved!" toast
   - Button should fill with color
   - Content should appear in Saved page

2. **Unsave saved content**:
   - Click bookmark on saved content  
   - Should see "Removed from saved" toast
   - Button should return to outline style
   - Content should disappear from Saved page

3. **Re-save content**:
   - Click bookmark again
   - Should see "Saved!" toast
   - Button should fill with color again
   - Content should reappear in Saved page

4. **Check database**:
   ```sql
   SELECT * FROM saved_content WHERE user_id = '<user-id>' AND content_id = '<content-id>';
   -- Should toggle between existing and not existing
   ```

## Related Files

- `ui/portal/app/stumble/page.tsx` - Frontend toggle logic
- `apis/interaction-service/src/store.ts` - Backend duplicate handling
- `ui/portal/data/types.ts` - Type definitions with 'unsave'
- `ui/portal/components/reaction-bar.tsx` - Bookmark button UI

## Future Improvements

Potential enhancements:
- [ ] Add optimistic UI updates (update button state immediately)
- [ ] Add loading state on bookmark button during API call
- [ ] Batch save/unsave operations for better performance
- [ ] Add undo functionality with toast action button
- [ ] Track toggle frequency for analytics

---

**Fixed**: October 4, 2025  
**Issue**: Duplicate key constraint violation on bookmark  
**Solution**: Proper toggle behavior with unsave action

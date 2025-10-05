# Like and Skip Toggle Implementation

## Overview
Implemented toggle functionality for likes and skips, similar to the existing bookmark/save toggle. Users can now click like or skip buttons multiple times to toggle their reactions on and off.

## Problem Statement
Previously, clicking "like" or "skip" on already-liked or already-skipped content resulted in a unique constraint violation error:
```
duplicate key value violates unique constraint "user_interactions_user_id_content_id_type_key"
```

## Solution
Added toggle logic to check for existing interactions before creating new ones. If an interaction exists, it is removed instead of creating a duplicate.

## Changes Made

### Backend (Interaction Service)

#### 1. **store.ts** - Added Toggle Logic
- Added duplicate check for 'like' interactions
  - If user has already liked content, delete the like record (unlike)
  - Return synthetic response with action: 'unlike'
- Added duplicate check for 'skip' interactions
  - If user has already skipped content, delete the skip record (unskip)
  - Return synthetic response with action: 'unskip'
- Follows same pattern as existing 'save'/'unsave' toggle

#### 2. **types.ts** - Extended Action Types
```typescript
action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'unskip' | 'unlike' | 'share' | 'view'
```
Added 'unlike' and 'unskip' to the Interaction action type union.

#### 3. **feedback.ts** - Updated Validation Schema
```typescript
action: z.enum(['up', 'down', 'save', 'unsave', 'skip', 'unskip', 'unlike', 'share', 'view'])
```
Added 'unlike' and 'unskip' to the Zod validation schema.

### Frontend (Portal)

#### 1. **types.ts** - Extended Action Types
Updated frontend Interaction type to match backend:
```typescript
action: 'up' | 'down' | 'save' | 'unsave' | 'skip' | 'unskip' | 'unlike' | 'share' | 'view'
```

#### 2. **stumble/page.tsx** - State Management
- Added `isLiked` and `isSkipped` state variables
- Added `likedIdsRef` and `skippedIdsRef` Set refs for tracking
- Updated `handleReaction` to toggle actions:
  ```typescript
  if (action === 'up' && isLiked) {
      actualAction = 'unlike';
  } else if ((action === 'down' || action === 'skip') && isSkipped) {
      actualAction = 'unskip';
  }
  ```
- Updated state management to:
  - Toggle liked/skipped states
  - Maintain mutual exclusivity (liking removes skip, skipping removes like)
  - Update refs for persistence across discoveries
- Updated toast messages to show "Like removed" and "Skip removed"
- Fixed auto-advance to only trigger on initial skip, not unskip

#### 3. **reaction-bar.tsx** - Visual Feedback
- Added `isLiked` and `isSkipped` props
- Updated Like button styling:
  ```typescript
  className={cn(
      "btn btn-circle btn-sm sm:btn-md hover:scale-110 active:scale-95 transition-transform touch-manipulation",
      isLiked ? 'btn-success' : 'btn-success btn-outline'
  )}
  ```
- Updated Skip button styling similarly
- Buttons now show filled/active state when liked or skipped

## User Experience Flow

### Like Toggle
1. User clicks Like button (thumbs up)
   - If not liked: Records like, button becomes filled green
   - If already liked: Removes like, button becomes outline green
   - If skipped: Removes skip, adds like

### Skip Toggle
1. User clicks Skip button (thumbs down)
   - If not skipped: Records skip, button becomes filled red, auto-advances to next discovery
   - If already skipped: Removes skip, button becomes outline red, stays on current discovery
   - If liked: Removes like, adds skip

### Save Toggle (Existing)
1. User clicks Save button (bookmark)
   - If not saved: Records save, button becomes filled yellow
   - If already saved: Removes save, button becomes outline yellow

## Mutual Exclusivity
- Liking content automatically removes any skip
- Skipping content automatically removes any like
- This prevents conflicting states and makes user intent clearer

## Technical Details

### Database Operations
- **Insert**: Creates new interaction record when none exists
- **Delete**: Removes interaction record when toggling off
- **No Update**: Uses delete + insert pattern instead of updates

### State Persistence
- Liked/skipped states persist within the browsing session
- States are tracked in refs that survive re-renders
- States reset when user navigates away from stumble page

### Error Handling
- Graceful fallback if interaction recording fails
- User sees toast notification on errors
- State rolls back if API call fails

## Testing Checklist
- [ ] Like button toggles on/off correctly
- [ ] Skip button toggles on/off correctly
- [ ] Save button continues to work (existing functionality)
- [ ] Like removes skip and vice versa
- [ ] Visual state (filled vs outline) updates correctly
- [ ] Toast messages show appropriate text
- [ ] Auto-advance works on skip but not unskip
- [ ] No duplicate key errors in console/logs
- [ ] State persists when navigating between discoveries
- [ ] Deep linking preserves state correctly

## Benefits
1. **Better UX**: Users can change their minds without error
2. **Clearer Intent**: Mutual exclusivity prevents ambiguous states
3. **Consistency**: All reactions (like, skip, save) now have toggle behavior
4. **Error Prevention**: Eliminates unique constraint violations
5. **Visual Feedback**: Users can see their current interaction state

## Future Enhancements
- Could add analytics to track how often users toggle reactions
- Could implement "neutral" state if user removes both like and skip
- Could sync toggle state across devices via database queries

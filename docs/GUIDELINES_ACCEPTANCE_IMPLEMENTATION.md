# Community Guidelines Acceptance Implementation

## Overview
Added a mandatory community guidelines acceptance step to the user onboarding flow, ensuring all users explicitly agree to follow community standards before accessing protected features.

## Implementation Date
October 2, 2025

## Changes Made

### 1. Database Schema (✅ Complete)
**File:** `database/migrations/add_guidelines_accepted_column.sql`
- Added `guidelines_accepted_at` timestamp column to `users` table
- Added column comment for documentation
- Created index for efficient querying of users who haven't accepted guidelines
- Migration applied successfully to Supabase

### 2. Backend API - User Service (✅ Complete)
**Files Modified:**
- `apis/user-service/src/types.ts`
- `apis/user-service/src/routes/users.ts`
- `apis/user-service/src/lib/repository.ts`

**Changes:**
- Added `guidelinesAcceptedAt?: string` to User interface
- Created new `PUT /api/users/:userId/accept-guidelines` endpoint with Clerk authentication
- Implemented `acceptGuidelines()` method in UserRepository
  - Sets `guidelines_accepted_at` timestamp when called
  - Updates `updated_at` timestamp
  - Returns updated user object
- Updated `getUserById()` to include `guidelinesAcceptedAt` in response

### 3. Frontend API Client (✅ Complete)
**File:** `ui/portal/lib/api-client.ts`

**Changes:**
- Added `acceptGuidelines(userId, token)` method to UserAPI class
- Updated all UserAPI method return types to include `guidelinesAcceptedAt?: string`
  - `getUser()`
  - `createUser()`
  - `initializeUser()`
  - `updatePreferences()`

### 4. Frontend Types (✅ Complete)
**File:** `ui/portal/data/types.ts`

**Changes:**
- Added `guidelinesAcceptedAt?: string` to User type definition

### 5. Onboarding Flow (✅ Complete)
**File:** `ui/portal/app/onboarding/page.tsx`

**New Step 2 - Community Guidelines:**
- Added between "Choose Your Interests" (Step 1) and "Set Your Exploration Level" (Step 3)
- Progress bar updated from 2 steps to 3 steps
- Added state: `guidelinesAccepted` boolean for checkbox

**Content Includes:**
- Condensed guidelines summary with two sections:
  - ✅ **What We Encourage:**
    - Quality, interesting content
    - Thoughtful curation and lists
    - Respectful interactions
    - Diverse perspectives
  - ❌ **What We Don't Allow:**
    - Hate speech or harassment
    - Violence or harmful content
    - Spam or manipulation
    - Illegal content
    - Adult or explicit content
    - Deliberate misinformation
- Link to full `/guidelines` page (opens in new tab)
- Checkbox for acceptance with explicit agreement text
- Back button to Step 1, Next button to Step 3 (disabled until checked)

**Form Submission:**
- Updated `handleComplete()` to call `UserAPI.acceptGuidelines()` when `guidelinesAccepted` is true
- Acceptance happens before saving preferences
- Guidelines timestamp recorded in database on completion

### 6. Access Control (✅ Complete)
**File:** `ui/portal/lib/use-onboarding.ts`

**Changes:**
- Extended `useOnboardingCheck()` hook to check both:
  - User has preferences (`hasPreferences`)
  - User has accepted guidelines (`hasAcceptedGuidelines`)
- User needs onboarding if EITHER condition is false
- Automatically redirects to `/onboarding` on protected pages

**Protected Pages Using This Check:**
- `/stumble` - Main discovery interface
- `/saved` - Saved content
- `/lists` - User lists
- `/submit` - Content submission
- `/dashboard` - User dashboard
- `/admin` - Admin panel
- `/analytics` - Analytics dashboard

## User Flow

### New User Flow:
1. User signs up with Clerk → Email verification
2. User redirected to `/onboarding`
3. **Step 1:** Select interests (topics)
4. **Step 2:** Accept Community Guidelines ✨ **NEW**
   - Must check acceptance box to proceed
   - Can view full guidelines in new tab
5. **Step 3:** Set wildness/exploration level
6. Click "Start Discovering!"
   - Guidelines acceptance recorded with timestamp
   - Preferences saved
   - Redirect to `/stumble`

### Existing User Protection:
- Users without `guidelines_accepted_at` timestamp are redirected to onboarding
- Must complete Step 2 before accessing protected features
- No way to bypass acceptance requirement

## API Endpoints

### Accept Guidelines
```
PUT /api/users/:userId/accept-guidelines
Authorization: Bearer <clerk-jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "preferredTopics": ["technology", "science"],
    "wildness": 35,
    "guidelinesAcceptedAt": "2025-10-02T12:34:56.789Z",
    "role": "user",
    "createdAt": "2025-10-01T10:00:00.000Z",
    "updatedAt": "2025-10-02T12:34:56.789Z"
  }
}
```

## Database Schema

```sql
ALTER TABLE users 
ADD COLUMN guidelines_accepted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.guidelines_accepted_at IS 
'Timestamp when user accepted the community guidelines during onboarding';

CREATE INDEX idx_users_guidelines_not_accepted 
ON users(guidelines_accepted_at) 
WHERE guidelines_accepted_at IS NULL;
```

## Testing Checklist

- [ ] New user signup flow includes guidelines step
- [ ] Cannot proceed without checking acceptance box
- [ ] Link to full guidelines page works
- [ ] Guidelines timestamp saved to database
- [ ] Existing users without acceptance are redirected to onboarding
- [ ] Protected pages check guidelines acceptance
- [ ] Skip button on other steps doesn't bypass guidelines
- [ ] Back/Next navigation works correctly between all 3 steps
- [ ] Progress bar shows "Step X of 3" correctly
- [ ] API endpoint requires authentication
- [ ] Database query performance acceptable with new index

## Benefits

1. **Legal Protection:** Explicit user agreement to community standards
2. **Clear Expectations:** Users know rules before interacting
3. **Reduced Moderation:** Fewer violations from uninformed users
4. **Audit Trail:** Timestamp proves user agreement
5. **Future-Proof:** Can track which version of guidelines accepted
6. **Mandatory:** No way to access platform without acceptance

## Future Enhancements

1. **Version Tracking:** Store which version of guidelines was accepted
2. **Re-acceptance:** Require re-acceptance when guidelines change significantly
3. **Guidelines History:** Show user when they accepted and which version
4. **Multi-language:** Translate guidelines for international users
5. **Analytics:** Track acceptance rates and drop-off at this step

## Related Files

### Backend
- `database/migrations/add_guidelines_accepted_column.sql`
- `apis/user-service/src/types.ts`
- `apis/user-service/src/routes/users.ts`
- `apis/user-service/src/lib/repository.ts`

### Frontend
- `ui/portal/app/onboarding/page.tsx`
- `ui/portal/app/guidelines/page.tsx`
- `ui/portal/lib/api-client.ts`
- `ui/portal/lib/use-onboarding.ts`
- `ui/portal/data/types.ts`

## Notes

- Guidelines acceptance is part of onboarding, not a separate page
- Checkbox must be checked; no default checked state
- Guidelines page exists at `/guidelines` for full reference
- Acceptance is permanent (no un-accepting)
- Admin users still must accept guidelines
- Moderators still must accept guidelines
- Timestamp stored in UTC (ISO 8601 format)

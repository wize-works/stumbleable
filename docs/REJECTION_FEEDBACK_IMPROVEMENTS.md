# Content Submission Rejection Feedback Improvements

## Summary
Improved the content submission system to provide clear, actionable feedback when user-submitted content is rejected by the moderation system.

## Changes Made

### 1. Backend API Improvements (`apis/discovery-service/src/lib/moderation.ts`)

#### Added User-Friendly Rejection Messages
- Created `generateRejectionMessage()` method that converts technical moderation flags into human-readable messages
- Maps each issue type to a clear explanation:
  - `nsfw-keywords` → "Content contains adult or explicit material"
  - `violence-keywords` → "Content contains violent or harmful material"
  - `url-shortener` → "URL shorteners are not allowed. Please submit the final destination URL"
  - `suspicious-domain` → "Domain appears to contain inappropriate content keywords"
  - `low-domain-reputation` → "Domain has a history of low-quality or problematic content"
  - `seo-spam-keywords` → "Content appears to be SEO spam or promotional"
  - `promotional-content` → "Content is primarily promotional or advertising"
  - `title-too-short` → "Title is too short or uninformative"
  - `excessive-caps` → "Title uses excessive capitalization"
  - `repetitive-content` → "Content appears repetitive or low-quality"

#### Added Actionable Suggestions
- Created `getSuggestions()` method that provides specific recommendations for fixing issues:
  - Title issues → "Use a more descriptive and informative title"
  - Promotional content → "Remove promotional language and focus on the content value"
  - Excessive caps → "Use normal capitalization in the title"
  - Domain issues → "Consider submitting content from more established sources"
  - Repetitive content → "Ensure the content is unique and not repetitive"

#### Fixed False Positives in Domain Checking
- **Before**: `.co` TLD was flagged as suspicious (affecting `jobsight.co` and similar legitimate domains)
- **After**: More precise domain checking:
  - URL shorteners checked by exact domain match (e.g., `bit.ly`, `tinyurl.com`)
  - NSFW keywords only checked in domain name, not TLD
  - Domain reputation only flags domains with score < 0.2 AND > 3 submissions (prevents new domain penalty)

### 2. API Response Updates (`apis/discovery-service/src/routes/submit.ts`)

Enhanced rejection response to include:
```json
{
  "error": "Content rejected",
  "reason": "Multiple issues detected: URL shorteners are not allowed...",
  "details": {
    "issues": ["url-shortener", "excessive-caps"],
    "suggestions": [
      "Use the final destination URL instead of a shortener",
      "Use normal capitalization in the title"
    ],
    "confidence": 0.7
  }
}
```

### 3. Frontend UI Improvements (`ui/portal/app/submit/page.tsx`)

#### Enhanced Error Display
- Shows the main rejection reason prominently
- Displays helpful suggestions in a highlighted box with 💡 icon
- Uses a more visually organized alert structure
- Updated `SubmissionResult` interface to include `details` field

#### Example Error Display:
```
❌ Submission rejected
Multiple issues detected: URL shorteners are not allowed...

💡 Suggestions:
• Use the final destination URL instead of a shortener
• Use normal capitalization in the title
```

## Test Results

### Before Changes
Submitting `https://jobsight.co`:
```json
{
  "error": "Content rejected",
  "reason": "Content does not meet quality and safety standards",
  "issues": ["suspicious-domain", "low-domain-reputation"]
}
```
❌ **Result**: False positive rejection with vague error message

### After Changes
Submitting `https://jobsight.co`:
```json
{
  "message": "Content submitted successfully",
  "discovery": { ... },
  "moderation": {
    "status": "approved",
    "confidence": 0.6
  }
}
```
✅ **Result**: Successfully accepted

### Rejection Example
Submitting problematic content now shows:
```json
{
  "error": "Content rejected",
  "reason": "Multiple issues detected: URL shorteners are not allowed...",
  "details": {
    "issues": ["url-shortener", "excessive-caps"],
    "suggestions": ["Use the final destination URL...", "Use normal capitalization..."],
    "confidence": 0.7
  }
}
```
✅ **Result**: Clear rejection with actionable feedback

## Benefits

1. **User Experience**: Users now understand WHY their content was rejected
2. **Actionable Feedback**: Specific suggestions help users fix issues and resubmit
3. **Reduced False Positives**: More intelligent domain checking reduces legitimate content being rejected
4. **Transparency**: Users can see the specific issues detected
5. **Better Conversions**: Users are more likely to successfully submit after seeing suggestions

## Future Enhancements

- Add link to detailed content guidelines in rejection messages
- Implement user appeal system for rejected content
- Add preview mode to show moderation issues before submission
- Track and display domain reputation scores to users
- Add A/B testing for different rejection message formats

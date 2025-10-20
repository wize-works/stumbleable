# Re-Engagement Email Content Fix

**Date:** October 19, 2025  
**Issue:** Re-engagement emails showing "0 trending discoveries" with no content listed

---

## 🔍 Root Cause Analysis

### Initial Problem
The re-engagement email template was working, but showed:
- "Over the last week there were 0 trending discoveries"
- No "Trending Now" content displayed

### Investigation Findings

#### Content Statistics (Confirmed via Supabase)
```sql
-- We have PLENTY of content:
Total content: 7,765
Last 14 days:  916
Last 7 days:   794
Most recent:   2025-10-20 02:21:28 (very recent!)

-- Interaction statistics (last 30 days):
Views:  3,436
Skips:  229
Saves:  76
Likes:  39
Shares: 4
```

#### Schema Issues Discovered
The original `get_trending_for_reengagement()` function had several bugs:

1. **❌ Looked for `like_count` and `save_count` columns on `content` table** 
   - These columns don't exist!
   - Engagement data is in `user_interactions` table

2. **❌ Wrong field names in joins**
   - Used `feedback_type` from `content_feedback` (doesn't have this field)
   - Used `deleted_at` on `saved_items` (doesn't have this field)

3. **❌ No fallback for zero engagement**
   - If no content had likes/saves, it would return recent content but with 0 engagement scores
   - Email would show "0 trending" even though content existed

---

## ✅ Solutions Implemented

### 1. Fixed Database Function - `get_trending_for_reengagement()`

**Correct Schema Usage:**
```sql
-- Fixed function now properly queries:
- user_interactions table for likes/saves (type = 'like' or 'save')
- Counts DISTINCT interactions within last 30 days
- Orders by engagement score: (likes + saves * 2)
- Falls back to recent content by created_at if no engagement
```

**Test Results:**
```
Top trending discoveries found:
- Media Cheat Sheet: 0 likes, 2 saves (score: 4)
- Digital Experience of St. Peter's: 1 like, 1 save (score: 3)
- Longreads Homepage: 1 like, 1 save (score: 3)
- [7 more with engagement]
```

### 2. Created Fallback Function - `get_recent_for_reengagement()`

**Purpose:** When there's no trending content with engagement, show fresh content
```sql
-- Returns 5 most recent quality discoveries from last 14 days
- Orders by created_at DESC, quality_score DESC
- Always has content to show
```

**Test Results:**
```
Recent discoveries found:
- "Bacteria hidden inside tumors could help beat cancer"
- "Scientists just proved the moai could walk"
- "Scientists reveal green tea's fat-burning secret"
- [2 more science articles]
```

### 3. Enhanced Queue Logic with Smart Fallback

**Updated `queue.ts` rendering logic:**

```typescript
if (emailType === 're-engagement') {
    // 1. Try trending with engagement
    const trending = await supabase.rpc('get_trending_for_reengagement', { limit_count: 5 });
    
    // 2. Check if any have actual engagement
    const hasEngagement = trending.some(d => d.like_count > 0 || d.save_count > 0);
    
    if (!hasEngagement) {
        // 3. Fall back to recent quality content
        const recent = await supabase.rpc('get_recent_for_reengagement', { limit_count: 5 });
        enrichedData.discoveries = recent;
        console.log('✓ Using recent discoveries instead of trending (no engagement yet)');
    } else {
        enrichedData.discoveries = trending;
        console.log('✓ Found trending discoveries with engagement');
    }
}
```

**Smart Fallback Logic:**
1. ✅ **First:** Try to get trending content with engagement
2. ✅ **If no engagement:** Fall back to recent quality content
3. ✅ **If database error:** Return empty array (graceful degradation)
4. ✅ **Always log:** What strategy was used for debugging

---

## 📊 Database Migrations Applied

### Migration: `add_get_trending_for_reengagement_function`
- Created initial function (had bugs)

### Migration: `fix_get_trending_for_reengagement_function`
- Attempted fix (still had schema issues)

### Migration: `fix_trending_function_saved_items`
- Attempted fix (wrong table references)

### Migration: `fix_trending_with_correct_schema`
- Fixed to use `user_interactions` table properly

### Migration: `get_recent_for_reengagement`
- Added fallback function for recent content

All migrations successfully applied to production Supabase database.

---

## 🚀 Deployment Steps

### To Deploy This Fix:

```powershell
# 1. Build the updated service
cd g:\code\@wizeworks\stumbleable
docker build -t brandonkorouscontainers.azurecr.io/stumbleable-email:latest -f apis/email-service/Dockerfile .

# 2. Push to Azure Container Registry
docker push brandonkorouscontainers.azurecr.io/stumbleable-email:latest

# 3. Restart Kubernetes deployment
kubectl rollout restart deployment email-service -n stumbleable

# 4. Monitor rollout
kubectl rollout status deployment email-service -n stumbleable

# 5. Verify logs show new behavior
kubectl logs -n stumbleable -l app=email-service --tail=100 -f
```

### Expected Log Output After Fix:

```
📧 Processing email [id]...
   Type: re-engagement
   ⏳ Fetching trending discoveries for re-engagement...
   ✓ Found 5 trending discoveries with engagement
   OR
   ⚠️  Trending content has no engagement, fetching recent content instead...
   ✓ Using 5 recent discoveries instead
   
   ⏳ Rendering template...
   ✓ HTML rendered successfully
```

---

## 🎯 What Users Will See Now

### Before Fix:
```
While You Were Away
🔥 0 Trending Discoveries
🔖 [user's saved count] Waiting in Your Saved

[No content cards displayed]
```

### After Fix:
```
While You Were Away
🔥 5 Trending Discoveries
🔖 [user's saved count] Waiting in Your Saved

Trending Now
Here are some of the most popular discoveries from the community:

[5 discovery cards with actual content]
#1 mediacheatsheet.com
Media Cheat Sheet - Social Media & Ad Specs Cheat Sheet
[description]
👍 0  🔖 2
[Visit button]

[4 more cards...]
```

---

## 📝 Files Changed

### Database Migrations (Supabase)
- ✅ `add_get_trending_for_reengagement_function.sql`
- ✅ `fix_get_trending_for_reengagement_function.sql`
- ✅ `fix_trending_function_saved_items.sql`
- ✅ `fix_trending_with_correct_schema.sql`
- ✅ `get_recent_for_reengagement.sql`

### Code Changes
- ✅ `apis/email-service/src/lib/queue.ts` - Enhanced re-engagement data enrichment
- ✅ `apis/email-service/src/routes/jobs.ts` - Added email field to template data

---

## ✅ Verification Checklist

- [x] Database functions return actual content with engagement data
- [x] Fallback function returns recent content when no trending
- [x] Queue processor intelligently chooses between trending/recent
- [x] Template receives properly formatted discovery data
- [x] Build succeeds without errors
- [ ] Deploy to production
- [ ] Monitor logs for successful email rendering
- [ ] Verify user receives email with 5 discovery cards
- [ ] Check that engagement stats are displayed correctly

---

## 🎓 Lessons Learned

1. **Always verify database schema** before writing functions
   - Don't assume column names match your mental model
   - Use `information_schema.columns` to verify actual schema

2. **Test database functions independently** before integration
   - Run `SELECT * FROM function()` to test return values
   - Check for errors in function definition

3. **Provide fallback strategies** for user-facing features
   - "Trending" with no engagement → show "Recent" instead
   - Database error → graceful degradation with empty state
   - Always have a plan B for critical user experiences

4. **Log decision points** for debugging
   - Why did we choose trending vs recent?
   - What was the engagement level?
   - Makes production debugging much easier

---

## 🔄 Next Steps (Optional Enhancements)

### Potential Future Improvements:

1. **Cache trending discoveries** 
   - Compute once per hour, store in `cached_trending` table
   - Reduces database load for high email volume

2. **Personalized recommendations**
   - Use user's preferred topics to filter discoveries
   - Increase relevance of re-engagement content

3. **A/B test content strategies**
   - Test "Trending" vs "Recent" vs "Recommended for you"
   - Measure which drives more re-engagement clicks

4. **Add content preview images**
   - Make discovery cards more visually appealing
   - Increase click-through rates

5. **Track email engagement**
   - Which discoveries get clicked from emails?
   - Use data to improve future content selection

---

**Status:** ✅ Fixed and ready for deployment  
**Impact:** High - Fixes critical re-engagement email content issue  
**Risk:** Low - Fallback strategies ensure graceful degradation

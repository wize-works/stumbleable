# Content Moderation Analysis & Recommendations

## Current Situation

You're correct - **submissions are being auto-approved** unless something risky is detected. After analyzing the codebase, here's what's happening:

### How Submissions Currently Work

1. **User submits content** → `POST /api/submit` (discovery-service or crawler-service)
2. **Automatic moderation runs** via `ContentModerationService.moderateContent()`
3. **Three possible outcomes**:
   - ✅ **APPROVE** → Content immediately added to `discoveries` table, live on site
   - ❌ **REJECT** → User gets error, content not added
   - ⚠️ **REVIEW** → Content added to `moderation_queue` table for manual review

### Why Nothing is Going to Moderation Queue

The moderation thresholds are **very permissive**. Content only goes to the queue if:

#### Safety Issues (Automatic Rejection, NOT queue):
- NSFW keywords detected (`porn`, `xxx`, `sex`, etc.)
- Violence keywords detected (`kill`, `murder`, `weapon`, etc.)
- URL shorteners (`bit.ly`, `t.co`, etc.)
- Suspicious domain keywords (`adult`, `porn`, `casino`)
- Domain reputation score < 0.2 (extremely low)

#### Spam Issues:
- **High confidence spam (>0.7)** → Automatic rejection
- **Medium confidence spam (0.4-0.7)** → Goes to moderation queue
- **Low confidence spam (<0.4)** → Auto-approved

### The Problem

Normal, legitimate submissions from unknown domains are passing through because:

1. **Domain reputation starts at 0.7** (neutral) - good enough to pass
2. **Spam detection is too lenient** - needs multiple spam indicators
3. **No "trust level" system** - all submissions treated equally
4. **Quality thresholds too low** - minimal checks on content quality

---

## What You're Seeing

When you submit sites like:
- `https://neal.fun/` 
- `https://www.cameronsworld.net/`
- `https://theuselessweb.com/`

They are:
- ✅ Not NSFW or violent
- ✅ Not URL shorteners
- ✅ Not obviously spam (no "buy now", "limited time", etc.)
- ✅ Domain reputation starts at 0.7
- ✅ Title is reasonable length and format

**Result:** Auto-approved and immediately live without human review.

---

## Recommended Solutions

### Option 1: Conservative (Everything Goes to Queue)
**Default all submissions to moderation queue unless from trusted sources**

```typescript
async moderateContent(...): Promise<{...}> {
    // Run safety and spam checks
    const [safetyResult, spamResult] = await Promise.all([...]);
    
    // Safety violations = reject
    if (!safetyResult.isSafe) {
        return { approved: false, recommendation: 'reject', ... };
    }
    
    // High confidence spam = reject
    if (spamResult.isSpam && spamResult.confidence > 0.7) {
        return { approved: false, recommendation: 'reject', ... };
    }
    
    // Check if submitter is trusted
    const submitterTrust = await this.getSubmitterTrustLevel(submittedBy);
    
    // NEW: Auto-approve only for trusted submitters
    if (submitterTrust >= 0.8) {
        return { approved: true, recommendation: 'approve', ... };
    }
    
    // Everything else goes to queue
    return { approved: false, recommendation: 'review', ... };
}
```

**Pros:**
- ✅ You review everything before it's live
- ✅ Builds trusted submitter reputation over time
- ✅ Protects site quality

**Cons:**
- ⚠️ More manual work initially
- ⚠️ Slower time-to-publish for good content

---

### Option 2: Balanced (Trust-Based Auto-Approval)
**Use submitter reputation + domain reputation for auto-approval**

```typescript
async moderateContent(...): Promise<{...}> {
    // Safety and spam checks (same as before)
    if (!safetyResult.isSafe) return { recommendation: 'reject', ... };
    if (spamResult.confidence > 0.7) return { recommendation: 'reject', ... };
    
    // Get reputation scores
    const domainRep = await this.getDomainReputation(domain);
    const submitterTrust = await this.getSubmitterTrustLevel(submittedBy);
    
    // Combined trust score (0-1)
    const trustScore = (domainRep.score + submitterTrust) / 2;
    
    // Trust thresholds
    if (trustScore >= 0.8) {
        return { approved: true, recommendation: 'approve', ... }; // High trust
    } else if (trustScore >= 0.5) {
        return { approved: false, recommendation: 'review', ... }; // Medium - needs review
    } else {
        return { approved: false, recommendation: 'reject', ... }; // Low trust
    }
}
```

**New Requirements:**
1. **Track submitter reputation** in `users` table
2. **Increase reputation** when submissions are approved
3. **Decrease reputation** when submissions are rejected
4. **Domain reputation** already exists but needs adjustment

**Pros:**
- ✅ Scales better - trusted users get auto-approval
- ✅ Still protects quality for new/untrusted submitters
- ✅ Incentivizes quality submissions

**Cons:**
- ⚠️ More complex logic
- ⚠️ Requires tracking submitter reputation

---

### Option 3: Aggressive (Low Quality Filter + Queue)
**Add quality checks and send borderline content to queue**

```typescript
// Add quality scoring
function assessContentQuality(url: string, title: string, description: string): number {
    let score = 0.5; // Start neutral
    
    // Good title
    if (title.length >= 20 && title.length <= 100) score += 0.1;
    if (title.split(' ').length >= 4) score += 0.1;
    
    // Good description
    if (description.length >= 50) score += 0.1;
    if (description.length >= 150) score += 0.1;
    
    // Domain factors
    const domain = new URL(url).hostname;
    if (domain.includes('.edu') || domain.includes('.gov')) score += 0.2;
    if (domain.length < 8) score -= 0.1; // Too short domain
    
    return Math.max(0, Math.min(1, score));
}

async moderateContent(...): Promise<{...}> {
    // Safety and spam checks
    if (!safetyResult.isSafe) return { recommendation: 'reject', ... };
    if (spamResult.confidence > 0.7) return { recommendation: 'reject', ... };
    
    // Quality assessment
    const qualityScore = assessContentQuality(url, title, description);
    
    if (qualityScore >= 0.7) {
        return { approved: true, recommendation: 'approve', ... };
    } else if (qualityScore >= 0.4) {
        return { approved: false, recommendation: 'review', ... };
    } else {
        return { approved: false, recommendation: 'reject', ... };
    }
}
```

**Pros:**
- ✅ Filters out low-effort submissions
- ✅ Rewards well-described content
- ✅ No need for user reputation system

**Cons:**
- ⚠️ May reject legitimate but short submissions
- ⚠️ Quality metrics are subjective

---

## My Recommendation: **Option 2 (Balanced Trust-Based)**

Here's why:

1. **Scales with your site** - As you approve submissions, trusted users emerge
2. **Protects quality** - New/untrusted submitters still go through review
3. **Fair to users** - Good contributors earn trust and faster approval
4. **Reduces workload over time** - You'll review less as trust builds

### Implementation Plan

#### Phase 1: Add User Trust Tracking
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN trust_level DECIMAL(3,2) DEFAULT 0.50 
    CHECK (trust_level >= 0 AND trust_level <= 1);
ALTER TABLE users ADD COLUMN submissions_approved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN submissions_rejected INTEGER DEFAULT 0;

-- Function to calculate trust level
CREATE OR REPLACE FUNCTION calculate_user_trust(user_id UUID) 
RETURNS DECIMAL(3,2) AS $$
DECLARE
    approved_count INTEGER;
    rejected_count INTEGER;
    total_count INTEGER;
    base_trust DECIMAL(3,2);
BEGIN
    SELECT 
        submissions_approved, 
        submissions_rejected 
    INTO approved_count, rejected_count
    FROM users 
    WHERE id = user_id;
    
    total_count := approved_count + rejected_count;
    
    -- No submissions = neutral trust
    IF total_count = 0 THEN
        RETURN 0.50;
    END IF;
    
    -- Calculate based on approval rate
    base_trust := (approved_count::DECIMAL / total_count::DECIMAL);
    
    -- Bonus for volume (max +0.2)
    base_trust := LEAST(1.0, base_trust + (LEAST(approved_count, 20) * 0.01));
    
    RETURN base_trust;
END;
$$ LANGUAGE plpgsql;
```

#### Phase 2: Update Moderation Logic
```typescript
// apis/discovery-service/src/lib/moderation.ts
async getSubmitterTrustLevel(userId?: string): Promise<number> {
    if (!userId) return 0.3; // Anonymous = low trust
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('trust_level, submissions_approved, submissions_rejected')
            .eq('id', userId)
            .single();
        
        if (error || !data) return 0.5; // Default neutral
        
        // Recalculate trust based on history
        const total = data.submissions_approved + data.submissions_rejected;
        if (total === 0) return 0.5;
        
        const approvalRate = data.submissions_approved / total;
        const volumeBonus = Math.min(data.submissions_approved * 0.01, 0.2);
        
        return Math.min(1.0, approvalRate + volumeBonus);
    } catch (error) {
        console.error('Error getting submitter trust:', error);
        return 0.5;
    }
}
```

#### Phase 3: Update Submission Approval Flow
```typescript
// When moderator approves content in moderation_queue
async reviewContent(queueId, status, moderatorId, notes) {
    const item = await this.getModerationQueueItem(queueId);
    
    // Update moderation queue
    await supabase.from('moderation_queue')
        .update({ status, moderated_by: moderatorId, ... })
        .eq('id', queueId);
    
    // Update submitter trust
    if (item.submitted_by) {
        const column = status === 'approved' 
            ? 'submissions_approved' 
            : 'submissions_rejected';
        
        await supabase.from('users')
            .update({ [column]: supabase.raw(`${column} + 1`) })
            .eq('id', item.submitted_by);
        
        // Recalculate trust level
        await supabase.rpc('calculate_user_trust', { user_id: item.submitted_by });
    }
    
    // If approved, create discovery
    if (status === 'approved') {
        await repository.createDiscovery({
            url: item.url,
            title: item.title,
            // ... rest of data
        });
    }
}
```

---

## Configuration Recommendations

### Trust Thresholds (Adjustable)
```typescript
const TRUST_THRESHOLDS = {
    AUTO_APPROVE: 0.8,   // 80%+ trust = auto-approve
    REQUIRES_REVIEW: 0.5, // 50-80% trust = needs review
    AUTO_REJECT: 0.3      // <30% trust = likely reject
};

const DOMAIN_THRESHOLDS = {
    TRUSTED: 0.8,         // Known good domains
    NEUTRAL: 0.5,         // New/unknown domains
    SUSPICIOUS: 0.3       // Flagged domains
};
```

### Initial Trust Levels
- **New users**: 0.50 (neutral)
- **Anonymous submissions**: 0.30 (low trust)
- **After 5 approved submissions**: ~0.70 (trusted)
- **After 10 approved submissions**: ~0.85 (highly trusted)

---

## Action Items

1. **Immediate**: Change default behavior to queue everything (`recommendation: 'review'`)
2. **Short-term**: Add user trust tracking to database
3. **Short-term**: Update moderation service with trust-based logic
4. **Medium-term**: Build admin UI to manage trust levels manually
5. **Long-term**: Machine learning for content quality scoring

---

## Testing the Changes

After implementing Option 2:

1. **Submit as new user** → Should go to queue (trust = 0.5)
2. **Approve 3 submissions** → Trust increases to ~0.65
3. **Submit again** → Still goes to queue (need 0.8+ for auto-approve)
4. **Approve 5 more submissions** → Trust increases to ~0.8+
5. **Submit again** → Auto-approved! 🎉

---

## Summary

**Current State:** Everything except obvious spam/NSFW is auto-approved.

**Problem:** You built a moderation queue but it's rarely used because thresholds are too permissive.

**Solution:** Implement trust-based moderation where:
- ❌ New/untrusted submitters → Moderation queue
- ⚠️ Medium trust submitters → Moderation queue  
- ✅ High trust submitters → Auto-approved

**Benefit:** Quality control now, scalability later as trusted users emerge.

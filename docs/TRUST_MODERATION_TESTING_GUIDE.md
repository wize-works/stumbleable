# Trust-Based Moderation Testing Guide

## Setup

1. **Apply the database migration**:
   ```sql
   -- Run in Supabase SQL Editor or via migration tool
   -- File: database/migrations/009_add_user_trust_tracking.sql
   ```

2. **Restart all services** to pick up the code changes:
   ```powershell
   npm run dev
   ```

## Test Scenarios

### Scenario 1: New User Submission (Should Go to Queue)

**Expected Behavior**: New users start with trust_level = 0.50, which is below the 0.80 auto-approve threshold, so submissions should go to moderation queue.

**Steps**:
1. Sign in as a new user (or create a new test account)
2. Navigate to `/submit`
3. Submit a clean, legitimate site (e.g., `https://neal.fun/`, `https://www.cameronsworld.net/`)
4. Check the response - should be `HTTP 202` with message "Content submitted for review"
5. Navigate to `/admin/moderation`
6. You should see the submission in the moderation queue with:
   - **Trust: 50%** badge (yellow/warning)
   - **✓ 0 approved** badge
   - **Combined Trust Score: 50%** (Medium - requires review)

**Database Verification**:
```sql
SELECT url, title, status FROM moderation_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5;
SELECT email, trust_level, submissions_approved, submissions_rejected FROM users WHERE email = 'your-test-email@example.com';
```

---

### Scenario 2: Approve Submission (Trust Should Increase)

**Expected Behavior**: When you approve a submission, the user's `submissions_approved` count increases and their `trust_level` recalculates automatically via database trigger.

**Steps**:
1. From the moderation queue, click **Approve** on the pending submission
2. Check that the submission disappears from the queue
3. Verify the discovery was created:
   - Navigate to `/stumble` and see if the content appears
   - Or check database: `SELECT * FROM discoveries WHERE url = 'the-submitted-url';`
4. Check the user's updated trust level:
   ```sql
   SELECT email, trust_level, submissions_approved, submissions_rejected 
   FROM users 
   WHERE email = 'your-test-email@example.com';
   ```
   - **Expected**: `trust_level` should be around 0.51-0.60 (depending on calculation)
   - **Expected**: `submissions_approved` should be 1

---

### Scenario 3: Build Trust to Auto-Approval (5+ Approved Submissions)

**Expected Behavior**: After 5-10 approved submissions, trust_level should reach ~0.80+, enabling auto-approval.

**Steps**:
1. Submit 5-10 more legitimate sites as the same test user
2. Approve each one in the moderation queue
3. After each approval, check the trust level:
   ```sql
   SELECT email, trust_level, submissions_approved FROM users WHERE email = 'your-test-email@example.com';
   ```
4. Once `trust_level >= 0.80`, submit another site
5. **Expected**: Site should be approved automatically (HTTP 201, not 202)
6. **Expected**: Site appears immediately in `/stumble`, NOT in moderation queue

---

### Scenario 4: Reject Submission (Trust Should Decrease)

**Expected Behavior**: Rejecting a submission increases `submissions_rejected` and lowers the user's trust_level.

**Steps**:
1. Submit a questionable site (or use a test site)
2. In moderation queue, click **Reject**
3. Check the updated trust level:
   ```sql
   SELECT email, trust_level, submissions_approved, submissions_rejected 
   FROM users 
   WHERE email = 'your-test-email@example.com';
   ```
   - **Expected**: `submissions_rejected` increases by 1
   - **Expected**: `trust_level` decreases (e.g., from 0.85 to 0.75)

---

### Scenario 5: Anonymous Submission (Low Trust)

**Expected Behavior**: Submissions without a userId should get trust_level = 0.30 (low) and go to review.

**Steps**:
1. Submit content without authentication (or omit the `userId` field if testing via API)
2. **Expected**: Goes to moderation queue
3. **Expected**: In queue, shows "Trust: 30%" or no user information

---

### Scenario 6: Spam Detection with High Trust Override

**Expected Behavior**: Medium-confidence spam (0.4-0.7) can be overridden by high trust (0.8+).

**Steps**:
1. Build a user's trust to 0.85+ (via multiple approvals)
2. Submit content that triggers spam detection but isn't egregious:
   - Example: URL with keywords like "best deals" or "limited time"
3. **Expected**: Content gets approved despite spam flags
4. Check logs for: `[Moderation] Medium spam but high trust - approving`

---

### Scenario 7: Domain Reputation Impact

**Expected Behavior**: Domain reputation (separate from user trust) also affects the combined trust score.

**Steps**:
1. Submit content from a new domain with neutral reputation (0.50)
2. Check combined trust score calculation:
   - Formula: `(user_trust * 0.6) + (domain_score * 0.4)`
   - Example: User trust 0.70, Domain 0.50 → Combined: (0.70 * 0.6) + (0.50 * 0.4) = 0.62
3. **Expected**: Combined score appears in moderation queue UI

---

## Trust Level Thresholds

| Trust Level | Behavior | How to Achieve |
|-------------|----------|----------------|
| **0.80+** | ✅ Auto-approve (high trust) | 8-10+ approved submissions, low/no rejections |
| **0.50-0.79** | ⚠️ Moderation queue (medium trust) | 1-7 approved submissions, or mix of approvals/rejections |
| **0.30-0.49** | ⚠️ Moderation queue with scrutiny (low trust) | More rejections than approvals |
| **<0.30** | 🚫 Very low trust | Anonymous or very poor submission history |

---

## Trust Calculation Formula

```
trust_level = (submissions_approved / total_submissions) + volume_bonus
volume_bonus = min(submissions_approved * 0.01, 0.20)  # Max +0.20
```

**Examples**:
- 0 approved, 0 rejected → `0.50` (neutral start)
- 5 approved, 0 rejected → `1.00 + 0.05 = 1.00` (maxed out)
- 8 approved, 2 rejected → `0.80 + 0.08 = 0.88` (high trust)
- 3 approved, 7 rejected → `0.30 + 0.03 = 0.33` (low trust)

---

## Verification Queries

### Check User Trust Levels
```sql
SELECT 
    email,
    trust_level,
    submissions_approved,
    submissions_rejected,
    (submissions_approved + submissions_rejected) as total_submissions,
    CASE 
        WHEN trust_level >= 0.80 THEN 'HIGH (auto-approve)'
        WHEN trust_level >= 0.50 THEN 'MEDIUM (review)'
        ELSE 'LOW (scrutiny)'
    END as trust_category
FROM users
WHERE submissions_approved > 0 OR submissions_rejected > 0
ORDER BY trust_level DESC;
```

### Check Moderation Queue with Trust Info
```sql
SELECT 
    mq.url,
    mq.title,
    mq.status,
    u.email as submitted_by,
    u.trust_level,
    u.submissions_approved,
    u.submissions_rejected,
    mq.issues,
    mq.created_at
FROM moderation_queue mq
LEFT JOIN users u ON u.id = mq.submitted_by
WHERE mq.status = 'pending'
ORDER BY mq.created_at DESC;
```

### Check Auto-Approved Discoveries
```sql
SELECT 
    d.url,
    d.title,
    d.submitted_at,
    u.email as submitted_by,
    u.trust_level
FROM discoveries d
LEFT JOIN users u ON u.id = d.submitted_by
WHERE d.submitted_at >= NOW() - INTERVAL '1 hour'
ORDER BY d.submitted_at DESC;
```

---

## Expected Log Messages

### High Trust Auto-Approval
```
[Moderation] Trust analysis: {
  url: 'https://example.com',
  submitterTrust: 0.85,
  domainScore: 0.70,
  combinedTrustScore: 0.79,
  spamConfidence: 0.1,
  isSpam: false
}
[Moderation] High trust - auto-approving
```

### Medium Trust Review
```
[Moderation] Trust analysis: {
  url: 'https://example.com',
  submitterTrust: 0.50,
  domainScore: 0.50,
  combinedTrustScore: 0.50,
  spamConfidence: 0.0,
  isSpam: false
}
[Moderation] Medium trust - sending to review
```

### Low Trust Review
```
[Moderation] User trust level: {
  userId: 'abc-123',
  trustLevel: 0.33,
  approved: 1,
  rejected: 3
}
[Moderation] Low trust - sending to review with scrutiny
```

---

## Troubleshooting

### Problem: Trust level not updating after approval
**Solution**: Check if the database trigger is working:
```sql
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_update_trust_on_review';
```

### Problem: All submissions still auto-approving
**Solution**: Check the trust calculation in logs. Verify the user's trust_level in database:
```sql
SELECT email, trust_level FROM users WHERE email = 'your-test-email';
```

### Problem: Discovery not created after approval
**Solution**: Check moderation service logs for errors. Verify the `createDiscoveryFromQueueItem` function is being called.

---

## Success Criteria

✅ New users (trust 0.50) → submissions go to moderation queue  
✅ After 8-10 approvals → trust reaches 0.80+  
✅ High trust users (0.80+) → submissions auto-approved  
✅ Rejected submissions → trust decreases  
✅ Moderation UI shows trust levels clearly  
✅ Database trigger automatically updates trust on review  
✅ Approved content creates discovery in database  

---

## Next Steps

After testing confirms everything works:

1. **Adjust thresholds** if needed (in `moderation.ts` files):
   - Increase AUTO_APPROVE threshold to 0.85 for stricter control
   - Decrease to 0.75 for more lenient auto-approval

2. **Add admin controls** to manually adjust user trust levels

3. **Monitor metrics**: Track approval rates, average trust levels, queue size

4. **Consider ML enhancement**: Replace keyword-based spam detection with AI model

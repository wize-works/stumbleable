# Submission Email Integration Implementation

## Overview
This document describes the implementation of automated email notifications for the content submission lifecycle in Stumbleable.

## Features Implemented

### 1. Submission Received Email
**Trigger:** When a user submits content that requires manual moderation review  
**Service:** Crawler Service (`apis/crawler-service`)  
**Email Type:** `submission-received`  
**Template Data:**
- `title`: Title of submitted content
- `url`: URL of submitted content
- `submittedAt`: Timestamp of submission

**Flow:**
1. User submits content via `/api/submit` endpoint
2. Content moderation algorithm determines content needs manual review
3. Content added to `crawler_moderation_queue` table
4. Email client queries user's email address from `users` table
5. Email queued to email service with submission details
6. User receives confirmation email

**Code Location:** `apis/crawler-service/src/routes/submit.ts` (lines ~370-395)

### 2. Submission Approved Email
**Trigger:** When a moderator approves user-submitted content  
**Service:** Moderation Service (`apis/moderation-service`)  
**Email Type:** `submission-approved`  
**Template Data:**
- `title`: Title of approved content
- `url`: URL of approved content
- `discoveryId`: ID of the created discovery (for linking to live content)
- `approvedAt`: Timestamp of approval

**Flow:**
1. Moderator reviews queued content via `/api/moderation/queue/:queueId/review`
2. Moderator approves content with action='approve'
3. Repository creates discovery record in `discoveries` table
4. Email client queries user email and discovery ID
5. Email queued to email service with approval details
6. User receives approval notification with link to view their content

**Code Location:** `apis/moderation-service/src/routes/moderation.ts` (lines ~165-185)

### 3. Submission Rejected Email
**Trigger:** When a moderator rejects user-submitted content  
**Service:** Moderation Service (`apis/moderation-service`)  
**Email Type:** `submission-rejected`  
**Template Data:**
- `title`: Title of rejected content
- `url`: URL of rejected content
- `rejectionReason`: Moderator's notes explaining why content was rejected
- `rejectedAt`: Timestamp of rejection

**Flow:**
1. Moderator reviews queued content via `/api/moderation/queue/:queueId/review`
2. Moderator rejects content with action='reject' and provides `moderator_notes`
3. Repository marks content as rejected
4. Email client queries user email
5. Email queued to email service with rejection details
6. User receives rejection notification with explanation

**Code Location:** `apis/moderation-service/src/routes/moderation.ts` (lines ~187-210)

## Architecture

### Email Client Modules
Each service that sends emails has its own email client module:

**Crawler Service Email Client:**  
`apis/crawler-service/src/lib/email-client.ts`
- `EmailClient.sendSubmissionReceivedEmail()`
- Communicates with email service at `EMAIL_API_URL`
- Handles submission confirmation emails

**Moderation Service Email Client:**  
`apis/moderation-service/src/lib/email-client.ts`
- `EmailClient.sendSubmissionApprovedEmail()`
- `EmailClient.sendSubmissionRejectedEmail()`
- Communicates with email service at `EMAIL_API_URL`
- Handles review outcome emails

### Integration Pattern
All email sending follows the same pattern:

```typescript
// 1. Query user email from database
const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

// 2. Send email asynchronously (don't block response)
EmailClient.sendSubmissionReceivedEmail(
    userId,
    userData.email,
    title,
    url
).catch((error) => {
    fastify.log.error('Failed to send email:', error);
});

// 3. Return API response immediately
return { success: true, queueId: '...' };
```

**Key Design Decisions:**
- **Asynchronous:** Email sending never blocks API responses
- **Error handling:** Email failures are logged but don't affect core functionality
- **Database queries:** User email fetched from database each time (ensures accuracy)
- **Fire-and-forget:** Services don't wait for email service response

## Environment Configuration

### Local Development (.env files)

**Crawler Service** (`apis/crawler-service/.env`):
```env
EMAIL_API_URL=http://localhost:7006
```

**Moderation Service** (`apis/moderation-service/.env`):
```env
EMAIL_API_URL=http://localhost:7006
```

### Production (Kubernetes)

**ConfigMap** (`k8s/base/configmap.yaml`):
```yaml
EMAIL_API_URL: "http://email-service:8080"
```

**Deployment Manifests:**
- `k8s/base/crawler-service.yaml` - References `EMAIL_API_URL` from ConfigMap
- `k8s/base/moderation-service.yaml` - References `EMAIL_API_URL` from ConfigMap

## Database Schema

### Email Queue Table
The email service stores queued emails in the `email_queue` table:

```sql
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);
```

### User Identification
- **Crawler Service:** Uses internal user UUID (not Clerk ID)
- **Moderation Service:** Uses internal user UUID stored in queue items
- Both services query the `users` table to get email addresses

## Testing

### Local Testing
Use the provided test script to verify email integration:

```powershell
# Set your authentication token
$env:TEST_AUTH_TOKEN="your_clerk_token_here"

# Run the test script
node test-submission-emails.js
```

The test script will:
1. Check health of all services
2. Submit test content (triggers submission-received email)
3. Approve the content (triggers submission-approved email)
4. Submit and reject another content (triggers submission-rejected email)
5. Display email queue status

### Manual Testing Flow

**Test Submission Received:**
1. Start all services: `npm run dev` (from root)
2. Log in to the portal at http://localhost:3000
3. Navigate to `/submit` page
4. Submit content that will require manual review
5. Check email service logs for queued email
6. Verify email received in inbox

**Test Approval:**
1. Log in as admin/moderator
2. Navigate to admin moderation dashboard
3. Approve a queued submission
4. Check email service logs
5. Verify approval email received

**Test Rejection:**
1. Log in as admin/moderator
2. Navigate to admin moderation dashboard
3. Reject a queued submission with moderator notes
4. Check email service logs
5. Verify rejection email with reason received

### Debugging

**Check Email Service Logs:**
```powershell
# View logs in real-time
npm run dev  # Watch for email queueing messages
```

**Verify Database Records:**
```sql
-- Check email queue
SELECT * FROM email_queue 
WHERE email_type IN ('submission-received', 'submission-approved', 'submission-rejected')
ORDER BY created_at DESC 
LIMIT 10;

-- Check user emails
SELECT id, email, clerk_id FROM users WHERE id = 'user_uuid_here';
```

**Common Issues:**

1. **Email not queued:** Check that EMAIL_API_URL is set correctly
2. **User email not found:** Verify user exists in users table with email
3. **Discovery ID missing:** Only approved submissions have discoveries
4. **Service communication failed:** Ensure email service is running on correct port

## Email Templates

Email templates are managed by the email service. The templates should be created for:

1. **submission-received.tsx** - Confirmation email
2. **submission-approved.tsx** - Approval notification
3. **submission-rejected.tsx** - Rejection notification with feedback

Each template receives `template_data` object with the fields described in the Features section above.

## Deployment

### Prerequisites
- Email service must be deployed and healthy
- ConfigMap must include EMAIL_API_URL
- Both crawler and moderation services must be updated

### Deployment Steps

1. **Commit Changes:**
```bash
git add apis/crawler-service/src/lib/email-client.ts
git add apis/crawler-service/src/routes/submit.ts
git add apis/crawler-service/.env
git add apis/moderation-service/src/lib/email-client.ts
git add apis/moderation-service/src/routes/moderation.ts
git add apis/moderation-service/.env
git add k8s/base/crawler-service.yaml
git add k8s/base/moderation-service.yaml
git commit -m "feat: add submission lifecycle email notifications"
```

2. **Push to Trigger Deployment:**
```bash
git push origin main
```

3. **Verify Deployment:**
- Check GitHub Actions workflow completes successfully
- Verify services restart in Kubernetes
- Check service logs for email queueing
- Test submission flow in production

## Monitoring

### Key Metrics to Monitor

1. **Email Queue Health:**
   - Queue size over time
   - Failed send attempts
   - Average time to send

2. **Service Health:**
   - Email service uptime
   - API response times
   - Error rates

3. **User Experience:**
   - Time from submission to email receipt
   - Email delivery success rate
   - User engagement with approval/rejection emails

### Logging

All email operations are logged with structured data:

```typescript
fastify.log.info('Queuing submission email', {
    userId,
    email: userData.email,
    emailType: 'submission-received',
    title,
    url
});
```

Check logs for:
- Email queueing confirmations
- Communication failures with email service
- Database query failures
- Missing user email addresses

## Future Enhancements

1. **Email Preferences:** Allow users to opt out of certain email types
2. **Retry Logic:** Implement exponential backoff for failed email sends
3. **Email Analytics:** Track open rates and click-through rates
4. **Batch Notifications:** Digest emails for multiple submissions
5. **Rich Email Content:** Include preview images and metadata in emails
6. **Status Updates:** Real-time submission status in user dashboard

## Related Documentation

- Email Service Implementation: `EMAIL_SERVICE_IMPLEMENTATION.md`
- Email Templates: `apis/email-service/src/templates/`
- Submission Flow: `CONTENT_SUBMISSION_FLOW.md`
- Moderation System: `MODERATION_SYSTEM.md`
- User Service Integration: See user-service email-client.ts for welcome/deletion emails

---

**Last Updated:** 2024-01-20  
**Version:** 1.0  
**Status:** ✅ Implementation Complete - Ready for Testing

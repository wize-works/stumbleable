# Email Integration Implementation

## Overview
This document describes the email triggers integrated into various services to send transactional and lifecycle emails to users.

## Implemented Email Triggers

### ✅ User Service Email Integrations

#### 1. Welcome Email
**Trigger**: When a new user account is created  
**Endpoint**: `POST /api/users`  
**Email Type**: `welcome`  
**Template Data**:
- `firstName`: User's first name (or email username if not provided)
- `email`: User's email address

**Code Location**: `apis/user-service/src/routes/users.ts` (line ~163)

**Implementation**:
```typescript
// Send welcome email (don't block response if email fails)
if (user.email) {
    EmailClient.sendWelcomeEmail(userId, user.email, finalUserData.fullName || undefined)
        .catch(err => {
            fastify.log.error({ error: err, userId, email: user.email }, 'Failed to queue welcome email');
        });
}
```

**When**: Immediately after user record is created in database

---

#### 2. Account Deletion Request Email
**Trigger**: When a user requests account deletion  
**Endpoint**: `POST /api/users/:userId/deletion-request`  
**Email Type**: `deletion-request`  
**Template Data**:
- `email`: User's email address
- `scheduledDeletionAt`: ISO timestamp of when account will be deleted (30 days)
- `deletionRequestId`: Unique ID for the deletion request

**Code Location**: `apis/user-service/src/routes/users.ts` (line ~320)

**Implementation**:
```typescript
// Send deletion request confirmation email (don't block response)
if (user.email) {
    EmailClient.sendDeletionRequestEmail(
        userId,
        user.email,
        deletionRequest.scheduledDeletionAt,
        deletionRequest.id
    ).catch(err => {
        fastify.log.error({ error: err, userId, email: user.email }, 'Failed to queue deletion request email');
    });
}
```

**When**: Immediately after deletion request is created and account is soft-deleted

---

#### 3. Account Deletion Cancelled Email
**Trigger**: When a user cancels their pending deletion request  
**Endpoint**: `POST /api/users/:userId/cancel-deletion`  
**Email Type**: `deletion-cancelled`  
**Template Data**:
- `firstName`: User's first name (or email username)
- `email`: User's email address

**Code Location**: `apis/user-service/src/routes/users.ts` (line ~370)

**Implementation**:
```typescript
// Send deletion cancelled email (don't block response)
if (result.email) {
    EmailClient.sendDeletionCancelledEmail(
        userId,
        result.email
    ).catch(err => {
        fastify.log.error({ error: err, userId, email: result.email }, 'Failed to queue deletion cancelled email');
    });
}
```

**When**: Immediately after deletion request is cancelled and account is restored

---

## Email Client Architecture

### Email Client Module
**Location**: `apis/user-service/src/lib/email-client.ts`

**Purpose**: Provides a simple interface for services to queue emails via the email service API.

**Key Methods**:
- `queueEmail(emailRequest)`: Generic method to queue any email
- `sendWelcomeEmail(userId, email, firstName)`: Queue welcome email
- `sendDeletionRequestEmail(...)`: Queue deletion request confirmation
- `sendDeletionCancelledEmail(...)`: Queue deletion cancelled notification
- `send7DayDeletionReminderEmail(...)`: Queue 7-day reminder (not yet used)
- `send1DayDeletionReminderEmail(...)`: Queue 1-day reminder (not yet used)
- `sendDeletionCompleteEmail(...)`: Queue deletion complete notification (not yet used)

**Configuration**:
- Uses `EMAIL_API_URL` environment variable (default: `http://email-service:8080`)
- Sends POST requests to `/api/send` endpoint of email service
- Errors are logged but don't block the main API response

---

## Environment Configuration

### Development (Local)
**User Service `.env`**:
```properties
EMAIL_API_URL=http://localhost:7006
```

### Production (Kubernetes)
**ConfigMap** (`k8s/base/configmap.yaml`):
```yaml
EMAIL_API_URL: "http://email-service:8080"
```

**User Service Deployment** (`k8s/base/user-service.yaml`):
```yaml
- name: EMAIL_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: EMAIL_API_URL
```

---

## Error Handling

All email triggers follow the same error handling pattern:

1. **Non-blocking**: Emails are queued asynchronously and don't block the API response
2. **Error logging**: Failures are logged with full context (userId, email, error)
3. **Graceful degradation**: If email service is unavailable, the main operation still succeeds
4. **Retry logic**: The email service's queue system handles retries (up to 3 attempts)

**Example**:
```typescript
EmailClient.sendWelcomeEmail(userId, email, firstName)
    .catch(err => {
        fastify.log.error({ 
            error: err, 
            userId, 
            email 
        }, 'Failed to queue welcome email');
    });
```

---

## Testing Email Triggers

### Test Welcome Email
```bash
# Create a new user via the API
curl -X POST http://localhost:7003/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{
    "userId": "user_test123",
    "userData": {
      "email": "test@example.com",
      "fullName": "Test User",
      "preferredTopics": ["technology"]
    }
  }'

# Check email queue
curl http://localhost:7006/api/queue/items?status=pending
```

### Test Deletion Request Email
```bash
# Request account deletion
curl -X POST http://localhost:7003/api/users/user_test123/deletion-request \
  -H "Authorization: Bearer <clerk-token>"

# Check email queue
curl http://localhost:7006/api/queue/items?email_type=deletion-request
```

### Test Deletion Cancelled Email
```bash
# Cancel deletion request
curl -X POST http://localhost:7003/api/users/user_test123/cancel-deletion \
  -H "Authorization: Bearer <clerk-token>"

# Check email queue
curl http://localhost:7006/api/queue/items?email_type=deletion-cancelled
```

---

## Monitoring

### Check Email Queue Status
```bash
curl http://localhost:7006/api/queue/status
```

**Response**:
```json
{
  "total": 42,
  "pending": 5,
  "sent": 35,
  "failed": 2
}
```

### Check Recent Emails
```bash
curl 'http://localhost:7006/api/queue/items?limit=10'
```

### View Logs
```bash
# User service logs (email queueing)
kubectl logs -n stumbleable -l app=user-service --tail=100

# Email service logs (email sending)
kubectl logs -n stumbleable -l app=email-service --tail=100
```

---

## Pending Email Integrations

### 🟡 Submission Emails (Content/Moderation Service)
- [ ] `submission-received`: When user submits content
- [ ] `submission-approved`: When content is approved by moderator
- [ ] `submission-rejected`: When content is rejected with feedback

### 🟢 Scheduled Emails (Email Service - Cron Jobs)
- [ ] `weekly-trending`: Weekly digest of popular content
- [ ] `weekly-new`: Weekly digest of new content
- [ ] `saved-digest`: Reminder of saved content
- [ ] `re-engagement`: Bring back inactive users

### 🟡 Deletion Reminder Emails (Background Job)
- [ ] `deletion-reminder-7d`: 7 days before deletion
- [ ] `deletion-reminder-1d`: 1 day before deletion
- [ ] `deletion-complete`: After account is permanently deleted

---

## Next Steps

1. **Deploy Changes**: Commit and push to trigger deployment
   ```bash
   git add .
   git commit -m "Integrate welcome and deletion emails in user service"
   git push origin main
   ```

2. **Test in Production**:
   - Create a test account and verify welcome email
   - Request deletion and verify confirmation email
   - Cancel deletion and verify cancellation email

3. **Add Submission Emails**: Integrate into content/moderation service
4. **Set Up Scheduled Emails**: Create cron jobs for weekly digests
5. **Add Deletion Reminders**: Background job to send reminders before permanent deletion

---

## Troubleshooting

### Issue: Emails not being sent
1. **Check email service is running**:
   ```bash
   kubectl get pods -n stumbleable -l app=email-service
   ```

2. **Check email service logs**:
   ```bash
   kubectl logs -n stumbleable -l app=email-service --tail=50
   ```

3. **Verify EMAIL_API_URL**:
   ```bash
   kubectl exec -n stumbleable <user-service-pod> -- env | grep EMAIL_API_URL
   ```

4. **Check email queue**:
   ```bash
   # From inside cluster
   kubectl run curl-test --rm -it --image=curlimages/curl -- \
     curl http://email-service:8080/api/queue/status
   ```

### Issue: User service can't reach email service
- Check that ConfigMap has `EMAIL_API_URL`
- Verify email service is accessible: `kubectl get svc -n stumbleable email-service`
- Test connectivity: `kubectl exec -n stumbleable <user-service-pod> -- wget -O- http://email-service:8080/health`

### Issue: Welcome email not triggered
- Check user service logs for "Failed to queue welcome email"
- Verify user has an email address (required)
- Check that `EmailClient.sendWelcomeEmail` is being called

---

## Related Documentation
- [Email Service Deployment](./EMAIL_SERVICE_DEPLOYMENT.md)
- [Email Queue Management](./EMAIL_QUEUE_MANAGEMENT.md)
- [Email Templates](../apis/email-service/README.md)

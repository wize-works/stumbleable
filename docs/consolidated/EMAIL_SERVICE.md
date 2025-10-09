# Email Service - Complete Documentation

**Last Updated:** October 9, 2025  
**Service Port:** 7006  
**Status:** ✅ Production Ready

> **Purpose:** The Email Service handles all email communications for Stumbleable, including transactional emails, notifications, digests, and user preferences management. Built with React Email templates and Resend API.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Email Templates](#email-templates)
- [API Endpoints](#api-endpoints)
- [Queue Management](#queue-management)
- [User Preferences](#user-preferences)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Service Design

The Email Service follows a **queue-based architecture**:
- **Send Endpoint:** Adds emails to queue immediately
- **Background Workers:** Process queue asynchronously
- **Preference Management:** Users control what emails they receive
- **Template System:** React Email components for consistent design
- **Delivery Provider:** Resend API for reliable delivery

### Service Communication

```typescript
Email Service (7006)
  ├─> Resend API - Email delivery
  ├─> Supabase - Email queue & preferences storage
  └─> User Service (7003) - User data lookup
```

### CORS Configuration

**Production CORS Fix (October 2025):**

The service now supports multiple origins via `ALLOWED_ORIGINS`:

```typescript
// src/server.ts
await app.register(cors, {
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
});
```

**Environment Variables:**
```bash
# Multiple domains (production)
ALLOWED_ORIGINS=https://stumbleable.com,https://www.stumbleable.com

# Single domain (development)
ALLOWED_ORIGINS=http://localhost:3000
```

**Kubernetes Configuration:**
```yaml
# k8s/base/email-service.yaml
env:
- name: ALLOWED_ORIGINS
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: ALLOWED_ORIGINS
- name: FRONTEND_URL  # Backward compatibility
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: FRONTEND_URL
```

---

## Email Templates

### Template System

All templates use **React Email** for consistent, maintainable design:

**Benefits:**
- ✅ Component-based architecture
- ✅ Type-safe template data
- ✅ Preview in development
- ✅ Inline SVG icons for compatibility
- ✅ Responsive design
- ✅ Dark mode support

### Available Templates

#### 1. Welcome Email

**Trigger:** New user signs up  
**File:** `src/templates/welcome.tsx`

```typescript
interface WelcomeEmailProps {
  firstName: string;
  userEmail: string;
  unsubscribeUrl: string;
}

// Usage:
await emailService.send({
  to: user.email,
  template: 'welcome',
  data: {
    firstName: user.firstName,
    userEmail: user.email,
    unsubscribeUrl: generateUnsubscribeUrl(user.id)
  }
});
```

**Content:**
- Welcome message with user's name
- Brief intro to Stumbleable features
- CTA: "Start Stumbling"
- Footer with unsubscribe link

---

#### 2. Submission Received

**Trigger:** User submits new content  
**File:** `src/templates/submission-received.tsx`

```typescript
interface SubmissionReceivedProps {
  firstName: string;
  submissionTitle: string;
  submissionUrl: string;
  reviewEstimate: string;
  unsubscribeUrl: string;
}
```

**Content:**
- Thank you message
- Submission details (title, URL)
- Estimated review time
- What happens next
- Link to submission guidelines

---

#### 3. Submission Approved

**Trigger:** Admin approves submitted content  
**File:** `src/templates/submission-approved.tsx`

```typescript
interface SubmissionApprovedProps {
  firstName: string;
  submissionTitle: string;
  submissionUrl: string;
  liveUrl: string;
  unsubscribeUrl: string;
}
```

**Content:**
- Congratulations message
- Link to live content on Stumbleable
- Share buttons
- Encouragement to submit more

---

#### 4. Submission Rejected

**Trigger:** Admin rejects submitted content  
**File:** `src/templates/submission-rejected.tsx`

```typescript
interface SubmissionRejectedProps {
  firstName: string;
  submissionTitle: string;
  submissionUrl: string;
  rejectionReason: string;
  guidelinesUrl: string;
  appealUrl: string;
  unsubscribeUrl: string;
}
```

**Content:**
- Polite rejection message
- Specific reason for rejection
- Link to community guidelines
- Option to appeal decision
- Tips for future submissions

**Recent Enhancement:** More detailed feedback with specific guideline violations highlighted.

---

#### 5. Weekly Digest

**Trigger:** Weekly job via Scheduler Service  
**File:** `src/templates/weekly-digest.tsx`

```typescript
interface WeeklyDigestProps {
  firstName: string;
  discoveries: Array<{
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    topics: string[];
  }>;
  unsubscribeUrl: string;
}
```

**Content:**
- Personalized greeting
- 5-10 curated discoveries based on user interests
- Topic chips for each item
- CTA: "Discover More"
- Stats: Your activity this week

---

#### 6. Moderation Alert

**Trigger:** Content reported or flagged  
**File:** `src/templates/moderation-alert.tsx`

```typescript
interface ModerationAlertProps {
  adminName: string;
  contentTitle: string;
  contentUrl: string;
  reportReason: string;
  reportedBy: string;
  reviewUrl: string;
}
```

**Content:**
- Alert that content needs review
- Report details
- Link to moderation dashboard
- Quick action buttons (approve/reject)

---

### Template Design Standards

**Visual Consistency:**
- **Colors:** CSS variables for theme consistency
- **Typography:** System fonts with fallbacks
- **Icons:** Inline SVG (no external dependencies)
- **Images:** Fallback for email clients that block images
- **Spacing:** Consistent padding/margins

**Email Client Compatibility:**
- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (web, desktop)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Mobile clients

**Best Practices:**
- Keep width ≤ 600px for mobile
- Use tables for layout (email client requirement)
- Inline all CSS
- Include plain text version
- Test in multiple clients before deploying

---

### SVG Icons Implementation

**Challenge:** Email clients often block external images, breaking icon display.

**Solution:** Inline SVG icons with base64 encoding:

```typescript
// src/lib/icons.tsx
export const CheckmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

// Usage in templates:
<CheckmarkIcon /> Submission approved!
```

**Icons Available:**
- Checkmark (success)
- X (error)
- Bell (notification)
- Star (featured)
- Bookmark (saved)
- Share (social)
- Info (help)

---

## API Endpoints

### Send Email

```http
POST /api/send
Content-Type: application/json
Authorization: Bearer <service-key>

{
  "to": "user@example.com",
  "template": "welcome",
  "data": {
    "firstName": "Alice",
    "userEmail": "user@example.com",
    "unsubscribeUrl": "https://stumbleable.com/unsubscribe/abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "queuedAt": "2025-10-09T12:34:56Z"
}
```

---

### Get User Preferences

```http
GET /api/preferences/:userId
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "preferences": {
    "weekly_digest": true,
    "submission_updates": true,
    "moderation_alerts": false,
    "product_updates": true
  },
  "email": "user@example.com",
  "updatedAt": "2025-10-09T10:00:00Z"
}
```

---

### Update User Preferences

```http
PUT /api/preferences/:userId
Content-Type: application/json
Authorization: Bearer <clerk-token>

{
  "preferences": {
    "weekly_digest": false,
    "submission_updates": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "weekly_digest": false,
    "submission_updates": true,
    "moderation_alerts": false,
    "product_updates": true
  }
}
```

---

### Get Queue Status

```http
GET /api/queue
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "pending": 45,
  "processing": 3,
  "completed": 1520,
  "failed": 12,
  "oldestPending": "2025-10-09T11:30:00Z"
}
```

---

### Get Job Status

```http
GET /api/jobs/:jobId
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "jobId": "job_abc123",
  "status": "completed",
  "emailsSent": 150,
  "emailsFailed": 5,
  "startedAt": "2025-10-09T12:00:00Z",
  "completedAt": "2025-10-09T12:15:00Z",
  "errors": [
    {
      "email": "bounced@example.com",
      "reason": "Invalid email address"
    }
  ]
}
```

---

## Queue Management

### Queue Architecture

Emails are processed asynchronously via a database queue:

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  template_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);
```

### Queue Processing

**Worker Process:**
```typescript
// Background worker (runs continuously)
async function processEmailQueue() {
  while (true) {
    // Get next batch (10 emails)
    const emails = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    // Process each email
    for (const email of emails) {
      try {
        await sendEmail(email);
        await markSent(email.id);
      } catch (error) {
        await markFailed(email.id, error.message);
      }
    }

    // Wait 5 seconds before next batch
    await sleep(5000);
  }
}
```

**Rate Limiting:**
- **Resend Limits:** 100 emails/second (API limit)
- **Our Limit:** 10 emails/5 seconds (conservative)
- **Retry Logic:** 3 attempts with exponential backoff

---

## User Preferences

### Preference Types

Users can control 4 types of emails:

1. **Weekly Digest** (`weekly_digest`)
   - Personalized content recommendations
   - Sent every Monday at 9am
   - Default: Enabled

2. **Submission Updates** (`submission_updates`)
   - Notifications about submitted content status
   - Includes approval, rejection, moderation
   - Default: Enabled

3. **Moderation Alerts** (`moderation_alerts`)
   - Admin-only: Content reports and flags
   - Default: Disabled (admin opt-in)

4. **Product Updates** (`product_updates`)
   - Feature announcements, blog posts
   - Default: Enabled

### Preference Management UI

**Frontend Component:**
```typescript
// app/email/preferences/page.tsx
export default function EmailPreferences() {
  const { user } = useUser();
  const [prefs, setPrefs] = useState({});

  const updatePref = async (key: string, value: boolean) => {
    await fetch(`${EMAIL_API}/api/preferences/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`
      },
      body: JSON.stringify({
        preferences: { [key]: value }
      })
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Email Preferences</h1>
      
      <label>
        <input 
          type="checkbox" 
          checked={prefs.weekly_digest}
          onChange={(e) => updatePref('weekly_digest', e.target.checked)}
        />
        Weekly Digest
      </label>
      
      {/* More preferences... */}
    </div>
  );
}
```

**Recent Enhancement:** Visual improvements with toggle switches, descriptions, and preview examples.

---

## Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-service
spec:
  replicas: 2  # Multiple instances for reliability
  template:
    spec:
      containers:
      - name: email-service
        image: stumbleable.azurecr.io/email-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        - name: HOST
          value: "0.0.0.0"
        - name: ALLOWED_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: stumbleable-config
              key: ALLOWED_ORIGINS
        - name: RESEND_API_KEY
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: RESEND_API_KEY
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: SUPABASE_URL
        - name: SUPABASE_SERVICE_KEY
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: SUPABASE_SERVICE_KEY
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: email-service
spec:
  type: ClusterIP
  ports:
  - port: 7006
    targetPort: 8080
  selector:
    app: email-service
```

---

## Testing

### Local Testing

**Start Service:**
```bash
cd apis/email-service
npm run dev
```

**Send Test Email:**
```bash
curl -X POST http://localhost:7006/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "welcome",
    "data": {
      "firstName": "Test",
      "userEmail": "test@example.com",
      "unsubscribeUrl": "https://stumbleable.com/unsubscribe/test"
    }
  }'
```

### Template Preview

React Email provides a dev server for previewing templates:

```bash
cd apis/email-service
npm run email:dev
```

Opens browser at `http://localhost:3001` with live template previews.

### Integration Testing

**Test Scripts:**
```bash
# Test all templates
npm run test:templates

# Test queue processing
npm run test:queue

# Test preference management
npm run test:preferences
```

**Manual Test Flow:**
1. Sign up new user → Check welcome email
2. Submit content → Check submission received email
3. Approve submission → Check approval email
4. Update preferences → Verify no unwanted emails
5. Trigger weekly digest job → Check digest email

---

## Troubleshooting

### Common Issues

#### 1. CORS Error: "blocked by CORS policy"

**Symptoms:** Frontend can't call `/api/preferences` in production.

**Problem:** Service configured with `FRONTEND_URL=http://localhost:3000`.

**Solution:** Use `ALLOWED_ORIGINS` with multiple domains:

```yaml
# k8s/base/email-service.yaml
- name: ALLOWED_ORIGINS
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: ALLOWED_ORIGINS
```

```bash
# ConfigMap
kubectl create configmap stumbleable-config \
  --from-literal=ALLOWED_ORIGINS="https://stumbleable.com,https://www.stumbleable.com"
```

**Verification:**
```bash
curl -I https://stumbleable.com/api/preferences/123 \
  -H "Origin: https://stumbleable.com"
# Should include: Access-Control-Allow-Origin: https://stumbleable.com
```

**Fixed:** October 9, 2025

---

#### 2. ES Modules Error: "Cannot use import outside a module"

**Problem:** TypeScript compiling to CommonJS, but imports use ESM syntax.

**Solution:** Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

And `package.json`:
```json
{
  "type": "module"
}
```

---

#### 3. Template Rendering Fails

**Symptoms:** Email sent but appears broken/unstyled.

**Debugging:**
```bash
# Test template rendering locally
npm run test:render -- --template=welcome

# Check logs for errors
kubectl logs -f deployment/email-service | grep ERROR
```

**Common Causes:**
- Missing props in template data
- SVG icons not inlined
- CSS not properly inlined
- Image URLs broken

**Solutions:**
- Validate template data with Zod schemas
- Use React Email's `<Img>` component with fallbacks
- Test in multiple email clients

---

#### 4. Emails Not Sending

**Symptoms:** Queue grows but emails never sent.

**Debugging:**
```bash
# Check queue status
curl http://localhost:7006/api/queue \
  -H "Authorization: Bearer <admin-token>"

# Check worker logs
kubectl logs -f deployment/email-service | grep "Processing email"

# Check Resend API status
curl https://api.resend.com/v1/status
```

**Common Causes:**
- Invalid Resend API key
- Rate limit exceeded
- Email addresses bouncing
- Worker not running

**Solutions:**
- Verify `RESEND_API_KEY` environment variable
- Check Resend dashboard for errors
- Implement retry logic with exponential backoff
- Ensure background worker is running

---

#### 5. Logger Errors: "fastify.log is not a function"

**Problem:** Pino logger not properly initialized in Fastify.

**Solution:**
```typescript
// src/server.ts
import Fastify from 'fastify';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

const app = Fastify({ logger });

// Now you can use:
app.log.info('Server started');
```

---

## Related Documentation

- **Scheduler Service:** [consolidated/SCHEDULER_SERVICE.md](./SCHEDULER_SERVICE.md)
- **User Service:** User preferences integration
- **Admin Dashboard:** Email job management
- **React Email:** [https://react.email](https://react.email)
- **Resend Docs:** [https://resend.com/docs](https://resend.com/docs)

---

**Maintenance:** This document consolidates 15+ separate email-related docs. For historical details, see `docs/archive/email/`.

**Last Updated:** October 9, 2025  
**Maintainer:** Development Team

# Moderation Service - Complete Documentation

**Last Updated:** October 9, 2025  
**Service Port:** 7007  
**Status:** ✅ Production Ready

> **Purpose:** The Moderation Service manages content review workflows, trust scoring, user reports, and automated moderation decisions. It provides both admin review tools and automated filtering capabilities.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Trust & Scoring System](#trust--scoring-system)
- [Content Review Workflow](#content-review-workflow)
- [Reporting System](#reporting-system)
- [API Endpoints](#api-endpoints)
- [Admin UI](#admin-ui)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Service Design

The Moderation Service implements a **three-tier approach**:
1. **Automated Filtering:** Pre-screening before human review
2. **Trust Scoring:** Reputation system for users and domains
3. **Manual Review:** Admin tools for final decisions

### Service Communication

```typescript
Moderation Service (7007)
  ├─> Discovery Service (7001) - Content metadata
  ├─> User Service (7003) - User reputation data
  ├─> Email Service (7006) - Status notifications
  └─> Supabase - Moderation queue & reports
```

### Core Principles

- **Transparency:** Clear reasons for decisions
- **User Empowerment:** Easy reporting and appeals
- **Admin Efficiency:** Bulk actions, filters, keyboard shortcuts
- **Trust Building:** Reward quality contributors

---

## Trust & Scoring System

### Domain Trust Scores

Every domain gets a trust score (0-100) based on:

```typescript
interface DomainTrustFactors {
  age: number;              // Domain age in years (max 10 points)
  backlinks: number;        // Quality backlinks (max 20 points)
  submissions: number;      // Total submissions (max 15 points)
  approvalRate: number;     // % approved (max 25 points)
  userReports: number;      // Negative reports (minus points)
  userFeedback: number;     // Like/skip ratio (max 30 points)
}

// Score calculation:
const trustScore = Math.min(100, 
  (age * 1) +
  (Math.log(backlinks) * 5) +
  (Math.log(submissions) * 3) +
  (approvalRate * 25) +
  (userFeedback * 30) -
  (userReports * 10)
);
```

**Trust Tiers:**
- **90-100:** Verified (auto-approve)
- **70-89:** Trusted (fast-track review)
- **40-69:** Standard (normal review)
- **20-39:** Suspicious (thorough review)
- **0-19:** Blocked (auto-reject)

**Score Updates:**
- Recalculated daily via scheduler job
- Updated immediately after user feedback
- Admin can manually override scores

---

### User Trust Scores

Users also receive trust scores based on submission quality:

```typescript
interface UserTrustFactors {
  submissionsTotal: number;
  submissionsApproved: number;
  submissionsRejected: number;
  accountAge: number;        // Days since signup
  reportsReceived: number;   // Reports against their content
  reportsFiled: number;      // Reports they filed (accuracy matters)
}

// User score calculation:
const userScore = Math.min(100,
  ((submissionsApproved / submissionsTotal) * 40) +
  (Math.min(accountAge / 365, 1) * 20) +
  (Math.log(submissionsTotal + 1) * 10) -
  (reportsReceived * 5) +
  (reportAccuracy * 30)
);
```

**Benefits by Tier:**
- **80-100:** Auto-approve submissions (bypass queue)
- **60-79:** Priority review
- **40-59:** Standard review
- **0-39:** All submissions manually reviewed

---

## Content Review Workflow

### Submission States

```typescript
type SubmissionStatus = 
  | 'pending'      // Awaiting review
  | 'approved'     // Live on site
  | 'rejected'     // Declined with reason
  | 'flagged';     // User-reported, needs re-review
```

### Review Process

**1. Submission → Automated Screening:**
```typescript
async function screenSubmission(submission: Submission) {
  // Check domain trust
  const domain = extractDomain(submission.url);
  const domainScore = await getDomainTrustScore(domain);
  
  if (domainScore >= 90) {
    return autoApprove(submission, 'Verified domain');
  }
  
  if (domainScore <= 19) {
    return autoReject(submission, 'Blocked domain');
  }
  
  // Check user trust
  const userScore = await getUserTrustScore(submission.userId);
  
  if (userScore >= 80 && domainScore >= 70) {
    return autoApprove(submission, 'Trusted user + good domain');
  }
  
  // Send to manual review queue
  return queueForReview(submission);
}
```

**2. Manual Review → Decision:**
```typescript
async function reviewSubmission(submissionId: string, decision: 'approve' | 'reject', reason?: string) {
  const submission = await getSubmission(submissionId);
  
  if (decision === 'approve') {
    // Publish to discovery feed
    await publishToDiscovery(submission);
    
    // Update trust scores
    await incrementDomainScore(submission.domain);
    await incrementUserScore(submission.userId);
    
    // Notify submitter
    await emailService.send({
      to: submission.userEmail,
      template: 'submission-approved',
      data: { /* ... */ }
    });
  } else {
    // Record rejection
    await markRejected(submissionId, reason);
    
    // Update trust scores (negative)
    await decrementScores(submission);
    
    // Notify with feedback
    await emailService.send({
      to: submission.userEmail,
      template: 'submission-rejected',
      data: { reason, /* ... */ }
    });
  }
}
```

**3. User Reports → Re-review:**
```typescript
async function handleUserReport(contentId: string, reportData: Report) {
  const content = await getContent(contentId);
  
  // Increment report count
  await incrementReports(contentId);
  
  // If threshold exceeded, flag for review
  if (content.reportCount >= 5) {
    await flagForReview(contentId, 'Multiple user reports');
    
    // Optionally hide from feed pending review
    if (content.reportCount >= 10) {
      await hideFromFeed(contentId);
    }
  }
  
  // Notify admins
  await emailService.send({
    to: 'moderation@stumbleable.com',
    template: 'moderation-alert',
    data: { content, report: reportData }
  });
}
```

---

## Reporting System

### Report Types

Users can report content for various reasons:

```typescript
enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  MISLEADING = 'misleading',
  BROKEN_LINK = 'broken_link',
  DUPLICATE = 'duplicate',
  COPYRIGHT = 'copyright',
  OTHER = 'other'
}
```

### Report Schema

```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES discoveries(id),
  reported_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_reports_content ON content_reports(content_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
```

### Report Workflow

**User Reports Content:**
```typescript
// Frontend: /stumble page
const reportContent = async () => {
  await fetch(`${MODERATION_API}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getToken()}`
    },
    body: JSON.stringify({
      contentId: currentDiscovery.id,
      reason: 'spam',
      details: 'This is clearly promotional spam'
    })
  });
  
  toast.success('Report submitted. Thank you!');
};
```

**Admin Reviews Report:**
```typescript
// Admin dashboard: /admin/reports
const resolveReport = async (reportId: string, action: 'remove' | 'keep') => {
  if (action === 'remove') {
    // Remove from discovery feed
    await removeContent(report.contentId);
    
    // Update domain/user scores
    await decrementScores(report.contentId);
    
    // Notify original submitter
    await emailService.send({
      to: report.submitterEmail,
      template: 'content-removed',
      data: { reason: report.reason }
    });
  }
  
  // Mark report as resolved
  await markResolved(reportId, action);
  
  // Update reporter's accuracy score
  await updateReporterAccuracy(report.reportedBy, action === 'remove');
};
```

---

## API Endpoints

### Submit Content for Review

```http
POST /api/submissions
Content-Type: application/json
Authorization: Bearer <clerk-token>

{
  "url": "https://example.com/article",
  "title": "Amazing Article",
  "description": "A great read about...",
  "topics": ["technology", "design"]
}
```

**Response:**
```json
{
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimatedReviewTime": "2-4 hours",
  "message": "Your submission is in the review queue"
}
```

---

### Get Pending Submissions (Admin)

```http
GET /api/submissions?status=pending&limit=50
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "submissions": [
    {
      "id": "...",
      "url": "...",
      "title": "...",
      "submittedBy": "...",
      "submittedAt": "...",
      "domainTrustScore": 65,
      "userTrustScore": 72
    }
  ],
  "total": 234,
  "page": 1
}
```

---

### Approve/Reject Submission (Admin)

```http
POST /api/submissions/:id/review
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "decision": "approve",
  "reason": "High quality content, relevant topics"
}
```

**Response:**
```json
{
  "success": true,
  "status": "approved",
  "publishedAt": "2025-10-09T12:34:56Z"
}
```

---

### Report Content

```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer <clerk-token>

{
  "contentId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "spam",
  "details": "Promotional content with affiliate links"
}
```

**Response:**
```json
{
  "reportId": "abc-123",
  "status": "pending",
  "message": "Thank you for reporting. We'll review this shortly."
}
```

---

### Get Reports (Admin)

```http
GET /api/reports?status=pending&limit=50
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "reports": [
    {
      "id": "...",
      "contentId": "...",
      "contentTitle": "...",
      "reason": "spam",
      "details": "...",
      "reportedBy": "...",
      "reportedAt": "...",
      "reportCount": 3
    }
  ],
  "total": 12
}
```

---

## Admin UI

### Moderation Dashboard

**Location:** `/admin/moderation`

**Features:**
- **Queue View:** All pending submissions
- **Bulk Actions:** Approve/reject multiple at once
- **Filters:** By domain, user, trust score, date
- **Keyboard Shortcuts:** `A` = approve, `R` = reject, `↑/↓` = navigate
- **Preview:** Iframe preview of content (with CSP fallback)

**Recent Enhancements:**
- ✅ Visual layout improvements with thumbnails
- ✅ Trust score badges (color-coded)
- ✅ Quick action buttons
- ✅ Rejection feedback modal with predefined reasons
- ✅ Bulk select with checkboxes

---

### Reports Dashboard

**Location:** `/admin/reports`

**Features:**
- **Active Reports:** Content flagged by users
- **Report Details:** Reason, reporter, content preview
- **Quick Actions:** Remove content or dismiss report
- **Report Grouping:** Multiple reports for same content grouped
- **Resolution Tracking:** History of decisions

---

### Trust Score Management

**Location:** `/admin/trust-scores`

**Features:**
- **Domain Scores:** View and manually adjust domain trust
- **User Scores:** Track user submission quality
- **Recalculate:** Trigger manual score recalculation
- **Override:** Admin can set custom scores

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
  name: moderation-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: moderation-service
        image: stumbleable.azurecr.io/moderation-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        - name: HOST
          value: "0.0.0.0"
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stumbleable-secrets
              key: CLERK_SECRET_KEY
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
        readinessProbe:
          httpGet:
            path: /health
            port: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: moderation-service
spec:
  type: ClusterIP
  ports:
  - port: 7007
    targetPort: 8080
  selector:
    app: moderation-service
```

---

## Testing

### Local Testing

```bash
cd apis/moderation-service
npm run dev
```

**Test Submission:**
```bash
curl -X POST http://localhost:7007/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "url": "https://example.com/test",
    "title": "Test Article",
    "topics": ["technology"]
  }'
```

**Test Report:**
```bash
curl -X POST http://localhost:7007/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "contentId": "550e8400-e29b-41d4-a716-446655440000",
    "reason": "spam"
  }'
```

### Integration Testing

**Test Trust Scoring:**
```javascript
// test-trust-scoring.js
const { calculateDomainScore, calculateUserScore } = require('./lib/scoring');

// Test domain with good metrics
const goodDomain = {
  age: 5,
  backlinks: 1000,
  submissions: 50,
  approvalRate: 0.95,
  userReports: 0,
  userFeedback: 0.85
};

console.log('Good domain score:', calculateDomainScore(goodDomain));
// Expected: ~85-95

// Test domain with poor metrics
const badDomain = {
  age: 0.5,
  backlinks: 10,
  submissions: 5,
  approvalRate: 0.4,
  userReports: 8,
  userFeedback: 0.2
};

console.log('Bad domain score:', calculateDomainScore(badDomain));
// Expected: ~10-20
```

---

## Troubleshooting

### Common Issues

#### 1. Auth 401 Errors

**Symptoms:** Admin actions return 401 Unauthorized.

**Problem:** Clerk authentication not properly configured.

**Solution:**
```typescript
// src/lib/auth.ts
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function verifyAdmin(token: string) {
  const session = await clerkClient.sessions.verifySession(token);
  const user = await clerkClient.users.getUser(session.userId);
  
  // Check admin role
  if (user.publicMetadata.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}
```

**Fixed:** October 2025

---

#### 2. Schema Validation Errors

**Symptoms:** Submissions fail with "Invalid schema" error.

**Problem:** Zod schema mismatch between frontend and backend.

**Solution:** Ensure schemas match:

```typescript
// Shared schema (in both frontend and backend)
const SubmissionSchema = z.object({
  url: z.string().url(),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  topics: z.array(z.string()).min(1).max(5)
});
```

---

#### 3. Trust Scores Not Updating

**Symptoms:** Scores remain static after approvals/rejections.

**Debugging:**
```bash
# Check scheduler job status
curl http://localhost:7005/api/jobs?type=recalculate_trust

# Manually trigger recalculation
curl -X POST http://localhost:7007/api/trust-scores/recalculate \
  -H "Authorization: Bearer <admin-token>"
```

**Common Causes:**
- Scheduler job not running
- Database connection issues
- Score calculation logic error

---

## Related Documentation

- **Admin Dashboard:** [ADMIN_DASHBOARD_IMPLEMENTATION.md](../ADMIN_DASHBOARD_IMPLEMENTATION.md)
- **Content Submission:** [IFRAME_PREVIEW_ON_SUBMIT.md](../IFRAME_PREVIEW_ON_SUBMIT.md)
- **Email Notifications:** [consolidated/EMAIL_SERVICE.md](./EMAIL_SERVICE.md)
- **Trust System:** [TRUST_MODERATION_IMPLEMENTATION_SUMMARY.md](../TRUST_MODERATION_IMPLEMENTATION_SUMMARY.md)

---

**Maintenance:** This document consolidates 8+ separate moderation-related docs. For historical details, see `docs/archive/moderation/`.

**Last Updated:** October 9, 2025  
**Maintainer:** Development Team

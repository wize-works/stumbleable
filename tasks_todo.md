# Stumbleable - Tasks & Roadmap

Last Updated: October 2, 2025

---

## 🔥 High Priority

### 1. Background Deletion Job - Automated processing after 30 days
**Status:** Not Started  
**Effort:** Medium (2-3 days)  
**Owner:** Unassigned

**Description:**
Implement automated background job to process pending account deletions after the 30-day grace period expires.

**Requirements:**
- Scheduled job (cron or cloud function) runs daily
- Queries `deletion_requests` table for pending requests past `scheduled_deletion_at`
- For each expired request:
  - Call `repository.completeDeletion(requestId)`
  - Hard delete user and all associated data
  - Mark deletion request as `completed`
  - Log completion for audit trail
- Error handling and retry logic
- Monitoring and alerting for failures

**Technical Approach:**
- Option A: Node.js cron job in separate service
- Option B: Supabase Edge Function with pg_cron
- Option C: GitHub Actions scheduled workflow

**Acceptance Criteria:**
- [ ] Job runs automatically every day at 2 AM UTC
- [ ] Processes all deletions past 30-day grace period
- [ ] Logs all deletions with timestamps
- [ ] Sends completion confirmation (see task #2)
- [ ] Handles errors gracefully with retries
- [ ] Monitoring dashboard shows job health

**Related:**
- Depends on Email Notifications (#2) for user confirmation
- Database migration already complete (004_create_deletion_requests)

---

### 2. Email Service & Notifications - Complete email integration system
**Status:** Not Started  
**Effort:** Large (5-7 days)  
**Owner:** Unassigned

**Description:**
Comprehensive email notification system covering user lifecycle, account management, content updates, and discovery engagement.

**Email Categories:**

**A) Account Lifecycle Emails**
1. **Welcome Email** - Sent immediately on sign-up
   - Welcome message and brand introduction
   - Quick start guide (how to stumble)
   - Set preferences CTA
   - Community guidelines link

2. **Onboarding Series** (optional future enhancement)
   - Day 1: Welcome + first stumble tips
   - Day 3: Discovery features overview
   - Day 7: Share your favorites reminder

**B) Account Deletion Lifecycle**
1. **Deletion Request Confirmation**
   - Sent: Immediately after deletion request
   - Content: Confirmation of request, 30-day timeline, cancellation link
   - CTA: "Cancel Deletion" button

2. **Deletion Reminder Emails**
   - 7 days before: "Your account will be deleted in 7 days"
   - 1 day before: "Final reminder - deletion tomorrow"
   - Content: Days remaining, cancellation link, export data reminder
   - CTA: "Keep My Account" button

3. **Deletion Completion**
   - Sent: After permanent deletion completes
   - Content: Confirmation that all data has been deleted
   - Note: "We're sorry to see you go, come back anytime"

4. **Cancellation Confirmation**
   - Sent: When user cancels deletion request
   - Content: Account restored, preferences intact
   - CTA: "Go to Dashboard" button

**C) Weekly Discovery Emails**
1. **Weekly Trending Discoveries** - Every Monday at 10 AM user timezone
   - Subject: "🔥 This Week's Top 5 Trending Discoveries"
   - Top 5 most popular discoveries from past 7 days
   - Based on like ratio, shares, and saves
   - Thumbnail images, titles, descriptions
   - One-click stumble to each
   - Stats: "X people loved this"

2. **Weekly New Discoveries** - Every Thursday at 10 AM user timezone
   - Subject: "✨ 5 Fresh Discoveries Just Added"
   - 5 newest approved discoveries from past 7 days
   - Based on approval date
   - Quality filtered (not flagged/reported)
   - Preview images, titles, descriptions
   - "Be among the first to discover"

**D) Content Submission Emails**
1. **Submission Received**
   - Sent: Immediately after content submission
   - Confirmation of submission with details
   - Expected review timeline (24-48 hours)
   - Guidelines reminder

2. **Content Approved**
   - Sent: When moderator approves submission
   - Congratulations message
   - Link to view in discovery feed
   - Encourage sharing

3. **Content Rejected**
   - Sent: When moderator rejects submission
   - Polite explanation with reason
   - Guidelines reference
   - Encourage resubmission if fixable

**E) Engagement & Re-engagement**
1. **Saved Content Digest** - Optional, user preference
   - Weekly summary of saved discoveries
   - "Your collection is growing" message
   - Quick links to saved items
   - Reminder to organize into lists (future)

2. **Inactivity Re-engagement** - If no activity for 14 days
   - Subject: "We miss you! Here's what's new"
   - Highlight of trending discoveries
   - New features announcement
   - Personalized suggestions based on past likes

**F) Administrative Emails**
1. **Contact Form Response**
   - Sent: After user submits contact form
   - Confirmation of receipt
   - Expected response time
   - Ticket number for reference

2. **Policy Updates**
   - Major privacy policy changes
   - Terms of service updates
   - Require acknowledgment for major changes

**Technical Stack:**
- **Email Service:** Resend (modern, developer-friendly, great deliverability)
- **Template Engine:** React Email (JSX-based, type-safe, preview support)
- **Queue System:** Supabase-based queue table for reliability
- **Scheduling:** Supabase pg_cron or dedicated scheduler service

**Infrastructure:**

**Email Service (New microservice: `email-service`)**
```
apis/email-service/
├── src/
│   ├── server.ts              # Fastify server
│   ├── types.ts               # Email types
│   ├── lib/
│   │   ├── resend.ts          # Resend client
│   │   ├── supabase.ts        # Database client
│   │   ├── queue.ts           # Email queue manager
│   │   └── scheduler.ts       # Weekly email scheduler
│   ├── routes/
│   │   ├── send.ts            # POST /api/send (trigger emails)
│   │   ├── preferences.ts     # GET/PUT /api/preferences/:userId
│   │   └── scheduled.ts       # GET /api/scheduled/trigger (cron endpoint)
│   └── templates/
│       ├── welcome.tsx
│       ├── deletion-*.tsx
│       ├── weekly-trending.tsx
│       ├── weekly-new.tsx
│       ├── submission-*.tsx
│       └── components/
│           ├── EmailLayout.tsx
│           ├── Button.tsx
│           └── DiscoveryCard.tsx
├── package.json
└── tsconfig.json
```

**Database Schema:**

```sql
-- Email queue for reliability
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email preferences
CREATE TABLE email_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    welcome_email BOOLEAN DEFAULT true,
    weekly_trending BOOLEAN DEFAULT true,
    weekly_new BOOLEAN DEFAULT true,
    saved_digest BOOLEAN DEFAULT false,
    submission_updates BOOLEAN DEFAULT true,
    re_engagement BOOLEAN DEFAULT true,
    account_notifications BOOLEAN DEFAULT true,
    unsubscribed_all BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs for audit trail
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    resend_id VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
```

**Requirements:**
- Professional HTML email templates using React Email
- Plain text fallbacks (Resend handles this)
- Unsubscribe footer (required by CAN-SPAM)
- One-click unsubscribe link in headers (RFC 8058)
- Email preference center page in UI
- Click tracking for analytics
- Retry logic with exponential backoff
- Comprehensive logging for audit trail
- Rate limiting (prevent spam)
- Preview mode for development

**Acceptance Criteria:**
- [x] Email service running on port 7006
- [x] Resend API integration working
- [x] All 12 email types implemented with templates (welcome, weekly-trending, weekly-new, deletion-request, deletion-reminder, deletion-complete, deletion-cancelled, submission-received, submission-approved, submission-rejected, saved-digest, re-engagement)
- [x] Templates are mobile-responsive
- [x] Plain text versions generated (React Email handles automatically)
- [x] Queue system processes emails reliably
- [x] Failed emails retry with backoff
- [x] Weekly emails sent via cron/scheduler
- [x] Database migration applied (email_queue, email_preferences, email_logs)
- [x] React Email template integration complete
- [ ] **Email sending verification (Resend account temporarily blocked - pending reactivation)**
  - [ ] Background processor runs every 60 seconds
  - [ ] Picks up pending emails from queue
  - [ ] Renders React Email templates to HTML
  - [ ] Sends via Resend API
  - [ ] Updates status to 'sent' and logs to email_logs table
  - [ ] Verifies email delivery in inbox
- [ ] Email preferences page in UI
- [x] Unsubscribe links work correctly (included in all templates)
- [ ] Users can manage preferences
- [x] Email logs track delivery status
- [ ] Analytics track open/click rates (logging in place, analytics pending)
- [x] Compliant with CAN-SPAM and GDPR
- [x] Preview mode for testing templates (npm run email:dev)
- [x] Documentation for adding new email types

**Integration Points:**
- User Service: Create preferences on user signup
- Background Deletion Job: Trigger deletion emails
- Moderation Service: Trigger submission status emails
- Discovery Service: Query trending/new discoveries
- Interaction Service: Query saved content for digests
- Frontend: Email preference center page

**Environment Variables:**
```env
# Email Service
RESEND_API_KEY=re_xxx
EMAIL_FROM_ADDRESS=noreply@stumbleable.com
EMAIL_FROM_NAME=Stumbleable
FRONTEND_URL=https://stumbleable.com
UNSUBSCRIBE_URL=https://stumbleable.com/email/unsubscribe
```

**Related:**
- Works with Background Deletion Job (#1)
- Integrates with all other services
- Requires new frontend pages for preferences/unsubscribe
- Foundation for future notification features

---

### 3. Testing - End-to-end testing of all features
**Status:** Not Started  
**Effort:** Large (4-5 days)  
**Owner:** Unassigned

**Description:**
Comprehensive testing of all data rights features to ensure reliability and compliance.

**Test Categories:**

**Unit Tests:**
- [ ] User Service: deletion request CRUD operations
- [ ] Repository: soft delete, hard delete, cancellation
- [ ] API endpoints: authentication, validation, error handling
- [ ] Frontend: data export, deletion forms, API calls

**Integration Tests:**
- [ ] Full deletion flow: request → soft delete → grace period → hard delete
- [ ] Cancellation flow: request → cancel → restore account
- [ ] Export flow: fetch data → format → download
- [ ] Email flow: trigger → queue → send → confirm

**End-to-End Tests (Playwright/Cypress):**
- [ ] User requests deletion from dashboard
- [ ] User downloads data export (JSON and CSV)
- [ ] User cancels deletion during grace period
- [ ] User cannot access account after soft delete
- [ ] Background job completes deletion after 30 days
- [ ] Email notifications received at correct times

**Security Tests:**
- [ ] Cannot access other users' deletion requests
- [ ] Cannot export other users' data
- [ ] JWT tokens validated correctly
- [ ] SQL injection protection
- [ ] CSRF protection on state-changing operations

**Performance Tests:**
- [ ] Data export completes in <5 seconds for 10k items
- [ ] Deletion request creates within 1 second
- [ ] Background job processes 1000 deletions in <5 minutes

**Compliance Tests:**
- [ ] Export includes all required GDPR data
- [ ] 30-day deletion timeline enforced
- [ ] User can cancel deletion during grace period
- [ ] Privacy policy accurately describes processes

**Acceptance Criteria:**
- [ ] 90%+ code coverage on critical paths
- [ ] All tests pass consistently
- [ ] CI/CD pipeline runs tests automatically
- [ ] Performance benchmarks documented
- [ ] Security audit completed
- [ ] Compliance checklist validated

**Tools:**
- Unit: Jest, Vitest
- Integration: Supertest, Testcontainers
- E2E: Playwright or Cypress
- Load: k6 or Artillery

---

## 🟡 Medium Priority

### 4. Admin Dashboard - View/manage deletion requests
**Status:** ✅ COMPLETE  
**Effort:** Medium (3-4 days)  
**Owner:** GitHub Copilot  
**Completed:** January 18, 2025

**Description:**
Administrative interface for support team to view, manage, and monitor account deletion requests.

**Features:**

**View Deletion Requests:**
- List all deletion requests with filters:
  - Status: Pending, Cancelled, Completed
  - Date range: Last 7/30/90 days
  - Search by user email or ID
- Sortable columns: Request date, Scheduled date, Status
- Pagination for large lists

**Request Details:**
- User information (email, ID, join date)
- Request timeline:
  - Requested at
  - Scheduled deletion at
  - Days remaining in grace period
  - Cancelled at (if applicable)
  - Completed at (if applicable)
- Reason for deletion (if user provided)
- Last login date
- Interaction count

**Admin Actions:**
- Manually cancel deletion (with reason)
- Extend grace period (emergency only)
- Force immediate deletion (admin only, requires 2FA)
- Export deletion audit log
- Send reminder email manually
- Add notes to deletion request

**Analytics Dashboard:**
- Deletion request trends (daily/weekly/monthly)
- Cancellation rate
- Average time before cancellation
- Top deletion reasons
- Retention metrics

**Security:**
- Admin/Moderator role required (RBAC)
- All actions logged for audit trail
- 2FA required for force deletions
- Rate limiting on admin actions

**UI/UX:**
- Clean table layout with status badges
- Color-coded grace period indicators:
  - Green: 20+ days remaining
  - Yellow: 10-19 days remaining
  - Orange: 3-9 days remaining
  - Red: 1-2 days remaining
- Quick action buttons
- Bulk operations (export, notify)

**Acceptance Criteria:**
- [ ] Admin can view all deletion requests
- [ ] Filtering and search work correctly
- [ ] Admin can cancel deletions with reason
- [ ] All actions logged for audit
- [ ] Analytics charts display correctly
- [ ] RBAC enforced (admin/moderator only)
- [ ] Mobile-responsive design

**Related:**
- Requires role-based access control (already implemented)
- May need new API endpoints in user-service

---

### 5. Self-Service Cancel - In-app cancellation button
**Status:** Not Started  
**Effort:** Small (1-2 days)  
**Owner:** Unassigned

**Description:**
Allow users to cancel their deletion request directly from the app during the grace period, without needing to contact support.

**Features:**

**Cancellation Page (`/account-recovery`):**
- Detect if user has pending deletion request
- Display deletion information:
  - Request date
  - Days remaining until deletion
  - Scheduled deletion date
- Countdown timer showing time remaining
- Clear "Keep My Account" button
- Confirmation modal before cancellation
- Success message after cancellation

**Email Integration:**
- "Cancel Deletion" link in emails
- Magic link authentication (signed token)
- Redirects to cancellation page
- Pre-fills cancellation reason (optional)

**User Flow:**
1. User receives reminder email
2. Clicks "Keep My Account" button
3. Redirects to app (authenticated via magic link)
4. Shows account status and countdown
5. User confirms cancellation
6. Account restored immediately
7. Confirmation email sent
8. Redirect to dashboard

**Technical:**
- New route: `/account-recovery`
- Magic link token generation and validation
- API: Already implemented `UserAPI.cancelDeletion()`
- Real-time countdown component
- Error handling for expired tokens

**UI Components:**
- Countdown timer with progress ring
- Status badge (days remaining)
- Timeline visualization
- Success animation on cancellation
- Error states for expired/invalid tokens

**Acceptance Criteria:**
- [ ] Page shows correct deletion status
- [ ] Countdown timer updates in real-time
- [ ] Cancellation button works correctly
- [ ] Magic link authentication works
- [ ] Success confirmation displayed
- [ ] User can immediately use their account
- [ ] Cancellation email sent
- [ ] Mobile responsive

**Related:**
- Backend API already complete (Task #2 done)
- Depends on Email Notifications (#2) for magic links

---

### 6. Export Scheduling - Automatic exports
**Status:** Not Started  
**Effort:** Medium (2-3 days)  
**Owner:** Unassigned

**Description:**
Allow users to schedule automatic data exports on a recurring basis (weekly, monthly, quarterly).

**Features:**

**Export Schedule Configuration:**
- Frequency options:
  - Weekly (every Monday)
  - Monthly (1st of month)
  - Quarterly (1st of Jan/Apr/Jul/Oct)
- Format preference: JSON or CSV
- Delivery method:
  - Download link via email
  - Direct email attachment (if small)
  - Cloud storage (Google Drive, Dropbox) integration
- Enable/disable scheduled exports
- Maximum retention: Keep last 12 exports

**User Interface:**
- New section in `/data-export` page
- "Schedule Automatic Exports" card
- Toggle to enable/disable
- Frequency dropdown
- Format selection (JSON/CSV)
- Delivery method selection
- Last export date/time
- Next scheduled export date
- Export history (last 12 exports)
- Download past exports

**Backend:**
- New table: `export_schedules`
  - user_id
  - frequency (weekly/monthly/quarterly)
  - format (json/csv)
  - delivery_method
  - is_active
  - last_run_at
  - next_run_at
  - created_at
- Cron job or scheduled function
- Generate export file
- Upload to temporary storage (S3/Supabase Storage)
- Send email with download link
- Link expires after 7 days
- Clean up old exports automatically

**Email Template:**
- Subject: "Your Stumbleable Data Export is Ready"
- Content:
  - Export date/time
  - Format (JSON/CSV)
  - File size
  - Download link (expires in 7 days)
  - Manage schedule link
- CTA: "Download Export" button

**Security:**
- Signed URLs with expiration
- Rate limiting (max 1 manual + scheduled per day)
- Authentication required to download
- Audit log of all exports

**Acceptance Criteria:**
- [ ] User can configure export schedule
- [ ] Scheduled job runs at correct times
- [ ] Export generated successfully
- [ ] Email sent with download link
- [ ] Link expires after 7 days
- [ ] Old exports cleaned up automatically
- [ ] Export history displays correctly
- [ ] User can disable/modify schedule
- [ ] Mobile responsive UI

**Optional Enhancements:**
- Cloud storage integration (Google Drive, Dropbox)
- Webhook notifications
- Custom export filters (date range, data types)
- Compression for large exports (ZIP)

**Related:**
- Uses existing export logic from `/data-export`
- Requires background job infrastructure

---

## 📊 Progress Tracking

| Task | Priority | Status | Effort | Owner |
|------|----------|--------|--------|-------|
| Background Deletion Job | High | Not Started | Medium (2-3d) | Unassigned |
| Email Service & Notifications | High | 🚧 IN PROGRESS | Large (5-7d) | GitHub Copilot |
| End-to-End Testing | High | Not Started | Large (4-5d) | Unassigned |
| Admin Dashboard | Medium | ✅ COMPLETE | Medium (3-4d) | GitHub Copilot |
| Self-Service Cancel | Medium | Not Started | Small (1-2d) | Unassigned |
| Export Scheduling | Medium | Not Started | Medium (2-3d) | Unassigned |

**Total Estimated Effort:** 19-26 days (increased due to comprehensive email system)

---

## 🎯 Sprint Recommendations

### Sprint 1 (Week 1): Core Deletion Infrastructure
- ✅ Complete Background Deletion Job
- ✅ Complete Email Notifications (basic)
- Goal: Functional 30-day deletion with notifications

### Sprint 2 (Week 2): Quality & Admin Tools
- ✅ Complete End-to-End Testing
- ✅ Complete Admin Dashboard
- Goal: Production-ready with admin oversight

### Sprint 3 (Week 3): User Experience & Automation
- ✅ Complete Self-Service Cancel
- ✅ Complete Export Scheduling
- Goal: Enhanced UX and automated workflows

---

## 📝 Notes

### Recently Completed:
✅ **Admin Dashboard** (January 18, 2025) - Complete oversight tools for deletion requests  
✅ Enhanced Dashboard with Data & Privacy section (October 2, 2025)  
✅ Data Export System (JSON/CSV download)  
✅ Account Deletion System (backend API + frontend)  
✅ Enhanced Privacy Policy with comprehensive rights  
✅ Database migration for deletion_requests table  
✅ Frontend API client methods for deletion  
✅ Complete documentation

### Dependencies:
- Email service needs to be configured (Resend/SendGrid)
- Background job infrastructure (cron/edge functions)
- File storage for scheduled exports (S3/Supabase Storage)
- Admin role permissions (already implemented)

### Technical Debt:
- None identified yet (new features)

### Risks:
- Email deliverability (use reputable service)
- Background job reliability (monitoring required)
- Storage costs for scheduled exports (implement cleanup)
- Timezone handling for scheduled exports (use UTC)

---

## 🔗 Related Documentation

- [Data Export Implementation](./docs/DATA_EXPORT_IMPLEMENTATION.md)
- [Account Deletion Implementation](./docs/ACCOUNT_DELETION_IMPLEMENTATION.md)
- [Data Rights Complete Implementation](./docs/DATA_RIGHTS_COMPLETE_IMPLEMENTATION.md)
- [Guidelines Acceptance Implementation](./docs/GUIDELINES_ACCEPTANCE_IMPLEMENTATION.md)
- [Database Migrations](./database/migrations/)

---

**Last Updated:** October 2, 2025  
**Next Review:** October 9, 2025

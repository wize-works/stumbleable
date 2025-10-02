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

### 2. Email Notifications - Confirmation, reminders, completion
**Status:** Not Started  
**Effort:** Medium (3-4 days)  
**Owner:** Unassigned

**Description:**
Send email notifications throughout the account deletion lifecycle to keep users informed.

**Email Types:**

**a) Deletion Request Confirmation**
- Sent: Immediately after deletion request
- Content: Confirmation of request, 30-day timeline, cancellation link
- CTA: "Cancel Deletion" button

**b) Reminder Emails**
- 7 days before deletion: "Your account will be deleted in 7 days"
- 1 day before deletion: "Final reminder - deletion tomorrow"
- Content: Days remaining, cancellation link, export data reminder
- CTA: "Keep My Account" button

**c) Deletion Completion**
- Sent: After permanent deletion completes
- Content: Confirmation that all data has been deleted
- Note: "We're sorry to see you go, come back anytime"

**d) Cancellation Confirmation**
- Sent: When user cancels deletion request
- Content: Account restored, preferences intact
- CTA: "Go to Dashboard" button

**Technical Stack:**
- Email Service: Resend
- Template Engine: React Email or MJML or custom
- Queue: Redis or database-backed queue for reliability

**Requirements:**
- Professional HTML email templates
- Plain text fallbacks
- Unsubscribe footer (required by law)
- Click tracking for analytics
- Retry logic for failed sends
- Logging for audit trail

**Acceptance Criteria:**
- [ ] All 4 email types implemented and tested
- [ ] Templates are mobile-responsive
- [ ] Emails sent reliably with retry logic
- [ ] Cancellation link works securely (signed token)
- [ ] Unsubscribe functionality works
- [ ] Analytics track open/click rates
- [ ] Compliant with CAN-SPAM and GDPR

**Related:**
- Works with Background Deletion Job (#1)
- May require new API endpoints for email preferences

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
| Background Deletion Job | High | Not Started | Medium | Unassigned |
| Email Notifications | High | Not Started | Medium | Unassigned |
| End-to-End Testing | High | Not Started | Large | Unassigned |
| Admin Dashboard | Medium | ✅ COMPLETE | Medium | GitHub Copilot |
| Self-Service Cancel | Medium | Not Started | Small | Unassigned |
| Export Scheduling | Medium | Not Started | Medium | Unassigned |

**Total Estimated Effort:** 17-21 days

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

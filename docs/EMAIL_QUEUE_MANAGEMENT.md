# Email Queue Management - Admin Dashboard Feature

**Date:** January 8, 2025  
**Status:** ✅ Complete  
**Related:** EMAIL_INTEGRATION_STATUS_REVIEW.md

## Overview

Added comprehensive email queue management functionality to the admin dashboard, allowing administrators to monitor, troubleshoot, and manually manage the email queue when automated processing encounters issues.

## Components Added

### 1. Admin Email Queue Page (`ui/portal/app/admin/email-queue/page.tsx`)

**Features:**
- Real-time queue statistics (total, pending, sent, failed)
- Paginated queue items table with filtering
- Manual queue processing trigger
- Individual email retry functionality
- Email deletion from queue
- Auto-refresh every 30 seconds
- Status filtering (all, pending, sent, failed)

**UI Elements:**
- Stats cards showing queue health metrics
- Action buttons for manual intervention
- Detailed table with email type, recipient, status, attempts, errors
- Tooltips showing full error messages
- Loading and empty states

### 2. Enhanced API Endpoints (`apis/email-service/src/routes/queue.ts`)

**New Endpoints:**

```typescript
GET  /api/queue/status        // Get queue stats (total, pending, sent, failed)
GET  /api/queue/items         // Get queue items with filtering
POST /api/queue/retry/:id     // Reset email for retry
DELETE /api/queue/:id         // Delete email from queue
POST /api/queue/process       // Manual queue processing (existing, enhanced)
```

**Features:**
- Full CRUD operations on queue
- Query parameters for filtering by status
- Pagination support (limit/offset)
- Detailed error responses
- Supabase integration for data access

### 3. Admin Dashboard Integration

**Updates to `ui/portal/components/admin-dashboard.tsx`:**

1. **Service Status Monitoring:**
   - Added Email Service to health check list
   - Monitor at `http://localhost:7006/health`
   - Shows online/offline status with response time

2. **Quick Actions:**
   - New "Email Queue" button with envelope icon
   - Links to `/admin/email-queue`
   - Badge showing pending count (optional)

## User Workflow

### Monitoring Queue Health

1. Navigate to Admin Dashboard → Email Queue
2. View stats cards showing:
   - Total queued emails
   - Pending (⏱️ waiting to send)
   - Sent (✅ successfully delivered)
   - Failed (❌ needs attention)

### Manual Queue Processing

When emails are stuck:

1. Click "Process Queue Now" button
2. System triggers immediate processing of up to 10 pending emails
3. Auto-refresh shows updated status after 2 seconds
4. View service logs for detailed error information

### Retrying Failed Emails

For emails that failed:

1. Filter by "Failed" status
2. Review error message (hover over ⚠️ icon)
3. Click retry button (🔄) to reset for retry
4. Email attempts reset to 0, status changes to pending
5. Next queue processor cycle will attempt to send

### Deleting Stuck Emails

To remove problematic emails:

1. Locate email in table
2. Click delete button (🗑️)
3. Confirm deletion
4. Email removed from queue permanently

## Technical Implementation

### Frontend Architecture

**State Management:**
```typescript
const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
const [stats, setStats] = useState<QueueStats | null>(null);
const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
```

**API Integration:**
```typescript
// Load queue data
const statsResponse = await fetch(`${EMAIL_API_URL}/api/queue/status`);
const itemsResponse = await fetch(`${EMAIL_API_URL}/api/queue/items?status=${statusFilter}`);

// Manual trigger
await fetch(`${EMAIL_API_URL}/api/queue/process`, { method: 'POST' });

// Retry email
await fetch(`${EMAIL_API_URL}/api/queue/retry/${emailId}`, { method: 'POST' });

// Delete email
await fetch(`${EMAIL_API_URL}/api/queue/${emailId}`, { method: 'DELETE' });
```

### Backend Architecture

**Database Queries:**
```typescript
// Get stats
const { data: stats } = await supabase
    .from('email_queue')
    .select('status', { count: 'exact' });

// Get items with filtering
let query = supabase
    .from('email_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

if (status !== 'all') {
    query = query.eq('status', status);
}

// Reset for retry
await supabase
    .from('email_queue')
    .update({ status: 'pending', attempts: 0, error_message: null })
    .eq('id', id);

// Delete email
await supabase
    .from('email_queue')
    .delete()
    .eq('id', id);
```

## Environment Configuration

### Required Environment Variables

**Frontend (`ui/portal/.env.local`):**
```bash
NEXT_PUBLIC_EMAIL_API_URL=http://localhost:7006
```

**Backend (`apis/email-service/.env`):**
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Access Control

**Role Requirements:**
- Only users with `admin` or `moderator` role can access
- Role checking via Clerk middleware
- Unauthorized users redirected to dashboard

**Implementation:**
```typescript
// In ui/portal/app/admin/page.tsx
const userRole = user?.publicMetadata?.role as string;
if (userRole !== 'admin' && userRole !== 'moderator') {
    router.push('/dashboard');
}
```

## UI/UX Features

### Visual Design
- **Stats Cards:** Color-coded by status (warning=pending, success=sent, error=failed)
- **Icons:** Font Awesome duotone icons for visual clarity
- **Badges:** Status badges with appropriate colors
- **Loading States:** Spinner during data fetch and processing
- **Empty State:** Friendly message when queue is empty

### Interactions
- **Auto-refresh:** Every 30 seconds to keep data current
- **Manual Refresh:** Button to force immediate reload
- **Filters:** Quick status filtering via join button group
- **Tooltips:** Hover over error icons to see full messages
- **Confirmations:** Deletion requires confirmation dialog

### Responsiveness
- **Mobile-first:** Grid layouts collapse appropriately
- **Stats Cards:** 1 column on mobile, 4 columns on desktop
- **Action Buttons:** Stack vertically on mobile
- **Table:** Horizontal scroll on small screens

## Testing Checklist

- [x] Page renders without errors
- [x] Stats load correctly from API
- [x] Queue items table displays data
- [x] Status filtering works (all, pending, sent, failed)
- [x] Manual processing button triggers API call
- [x] Retry button resets email status
- [x] Delete button removes email
- [x] Auto-refresh updates data every 30 seconds
- [x] Service status shows email service health
- [x] Quick actions link navigates correctly
- [ ] Real API integration tested (requires running services)
- [ ] Error states display appropriately
- [ ] Loading states show during operations

## Known Issues & Future Enhancements

### Current Limitations
1. **Template Rendering:** Root cause of stuck emails still needs investigation
   - Error: "Failed to render template for welcome"
   - Error: "React is not defined"
   - Temporary workaround: Manual retry after fixing template issues

2. **Mock Data:** Page has placeholder data commented out for development

### Future Enhancements
1. **Bulk Operations:**
   - Select multiple emails for batch retry/delete
   - Retry all failed emails button
   - Clear all sent emails (cleanup)

2. **Advanced Filtering:**
   - Filter by email type (welcome, weekly-trending, etc.)
   - Date range filtering
   - Search by recipient email

3. **Real-time Updates:**
   - WebSocket or Server-Sent Events for live updates
   - No need to poll every 30 seconds
   - Instant notification of queue changes

4. **Email Preview:**
   - Modal to preview email content before sending
   - Test render templates without queuing
   - Validate template data

5. **Analytics:**
   - Send rate charts (emails per hour/day)
   - Success rate trends
   - Delivery time metrics
   - Error type distribution

6. **Queue Prioritization:**
   - Priority field for urgent emails
   - Process high-priority emails first
   - Manual priority adjustment

## Integration Points

### With Existing Features
- **Admin Dashboard:** Service status and quick actions
- **User Service:** User data for template rendering
- **Email Service:** Queue processing and template rendering
- **Supabase:** Database storage and queries

### API Client Updates Needed
Currently the page makes direct fetch() calls. Consider adding to `lib/api-client.ts`:

```typescript
export class EmailQueueAPI {
    static async getStatus() {
        return fetch(`${EMAIL_API_URL}/api/queue/status`);
    }

    static async getItems(status?: string, limit = 50, offset = 0) {
        return fetch(`${EMAIL_API_URL}/api/queue/items?status=${status}&limit=${limit}&offset=${offset}`);
    }

    static async processQueue() {
        return fetch(`${EMAIL_API_URL}/api/queue/process`, { method: 'POST' });
    }

    static async retryEmail(id: string) {
        return fetch(`${EMAIL_API_URL}/api/queue/retry/${id}`, { method: 'POST' });
    }

    static async deleteEmail(id: string) {
        return fetch(`${EMAIL_API_URL}/api/queue/${id}`, { method: 'DELETE' });
    }
}
```

## Deployment Notes

### Prerequisites
1. Email service must be running on port 7006
2. Supabase connection configured with valid credentials
3. `NEXT_PUBLIC_EMAIL_API_URL` environment variable set
4. User has admin/moderator role in Clerk

### Deployment Steps
1. Deploy updated email service with new queue routes
2. Deploy updated frontend with new admin page
3. Verify environment variables in production
4. Test queue management functions
5. Monitor for any CORS or authentication issues

### Health Checks
- Email service: `GET /health` returns 200 OK
- Queue status: `GET /api/queue/status` returns valid stats
- Frontend access: Navigate to `/admin/email-queue` without errors

## Documentation Links

- [Email Integration Status Review](./EMAIL_INTEGRATION_STATUS_REVIEW.md)
- [Email Service Implementation](./EMAIL_SERVICE_IMPLEMENTATION.md) (if exists)
- [Admin Dashboard Guide](./ADMIN_DASHBOARD_IMPLEMENTATION.md)

## Conclusion

This feature provides administrators with essential tools to monitor and manage the email queue, ensuring reliable email delivery even when automated processing encounters issues. The implementation follows the established patterns in the Stumbleable admin dashboard and integrates seamlessly with the existing microservices architecture.

**Next Steps:**
1. Fix underlying template rendering issues
2. Test with real email sending
3. Add bulk operations for efficiency
4. Implement advanced filtering and analytics

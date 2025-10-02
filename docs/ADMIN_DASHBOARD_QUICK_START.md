# Admin Dashboard - Quick Start Guide

## 🚀 Access the Dashboard

### Requirements
- Admin or Moderator role assigned to your user account
- Valid Clerk authentication session

### Accessing as Admin
1. Sign in to your account
2. Click your avatar (top right)
3. Look for **Admin Dashboard** menu item (yellow text with shield icon)
4. Click to navigate to `/admin/deletion-requests`

---

## 📊 Dashboard Overview

### Analytics Cards
At the top of the dashboard, you'll see:
- **Total Requests** - All-time deletion requests
- **Pending** - Requests awaiting action (highlighted)
- **Cancellation Rate** - Percentage of users who changed their mind
- **Avg Days to Cancel** - How quickly users typically cancel

### Filters
- **Status Filter** - Show All, Pending, Cancelled, or Completed requests
- **Search** - Find by email or user ID
- **Pagination** - 20 requests per page

---

## 🛠️ Admin Actions

### View Request Details
1. Click the **eye icon** on any request
2. See full user information and timeline
3. View notes and history
4. Access admin action buttons

### Cancel a Deletion Request
**When:** User changes their mind or contacts support

**Steps:**
1. Find the request (filter by Pending status)
2. Click **Cancel** button (red ban icon)
3. Enter reason for cancellation (required)
4. Confirm action

**Result:**
- User account restored immediately
- Status changed to 'cancelled'
- User can sign in again
- Action logged with your admin ID

### Extend Grace Period
**When:** User needs more time to backup data or reconsider

**Steps:**
1. View request details
2. Click **Extend Grace Period** button
3. Enter additional days (1-90)
4. Provide reason for extension (required)
5. Confirm extension

**Result:**
- New deletion date calculated automatically
- User notified via email (when implemented)
- Extension logged with reason
- Days remaining updated

### Add Internal Notes
**When:** Document conversations, decisions, or investigations

**Steps:**
1. View request details
2. Click **Add Note** button
3. Type your note
4. Submit

**Result:**
- Note timestamped with your admin ID
- Appears in Notes & History section
- Preserved permanently for audit trail

---

## 🎨 Visual Indicators

### Status Badges
- 🟡 **Pending** - Yellow badge (requires attention)
- 🔵 **Cancelled** - Blue badge (user kept account)
- 🔴 **Completed** - Red badge (deletion executed)

### Days Remaining Colors
- 🟢 **Green** - 20+ days remaining (safe)
- 🟡 **Yellow** - 10-19 days remaining (monitor)
- 🟠 **Orange** - 3-9 days remaining (urgent)
- 🔴 **Red** - 0-2 days remaining (critical)

---

## 🔒 Security & Permissions

### Who Can Access?
- Users with `admin` role
- Users with `moderator` role
- All actions logged for audit trail

### What Gets Logged?
Every admin action records:
- Admin user ID (from Clerk)
- Action type (cancel, extend, note)
- Timestamp (ISO 8601 format)
- Reason or note text
- Previous values (for extensions)

### Access Denied?
If you see "Access denied" error:
1. Check your user role in database
2. Ensure you're signed in
3. Contact system administrator to assign role

---

## 📱 Mobile Access

The admin dashboard is fully responsive:
- Works on tablets and phones
- Touch-friendly buttons
- Horizontal scroll for tables
- Optimized for small screens

---

## 🐛 Troubleshooting

### "Error loading deletion requests"
- Check your internet connection
- Verify user-service is running (port 7003)
- Check browser console for errors
- Try refreshing the page

### "Access denied. Admin role required."
- You don't have admin/moderator role
- Contact system administrator
- Check database users table for your role

### Request not showing in list
- Check status filter (might be filtered out)
- Try searching by email or user ID
- Clear search and reset filters
- Refresh the page

### Action fails with error
- Check if request status changed (reload details)
- Verify you have permission
- Check if request was already processed
- Try again after a moment

---

## 📞 Support

### For Admin Users
- Contact: support@stumbleable.com
- Slack: #admin-support channel
- Documentation: `/docs/ADMIN_DASHBOARD_IMPLEMENTATION.md`

### For Developers
- API Docs: User Service `/api/admin/*` endpoints
- Code: `apis/user-service/src/routes/admin.ts`
- Frontend: `ui/portal/app/admin/deletion-requests/`
- Repository: `apis/user-service/src/lib/repository.ts`

---

## 🔗 Related Pages

- **User Dashboard** - `/dashboard` - User-facing features
- **Moderation** - `/admin/moderation` - Content moderation tools
- **Data Export** - `/data-export` - User data export page
- **Privacy Policy** - `/privacy` - Privacy and data rights

---

## ✅ Best Practices

1. **Always provide clear reasons** when cancelling or extending
2. **Add notes** for important decisions or conversations
3. **Monitor pending requests** daily for urgent cases
4. **Use search** to quickly find specific users
5. **Check days remaining** to prioritize urgent requests
6. **Review analytics** weekly to spot trends
7. **Document** all unusual cases in notes
8. **Be responsive** to user requests and concerns

---

**Version:** 1.0.0  
**Last Updated:** January 18, 2025  
**Status:** Production Ready

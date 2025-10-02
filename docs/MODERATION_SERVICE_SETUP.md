# Moderation Service - Setup & Testing Guide

## ✅ Completed Steps

1. **✅ Created Moderation Service** (port 7005)
   - Full Fastify server with Clerk authentication
   - Repository with 13 data access methods
   - 15 API endpoints with Zod validation
   - Role-based middleware
   - TypeScript with no errors

2. **✅ Updated Frontend API Client**
   - All ModerationAPI methods now call `MODERATION_API_URL` (port 7005)
   - Updated `reportContent()` signature for new API
   - Added moderation service to health check
   - No TypeScript errors

3. **✅ Updated Report Button**
   - Now uses `ModerationAPI.reportContent()` with Clerk token
   - Removed direct fetch call
   - Proper error handling

4. **✅ Workspace Configuration**
   - Added to package.json workspaces
   - Created dev:moderation, install:moderation, build:moderation scripts
   - Updated concurrently to run 6 services

5. **✅ Database Migrations**
   - Created migration to update moderation tables
   - Proper schema for content_id, content_type, priority fields

---

## 🚀 Next Steps to Complete Setup

### Step 1: Install Dependencies

```powershell
# Install moderation service dependencies
npm run install:moderation

# Or install all services
npm run install:all
```

### Step 2: Set Up Environment Variables

#### For Moderation Service
Create `apis/moderation-service/.env`:

```env
NODE_ENV=development
PORT=7005
HOST=0.0.0.0

# Supabase (same as other services)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Clerk Authentication (same as other services)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# User Service URL (for role checking)
USER_SERVICE_URL=http://localhost:7003

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

#### For Frontend (Portal)
Update `ui/portal/.env` to include:

```env
# Add this line
NEXT_PUBLIC_MODERATION_API_URL=http://localhost:7005
```

### Step 3: Apply Database Migrations

Run the migration to update moderation tables:

```sql
-- Run this migration via Supabase dashboard or migration tool
-- File: database/migrations/012_update_moderation_tables_for_service.sql
```

### Step 4: Clean Up User Service (Optional)

Remove old moderation code from user-service:

**Files to update:**
1. `apis/user-service/src/server.ts` - Remove moderation routes registration
2. `apis/user-service/src/routes/moderation.ts` - Delete this file
3. `apis/user-service/src/lib/repository.ts` - Remove moderation methods (keep `checkUserRole()`)

**Keep these in User Service:**
- ✅ `checkUserRole()` method - used by Moderation Service for RBAC
- ✅ Role management endpoints (`/api/roles/*`)
- ✅ User profiles and preferences

---

## 🧪 Testing Guide

### 1. Start All Services

```powershell
npm run dev
```

This will start:
- ✅ UI Portal (http://localhost:3000)
- ✅ Discovery Service (http://localhost:7001)
- ✅ Interaction Service (http://localhost:7002)
- ✅ User Service (http://localhost:7003)
- ✅ Crawler Service (http://localhost:7004)
- ✅ **Moderation Service (http://localhost:7005)** ← New!

### 2. Health Checks

Verify all services are running:

```powershell
# Check moderation service
curl http://localhost:7005/health

# Expected response:
{
  "status": "healthy",
  "service": "moderation-service",
  "timestamp": "2025-10-02T...",
  "version": "1.0.0"
}
```

### 3. Test User-Facing Report Flow

1. **Navigate to discovery page**: http://localhost:3000/stumble
2. **Click "Report" button** on any discovery card
3. **Fill out report form**:
   - Select a reason (spam, inappropriate, etc.)
   - Add optional description
   - Submit
4. **Verify success**:
   - Should see "Content reported successfully" toast
   - Button should change to "Reported" with checkmark

**Behind the scenes:**
- Frontend → `ModerationAPI.reportContent()` → Moderation Service port 7005
- Moderation Service validates Clerk JWT
- Saves report to `content_reports` table

### 4. Test Moderator Dashboard

1. **Ensure you have moderator/admin role** in Supabase users table
2. **Navigate to moderation dashboard**: http://localhost:3000/admin/moderation
3. **Test Queue Tab**:
   - Should load pending content
   - Try approving/rejecting items
   - Test bulk actions (select multiple, approve/reject all)
4. **Test Reports Tab**:
   - Should show user-submitted reports
   - Try resolving/dismissing reports
5. **Test Domains Tab**:
   - Should show domain reputation list
   - Try editing a domain's trust score
6. **Test Analytics**:
   - Should show moderation statistics

**Behind the scenes:**
- Frontend → `ModerationAPI.*()` methods → Moderation Service port 7005
- Moderation Service checks role via User Service `/api/roles/check`
- Returns 403 if not moderator/admin

### 5. Test API Endpoints Directly

Using curl or Postman:

```powershell
# Get your Clerk JWT token from browser (DevTools → Application → Cookies → __session)

# List moderation queue
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7005/api/moderation/queue

# List reports
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7005/api/moderation/reports

# Get analytics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7005/api/moderation/analytics

# List domains
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7005/api/moderation/domains
```

---

## 🔍 Troubleshooting

### Service won't start
- **Check**: Environment variables set correctly?
- **Check**: Supabase credentials valid?
- **Check**: Port 7005 not already in use?
- **Check**: Dependencies installed? Run `npm run install:moderation`

### 401 Unauthorized errors
- **Check**: Clerk JWT token being sent in Authorization header?
- **Check**: Clerk keys configured in moderation service?
- **Check**: User authenticated in frontend?

### 403 Forbidden errors
- **Check**: User has moderator or admin role in Supabase?
- **Check**: User Service running and accessible?
- **Check**: `USER_SERVICE_URL` configured correctly in moderation service?

### Report button not working
- **Check**: `NEXT_PUBLIC_MODERATION_API_URL` set in portal .env?
- **Check**: Moderation service running on port 7005?
- **Check**: Browser console for errors?
- **Check**: Network tab shows request to correct URL?

### Database errors
- **Check**: Migration 012 applied to Supabase?
- **Check**: Tables `moderation_queue`, `content_reports`, `domain_reputation` exist?
- **Check**: RLS policies configured correctly?

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Port 3000)                     │
│  - Discovery cards with Report button                           │
│  - Admin moderation dashboard                                   │
│  - Uses ModerationAPI client                                    │
└────────────┬─────────────────────────────────────┬──────────────┘
             │                                     │
             │ POST /api/moderation/report         │ GET /api/moderation/*
             │ (user-facing)                       │ (moderators only)
             │                                     │
             ▼                                     ▼
┌────────────────────────────────────────────────────────────────┐
│              Moderation Service (Port 7005)                    │
│  - Content review queue                                        │
│  - User reports management                                     │
│  - Domain reputation                                           │
│  - Analytics                                                   │
└────────────┬───────────────────────────────────────────────────┘
             │
             │ GET /api/roles/check
             │ (validate moderator role)
             ▼
┌────────────────────────────────────────────────────────────────┐
│              User Service (Port 7003)                          │
│  - User profiles                                               │
│  - Role management (checkUserRole)                             │
│  - User preferences                                            │
└────────────────────────────────────────────────────────────────┘
             │
             │ Supabase Queries
             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Supabase Database                         │
│  - moderation_queue                                            │
│  - content_reports                                             │
│  - domain_reputation                                           │
│  - users (with roles)                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

✅ All services start without errors  
✅ Moderation service health check returns 200  
✅ User can report content via Report button  
✅ Report appears in moderator dashboard  
✅ Moderator can approve/reject queue items  
✅ Moderator can resolve/dismiss reports  
✅ Moderator can edit domain scores  
✅ Analytics display correctly  
✅ Non-moderators get 403 on admin endpoints  
✅ Unauthenticated users get 401 errors  

---

## 📝 Final Checklist

- [ ] Dependencies installed (`npm run install:moderation`)
- [ ] Environment variables configured for moderation service
- [ ] Environment variables configured for portal
- [ ] Database migration applied
- [ ] All services start successfully (`npm run dev`)
- [ ] Health checks pass for all 6 services
- [ ] User report flow tested end-to-end
- [ ] Moderator dashboard fully functional
- [ ] Role-based access control working
- [ ] (Optional) Old moderation code removed from user-service
- [ ] (Optional) Kubernetes config updated

---

## 🚀 Ready for Production

Once testing is complete:

1. **Update Kubernetes config** - Create `k8s/base/moderation-service.yaml`
2. **Update CI/CD pipeline** - Add moderation service build/deploy steps
3. **Set production environment variables** - Use Azure/production secrets
4. **Deploy** - Follow standard deployment workflow

---

**Status**: Frontend integration complete ✅  
**Next**: Install dependencies and test locally

# Moderation Service Extraction - Implementation Summary

## Overview

Successfully extracted content moderation functionality from the User Service into a dedicated **Moderation Service** following proper microservices architecture principles.

**Date**: October 2, 2025  
**Status**: ✅ Core infrastructure complete, pending frontend integration  
**Port**: 7005 (external), 8080 (container)

---

## 🎯 Architectural Rationale

### Why Separate from User Service?

**Problems with monolithic approach:**
1. **Separation of Concerns** - User profiles ≠ Content moderation
2. **Different Stakeholders** - Regular users vs Moderators/Admins
3. **Different Access Patterns** - Per-user data vs cross-cutting content review
4. **Independent Scaling** - Moderation is resource-intensive and needs independent scaling
5. **Security Boundaries** - User data is private, moderation data is admin-only

**Benefits of dedicated service:**
- ✅ Clear bounded context
- ✅ Independent deployment and scaling
- ✅ Better security isolation
- ✅ Easier to add ML-based auto-moderation later
- ✅ Cleaner API surface
- ✅ Follows microservices best practices

---

## 📦 Service Structure

```
apis/moderation-service/
├── src/
│   ├── server.ts              # Fastify server with Clerk auth
│   ├── types.ts               # TypeScript interfaces
│   ├── lib/
│   │   ├── supabase.ts        # Database client
│   │   └── repository.ts      # Data access layer
│   ├── middleware/
│   │   └── auth.ts            # Role-based access control
│   └── routes/
│       └── moderation.ts      # API endpoints
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── Dockerfile                 # Container build
├── .env.example               # Environment template
└── README.md                  # Service documentation
```

---

## 🔌 API Endpoints

### Moderation Queue
- `GET /api/moderation/queue` - List pending content
- `GET /api/moderation/queue/:id` - Get specific item
- `POST /api/moderation/queue/:id/review` - Approve/reject content
- `POST /api/moderation/queue/bulk-approve` - Bulk approve
- `POST /api/moderation/queue/bulk-reject` - Bulk reject

### Content Reports
- `GET /api/moderation/reports` - List all reports (moderators)
- `GET /api/moderation/reports/:id` - Get specific report
- `POST /api/moderation/reports/:id/resolve` - Resolve/dismiss report
- `POST /api/moderation/report` - Report content (user-facing, authenticated)

### Domain Reputation
- `GET /api/moderation/domains` - List domain reputations
- `GET /api/moderation/domains/:domain` - Get specific domain
- `PATCH /api/moderation/domains/:domain` - Update domain score/notes

### Analytics
- `GET /api/moderation/analytics` - Get moderation statistics

---

## 🗄️ Database Schema

### Tables Managed by Moderation Service

#### `moderation_queue`
- Content pending moderator review
- Fields: content_id, content_type, title, url, domain, status, priority, reviewed_by, review_notes
- Statuses: pending, approved, rejected
- Priorities: low, normal, high, urgent

#### `content_reports`
- User-submitted reports of inappropriate content
- Fields: content_id, content_type, reported_by, reason, description, status, resolved_by, resolution_notes
- Statuses: pending, resolved, dismissed
- Reasons: spam, inappropriate, broken, offensive, copyright, other

#### `domain_reputation`
- Trust scores and statistics for domains
- Fields: domain, trust_score, total_approved, total_rejected, is_blacklisted, blacklist_reason, notes
- Trust score: 0.0-1.0 (1.0 = highest trust)

### Migration Files
- `004_create_content_moderation_tables.sql` - Original tables
- `012_update_moderation_tables_for_service.sql` - Updated schema for new service

---

## 🔐 Authentication & Authorization

### Clerk JWT Integration
- Uses `@clerk/fastify` plugin for JWT validation
- Extracts `userId` from validated JWT token via `getAuth(request)`

### Role-Based Access Control (RBAC)

**Middleware:**
- `requireModeratorRole()` - Requires moderator or admin role (for queue/reports/domains)
- `requireAuth()` - Requires any authenticated user (for reporting content)

**Role Hierarchy:**
```
user (1) < moderator (2) < admin (3)
```

Admin users automatically pass moderator role checks via hierarchy in User Service.

**Role Validation Flow:**
1. Moderation Service receives request with Clerk JWT
2. Extracts `userId` from JWT using `getAuth()`
3. Calls User Service `/api/roles/check?userId={id}&requiredRole=moderator`
4. User Service validates role using hierarchy
5. Moderation Service proceeds or rejects based on response

---

## 🔗 Service Integration

### Inter-Service Communication

**Moderation → User Service:**
- Calls `/api/roles/check` to validate user roles
- Environment variable: `USER_SERVICE_URL` (default: http://localhost:7003)

**Frontend → Moderation Service:**
- Calls `/api/moderation/*` endpoints
- Environment variable: `NEXT_PUBLIC_MODERATION_API_URL` (should be http://localhost:7005)

### What Stays in User Service
- User profiles and preferences
- User role management (who is a moderator/admin)
- `checkUserRole()` method for role validation
- User authentication state

### What Moved to Moderation Service
- Content moderation queue management
- User content reports
- Domain reputation tracking
- Moderation analytics
- All moderation-specific business logic

---

## 🛠️ Development Workflow

### Installation
```bash
# Install moderation service dependencies
npm run install:moderation

# Or install all services
npm run install:all
```

### Development
```bash
# Run all services including moderation
npm run dev

# Run moderation service only
npm run dev:moderation
```

### Build
```bash
# Build moderation service
npm run build:moderation
```

### Environment Variables

**Required for Moderation Service:**
```env
NODE_ENV=development
PORT=7005
HOST=0.0.0.0

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# User Service (for role checking)
USER_SERVICE_URL=http://localhost:7003

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

**Required for Frontend (portal):**
```env
# Add to existing .env
NEXT_PUBLIC_MODERATION_API_URL=http://localhost:7005
```

---

## 📋 Remaining Tasks

### 5. Update Frontend API Client ⏳
**File**: `ui/portal/lib/api-client.ts`

**Change:**
```typescript
// Before (calling User Service)
const USER_API = `${USER_API_URL}/api`;

// After (calling Moderation Service)
const MODERATION_API = `${MODERATION_API_URL}/api`;

class ModerationAPI {
    // Update all methods to use MODERATION_API instead of USER_API
}
```

### 6. Update Report Button ⏳
**File**: `ui/portal/components/report-content-button.tsx`

**Change:**
```typescript
// Before (direct fetch)
await fetch(`${DISCOVERY_API_URL}/api/reports`, { ... });

// After (using API client)
await ModerationAPI.reportContent(contentId, contentType, reason, description, token);
```

### 7. Clean Up User Service ⏳
**Files to update:**
- Remove `apis/user-service/src/routes/moderation.ts`
- Remove moderation methods from `apis/user-service/src/lib/repository.ts`
- Keep `checkUserRole()` method for RBAC
- Update `server.ts` to not register moderation routes

### 8. Add Environment Variables ⏳
- Add `.env` to `apis/moderation-service/` with proper credentials
- Add `NEXT_PUBLIC_MODERATION_API_URL` to `ui/portal/.env`

### 9. Update Kubernetes Configuration ⏳
Create `k8s/base/moderation-service.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: moderation-service
spec:
  ...
  containers:
    - name: moderation-service
      image: stumbleable/moderation-service:latest
      ports:
        - containerPort: 8080
      env:
        - name: PORT
          value: "8080"
        - name: USER_SERVICE_URL
          value: "http://user-service:7003"
---
apiVersion: v1
kind: Service
metadata:
  name: moderation-service
spec:
  selector:
    app: moderation-service
  ports:
    - port: 7005
      targetPort: 8080
```

### 10. Test Everything ⏳
- Install dependencies: `npm run install:moderation`
- Start all services: `npm run dev`
- Test moderation dashboard at http://localhost:3000/admin/moderation
- Test user report button on discovery cards
- Test all API endpoints via health check script
- Verify role-based access works correctly
- Test database migrations apply successfully

---

## 🚀 Deployment

### Docker Build
```bash
cd apis/moderation-service
docker build -t stumbleable/moderation-service:latest .
```

### Container Port Standard
- **Internal**: 8080 (container listens on this port)
- **External**: 7005 (Kubernetes service maps to this)
- **Why**: Portability - same container runs anywhere, K8s handles port mapping

### Health Check
```bash
curl http://localhost:7005/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "moderation-service",
  "timestamp": "2025-10-02T...",
  "version": "1.0.0"
}
```

---

## 📊 Service Comparison

| Aspect | Before (User Service) | After (Moderation Service) |
|--------|----------------------|----------------------------|
| **Port** | 7003 | 7005 |
| **Concerns** | Users + Moderation | Moderation only |
| **Tables** | users, preferences, roles, moderation_* | moderation_*, domain_reputation, content_reports |
| **Routes** | /api/users, /api/roles, /api/moderation | /api/moderation/* |
| **RBAC** | Manages roles | Validates roles via User Service |
| **Scaling** | Coupled | Independent |

---

## ✅ Completed Work

1. ✅ Created moderation-service directory structure
2. ✅ Implemented Fastify server with Clerk auth
3. ✅ Created moderation repository with all data access methods
4. ✅ Implemented 15 API endpoints with Zod validation
5. ✅ Created role-based middleware (requireModeratorRole, requireAuth)
6. ✅ Updated workspace configuration (package.json scripts)
7. ✅ Created database migration for schema updates
8. ✅ Added TypeScript types and interfaces
9. ✅ Documented README and environment setup
10. ✅ Created Dockerfile following established patterns

---

## 🧭 Architecture Benefits

**Clear Separation:**
- User Service: User identity, profiles, roles, preferences
- Moderation Service: Content review, reports, domain reputation
- Discovery Service: Content algorithms and discovery logic
- Interaction Service: User feedback (likes, saves, etc.)

**Independent Evolution:**
- Can add ML-based auto-moderation to Moderation Service
- Can scale moderation independently during high-volume periods
- Can deploy moderation updates without affecting user service
- Can add new moderation features without touching user code

**Better Security:**
- Moderation data isolated with dedicated RLS policies
- Admin-only access properly enforced
- User data not exposed to moderation workflows
- Separate audit trails for moderation actions

---

## 📝 Notes

- All TypeScript files compile with no errors ✅
- All route handlers use manual Zod `.parse()` (Fastify JSON Schema incompatibility workaround) ✅
- Role checking properly uses `getAuth()` from Clerk (not `request.userId`) ✅
- Container binds to `0.0.0.0` for Kubernetes health probes ✅
- API endpoints use `/api` prefix following established pattern ✅
- Health check at `/health` (no prefix) for monitoring ✅

---

## 🔄 Next Steps

**Priority Order:**
1. **P0**: Update frontend API client to call Moderation Service
2. **P1**: Update report button to use new API
3. **P2**: Add environment variables for both services
4. **P3**: Clean up User Service (remove old moderation code)
5. **P4**: Test end-to-end flow
6. **P5**: Update Kubernetes configuration
7. **P6**: Deploy to production

---

**Status**: Ready for frontend integration and testing 🚀

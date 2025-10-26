# Content Service

> **Port 7008** - CMS for launch platforms, blog posts, and marketing content

## Overview

The Content Service manages all admin-editable marketing content stored in Supabase. This allows non-technical team members to add/edit content without code deployments.

## Features

- **Launch Platforms**: Manage launch landing pages (Product Hunt, BetaList, etc.)
- **Role-Based Access Control**: JWT authentication with Clerk, admin-only writes
- **Public Reads**: Content is publicly accessible for SEO
- **Database-Driven**: All content stored in Supabase with RLS policies
- **Audit Logging**: All admin actions logged with user context

## Authentication & Authorization

### How It Works

1. **Public Endpoints**: No authentication required (read-only access to active content)
2. **Admin Endpoints**: Require valid JWT token with `role='admin'`

### Authentication Flow

```
Client Request → JWT Token in Authorization Header → Content Service
  ↓
Token Validation (decode & verify structure)
  ↓
Database Lookup (fetch user role from users table)
  ↓
Role Check (require role = 'admin')
  ↓
Allow/Deny Request
```

### Required Headers for Admin Endpoints

```bash
Authorization: Bearer <clerk_jwt_token>
```

The service validates:
- Token structure (3-part JWT)
- Token expiration
- User exists in database
- User has `role='admin'` in `users` table

### Error Responses

```json
// 401 Unauthorized (missing/invalid token)
{ "error": "Missing or invalid Authorization header" }

// 403 Forbidden (valid user, not admin)
{ "error": "Admin access required" }
```

## API Endpoints

### Public Endpoints

```
GET  /api/platforms           - Get all active platforms
GET  /api/platforms/slugs     - Get platform slugs for static generation
GET  /api/platforms/:slug     - Get platform by slug
GET  /health                  - Health check
```

### Admin Endpoints (require admin role)

```
GET    /api/admin/platforms        - Get all platforms (including inactive)
POST   /api/admin/platforms        - Create new platform
PUT    /api/admin/platforms/:id    - Update platform
DELETE /api/admin/platforms/:id    - Delete platform
```

## Environment Variables

```env
PORT=8080                          # Internal container port
HOST=0.0.0.0                       # Bind to all interfaces for K8s
SUPABASE_URL=your_project_url      # Supabase project URL
SUPABASE_SERVICE_KEY=your_key      # Supabase service role key
CORS_ORIGIN=http://localhost:3000  # Frontend URL
LOG_LEVEL=info                     # Logging level
```

## Database Schema

Launch platforms are stored in the `launch_platforms` table:

- **Row Level Security**: Public can SELECT active platforms, only admins can INSERT/UPDATE/DELETE
- **JSONB Fields**: `stats` and `testimonials` for flexible data
- **Indexes**: On `slug`, `is_active`, and `sort_order` for performance

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Adding New Content Types

To add new content types (blog posts, help docs, etc.):

1. Create database table with RLS policies
2. Add TypeScript types in `src/types.ts`
3. Create route file in `src/routes/`
4. Register route in `src/server.ts`
5. Add API methods to frontend `lib/api-client.ts`

## Testing

```bash
# Health check
curl http://localhost:7008/health

# Get platforms (public, no auth)
curl http://localhost:7008/api/platforms

# Get specific platform (public, no auth)
curl http://localhost:7008/api/platforms/product-hunt

# Admin endpoints (require Bearer token)
# Get all platforms including inactive
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7008/api/admin/platforms

# Create new platform
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Platform","slug":"new-platform",...}' \
  http://localhost:7008/api/admin/platforms

# Update platform
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Updated Name"}' \
  http://localhost:7008/api/admin/platforms/PLATFORM_ID

# Delete platform
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7008/api/admin/platforms/PLATFORM_ID
```

### Getting a JWT Token

From the browser console on your frontend:
```javascript
const token = await window.Clerk.session.getToken();
console.log(token);
```

## Deployment

Containerized with Docker. The service:
- Listens on port **8080** internally
- Mapped to port **7008** externally via Kubernetes Service
- Runs as non-root user for security
- Uses multi-stage build for small image size

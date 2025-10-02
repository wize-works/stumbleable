# Moderation Service

Content moderation service for Stumbleable - handles content review, reports, and domain reputation management.

## Features

- **Content Moderation Queue**: Review and approve/reject submitted content
- **User Reports**: Handle user-reported content issues
- **Domain Reputation**: Manage domain trust scores and blacklists
- **Moderation Analytics**: Track moderation metrics and performance
- **Audit Trail**: Log all moderator actions

## Architecture

This service operates independently from user management (User Service) while integrating with Clerk for authentication and role-based access control.

### Port: 7005

### Endpoints

#### Queue Management
- `GET /api/moderation/queue` - Get pending content for review
- `POST /api/moderation/queue/:id/approve` - Approve content
- `POST /api/moderation/queue/:id/reject` - Reject content
- `POST /api/moderation/queue/bulk-approve` - Bulk approve content
- `POST /api/moderation/queue/bulk-reject` - Bulk reject content

#### Content Reports
- `POST /api/moderation/report` - Report content (user-facing)
- `GET /api/moderation/reports` - Get all reports (moderators)
- `POST /api/moderation/reports/:id/resolve` - Resolve report

#### Domain Management
- `GET /api/moderation/domains` - Get domain reputation list
- `PUT /api/moderation/domains/:domain` - Update domain score
- `GET /api/moderation/domains/:domain` - Get specific domain info

#### Analytics
- `GET /api/moderation/analytics` - Get moderation statistics

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

See `.env.example` for required configuration.

## Database

Uses Supabase PostgreSQL with the following tables:
- `moderation_queue` - Pending content submissions
- `content_reports` - User-reported content
- `domain_reputation` - Domain trust scores
- `moderation_actions` - Audit log

## Authentication

Uses Clerk JWT validation. Requires moderator or admin role for most endpoints.

## Docker

```bash
# Build image
docker build -t stumbleable/moderation-service .

# Run container
docker run -p 7005:8080 --env-file .env stumbleable/moderation-service
```

## Kubernetes

See `k8s/base/moderation-service.yaml` for deployment configuration.

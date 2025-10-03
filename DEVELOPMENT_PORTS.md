# Stumbleable Development Ports

This document outlines the port assignments for local development of the Stumbleable application.

## Port Assignments

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend (Next.js) | 3000 | http://localhost:3000 | Main web application |
| Discovery Service | 7001 | http://localhost:7001 | Discovery recommendation API |
| Interaction Service | 7002 | http://localhost:7002 | User interaction tracking API |
| User Service | 7003 | http://localhost:7003 | User profiles & preferences API |
| Crawler Service | 7004 | http://localhost:7004 | Automated content crawler API |
| Moderation Service | 7005 | http://localhost:7005 | Content moderation & reporting API |
| Email Service | 7006 | http://localhost:7006 | Email notifications & communications API |

## Starting Services

### All Services at Once
```bash
# From root directory
npm run dev
# Starts all services concurrently
```

### Individual Services

#### Frontend
```bash
cd ui/portal
npm run dev
# Runs on http://localhost:3000
```

#### Discovery Service
```bash
cd apis/discovery-service
npm run dev
# Runs on http://localhost:7001
```

#### Interaction Service
```bash
cd apis/interaction-service
npm run dev
# Runs on http://localhost:7002
```

#### User Service
```bash
cd apis/user-service
npm run dev
# Runs on http://localhost:7003
```

#### Crawler Service
```bash
cd apis/crawler-service
npm run dev
# Runs on http://localhost:7004
```

#### Moderation Service
```bash
cd apis/moderation-service
npm run dev
# Runs on http://localhost:7005
```

#### Email Service
```bash
cd apis/email-service
npm run dev
# Runs on http://localhost:7006
```

## Health Checks

- Discovery Service: http://localhost:7001/health
- Interaction Service: http://localhost:7002/health
- User Service: http://localhost:7003/health
- Crawler Service: http://localhost:7004/health
- Moderation Service: http://localhost:7005/health
- Email Service: http://localhost:7006/health

Run `npm run health` from root to check all services at once.

## Environment Configuration

Each service has an `.env.example` file showing required environment variables. Copy to `.env` and modify as needed:

```bash
# In each service directory
cp .env.example .env
```

### Key Environment Variables
- `PORT` - Service port number
- `HOST` - Bind address (127.0.0.1 for local development, 0.0.0.0 for Docker/K8s)
- `NODE_ENV` - Environment (development/production)

**Note**: Services bind to `127.0.0.1` by default for local development. For Docker or Kubernetes deployment, set `HOST=0.0.0.0` to accept connections from other containers/pods.

## API Endpoints

### Discovery Service (Port 7001)
- `POST /api/next` - Get next discovery for user
- `GET /api/trending` - Get trending content
- `POST /api/submit` - Submit new content for moderation
- `GET /api/moderation/queue` - Get moderation queue (moderator/admin)
- `POST /api/moderation/:id/decision` - Make moderation decision (moderator/admin)
- `GET /api/reports` - Get content reports (moderator/admin)
- `POST /api/reports/:id/resolve` - Resolve content report (moderator/admin)

### Interaction Service (Port 7002)
- `POST /api/feedback` - Record user feedback (like, skip, save, share)
- `GET /api/saved` - Get saved discoveries for user
- `POST /api/saved/:discoveryId` - Save a discovery
- `DELETE /api/saved/:discoveryId` - Unsave a discovery
- `GET /api/stats/:discoveryId` - Get interaction stats for discovery

### User Service (Port 7003)
- `GET /api/users/:clerkId` - Get or create user by Clerk ID
- `PATCH /api/users/:id/preferences` - Update user preferences
- `GET /api/topics` - Get all available topics

### Crawler Service (Port 7004)
- `GET /api/sources` - List all crawler sources
- `POST /api/sources` - Create new crawler source
- `GET /api/sources/:id` - Get crawler source details
- `PATCH /api/sources/:id` - Update crawler source
- `DELETE /api/sources/:id` - Delete crawler source
- `GET /api/jobs` - List recent crawler jobs
- `POST /api/crawl/:sourceId` - Trigger manual crawl for a source
- `GET /api/stats` - Get aggregated crawler statistics

### Moderation Service (Port 7005)
- `GET /api/moderation/queue` - Get moderation queue
- `POST /api/moderation/:id/approve` - Approve content
- `POST /api/moderation/:id/reject` - Reject content
- `GET /api/moderation/stats` - Get moderation statistics
- `POST /api/reports` - Create content report
- `GET /api/reports` - List content reports
- `POST /api/reports/:id/resolve` - Resolve report

### Email Service (Port 7006)
- `POST /api/send` - Queue an email to be sent
- `GET /api/preferences/:userId` - Get user's email preferences
- `PUT /api/preferences/:userId` - Update email preferences
- `POST /api/scheduled/trigger` - Trigger scheduled email job
- `GET /api/scheduled/status` - Get scheduler status
# Crawler Service

Automated content discovery service for Stumbleable. Monitors RSS feeds, sitemaps, and websites to discover new content.

## 🔒 Authentication & Authorization

The crawler service uses **Clerk authentication** and requires **admin role** for all management endpoints:

### Protected Endpoints (Admin Only)
All crawler management endpoints require:
1. Valid Clerk authentication token
2. User must have `role: 'admin'` in the database

**Source Management:**
- `GET /api/sources` - List all crawler sources
- `POST /api/sources` - Create new crawler source
- `GET /api/sources/:id` - Get source details
- `PUT /api/sources/:id` - Update source configuration
- `DELETE /api/sources/:id` - Delete source

**Job Management:**
- `GET /api/jobs` - List all crawler jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/crawl/:sourceId` - Trigger manual crawl
- `GET /api/stats` - Get crawler statistics

### Public Endpoints
- `GET /health` - Service health check (no auth required)

### Authentication Headers
Include the Clerk session token in requests:
```bash
Authorization: Bearer <clerk_session_token>
```

### Testing Authentication
```bash
# This will fail without auth
curl http://localhost:7004/api/sources

# This will work with admin token
curl http://localhost:7004/api/sources \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## 🚀 Getting Started

- **RSS/Atom Feed Parsing**: Automatically discover and parse RSS/Atom feeds
- **Sitemap Crawling**: Parse XML sitemaps for content discovery
- **Robots.txt Compliance**: Respects robots.txt rules and crawl-delay directives
- **Scheduled Crawling**: Background job scheduler with configurable intervals
- **Rate Limiting**: Politeness policies and per-domain crawl delays
- **Content Submission**: Automatic submission to discovery-service
- **Statistics Tracking**: Monitor crawler performance and success rates

## API Endpoints

### Sources Management
- `GET /api/sources` - List all crawler sources
- `GET /api/sources/:id` - Get a specific source
- `POST /api/sources` - Create a new source
- `PUT /api/sources/:id` - Update a source
- `DELETE /api/sources/:id` - Delete a source

### Jobs & Crawling
- `GET /api/jobs` - List all crawler jobs
- `GET /api/jobs/:id` - Get a specific job
- `POST /api/crawl/:sourceId` - Manually trigger a crawl
- `GET /api/history/:sourceId` - Get crawl history for a source
- `GET /api/stats` - Get statistics for all sources

### Health Check
- `GET /health` - Service health status

## Configuration

### Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Service Configuration
PORT=7004
NODE_ENV=development

# Discovery Service URL
DISCOVERY_SERVICE_URL=http://localhost:7001

# Crawler Configuration
CRAWLER_USER_AGENT=Stumbleable-Bot/1.0 (+https://stumbleable.com/bot)
DEFAULT_CRAWL_DELAY_MS=1000
MAX_CONCURRENT_CRAWLS=5
```

## Source Types

### RSS Feed
```json
{
  "name": "Example Blog",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "crawl_frequency_hours": 24,
  "topics": ["technology", "programming"],
  "enabled": true
}
```

### Sitemap
```json
{
  "name": "News Site",
  "type": "sitemap",
  "url": "https://news.example.com/sitemap.xml",
  "crawl_frequency_hours": 12,
  "topics": ["news", "culture"],
  "enabled": true
}
```

### Website (Auto-discovery)
```json
{
  "name": "Tech Blog",
  "type": "web",
  "url": "https://techblog.example.com",
  "crawl_frequency_hours": 48,
  "topics": ["technology"],
  "enabled": true
}
```

## How It Works

1. **Scheduler** runs every 15 minutes checking for sources due for crawling
2. **Crawler Engine** fetches content based on source type (RSS, sitemap, or web)
3. **Robots.txt Service** ensures compliance with site policies
4. **Rate Limiter** respects crawl-delay directives and domain-specific delays
5. **Content Submission** sends discovered URLs to discovery-service for moderation
6. **History Tracking** records all discovered URLs to prevent duplicates
7. **Statistics** track crawler performance and success rates

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

## Database Tables

- `crawler_sources` - Content sources to crawl
- `crawler_jobs` - Individual crawl job executions
- `crawler_history` - Historical record of discovered URLs
- `crawler_stats` - Aggregated statistics per source

## Politeness & Ethics

The crawler is designed to be a good web citizen:

- Respects `robots.txt` rules and User-agent directives
- Honors `Crawl-delay` directives
- Uses descriptive User-Agent string with contact information
- Implements rate limiting per domain
- Limits concurrent crawls
- Filters recent content to avoid re-crawling

## Monitoring

Monitor crawler health via:
- `/health` endpoint
- Job statistics in `crawler_stats` table
- Job history in `crawler_jobs` table
- Submission success/failure rates

## Common Issues

### Source not crawling
- Check `enabled` flag is `true`
- Verify `next_crawl_at` is in the past
- Check `crawler_jobs` for error messages
- Verify robots.txt allows crawling

### Low success rate
- Review `crawler_history` for error messages
- Check if URLs are being rejected by moderation
- Verify topics are correctly classified
- Check discovery-service logs

### Rate limiting
- Adjust `DEFAULT_CRAWL_DELAY_MS` environment variable
- Check robots.txt for crawl-delay directive
- Reduce `MAX_CONCURRENT_CRAWLS` if needed

## License

MIT

# Rate Limiting Implementation

## Overview

**Status:** ✅ Complete  
**Date:** 2025-01-XX  
**Services:** Discovery (7001), Interaction (7002), User (7003)

All three Stumbleable microservices now have production-ready rate limiting to prevent abuse and ensure fair resource allocation.

---

## Implementation Details

### Package Used
- **@fastify/rate-limit** v9.0.1
- Official Fastify plugin for rate limiting
- In-memory cache with configurable size
- Support for both IP-based and user-based limits

### Configuration

Each service has identical rate limiting configuration:

```typescript
await fastify.register(fastifyRateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    cache: 10000, // Cache 10k entries
    allowList: ['127.0.0.1'], // Whitelist localhost for development
    continueExceeding: true, // Don't ban, just reject
    skipOnError: true, // Don't apply rate limit if error
    addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true
    },
    addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true
    },
    keyGenerator: (request) => {
        // Use Clerk user ID if authenticated, otherwise IP
        const clerkUserId = (request as any).auth?.userId;
        if (clerkUserId) {
            return `user:${clerkUserId}`;
        }
        return request.ip || 'unknown';
    },
    errorResponseBuilder: (request, context) => {
        return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
            retryAfter: Math.ceil(context.ttl / 1000)
        };
    },
    onExceeding: (request, key) => {
        fastify.log.warn({ key, ip: request.ip }, 'Rate limit threshold approaching');
    },
    onExceeded: (request, key) => {
        fastify.log.error({ key, ip: request.ip }, 'Rate limit exceeded');
    }
});
```

---

## Configuration Options

### Environment Variables

Each service can be configured via environment variables:

```env
# Rate limiting settings
RATE_LIMIT_MAX=100          # Maximum requests per window
RATE_LIMIT_WINDOW=60000     # Time window in milliseconds (60 seconds)
```

### Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| `RATE_LIMIT_MAX` | 100 | Maximum requests per time window |
| `RATE_LIMIT_WINDOW` | 60000 | Time window in milliseconds (1 minute) |
| Cache size | 10000 | Number of keys to store in memory |
| Allow list | `127.0.0.1` | IPs that bypass rate limiting |

---

## Key Features

### 1. Smart Key Generation

**Authenticated users:** Rate limited per Clerk user ID
- Key format: `user:{clerkUserId}`
- Allows users to make requests from multiple IPs
- More accurate for logged-in users

**Anonymous users:** Rate limited per IP address
- Key format: IP address (e.g., `192.168.1.1`)
- Prevents abuse from unauthenticated endpoints
- Fair for casual browsing

### 2. Informative Headers

Every response includes rate limit information:

```http
HTTP/1.1 200 OK
x-ratelimit-limit: 100
x-ratelimit-remaining: 87
x-ratelimit-reset: 1234567890
```

**Headers:**
- `x-ratelimit-limit`: Maximum requests allowed in window
- `x-ratelimit-remaining`: Requests remaining in current window
- `x-ratelimit-reset`: Unix timestamp when limit resets

### 3. Graceful Error Responses

When limit is exceeded (HTTP 429):

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 42 seconds.",
  "retryAfter": 42
}
```

### 4. Health Check Exemption

The `/health` endpoint bypasses rate limiting:

```typescript
fastify.get('/health', {
    config: {
        rateLimit: false // Disable rate limiting for health checks
    }
}, async (request, reply) => {
    return {
        status: 'healthy',
        service: 'discovery-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        rateLimit: {
            enabled: true,
            max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10)
        }
    };
});
```

Health check responses now include rate limit configuration info.

### 5. Structured Logging

Rate limit events are logged with context:

**Warning (approaching limit):**
```json
{
  "level": "warn",
  "msg": "Rate limit threshold approaching",
  "key": "user:user_abc123",
  "ip": "192.168.1.1"
}
```

**Error (limit exceeded):**
```json
{
  "level": "error",
  "msg": "Rate limit exceeded",
  "key": "user:user_abc123",
  "ip": "192.168.1.1"
}
```

---

## Testing

### Manual Testing

**Test authenticated user rate limit:**

```bash
# Get Clerk auth token first
TOKEN="your_clerk_token"

# Make multiple requests
for i in {1..105}; do
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:7001/api/discovery/next
done

# After 100 requests, you'll see:
# {"statusCode":429,"error":"Too Many Requests","message":"Rate limit exceeded. Try again in 42 seconds.","retryAfter":42}
```

**Test anonymous user rate limit:**

```bash
# Make requests without authentication
for i in {1..105}; do
  curl http://localhost:7001/health
done

# Health checks are exempt, all should succeed
```

**Check rate limit headers:**

```bash
curl -i http://localhost:7001/api/discovery/trending

# Response includes:
# x-ratelimit-limit: 100
# x-ratelimit-remaining: 99
# x-ratelimit-reset: 1234567890
```

### Integration Testing

Create a test file `apis/discovery-service/src/test/rate-limit.test.ts`:

```typescript
import { test } from 'tap';
import { build } from '../server';

test('rate limiting', async (t) => {
  const app = await build();
  
  // Make requests up to limit
  for (let i = 0; i < 100; i++) {
    const response = await app.inject({
      method: 'GET',
      url: '/api/discovery/trending'
    });
    t.equal(response.statusCode, 200);
  }
  
  // Next request should be rate limited
  const response = await app.inject({
    method: 'GET',
    url: '/api/discovery/trending'
  });
  t.equal(response.statusCode, 429);
  
  const body = JSON.parse(response.body);
  t.equal(body.error, 'Too Many Requests');
  t.ok(body.retryAfter > 0);
  
  await app.close();
});

test('health check bypasses rate limiting', async (t) => {
  const app = await build();
  
  // Make many health check requests
  for (let i = 0; i < 150; i++) {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });
    t.equal(response.statusCode, 200);
  }
  
  await app.close();
});
```

---

## Production Considerations

### Recommended Settings

**Development:**
```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000    # 100 requests per minute
```

**Production:**
```env
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=60000    # 1000 requests per minute
```

**Stricter limits for specific endpoints:**
```typescript
// Example: Limit content submission to 10 per hour
fastify.post('/api/content/submit', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: 3600000 // 1 hour
    }
  }
}, async (request, reply) => {
  // Handler
});
```

### Performance Tuning

**Cache size:**
- Current: 10,000 entries
- Increase for high-traffic sites: 50,000+
- Each entry uses ~200 bytes of memory

**Time window:**
- Current: 60 seconds
- Shorter windows (15s) for stricter limiting
- Longer windows (5m) for gentler limiting

**Allow list:**
- Add trusted IPs (monitoring, health checks)
- Add load balancer IPs if behind proxy
- Add CI/CD servers for testing

### Scaling Considerations

**Current implementation (in-memory cache):**
- ✅ Simple, fast, no external dependencies
- ✅ Works well for single-instance deployments
- ❌ State not shared between instances
- ❌ Resets on server restart

**For multi-instance deployments:**

Consider using Redis for shared state:

```typescript
import fastifyRateLimit from '@fastify/rate-limit';
import redis from '@fastify/redis';

await fastify.register(redis, {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379')
});

await fastify.register(fastifyRateLimit, {
  redis: fastify.redis,
  // ... other options
});
```

Benefits:
- Shared rate limit state across all instances
- Persistent between restarts
- Centralized monitoring and management

---

## Monitoring

### Log Analysis

**Query Pino logs for rate limit events:**

```bash
# Count rate limit warnings by user
cat logs/discovery-service.log | \
  grep "Rate limit threshold approaching" | \
  jq '.key' | \
  sort | uniq -c | sort -rn

# Find IPs exceeding limits
cat logs/discovery-service.log | \
  grep "Rate limit exceeded" | \
  jq '.ip' | \
  sort | uniq -c | sort -rn
```

### Metrics to Track

1. **Rate limit rejections (429 responses)**
   - Track per service
   - Alert if > 5% of requests

2. **Unique users/IPs hitting limits**
   - Identify potential abuse
   - Adjust limits if legitimate usage

3. **Time to rate limit**
   - How fast users hit limits
   - Indicates if limits too strict

4. **Rate limit resets**
   - Frequency of limit resets
   - Pattern analysis

### Alerting

**High rate limit rejection rate:**
```
If (rate_limit_429_count / total_requests) > 0.05
Then alert("High rate limit rejection rate - consider increasing limits")
```

**Repeated limit violations:**
```
If user hits rate limit > 5 times in 1 hour
Then alert("Potential abuse detected from user: {userId}")
```

---

## Troubleshooting

### Issue: Rate limit headers not showing in development

**Cause:** Localhost is in the allow list, so rate limiting is **bypassed** during local development:
```typescript
allowList: ['127.0.0.1']
```

This is intentional - it allows developers to work without hitting limits.

**To test rate limiting in development:**
1. Temporarily remove `127.0.0.1` from `allowList`
2. Restart the service
3. Make requests and observe headers
4. Remember to add it back before committing!

**To see rate limit headers in production:**
Rate limit headers will appear for all non-allowlisted IPs in production.

### Issue: Localhost development being rate limited

**Solution:** If you want to disable rate limiting for localhost (recommended), ensure it's in the allow list:
```typescript
allowList: ['127.0.0.1']
```

If using `localhost` instead of `127.0.0.1`, add both:
```typescript
allowList: ['127.0.0.1', '::1'] // IPv4 and IPv6 localhost
```

### Issue: Health checks failing due to rate limits

**Solution:** Health checks are already exempt:
```typescript
fastify.get('/health', {
  config: {
    rateLimit: false
  }
}, ...)
```

Make sure your monitoring tool is using `/health`, not other endpoints.

### Issue: Users report being rate limited too aggressively

**Solution:** Increase limits via environment variables:
```env
RATE_LIMIT_MAX=500          # Increase from 100
RATE_LIMIT_WINDOW=60000     # Keep window same
```

Or implement tiered limits based on user roles:
```typescript
keyGenerator: (request) => {
  const user = (request as any).auth?.userId;
  const isAdmin = (request as any).auth?.metadata?.role === 'admin';
  
  if (isAdmin) {
    return `admin:${user}`; // Higher limit for admins
  }
  return `user:${user}`;
}
```

### Issue: Rate limits not working after deployment

**Checklist:**
1. ✅ Plugin registered BEFORE routes?
2. ✅ Environment variables set correctly?
3. ✅ Multiple server instances? (use Redis)
4. ✅ Behind load balancer? (check IP forwarding)

---

## Service Status

| Service | Port | Rate Limiting | Status |
|---------|------|---------------|--------|
| Discovery | 7001 | ✅ Enabled | Ready |
| Interaction | 7002 | ✅ Enabled | Ready |
| User | 7003 | ✅ Enabled | Ready |

All services now include rate limiting information in their startup logs:

```
🚀 Discovery Service running on http://127.0.0.1:7001
📊 Health check: http://127.0.0.1:7001/health
🔍 Next discovery: POST http://127.0.0.1:7001/api/discovery/next
📈 Trending: GET http://127.0.0.1:7001/api/discovery/trending
🛡️  Rate limiting: 100 requests per 60 seconds
```

---

## Next Steps

### Enhanced Logging (Next Priority)
- Correlation IDs for request tracing
- Query performance logging
- Log aggregation setup (ELK, CloudWatch)

### Service Health Monitoring
- Comprehensive health checks
- Uptime monitoring
- Performance metrics
- Alert thresholds

### Rate Limiting Enhancements (Future)
- Redis-based shared state for multi-instance
- Per-endpoint custom limits
- User role-based limits
- Dynamic limit adjustment based on load

---

## Related Documentation

- [Content Moderation System](./CONTENT_MODERATION_SYSTEM.md)
- [Production Deployment Guide](./DEPLOYMENT.md) (TBD)
- [Monitoring & Observability](./MONITORING.md) (TBD)
- [API Documentation](./API.md) (TBD)

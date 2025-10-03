# OG Image Service

🖼️ Dynamic Open Graph image generation service for Stumbleable.

## Overview

This microservice generates beautiful Open Graph (social media preview) images on-demand using `@vercel/og`. Images are cached in-memory for performance.

## Features

- ✅ Dynamic image generation based on title/description
- ✅ Multiple themes (light/dark)
- ✅ Multiple types (default, article, about, alternative)
- ✅ In-memory caching (100 images)
- ✅ Rate limiting (100 req/min)
- ✅ 1200x630px (perfect for social media)
- ✅ Brand-consistent design

## API Endpoints

### Generate OG Image
```
GET /api/og/generate?title=...&description=...&type=...&theme=...
```

**Query Parameters:**
- `title` (required): Image title (1-200 chars)
- `description` (optional): Subtitle text (max 300 chars)
- `type` (optional): `default` | `article` | `about` | `alternative`
- `theme` (optional): `light` | `dark`

**Response:** PNG image (1200x630px)

**Example:**
```
http://localhost:7005/api/og/generate?title=Rediscover%20the%20Magic%20of%20Web%20Discovery&description=One%20click.%20One%20surprise.&type=default&theme=light
```

### Service Info
```
GET /api/og/info
```

Returns service metadata and example URLs.

### Clear Cache
```
DELETE /api/og/cache
```

Clears the in-memory image cache (useful for development).

## Usage in Frontend

### In Next.js Metadata:
```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: 'http://localhost:7005/api/og/generate?title=My%20Page&description=Description',
        width: 1200,
        height: 630,
        alt: 'My Page'
      }
    ]
  }
};
```

### Dynamic URL Generation:
```typescript
const ogImageUrl = (title: string, description?: string) => {
  const params = new URLSearchParams({
    title,
    ...(description && { description }),
    type: 'default',
    theme: 'light'
  });
  return `${process.env.NEXT_PUBLIC_OG_SERVICE_URL}/api/og/generate?${params}`;
};
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build
npm run build

# Run production
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=7005
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

## Architecture

- **Fastify**: Web server
- **@vercel/og**: Image generation (Satori under the hood)
- **Zod**: Request validation
- **In-memory cache**: Simple Map-based LRU cache

## Performance

- Cached images: ~1-5ms response time
- New images: ~100-300ms generation time
- Cache size: 100 images (configurable)
- Cache strategy: Simple LRU eviction

## Production Considerations

For production, consider:
1. **Redis cache** instead of in-memory (for multi-instance deployments)
2. **CDN** for image delivery (CloudFront, Cloudflare)
3. **Pre-generation** of common images at build time
4. **Monitoring** cache hit rates and generation times

## Testing

```bash
# Health check
curl http://localhost:7005/health

# Service info
curl http://localhost:7005/api/og/info

# Generate image
curl "http://localhost:7005/api/og/generate?title=Test&description=Hello" --output test.png
```

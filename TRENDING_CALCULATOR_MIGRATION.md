# Trending Calculator Migration Fix

## Problem
When deploying crawler-service with the trending calculator, the build failed:

```
error TS2307: Cannot find module './scoring' or its corresponding type declarations.
```

The `trending-calculator.ts` was copied from discovery-service, but it depends on `scoring.ts` which was not copied.

## Solution

### Files Copied to Crawler Service
1. ✅ `src/lib/trending-calculator.ts` - The trending calculator class
2. ✅ `src/lib/scoring.ts` - Scoring algorithms it depends on

### Dependencies Check
- ✅ `node-cron` - Already in crawler-service package.json
- ✅ `@types/node-cron` - Already in devDependencies
- ✅ `supabase` client - Already exists in crawler-service

### Files Modified
- `apis/crawler-service/src/server.ts` - Import and start trending calculator
- `apis/crawler-service/src/lib/trending-calculator.ts` - (copied from discovery)
- `apis/crawler-service/src/lib/scoring.ts` - (copied from discovery)

## Verification

Both services should now compile successfully:

```bash
# Discovery service (trending calculator removed)
cd apis/discovery-service
npm run build

# Crawler service (trending calculator added)
cd apis/crawler-service
npm run build
```

## What Each Service Now Does

### Discovery Service
- Core discovery routes (next, trending, similar, content)
- Fast, read-only operations
- No background jobs
- Optimized for speed

### Crawler Service  
- Content crawling (RSS, sitemaps)
- Admin management routes
- **Trending calculator** (every 15 minutes)
- Background job processing

## Deploy Ready
Both services should now build and deploy successfully through the GitHub Actions workflow.

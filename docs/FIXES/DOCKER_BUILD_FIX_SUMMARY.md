# Docker Build Fix - Summary

## Problem
Next.js Docker builds were failing with multiple errors related to dependencies and authentication.

## Errors Encountered

### Error 1: Missing TypeScript
```
Cannot find module 'typescript'
```
**Cause**: `npm ci --only=production` excluded devDependencies needed for build.

### Error 2: Clerk Missing Publishable Key
```
@clerk/clerk-react: Missing publishableKey
```
**Cause**: ClerkProvider wraps the app, and Next.js tried to statically generate pages during build.

### Error 3: Invalid Clerk Publishable Key
```
@clerk/clerk-react: The publishableKey passed to Clerk is invalid. (key=pk_test_placeholder_for_build)
```
**Cause**: Even with placeholder keys, Clerk validates the key format and rejects invalid ones.

## Solution

### 1. Install All Dependencies During Build
**File**: `ui/portal/Dockerfile`

Changed from:
```dockerfile
RUN npm ci --only=production
```

To:
```dockerfile
RUN npm ci  # Installs ALL dependencies including devDependencies
```

**Why**: TypeScript, ESLint, Tailwind CSS, and other build tools are devDependencies but required for compilation.

### 2. Force Dynamic Rendering
**File**: `ui/portal/app/layout.tsx`

Added:
```typescript
// Force dynamic rendering to prevent static generation during Docker builds
export const dynamic = 'force-dynamic';
```

**Why**: 
- Disables static page generation at build time
- Pages render at request time instead
- Clerk authentication happens at runtime, not during build
- No need for API keys during Docker build

### 3. Simplified Build Arguments
**File**: `ui/portal/Dockerfile`

Removed placeholder Clerk keys, kept only optional API URLs:
```dockerfile
ARG NEXT_PUBLIC_DISCOVERY_API_URL
ARG NEXT_PUBLIC_INTERACTION_API_URL
ARG NEXT_PUBLIC_USER_API_URL
ARG NEXT_PUBLIC_CRAWLER_API_URL
ARG NEXT_PUBLIC_FONTAWESOME_KIT_URL
```

**Why**: With dynamic rendering, no Clerk keys are validated during build.

## Benefits of This Approach

### ✅ Security
- No credentials in Docker build
- No placeholder keys that could be confused with real ones
- All authentication happens at runtime

### ✅ Simplicity
- Cleaner Dockerfile
- No complex placeholder value management
- Works with any CI/CD pipeline

### ✅ Flexibility
- Environment variables provided at runtime
- Easy to switch between dev/staging/prod
- No rebuild needed for different environments

### ✅ Performance
- Dynamic rendering is still fast with Next.js 15
- Proper caching at runtime
- Smaller build context (no secrets)

## Docker Build Command

### Minimal Build (Recommended)
```bash
docker build -t stumbleable-ui:latest ./ui/portal
```

### With Optional API URLs
```bash
docker build \
  --build-arg NEXT_PUBLIC_DISCOVERY_API_URL=https://api.example.com \
  -t stumbleable-ui:latest \
  ./ui/portal
```

## Runtime Configuration

All environment variables are provided when running the container:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key \
  -e CLERK_SECRET_KEY=sk_live_your_secret \
  -e NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery \
  -e NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction \
  -e NEXT_PUBLIC_USER_API_URL=https://api.stumbleable.com/user \
  -e NEXT_PUBLIC_CRAWLER_API_URL=https://api.stumbleable.com/crawler \
  stumbleable-ui:latest
```

## Trade-offs

### What We Gave Up
- ❌ Static page generation at build time
- ❌ Slightly faster initial page loads (for static pages)

### What We Gained
- ✅ Successful Docker builds without credentials
- ✅ Simpler build process
- ✅ Better security (no build-time secrets)
- ✅ More flexible deployment
- ✅ Easier CI/CD integration

## Performance Impact

**Minimal to None:**
- Next.js 15 dynamic rendering is highly optimized
- Pages still use React Server Components
- Caching still works at runtime
- Initial render happens server-side (fast)

## Testing the Build

### Local Test
```bash
# Build
docker build -t stumbleable-ui:test ./ui/portal

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_KEY \
  -e CLERK_SECRET_KEY=$CLERK_SECRET \
  stumbleable-ui:test
```

### Azure Container Registry
```bash
az acr build \
  --registry your-registry \
  --image stumbleable-ui:latest \
  ./ui/portal
```

## Related Documentation
- [Docker Build Guide](./DOCKER_BUILD_GUIDE.md) - Complete Docker reference
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment variable configuration
- [Azure Deployment](./AZURE_DEPLOYMENT_GUIDE.md) - Azure-specific deployment

## Conclusion

The solution uses Next.js 15's dynamic rendering to avoid static page generation during Docker builds. This eliminates the need for Clerk API keys during build time while maintaining security, performance, and flexibility.

**Status**: ✅ Ready for production deployment

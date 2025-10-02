# Docker Build Guide for Stumbleable UI

## Overview
The Stumbleable UI uses a multi-stage Docker build process optimized for Next.js 15 applications with Clerk authentication.

## Build Stages

### Stage 1: Dependencies (`deps`)
- Installs ALL dependencies (including devDependencies)
- Required for TypeScript, Tailwind CSS, and other build tools
- Uses `npm ci` for clean, reproducible installs

### Stage 2: Builder (`builder`)
- Copies dependencies from Stage 1
- Accepts optional build arguments for API URLs
- Compiles the Next.js application
- Uses dynamic rendering (no static page generation)

### Stage 3: Production Dependencies (`prod-deps`)
- Installs only production dependencies
- Optimizes final image size

### Stage 4: Runner (`runner`)
- Minimal runtime image
- Runs as non-root user (`nextjs`)
- Includes health check endpoint

## Build Arguments

The following build arguments are accepted (all optional):

```bash
NEXT_PUBLIC_DISCOVERY_API_URL
NEXT_PUBLIC_INTERACTION_API_URL
NEXT_PUBLIC_USER_API_URL
NEXT_PUBLIC_CRAWLER_API_URL
NEXT_PUBLIC_FONTAWESOME_KIT_URL
```

### Why No Clerk Keys During Build?

The application uses **dynamic rendering** (`export const dynamic = 'force-dynamic'` in `app/layout.tsx`), which means:

1. **No static page generation** - Pages are rendered at request time, not build time
2. **No Clerk validation during build** - Authentication happens at runtime
3. **Cleaner builds** - No need for placeholder or dummy API keys
4. **Runtime flexibility** - All environment variables are provided when the container starts

This approach is more secure and flexible than embedding credentials in the build.

## Building the Image

### Basic Build
```bash
docker build -t stumbleable-ui:latest ./ui/portal
```

### Build with Custom API URLs (Optional)
```bash
docker build \
  --build-arg NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery \
  --build-arg NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction \
  -t stumbleable-ui:latest \
  ./ui/portal
```

### Build with Azure Container Registry
```bash
az acr build \
  --registry your-registry \
  --image stumbleable-ui:latest \
  ./ui/portal
```

## Runtime Environment Variables

**IMPORTANT**: All authentication and API configuration is provided at runtime, not during the build.

### Docker Run
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_real_key \
  -e CLERK_SECRET_KEY=sk_live_your_real_secret \
  -e NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery \
  -e NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction \
  -e NEXT_PUBLIC_USER_API_URL=https://api.stumbleable.com/user \
  stumbleable-ui:latest
```

### Kubernetes
Runtime environment variables are provided via ConfigMaps and Secrets (see `k8s/` directory).

### Azure Container Apps
Environment variables are configured in the Azure Portal or via Azure CLI during deployment.

## Common Issues

### Issue: TypeScript Not Found During Build
**Symptom**: `Cannot find module 'typescript'`
**Solution**: Ensure Stage 1 uses `npm ci` (not `npm ci --only=production`)

### Issue: Clerk Invalid Publishable Key During Build
**Symptom**: `@clerk/clerk-react: The publishableKey passed to Clerk is invalid`
**Solution**: Application uses dynamic rendering (`force-dynamic`) to skip static generation. No Clerk keys are needed during build.

### Issue: Build Cache Not Found
**Symptom**: `failed to configure registry cache importer`
**Solution**: This is expected on first build. Cache will be created after successful build.

## Optimization Tips

1. **Use BuildKit**: Enable Docker BuildKit for faster, more efficient builds
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Layer Caching**: The multi-stage build maximizes layer caching:
   - Dependencies layer only rebuilds when `package.json` changes
   - Source code layer rebuilds when application code changes

3. **Image Size**: The final runner image is minimal:
   - Only production dependencies
   - No build tools or devDependencies
   - Runs as non-root user

## Health Checks

The Docker image includes a health check that verifies:
- The Next.js server is responding
- The `/api/health` endpoint returns 200 status

Configure health check intervals in your orchestration platform as needed.

## Security Considerations

1. **Non-root User**: Application runs as user `nextjs` (UID 1001)
2. **Read-only Filesystem**: Compatible with read-only container filesystems
3. **No Secrets in Build**: Build-time placeholders are replaced at runtime
4. **Minimal Attack Surface**: Final image contains only necessary runtime components

## Related Documentation

- [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Quick Deploy Guide](../QUICK_DEPLOY.md)

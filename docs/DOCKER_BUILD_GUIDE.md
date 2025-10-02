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
- Accepts build arguments for configuration
- Compiles the Next.js application
- Uses placeholder values for Clerk keys to allow static page generation

### Stage 3: Production Dependencies (`prod-deps`)
- Installs only production dependencies
- Optimizes final image size

### Stage 4: Runner (`runner`)
- Minimal runtime image
- Runs as non-root user (`nextjs`)
- Includes health check endpoint

## Build Arguments

The following build arguments are accepted (with default placeholders):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder_for_build
CLERK_SECRET_KEY=sk_test_placeholder_for_build
NEXT_PUBLIC_DISCOVERY_API_URL=http://localhost:7001
NEXT_PUBLIC_INTERACTION_API_URL=http://localhost:7002
NEXT_PUBLIC_USER_API_URL=http://localhost:7003
NEXT_PUBLIC_CRAWLER_API_URL=http://localhost:7004
NEXT_PUBLIC_FONTAWESOME_KIT_URL=https://kit.fontawesome.com/fab812572f.js
```

### Why Placeholder Values?

During the Docker build, Next.js attempts to statically generate pages. Since ClerkProvider wraps the entire application, it needs API keys during build time. We provide placeholder values that:

1. **Allow the build to complete** without errors
2. **Are overridden at runtime** by actual environment variables
3. **Don't pose security risks** (placeholders are never used in production)

## Building the Image

### Basic Build
```bash
docker build -t stumbleable-ui:latest ./ui/portal
```

### Build with Custom Values
```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key \
  --build-arg CLERK_SECRET_KEY=sk_live_your_secret \
  --build-arg NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery \
  -t stumbleable-ui:latest \
  ./ui/portal
```

### Build with Azure Container Registry
```bash
az acr build \
  --registry your-registry \
  --image stumbleable-ui:latest \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PK \
  --build-arg CLERK_SECRET_KEY=$CLERK_SK \
  ./ui/portal
```

## Runtime Environment Variables

**IMPORTANT**: The placeholder values used during build MUST be overridden at runtime with actual values.

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

### Issue: Clerk Missing Publishable Key
**Symptom**: `@clerk/clerk-react: Missing publishableKey`
**Solution**: Build arguments now include placeholder values by default

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

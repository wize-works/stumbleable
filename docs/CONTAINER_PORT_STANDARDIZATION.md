# Container Port Standardization

**Date**: October 1, 2025  
**Status**: ✅ Complete

## Overview

Standardized all API service containers to use **port 8080** internally while maintaining logical service ports (7001-7004) for external addressing via Kubernetes port mapping.

## Motivation

### The Problem
Services were hardcoding service-specific ports (7001, 7002, 7003, 7004) in multiple places:
- ❌ `server.ts` defaults
- ❌ `Dockerfile` EXPOSE and ENV
- ❌ Kubernetes containerPort

This violated best practices:
- **Not portable**: Container tied to specific service identity
- **Not reusable**: Can't run same image on different ports
- **Not conventional**: Didn't follow industry standards (8080 for HTTP)

### The Solution
- ✅ Containers use **8080** internally (industry standard)
- ✅ Kubernetes maps external ports (7001-7004) to internal 8080
- ✅ PORT environment variable allows override when needed
- ✅ Containers are now portable and follow conventions

---

## Changes Made

### 1. API Service Code (server.ts)

**Discovery Service** (`apis/discovery-service/src/server.ts`):
```typescript
// Before:
const port = parseInt(process.env.PORT || '7001', 10);

// After:
const port = parseInt(process.env.PORT || '8080', 10);
```

**Interaction Service** (`apis/interaction-service/src/server.ts`):
```typescript
// Before:
const port = parseInt(process.env.PORT || '7002', 10);

// After:
const port = parseInt(process.env.PORT || '8080', 10);
```

**User Service** (`apis/user-service/src/server.ts`):
```typescript
// Before:
const port = parseInt(process.env.PORT || '7003', 10);

// After:
const port = parseInt(process.env.PORT || '8080', 10);
```

**Crawler Service**: Already used dynamic `PORT` env var, no code change needed.

---

### 2. Dockerfiles

All four API service Dockerfiles updated:

```dockerfile
# Before:
EXPOSE 7001  # (or 7002, 7003, 7004)
ENV PORT=7001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7001/health', ...)"

# After:
EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', ...)"
```

**Files Modified**:
- ✅ `apis/discovery-service/Dockerfile`
- ✅ `apis/interaction-service/Dockerfile`
- ✅ `apis/user-service/Dockerfile`
- ✅ `apis/crawler-service/Dockerfile`

---

### 3. Kubernetes Deployment YAMLs

Changed container ports and health probe ports from service-specific to 8080:

```yaml
# Before:
containers:
- name: discovery-service
  ports:
  - containerPort: 7001  # Service-specific
  livenessProbe:
    httpGet:
      path: /health
      port: 7001
  readinessProbe:
    httpGet:
      path: /health
      port: 7001

# After:
containers:
- name: discovery-service
  ports:
  - containerPort: 8080  # Standard port
  livenessProbe:
    httpGet:
      path: /health
      port: 8080
  readinessProbe:
    httpGet:
      path: /health
      port: 8080
```

**Files Modified**:
- ✅ `k8s/base/discovery-service.yaml`
- ✅ `k8s/base/interaction-service.yaml`
- ✅ `k8s/base/user-service.yaml`
- ✅ `k8s/base/crawler-service.yaml`

---

### 4. Kubernetes Service YAMLs

Updated to map external service ports to internal container port:

```yaml
# Before:
spec:
  type: ClusterIP
  ports:
  - port: 7001
    targetPort: 7001  # Same port internally and externally

# After:
spec:
  type: ClusterIP
  ports:
  - port: 7001          # External port (what clients use)
    targetPort: 8080    # Internal port (what container listens on)
```

**This is the key change**: 
- External callers still use `discovery-service:7001`
- Kubernetes routes to container's port 8080
- Container doesn't need to know its logical service port

**Files Modified**:
- ✅ `k8s/base/discovery-service.yaml` (port: 7001 → targetPort: 8080)
- ✅ `k8s/base/interaction-service.yaml` (port: 7002 → targetPort: 8080)
- ✅ `k8s/base/user-service.yaml` (port: 7003 → targetPort: 8080)
- ✅ `k8s/base/crawler-service.yaml` (port: 7004 → targetPort: 8080)

---

### 5. Documentation Updates

Added to `.github/copilot-instructions.md`:

#### Service Development Standards Section:
```markdown
- **Container port**: ALL services MUST use **8080** as default internal port
- **Service ports**: External service addressing uses logical ports (7001-7004)
- **Port mapping**: Kubernetes maps external ports to internal 8080 via targetPort
```

#### New Port Mapping Architecture Section:
```markdown
### Port Mapping Architecture

**Container Internal Port**: 8080 (standard)
- All services bind to port 8080 inside the container
- Can be overridden via PORT environment variable
- Makes containers portable and reusable

**Kubernetes Service Ports**: 7001-7004 (logical addressing)

**Why This Matters**:
- ✅ Portability: Same container can run anywhere
- ✅ Convention: 8080 is the standard HTTP service port
- ✅ Separation: Container doesn't need to know its service identity
- ✅ Flexibility: K8s handles external port mapping
```

---

## Architecture

### Before (Service-Specific Ports)
```
Frontend Request
  ↓
discovery-service:7001 (K8s Service)
  ↓
Pod Container Port 7001
  ↓
App binds to 0.0.0.0:7001
```

❌ **Problem**: Container is hardcoded to service identity

### After (Standard 8080 with Mapping)
```
Frontend Request
  ↓
discovery-service:7001 (K8s Service) ← Logical service port
  ↓ [port mapping via targetPort]
Pod Container Port 8080 ← Standard container port
  ↓
App binds to 0.0.0.0:8080
```

✅ **Benefits**: Container is portable, K8s handles routing

---

## Port Reference

### Internal Container Ports (All Services)
- **Default**: `8080` (standard HTTP service port)
- **Override**: Via `PORT` environment variable in ConfigMap
- **Health Checks**: Always use port `8080`

### External Service Ports (Kubernetes)
- **Discovery Service**: `7001` → maps to container `8080`
- **Interaction Service**: `7002` → maps to container `8080`
- **User Service**: `7003` → maps to container `8080`
- **Crawler Service**: `7004` → maps to container `8080`
- **UI Portal**: `3000` (Next.js uses its own convention)

### Service URLs in Cluster
```bash
# External addressing (unchanged)
http://discovery-service:7001/health
http://interaction-service:7002/health
http://user-service:7003/health
http://crawler-service:7004/health

# Internal container (now all use 8080)
curl localhost:8080/health  # Inside any API container
```

---

## Benefits

### 1. **Portability**
Containers can run on any platform without modification:
```bash
# Local Docker
docker run -p 9000:8080 stumbleable-discovery

# Cloud Run (expects 8080)
gcloud run deploy --image=... --port=8080

# AWS ECS (port mapping in task definition)
"portMappings": [{"containerPort": 8080, "hostPort": 7001}]
```

### 2. **Convention**
Following industry standards:
- ✅ Cloud Run default: 8080
- ✅ Google App Engine: 8080
- ✅ Azure Container Apps: 8080
- ✅ Most HTTP service examples: 8080

### 3. **Reusability**
Same image can serve multiple purposes:
```bash
# Run as discovery service
kubectl set env deployment/discovery-service PORT=7001

# Run for testing on different port
docker run -e PORT=9999 -p 9999:8080 stumbleable-discovery
```

### 4. **Separation of Concerns**
- **Container**: Knows it's an HTTP service (port 8080)
- **Kubernetes**: Knows it's the discovery service (port 7001)
- **Application**: Doesn't need to know either (uses PORT env var)

---

## Migration Notes

### Development
No changes needed for local development:
```bash
npm run dev  # Services still run on 7001, 7002, 7003, 7004 locally
```

The `dev` scripts in `package.json` already set PORT env vars.

### Docker Compose
If you're using docker-compose, update port mappings:
```yaml
# Before:
services:
  discovery:
    ports:
      - "7001:7001"

# After:
services:
  discovery:
    ports:
      - "7001:8080"  # External:Internal
    environment:
      - PORT=8080
```

### Kubernetes
Already updated in this change. Services will:
1. ✅ Pull new images with 8080 as default
2. ✅ Container starts on port 8080
3. ✅ Health probes check port 8080
4. ✅ Service routes external 7001 → internal 8080

---

## Testing Checklist

After deployment:

### 1. Verify Container Logs
```bash
kubectl logs -n stumbleable deployment/discovery-service
```
Should show: `Server listening at http://0.0.0.0:8080`

### 2. Test Health Endpoints
```bash
# From inside cluster
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- \
  curl -v http://discovery-service:7001/health
```
Should return 200 OK.

### 3. Verify Port Mappings
```bash
kubectl get svc -n stumbleable
```
Should show:
```
NAME                   TYPE        CLUSTER-IP      PORT(S)
discovery-service      ClusterIP   10.x.x.x        7001/TCP
interaction-service    ClusterIP   10.x.x.x        7002/TCP
user-service           ClusterIP   10.x.x.x        7003/TCP
crawler-service        ClusterIP   10.x.x.x        7004/TCP
```

### 4. Check Pod Status
```bash
kubectl get pods -n stumbleable
```
All pods should be `Running` with `READY 1/1`.

---

## Related Documentation

- [Kubernetes Deployment Fixes](./KUBERNETES_DEPLOYMENT_FIXES.md) - Host binding (0.0.0.0) fix
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment variables
- [Development Ports](../DEVELOPMENT_PORTS.md) - Port usage reference

---

## Files Changed

### Source Code (3 files)
- ✅ `apis/discovery-service/src/server.ts`
- ✅ `apis/interaction-service/src/server.ts`
- ✅ `apis/user-service/src/server.ts`

### Dockerfiles (4 files)
- ✅ `apis/discovery-service/Dockerfile`
- ✅ `apis/interaction-service/Dockerfile`
- ✅ `apis/user-service/Dockerfile`
- ✅ `apis/crawler-service/Dockerfile`

### Kubernetes Manifests (4 files)
- ✅ `k8s/base/discovery-service.yaml`
- ✅ `k8s/base/interaction-service.yaml`
- ✅ `k8s/base/user-service.yaml`
- ✅ `k8s/base/crawler-service.yaml`

### Documentation (1 file)
- ✅ `.github/copilot-instructions.md`

**Total**: 12 files modified

---

**Status**: ✅ Complete and ready for deployment

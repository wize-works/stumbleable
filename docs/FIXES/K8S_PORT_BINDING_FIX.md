# Kubernetes Port Binding Fix

## Problem: Health Probe Failures

**Error:** `connection refused` on health probes checking port 8080

```
Warning  Unhealthy  Readiness probe failed: Get "http://10.240.0.124:8080/health": dial tcp 10.240.0.124:8080: connect: connection refused
Warning  Unhealthy  Liveness probe failed: Get "http://10.240.0.124:8080/health": dial tcp 10.240.0.124:8080: connect: connection refused
```

## Root Cause: The "5 Whys"

**Why #1: Why is the health probe failing?**
- The probe is checking port 8080, but nothing is listening on that port.

**Why #2: Why is nothing listening on port 8080?**
- The service is listening on port 7002 (or 7001, 7003, 7004 for other services) instead of 8080.

**Why #3: Why is the service listening on 7002?**
- The deployment YAML sets `PORT` env variable from ConfigMap, overriding the service's default port.

**Why #4: Why is the ConfigMap setting the port to 7002?**
- The ConfigMap was configured with the OLD port scheme (7001-7004 for different services).

**Why #5: Why does the old port scheme conflict?**
- According to the project's **Container Port Standardization**, ALL services should use port 8080 internally. Kubernetes maps external service ports (7001-7004) to the internal port 8080 via `targetPort`.

## The Fix

### Code Changes

#### 1. Fixed Server Host Binding (Already Complete)
Changed all services from binding to `127.0.0.1` to `0.0.0.0`:

```typescript
// apis/*/src/server.ts - Environment Schema
const envSchema = {
    // ...
    HOST: { type: 'string', default: '0.0.0.0' }, // ✅ Changed from 127.0.0.1
    // ...
};
```

**Why:** Kubernetes health probes connect from outside the container via the pod IP. Services bound to `127.0.0.1` only accept connections from within the same container.

#### 2. Fixed Pino-Pretty Production Crash (Already Complete)
Made pino-pretty conditional on NODE_ENV:

```typescript
// apis/*/src/server.ts - Fastify Instance
const fastify = Fastify({
    logger: {
        level: 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    }
});
```

**Why:** `pino-pretty` is a dev dependency and wasn't installed in production containers, causing crashes.

### Kubernetes Configuration Changes

#### 3. Removed PORT Environment Variable
Removed the PORT configuration from all service deployments:

**Before:**
```yaml
env:
- name: PORT
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: INTERACTION_PORT  # Was set to 7002
- name: NODE_ENV
  # ...
```

**After:**
```yaml
env:
- name: NODE_ENV
  # ... (PORT removed - services use default 8080)
```

**Applied to:**
- ✅ `k8s/base/interaction-service.yaml`
- ✅ `k8s/base/discovery-service.yaml`
- ✅ `k8s/base/user-service.yaml`
- ✅ `k8s/base/crawler-service.yaml`

## How It Works Now

### Port Architecture

1. **Container Internal Port**: 8080 (standard)
   - All services bind to port 8080 inside the container
   - Services default to PORT=8080 in their environment schema

2. **Kubernetes Service Ports**: 7001-7004 (logical addressing)
   ```yaml
   # Service definition maps external to internal
   service:
     port: 7002           # External: interaction-service:7002
     targetPort: 8080     # Internal: container listens on 8080
   ```

3. **Health Probes**: Check port 8080
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8080  # ✅ Matches container port
   ```

### Network Flow

```
Frontend → discovery-service:7001 (K8s Service)
  → Pod:8080 (Container)
    → App listening on 0.0.0.0:8080

Health Probe → Pod IP:8080
  → App listening on 0.0.0.0:8080
  → Returns 200 OK
```

## Deployment Instructions

### 1. Apply Updated Kubernetes Configurations

```bash
# From project root
kubectl apply -k k8s/base
```

### 2. Restart All Pods (Force Pull New Images)

```bash
# Restart deployments to pick up config changes
kubectl rollout restart deployment/interaction-service -n stumbleable
kubectl rollout restart deployment/discovery-service -n stumbleable
kubectl rollout restart deployment/user-service -n stumbleable
kubectl rollout restart deployment/crawler-service -n stumbleable

# Watch rollout status
kubectl rollout status deployment/interaction-service -n stumbleable
kubectl rollout status deployment/discovery-service -n stumbleable
kubectl rollout status deployment/user-service -n stumbleable
kubectl rollout status deployment/crawler-service -n stumbleable
```

### 3. Verify Health

```bash
# Check pod status
kubectl get pods -n stumbleable

# Check health probe status
kubectl describe pod -l app=interaction-service -n stumbleable | grep -A 10 "Conditions"

# Check logs for successful startup
kubectl logs -l app=interaction-service -n stumbleable --tail=20
```

You should see:
```
🚀 Interaction Service running on http://0.0.0.0:8080
📊 Health check: http://0.0.0.0:8080/health
```

## Key Learnings

1. **Container Port Standardization**: ALL services MUST use port 8080 internally
2. **Host Binding**: Services MUST bind to `0.0.0.0` for Kubernetes health probes
3. **Dev Dependencies**: Don't use dev dependencies (like pino-pretty) in production
4. **Environment Overrides**: Be careful with ConfigMap PORT overrides - they can break health probes
5. **Service vs Container Ports**: Kubernetes Services can map external ports to different internal ports

## References

- [Container Port Standardization](../docs/CONTAINER_PORT_STANDARDIZATION.md)
- [GitHub Copilot Instructions](../.github/copilot-instructions.md) - See "Container Host Binding" section

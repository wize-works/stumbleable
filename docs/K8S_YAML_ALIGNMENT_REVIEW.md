# Kubernetes YAML Alignment Review

**Date:** October 8, 2025  
**Context:** Post-Dockerfile standardization review

## Executive Summary

✅ **GOOD NEWS:** Your Kubernetes YAML files are already well-aligned and follow consistent patterns!

The YAML deployments were already configured correctly for the standardized Dockerfiles (all using port 8080 internally). Only one minor fix was needed for the moderation-service.

## Review Findings

### ✅ Consistency Across All Services

All service deployments follow the same patterns:

#### Container Configuration
- ✅ **Container Port:** `8080` (matches Dockerfile `EXPOSE 8080`)
- ✅ **Service Target Port:** `8080` (correctly maps to container)
- ✅ **Health Check Path:** `/health` (standardized across all services)
- ✅ **Image Pull Policy:** `Always` (ensures latest images)
- ✅ **Namespace:** `stumbleable` (consistent)

#### Deployment Strategy
- ✅ **Rolling Update Strategy:** 
  - `maxSurge: 1` (can have 1 extra pod during rollout)
  - `maxUnavailable: 0` (always maintain availability)
- ✅ **Labels:** Consistent app/component labeling

#### Health Probes (Standard Services)
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

## Service-Specific Configurations

### Public-Facing API Services

**Services:** discovery-service, user-service, interaction-service  
**Port Mapping:** 7001 (discovery), 7002 (interaction), 7003 (user) → 8080

**Common Environment Variables:**
```yaml
env:
  - NODE_ENV (from configmap)
  - LOG_LEVEL (from configmap)
  - SUPABASE_URL (from secret)
  - SUPABASE_SERVICE_KEY (from secret)
  - CLERK_PUBLISHABLE_KEY (from secret)
  - CLERK_SECRET_KEY (from secret)
  - ALLOWED_ORIGINS (from configmap)
  - RATE_LIMIT_MAX (from configmap)
  - RATE_LIMIT_WINDOW (from configmap)
```

**Resources:**
```yaml
requests:
  memory: "128Mi"
  cpu: "100m"
limits:
  memory: "256Mi"
  cpu: "250m"
```

**Replicas:** 2 (high availability)

### Crawler Service

**Port Mapping:** 7004 → 8080

**Differences from Standard:**
- ⚡ **More Resources** (handles intensive web scraping):
  ```yaml
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"
  ```
- ⏱️ **Longer Probe Timeouts** (some crawls take time):
  ```yaml
  livenessProbe:
    initialDelaySeconds: 30  # vs 20
    timeoutSeconds: 10       # vs 5
    failureThreshold: 5      # vs 3
  readinessProbe:
    initialDelaySeconds: 15  # vs 10
    timeoutSeconds: 8        # vs 3
  ```
- 📊 **Single Replica** (1 instead of 2)
  - Crawling doesn't need high availability
  - Multiple crawlers could duplicate work

### Moderation Service

**Port Mapping:** 7005 → 8080

**Differences from Standard:**
- 🔗 **Service-to-Service Communication:**
  ```yaml
  - name: USER_SERVICE_URL
    value: "http://user-service:7003"
  ```

**Fixed:** Added missing environment variables for CORS and rate limiting (was missing before).

### Email Service

**Port Mapping:** 7006 → 8080

**Differences from Standard:**
- 📧 **Email-Specific Configuration:**
  ```yaml
  - name: RESEND_API_KEY (from secret)
  - name: FRONTEND_URL (from configmap)
  - name: EMAIL_FROM_ADDRESS
    value: "noreply@updates.stumbleable.com"
  - name: EMAIL_FROM_NAME
    value: "Stumbleable"
  ```
- 🔒 **No Clerk Auth** (internal service, not user-facing)
- 🌐 **No CORS/Rate Limiting** (internal service)

## Changes Made

### 1. Fixed Moderation Service YAML

**Issue:** Missing CORS and rate limiting configuration  
**Why it matters:** The moderation-service code expects these env vars and uses CORS/rate limiting

**Added:**
```yaml
- name: ALLOWED_ORIGINS
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: ALLOWED_ORIGINS
- name: RATE_LIMIT_MAX
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: RATE_LIMIT_MAX
- name: RATE_LIMIT_WINDOW
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: RATE_LIMIT_WINDOW
```

## Port Mapping Architecture

All services follow this pattern:

```
External Request
    ↓
Ingress (if public)
    ↓
Kubernetes Service (logical port: 7001-7006)
    ↓
Service Target Port: 8080
    ↓
Container Port: 8080
    ↓
Application (binds to 0.0.0.0:8080)
```

### Port Assignments

| Service | External Port | Container Port | Purpose |
|---------|--------------|----------------|---------|
| discovery-service | 7001 | 8080 | Discovery algorithms |
| interaction-service | 7002 | 8080 | User interactions |
| user-service | 7003 | 8080 | User profiles |
| crawler-service | 7004 | 8080 | Web crawling |
| moderation-service | 7005 | 8080 | Content moderation |
| email-service | 7006 | 8080 | Email notifications |

**Why this works:**
- External ports (7001-7006) are for logical service addressing in K8s
- All containers use port 8080 internally (standard, portable)
- Kubernetes handles the mapping via `targetPort: 8080`
- Makes containers reusable across environments

## Alignment with Dockerfiles

### Docker Health Check vs K8s Probes

**Dockerfile Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Kubernetes Probes (More Important):**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

**Note:** 
- The Dockerfile HEALTHCHECK is used by Docker daemon
- Kubernetes probes OVERRIDE Docker health checks when deployed
- Both check the same endpoint: `/health`
- K8s probes are what actually matter in production

### Why The Timings Differ

| Setting | Dockerfile | Kubernetes | Why Different |
|---------|-----------|------------|---------------|
| Initial Delay | 20s | 20s (liveness), 10s (readiness) | K8s separates liveness/readiness |
| Interval | 30s | 30s (liveness), 10s (readiness) | Readiness checks more frequently |
| Timeout | 10s | 5s (standard), 10s (crawler) | K8s more aggressive by default |
| Retries | 3 | 3 | Consistent |

**This is fine!** The difference is intentional:
- Dockerfile health checks are for local development/Docker Compose
- Kubernetes probes are optimized for production orchestration

## Best Practices Observed

### ✅ Security
- Non-root users in containers (`apiuser` uid 1001)
- Secrets stored in Kubernetes secrets (not configmaps)
- Helmet security headers configured
- CORS properly configured for public services

### ✅ Reliability
- Zero-downtime rolling updates
- Separate liveness and readiness probes
- Multiple replicas for critical services
- Proper resource limits prevent resource exhaustion

### ✅ Observability
- Structured logging (Pino)
- Health check endpoints
- Rate limit headers
- Service versioning in health checks

### ✅ Performance
- Resource requests ensure scheduling
- Resource limits prevent noisy neighbors
- Multi-stage Docker builds reduce image size
- Layer caching speeds up deployments

## Validation Checklist

Before deploying a new service, verify:

- [ ] Dockerfile uses standard multi-stage build pattern
- [ ] Container exposes port 8080
- [ ] Application binds to `0.0.0.0:8080` (not 127.0.0.1)
- [ ] `/health` endpoint returns 200 OK
- [ ] YAML includes all required environment variables
- [ ] Secrets use `secretKeyRef`, configs use `configMapKeyRef`
- [ ] Resources have both requests and limits
- [ ] Probes configured with appropriate timeouts
- [ ] Service maps external port to `targetPort: 8080`
- [ ] Labels include `app` and `component`

## Testing Deployments

### Local Build Test
```bash
# Build the image
docker build -t test-service -f apis/SERVICE-NAME/Dockerfile apis/SERVICE-NAME

# Run locally
docker run -p 8080:8080 test-service

# Check health
curl http://localhost:8080/health
```

### Kubernetes Deployment Test
```bash
# Apply the YAML
kubectl apply -f k8s/base/SERVICE-NAME.yaml

# Check pod status
kubectl get pods -n stumbleable -l app=SERVICE-NAME

# Check logs
kubectl logs -n stumbleable -l app=SERVICE-NAME --tail=50

# Port forward for testing
kubectl port-forward -n stumbleable svc/SERVICE-NAME 7001:7001

# Test the service
curl http://localhost:7001/health
```

### Health Check Verification
```bash
# Get into a pod
kubectl exec -it -n stumbleable deployment/SERVICE-NAME -- sh

# Test health endpoint from inside
wget -qO- http://localhost:8080/health
```

## Future Recommendations

### 1. Add Resource Metrics (Optional)
Consider adding if you need autoscaling:
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "250m"
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Add Pod Disruption Budgets (Production)
For high availability:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: SERVICE-NAME-pdb
  namespace: stumbleable
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: SERVICE-NAME
```

### 3. Consider Service Mesh (Future)
If you need advanced networking:
- Istio or Linkerd for mTLS between services
- Advanced traffic routing
- Distributed tracing
- Circuit breakers

### 4. Add Monitoring (Recommended)
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

## Related Documentation

- [Dockerfile Standardization](./DOCKERFILE_STANDARDIZATION.md)
- [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)
- [Architecture: Service Communication](./ARCHITECTURE_DECISION_CONTENT_ROUTE.md)

## Summary

✅ **Your YAML files are well-structured and aligned!**

Only one minor fix was needed (moderation-service missing env vars). The configurations are:
- Consistent where they should be (ports, probes, strategies)
- Differentiated where appropriate (resources, replicas, env vars)
- Production-ready with proper health checks and resource limits
- Secure with secrets management and non-root users

Your infrastructure is in great shape! 🚀

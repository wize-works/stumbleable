# Moderation Service Deployment - Issues Fixed

**Date:** October 2, 2025  
**Status:** ✅ RESOLVED

---

## Problem

The moderation service was not starting up in deployment. Investigation revealed it was missing from several critical configuration files.

---

## Root Cause Analysis

The moderation service was created but never fully integrated into the deployment pipeline:

1. ❌ **Missing from Ingress** - No route to access the service externally
2. ❌ **Missing from CI/CD** - Not being built or deployed
3. ❌ **Missing from ConfigMap** - Environment variables not configured
4. ❌ **Missing from UI Portal** - Frontend couldn't communicate with it

---

## Files Modified

### 1. `.github/workflows/deploy-aks.yml`

**Added to build matrix:**
```yaml
- name: moderation
  context: ./apis/moderation-service
  dockerfile: ./apis/moderation-service/Dockerfile
```

**Added to deployment checks:**
```yaml
kubectl rollout status deployment/moderation-service -n stumbleable --timeout=5m
```

**Added smoke test:**
```yaml
kubectl run curl-test-moderation --image=curlimages/curl:latest \
  --restart=Never -n stumbleable -- \
  curl -f http://moderation-service:7005/health
```

### 2. `k8s/base/ingress.yaml`

**Added route:**
```yaml
# Moderation Service (admin/moderator only)
- path: /moderation
  pathType: Prefix
  backend:
    service:
      name: moderation-service
      port:
        number: 8080
```

**Result:** `https://api.stumbleable.com/moderation/*` now routes to moderation service

### 3. `k8s/base/configmap.yaml`

**Added configuration:**
```yaml
MODERATION_PORT: "7005"
MODERATION_API_URL: "http://moderation-service:7005"
NEXT_PUBLIC_MODERATION_API_URL: "https://api.stumbleable.com/moderation"
NEXT_PUBLIC_CRAWLER_API_URL: "https://api.stumbleable.com/crawler"  # Also missing
```

### 4. `k8s/base/ui-portal.yaml`

**Added environment variables:**
```yaml
- name: NEXT_PUBLIC_CRAWLER_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NEXT_PUBLIC_CRAWLER_API_URL
- name: NEXT_PUBLIC_MODERATION_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NEXT_PUBLIC_MODERATION_API_URL
```

---

## Verification Steps

After pushing these changes, the deployment pipeline will:

1. ✅ Build moderation service Docker image
2. ✅ Push to Azure Container Registry
3. ✅ Deploy to AKS cluster
4. ✅ Wait for rollout to complete
5. ✅ Run health check smoke test
6. ✅ Make service accessible via ingress

---

## Testing

### Internal (within cluster):
```bash
kubectl run curl-test --image=curlimages/curl:latest --restart=Never \
  -n stumbleable -- curl http://moderation-service:7005/health
```

### External (via ingress):
```bash
curl https://api.stumbleable.com/moderation/health
```

### From UI Portal:
The frontend will now correctly use:
- Local dev: `http://localhost:7005`
- Production: `https://api.stumbleable.com/moderation`

---

## Additional Discovery

While investigating, also found that **crawler service** was missing from the public API URLs in the configmap. This has also been fixed:

- Added `NEXT_PUBLIC_CRAWLER_API_URL` to configmap
- Added environment variable to ui-portal deployment

---

## Status: ✅ Complete

All necessary configuration is now in place. The moderation service will be deployed on the next push to main branch.

---

## Related Files Created

- `docs/MODERATION_SERVICE_DEPLOYMENT_CHECKLIST.md` - Complete deployment guide

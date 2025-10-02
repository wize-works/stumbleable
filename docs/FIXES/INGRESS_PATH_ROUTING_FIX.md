# Ingress Path Routing Fix - 404 Errors

**Date:** October 2, 2025  
**Status:** ✅ FIXED  
**Issue:** 404 errors on all API endpoints despite correct URLs

---

## Problem Description

### Symptoms
Browser console showing:
```
api.stumbleable.com/user/api/users/user_xxx:1  Failed to load resource: 404
api.stumbleable.com/discovery/api/trending:1  Failed to load resource: 404
api.stumbleable.com/discovery/api/next:1  Failed to load resource: 404
```

### Root Cause

**The ingress path rewriting was incorrect!**

**What was happening:**

1. **Browser makes request:**
   ```
   GET https://api.stumbleable.com/discovery/api/trending
   ```

2. **Ingress receives:**
   ```
   Path: /discovery/api/trending
   ```

3. **Ingress has `rewrite-target: /`** which means:
   - Strip EVERYTHING after the matched path
   - Forward only `/` to the backend

4. **Backend receives:**
   ```
   GET /  ❌ WRONG!
   ```

5. **Backend expects:**
   ```
   GET /api/trending  ✅ CORRECT!
   ```

6. **Result:** 404 because `/` endpoint doesn't exist

---

## The Fix

### Changed Ingress Configuration

**Before:**
```yaml
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /

paths:
  - path: /discovery
    pathType: Prefix
```

**After:**
```yaml
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /$2

paths:
  - path: /discovery(/|$)(.*)
    pathType: ImplementationSpecific
```

### How It Works Now

**Regex Pattern Explanation:**
```regex
/discovery(/|$)(.*)
    ↑       ↑  ↑  ↑
    |       |  |  └─ $2: Capture everything after /discovery/
    |       |  └──── Optional slash or end of string
    |       └─────── $1: Capture the separator (not used)
    └─────────────── Fixed prefix
```

**Example Request Flow:**

1. **Browser makes request:**
   ```
   GET https://api.stumbleable.com/discovery/api/trending
   ```

2. **Ingress regex matches:**
   ```
   /discovery(/|$)(.*)
              ↑     ↑
              /     api/trending  ← $2 captures this
   ```

3. **Rewrite target `/$2` becomes:**
   ```
   /api/trending  ✅
   ```

4. **Backend service receives:**
   ```
   GET /api/trending  ✅ CORRECT!
   ```

5. **Service route matches:**
   ```typescript
   // In server.ts
   await fastify.register(trendingDiscoveryRoute, { prefix: '/api' });
   ```

6. **Result:** ✅ **200 OK**

---

## Complete Mapping

### Discovery Service

| Browser Request | Ingress Match | Rewrite To | Service Route | Final Handler |
|----------------|---------------|------------|---------------|---------------|
| `/discovery/api/next` | `/discovery(/|$)(.*)` → `$2 = /api/next` | `/api/next` | `prefix: '/api'` | `POST /next` ✅ |
| `/discovery/api/trending` | `/discovery(/|$)(.*)` → `$2 = /api/trending` | `/api/trending` | `prefix: '/api'` | `GET /trending` ✅ |

### User Service

| Browser Request | Ingress Match | Rewrite To | Service Route | Final Handler |
|----------------|---------------|------------|---------------|---------------|
| `/user/api/users/123` | `/user(/|$)(.*)` → `$2 = /api/users/123` | `/api/users/123` | `prefix: '/api'` | `GET /users/:id` ✅ |
| `/user/api/topics` | `/user(/|$)(.*)` → `$2 = /api/topics` | `/api/topics` | `prefix: '/api'` | `GET /topics` ✅ |

### All Services Updated

- ✅ Discovery Service: `/discovery(/|$)(.*)`
- ✅ Interaction Service: `/interaction(/|$)(.*)`
- ✅ User Service: `/user(/|$)(.*)`
- ✅ Crawler Service: `/crawler(/|$)(.*)`
- ✅ Moderation Service: `/moderation(/|$)(.*)`

---

## Why This Pattern?

### Option 1: Simple Prefix (WRONG)
```yaml
path: /discovery
rewrite-target: /
```
❌ Strips entire path, forwards only `/`

### Option 2: Capture Group (CORRECT)
```yaml
path: /discovery(/|$)(.*)
rewrite-target: /$2
```
✅ Strips `/discovery` prefix, forwards rest of path

### Option 3: No Rewrite (Alternative)
```yaml
path: /discovery
# No rewrite-target
```
✅ Would work IF services expected `/discovery/api/next`  
❌ But our services expect `/api/next` (no prefix)

---

## NGINX Ingress Rewrite Rules

### Capture Groups
- `$1`, `$2`, `$3` = Captured groups from regex
- Defined by parentheses `(...)` in path pattern

### Pattern Breakdown
```regex
/discovery(/|$)(.*)
          └─┬─┘ └─┬─┘
            $1    $2

$1 = / or end-of-string (separator)
$2 = everything after the separator
```

### Rewrite Examples

**Path:** `/discovery/api/trending`

| Pattern | Rewrite | Result |
|---------|---------|--------|
| `/discovery` + `/$2` with no capture | `/` | ❌ Wrong |
| `/discovery/(.*)` + `/$1` | `/api/trending` | ✅ Correct |
| `/discovery(/|$)(.*)` + `/$2` | `/api/trending` | ✅ Correct (handles trailing slash) |

---

## Testing

### Test Health Endpoint
```bash
# Should return 200
curl https://api.stumbleable.com/discovery/health
curl https://api.stumbleable.com/user/health
curl https://api.stumbleable.com/interaction/health
```

### Test API Endpoints
```bash
# Discovery - Trending
curl https://api.stumbleable.com/discovery/api/trending

# User - Topics
curl https://api.stumbleable.com/user/api/topics

# Should all return valid JSON, not 404
```

### Test in Browser
```javascript
// In DevTools console on stumbleable.com
fetch('https://api.stumbleable.com/discovery/api/trending')
  .then(r => r.json())
  .then(data => console.log('✅ Success:', data))
  .catch(err => console.error('❌ Error:', err));
```

---

## Deployment

### Apply Changes
```bash
# Apply the updated ingress
kubectl apply -f k8s/base/ingress.yaml

# Verify ingress updated
kubectl describe ingress stumbleable-ingress -n stumbleable

# Check annotations
kubectl get ingress stumbleable-ingress -n stumbleable -o yaml | grep rewrite-target
# Should show: nginx.ingress.kubernetes.io/rewrite-target: /$2
```

### Verify Routing
```bash
# Test from outside cluster
curl -v https://api.stumbleable.com/discovery/api/trending

# Should see:
# < HTTP/2 200
# < content-type: application/json
# Not 404!
```

---

## Common Pitfalls

### ❌ WRONG: Rewrite to /
```yaml
rewrite-target: /
path: /discovery
```
**Result:** All requests forwarded to `/` → 404

### ❌ WRONG: Prefix without regex
```yaml
rewrite-target: /$2
path: /discovery
pathType: Prefix
```
**Result:** No capture group, `$2` is empty → 404

### ✅ CORRECT: Regex with capture
```yaml
rewrite-target: /$2
path: /discovery(/|$)(.*)
pathType: ImplementationSpecific
```
**Result:** Strips prefix, forwards rest → ✅

---

## Alternative Approaches

### Option A: Change Service Routes (NOT RECOMMENDED)
Remove `/api` prefix from all services:
```typescript
// BEFORE
await fastify.register(routes, { prefix: '/api' });

// AFTER
await fastify.register(routes); // No prefix

// Then ingress can rewrite to /
```
❌ This would break the API URL structure

### Option B: Add Ingress Path to Services (NOT RECOMMENDED)
```typescript
await fastify.register(routes, { prefix: '/discovery/api' });
```
❌ Services shouldn't know about ingress paths

### Option C: Use Capture Groups (RECOMMENDED) ✅
Keep services simple, handle routing in ingress
```yaml
path: /discovery(/|$)(.*)
rewrite-target: /$2
```
✅ Clean separation of concerns

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Rewrite Target** | `/` | `/$2` |
| **Path Pattern** | `/discovery` | `/discovery(/|$)(.*)` |
| **Path Type** | `Prefix` | `ImplementationSpecific` |
| **Forwarded Path** | `/` (wrong) | `/api/trending` (correct) |
| **API Response** | 404 ❌ | 200 ✅ |

**Status:** ✅ Fixed. All API endpoints now route correctly!

---

## References

- [NGINX Ingress Rewrite Documentation](https://kubernetes.github.io/ingress-nginx/examples/rewrite/)
- [NGINX Regex Patterns](http://nginx.org/en/docs/http/ngx_http_rewrite_module.html)
- [Kubernetes Ingress Path Types](https://kubernetes.io/docs/concepts/services-networking/ingress/#path-types)

# Troubleshooting Production Localhost URLs

**Date:** October 2, 2025  
**Issue:** Still seeing localhost URLs after fix

---

## Current Situation

✅ **Workflow updated** with production URLs in build-args  
✅ **Changes committed and pushed** to main branch  
❌ **Production still showing localhost URLs**

---

## Possible Causes & Solutions

### 1. GitHub Actions Workflow Hasn't Run Yet

**Check GitHub Actions:**
1. Go to: https://github.com/wize-works/stumbleable/actions
2. Look for the workflow run triggered by commit `c88235e`
3. Check status:
   - ⏳ **Running** - Wait for it to complete
   - ✅ **Success** - Deployment completed, go to #2
   - ❌ **Failed** - Check logs for errors

**If workflow hasn't started:**
- It should start automatically on push to main
- If not, manually trigger: Actions → Deploy to AKS → Run workflow

---

### 2. Browser Cache (Most Likely)

Even if deployment succeeded, your browser might be serving cached JavaScript files.

**Hard Refresh (Try all these):**

**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

**Nuclear Option - Clear Site Data:**
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**
1. DevTools → Application tab
2. Storage → Clear site data
3. Refresh page

---

### 3. CDN/Proxy Cache

If you're using a CDN (Cloudflare, CloudFront, etc.):

**Check CDN:**
- Cloudflare: Purge cache for your domain
- CloudFront: Invalidate distribution
- Azure Front Door: Purge cached content

**Verify which CDN:**
```bash
curl -I https://stumbleable.com
# Look for headers like:
# - cf-cache-status (Cloudflare)
# - x-cache (CloudFront)
# - x-azure-ref (Azure Front Door)
```

---

### 4. Verify Current Deployment

**Check deployed image tag in Kubernetes:**

```bash
# SSH into Azure or use Cloud Shell
az aks get-credentials --resource-group YOUR_RG --name YOUR_CLUSTER

# Check current UI portal deployment
kubectl get deployment ui-portal -n stumbleable -o yaml | grep image:

# Expected: stumbleable-ui:main-c88235e or stumbleable-ui:latest
# If you see an old SHA, the deployment didn't update
```

**Check pod restart times:**
```bash
kubectl get pods -n stumbleable -l app=ui-portal

# Look at AGE column
# If pods are old (hours/days), they didn't restart with new image
```

**Force pod restart:**
```bash
kubectl rollout restart deployment/ui-portal -n stumbleable
```

---

### 5. Verify Bundle Contents

**Check if new bundle has correct URLs:**

**In browser on https://stumbleable.com:**

1. Open DevTools → Network tab
2. Hard refresh page
3. Find `2327-*.js` file (the main bundle)
4. Click on it → Preview or Response tab
5. Search for "localhost:7001"
   - ❌ Found = Old bundle still cached
   - ✅ Not found = New bundle loaded

**Or use this in console:**
```javascript
fetch('/_next/static/chunks/2327-ac611da2ac59d575.js')
  .then(r => r.text())
  .then(code => {
    const hasLocalhost = code.includes('localhost:7001');
    const hasProduction = code.includes('api.stumbleable.com');
    console.log('Has localhost:', hasLocalhost ? '❌ OLD BUILD' : '✅ FIXED');
    console.log('Has production URLs:', hasProduction ? '✅ CORRECT' : '❌ MISSING');
  });
```

---

### 6. Image Tag Issue

**Check if workflow uses correct tag:**

In `.github/workflows/deploy-aks.yml`:
```yaml
- name: Set image tag
  id: image-tag
  run: |
      if [ "${{ github.ref }}" == "refs/heads/main" ]; then
        echo "IMAGE_TAG=latest" >> $GITHUB_OUTPUT
      else
        echo "IMAGE_TAG=${{ github.ref_name }}-${{ github.sha }}" >> $GITHUB_OUTPUT
      fi
```

**Problem:** If using `latest` tag, Kubernetes might not pull new image if tag hasn't changed.

**Solution 1 - Force pull:**
```yaml
# In ui-portal.yaml
spec:
  template:
    spec:
      containers:
      - name: ui-portal
        image: ${ACR_NAME}.azurecr.io/stumbleable-ui:${IMAGE_TAG}
        imagePullPolicy: Always  # Add this line
```

**Solution 2 - Use unique tags:**
Use SHA-based tags instead of `latest`:
```yaml
echo "IMAGE_TAG=main-${{ github.sha }}" >> $GITHUB_OUTPUT
```

---

### 7. Environment Variable Override

**Check if runtime env vars are overriding build-time vars:**

In `ui-portal.yaml`, make sure runtime env vars are NOT overriding the build-time values:

```yaml
# These are OK (server-side):
- name: NEXT_PUBLIC_DISCOVERY_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NEXT_PUBLIC_DISCOVERY_API_URL
```

**BUT** if the ConfigMap still has localhost URLs, remove these env vars from the deployment since they're already baked into the build.

---

## Diagnostic Steps

### Step 1: Verify GitHub Actions
```bash
# Check latest workflow run
# Go to: https://github.com/wize-works/stumbleable/actions
# Status should be ✅ green checkmark
```

### Step 2: Check Kubernetes Deployment
```bash
az aks get-credentials --resource-group YOUR_RG --name YOUR_CLUSTER

# Check deployment
kubectl get deployment ui-portal -n stumbleable

# Check pods
kubectl get pods -n stumbleable -l app=ui-portal

# Check image
kubectl describe deployment ui-portal -n stumbleable | grep Image

# Check logs
kubectl logs -n stumbleable -l app=ui-portal --tail=50
```

### Step 3: Test Without Cache
```bash
# Use curl to bypass browser cache
curl -s https://stumbleable.com | grep -o 'localhost:700[0-9]'

# If this returns results, the server is serving old content
# If empty, it's a browser cache issue
```

### Step 4: Check DNS/CDN
```bash
# Get IP
nslookup stumbleable.com

# Check headers
curl -I https://stumbleable.com

# Test directly to pod (if no CDN)
kubectl port-forward -n stumbleable deployment/ui-portal 8080:3000
# Then browse to http://localhost:8080
```

---

## Quick Fix Commands

### Force New Deployment
```bash
# Option 1: Restart deployment
kubectl rollout restart deployment/ui-portal -n stumbleable

# Option 2: Scale down and up
kubectl scale deployment ui-portal -n stumbleable --replicas=0
kubectl scale deployment ui-portal -n stumbleable --replicas=2

# Option 3: Delete pods (they'll recreate)
kubectl delete pods -n stumbleable -l app=ui-portal
```

### Clear Browser Cache
```javascript
// Run in DevTools console on stumbleable.com
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
location.reload(true);
```

---

## Expected Timeline

After pushing the fix:

1. **Immediate** (0-2 min): GitHub Actions starts
2. **Build Phase** (5-10 min): Docker images build
3. **Push Phase** (2-5 min): Images pushed to ACR
4. **Deploy Phase** (3-7 min): Kubernetes updates pods
5. **Pod Restart** (1-2 min): New pods come online
6. **DNS/CDN** (0-60 min): May take time to propagate

**Total: 10-30 minutes** from push to live

---

## If Still Seeing Localhost After All This

### Nuclear Option 1: Rebuild Everything
```bash
# Trigger a fresh build
git commit --allow-empty -m "Force rebuild"
git push
```

### Nuclear Option 2: Manual Build & Deploy
```bash
# Build locally with correct env vars
cd ui/portal
docker build \
  --build-arg NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery \
  --build-arg NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction \
  --build-arg NEXT_PUBLIC_USER_API_URL=https://api.stumbleable.com/user \
  --build-arg NEXT_PUBLIC_CRAWLER_API_URL=https://api.stumbleable.com/crawler \
  --build-arg NEXT_PUBLIC_MODERATION_API_URL=https://api.stumbleable.com/moderation \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... \
  -t stumbleable-ui:manual .

# Tag and push
docker tag stumbleable-ui:manual YOUR_ACR.azurecr.io/stumbleable-ui:manual
docker push YOUR_ACR.azurecr.io/stumbleable-ui:manual

# Update Kubernetes to use manual tag
kubectl set image deployment/ui-portal -n stumbleable \
  ui-portal=YOUR_ACR.azurecr.io/stumbleable-ui:manual
```

---

## Verify Success

Once deployed, verify:

1. ✅ GitHub Actions shows green checkmark
2. ✅ Kubernetes pods restarted (check AGE)
3. ✅ Browser shows production URLs in Network tab
4. ✅ No CORS errors in console
5. ✅ API calls succeed

**Test command:**
```javascript
// In browser console on stumbleable.com
console.log('Testing API URLs...');
fetch('/_next/static/chunks/2327-ac611da2ac59d575.js')
  .then(r => r.text())
  .then(code => {
    console.log('✅ Production URLs:', code.includes('api.stumbleable.com'));
    console.log('❌ Localhost URLs:', code.includes('localhost:700'));
  });
```

---

## Contact Points

If still having issues:

1. **Check GitHub Actions logs** for build errors
2. **Check Kubernetes pod logs** for runtime errors
3. **Check Azure Application Insights** for request traces
4. **Test API endpoints directly**: `curl https://api.stumbleable.com/discovery/health`

---

**Most likely cause:** Browser cache. Try incognito/private browsing mode!

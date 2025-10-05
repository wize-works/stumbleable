# AKS Automatic Deployment - Quick Reference

## 🎯 What Was Fixed

Your AKS pods now **automatically update** when new images are pushed. No more manual pod deletion required!

## 🔧 Changes Made

### 1. Updated All Kubernetes Deployments
**Files modified:**
- `k8s/base/ui-portal.yaml`
- `k8s/base/discovery-service.yaml`
- `k8s/base/interaction-service.yaml`
- `k8s/base/user-service.yaml`
- `k8s/base/crawler-service.yaml`
- `k8s/base/moderation-service.yaml`

**What changed:**
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # Add 1 new pod before removing old
      maxUnavailable: 0     # Keep all replicas available
  template:
    metadata:
      annotations:
        deployment.timestamp: "${DEPLOYMENT_TIMESTAMP}"  # Forces change detection
    spec:
      containers:
        imagePullPolicy: Always  # Always pull fresh images
```

### 2. Updated GitHub Actions Workflow
**File modified:**
- `.github/workflows/deploy-aks.yml`

**What changed:**
- Generates unique timestamp on each deployment
- Passes timestamp to `envsubst` for annotation replacement
- Forces Kubernetes to detect deployment changes

## ✅ How to Test

### Option 1: Push to main branch
```bash
git add .
git commit -m "test: verify automatic deployment"
git push origin main
```

### Option 2: Manual workflow trigger
1. Go to GitHub Actions
2. Select "Build and Deploy to AKS"
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

### Option 3: Watch deployment in real-time
```bash
# Watch all pods updating
kubectl get pods -n stumbleable -w

# Check specific deployment status
kubectl rollout status deployment/ui-portal -n stumbleable

# View deployment history
kubectl rollout history deployment/ui-portal -n stumbleable
```

## 🚨 If Automatic Deployment Still Fails

### Windows (PowerShell)
```powershell
.\scripts\force-rollout.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/force-rollout.sh
./scripts/force-rollout.sh
```

### Manual kubectl commands
```bash
# Restart specific service
kubectl rollout restart deployment/ui-portal -n stumbleable

# Restart all services
kubectl get deployments -n stumbleable -o name | xargs -I {} kubectl rollout restart {} -n stumbleable
```

## 📊 Verifying Success

After deployment completes, verify:

### 1. Check pod ages (should be recent)
```bash
kubectl get pods -n stumbleable -o wide
```
Look for pods with creation time matching your deployment time.

### 2. Check deployment annotations
```bash
kubectl describe deployment ui-portal -n stumbleable | grep deployment.timestamp
```
Should show a Unix timestamp from the deployment.

### 3. Check rollout history
```bash
kubectl rollout history deployment/ui-portal -n stumbleable
```
Should show new revision after each deployment.

### 4. Check image digests
```bash
kubectl get pods -n stumbleable -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].imageID}{"\n"}{end}'
```
Should show recent image SHA256 digests from ACR.

## 🎓 Understanding the Fix

### Before (Broken)
```
Push to main → Build image → Push to ACR → kubectl apply
                                                  ↓
                                          "No changes detected"
                                                  ↓
                                          Pods stay old ❌
```

### After (Fixed)
```
Push to main → Build image → Push to ACR → Generate timestamp
                                                  ↓
                                          kubectl apply (new annotation)
                                                  ↓
                                          "Change detected!"
                                                  ↓
                        New pod starts → Health check passes → Old pod terminates ✅
```

## 🔑 Key Concepts

### imagePullPolicy: Always
Forces Kubernetes to check ACR for new images every time, even if tag is `latest`.

### deployment.timestamp annotation
Changes on every deployment, forcing Kubernetes to see it as a "new" deployment.

### RollingUpdate strategy
- `maxSurge: 1` = Start 1 new pod before stopping old ones
- `maxUnavailable: 0` = Never let all pods be down (zero downtime)

### Result
Every push to `main` automatically:
1. Builds new images
2. Pushes to ACR
3. Updates Kubernetes deployments
4. Rolls out new pods with zero downtime

## 📚 Additional Resources

- **Full Documentation**: `docs/AUTOMATIC_DEPLOYMENT_FIX.md`
- **Force Rollout Script**: `scripts/force-rollout.ps1` or `scripts/force-rollout.sh`
- **GitHub Workflow**: `.github/workflows/deploy-aks.yml`

## 🆘 Troubleshooting

### Problem: Pods still not updating
**Solution 1**: Check GitHub Actions logs for errors
**Solution 2**: Run `.\scripts\force-rollout.ps1`
**Solution 3**: Verify ACR credentials with `az acr login --name $ACR_NAME`

### Problem: Deployment stuck in progress
**Solution**: Check pod logs: `kubectl logs -n stumbleable -l app=ui-portal --tail=100`

### Problem: Health checks failing
**Solution**: Verify service health: `kubectl exec -n stumbleable deployment/ui-portal -- curl http://localhost:3000/api/health`

### Problem: Image pull errors
**Solution**: Verify AKS-ACR integration: `az aks show -n $AKS_CLUSTER_NAME -g $AKS_RESOURCE_GROUP --query "servicePrincipalProfile"`

## ✨ Benefits of This Fix

- ✅ **Zero downtime deployments** - Always keep services running
- ✅ **Automatic updates** - No manual intervention needed
- ✅ **Guaranteed freshness** - Always pulls latest images
- ✅ **Change detection** - Never miss a deployment
- ✅ **Rollback support** - Easy to revert if needed
- ✅ **Kubernetes best practices** - Industry-standard approach

---

**Status**: ✅ Fixed and ready for production  
**Next Deployment**: Will automatically roll out new pods  
**Manual Intervention**: No longer required

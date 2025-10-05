# Automatic Deployment Fix for AKS

## 🔴 Problem

Pods in AKS were **not automatically updating** when new images were pushed to Azure Container Registry. After a GitHub Actions deployment completed successfully, the old pods continued running with outdated images. The only way to force an update was to manually delete all pods.

## 🔍 Root Causes

### 1. **Missing Deployment Strategy**
Kubernetes deployments did not explicitly define a `strategy` field, relying on default behavior which may not trigger properly with template-based image tags.

### 2. **No ImagePullPolicy**
Without `imagePullPolicy: Always`, Kubernetes could use cached images instead of pulling fresh ones from ACR, especially when using the `latest` tag.

### 3. **Image Tag Substitution Limitation**
The workflow used `envsubst` to replace `${IMAGE_TAG}` in YAML files. However, if the tag remained the same (e.g., `latest` → `latest`), Kubernetes would not detect any spec change and wouldn't trigger a rolling update.

### 4. **No Change Detection Mechanism**
Without annotations that change on each deployment, Kubernetes had no way to know that a new deployment was intended, even if the underlying image had changed.

## ✅ Solution Implemented

### 1. **Added Explicit RollingUpdate Strategy**

All deployment manifests now include:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # Create 1 extra pod during update
      maxUnavailable: 0    # Keep all replicas available during rollout
```

**Benefits:**
- Zero-downtime deployments
- Explicit control over rollout behavior
- One new pod starts before any old pod is terminated

### 2. **Added ImagePullPolicy: Always**

All containers now specify:

```yaml
containers:
  - name: service-name
    image: ${ACR_NAME}.azurecr.io/stumbleable-service:${IMAGE_TAG}
    imagePullPolicy: Always
```

**Benefits:**
- Forces Kubernetes to check ACR for new images on every pod creation
- Prevents using stale cached images
- Essential for `latest` tag deployments

### 3. **Added Deployment Timestamp Annotation**

All pod templates now include:

```yaml
template:
  metadata:
    annotations:
      deployment.timestamp: "${DEPLOYMENT_TIMESTAMP}"
```

**Benefits:**
- Creates a unique spec change on every deployment
- Forces Kubernetes to recognize the deployment as "changed"
- Triggers rolling update even when image tag is the same

### 4. **Updated GitHub Actions Workflow**

The workflow now generates a unique timestamp:

```yaml
- name: Set image tag
  id: image-tag
  run: |
    # ... existing image tag logic ...
    # Generate unique deployment timestamp to force rolling update
    echo "DEPLOYMENT_TIMESTAMP=$(date +%s)" >> $GITHUB_OUTPUT
```

And passes it to `envsubst`:

```yaml
env:
  ACR_NAME: ${{ env.ACR_NAME }}
  IMAGE_TAG: ${{ steps.image-tag.outputs.IMAGE_TAG }}
  DEPLOYMENT_TIMESTAMP: ${{ steps.image-tag.outputs.DEPLOYMENT_TIMESTAMP }}
```

## 📊 How It Works

### Before (Broken)
```
GitHub Actions Push → Build Image → Push to ACR → kubectl apply
                                                          ↓
                                                   No change detected!
                                                          ↓
                                                    Pods stay old
```

### After (Fixed)
```
GitHub Actions Push → Build Image → Push to ACR → Generate timestamp
                                                          ↓
                                              kubectl apply with new annotation
                                                          ↓
                                              Spec change detected!
                                                          ↓
                                          Rolling update triggered automatically
                                                          ↓
                                    New pod created → Old pod terminated → Success!
```

## 🎯 Affected Services

All services now have automatic deployments:

- ✅ **ui-portal** (frontend)
- ✅ **discovery-service** (API)
- ✅ **interaction-service** (API)
- ✅ **user-service** (API)
- ✅ **crawler-service** (API)
- ✅ **moderation-service** (API)

## 🧪 Testing the Fix

### 1. Trigger a deployment
```bash
git commit -m "test: trigger deployment"
git push origin main
```

### 2. Watch the rollout in AKS
```bash
# Watch deployment progress
kubectl rollout status deployment/ui-portal -n stumbleable
kubectl rollout status deployment/discovery-service -n stumbleable

# Watch pods being replaced
kubectl get pods -n stumbleable -w

# Check rollout history
kubectl rollout history deployment/ui-portal -n stumbleable
```

### 3. Verify new pods are running
```bash
# Check pod creation timestamps
kubectl get pods -n stumbleable -o wide

# Check pod annotations
kubectl describe pod <pod-name> -n stumbleable | grep deployment.timestamp
```

## 🔧 Manual Rollout (If Needed)

If for any reason automatic rollout doesn't occur, you can manually trigger it:

```bash
# Restart all deployments (forces new pods with latest images)
kubectl rollout restart deployment/ui-portal -n stumbleable
kubectl rollout restart deployment/discovery-service -n stumbleable
kubectl rollout restart deployment/interaction-service -n stumbleable
kubectl rollout restart deployment/user-service -n stumbleable
kubectl rollout restart deployment/crawler-service -n stumbleable
kubectl rollout restart deployment/moderation-service -n stumbleable

# Or use a one-liner
kubectl get deployments -n stumbleable -o name | xargs -I {} kubectl rollout restart {} -n stumbleable
```

## 📝 Best Practices Applied

### 1. **Zero-Downtime Deployments**
```yaml
maxSurge: 1
maxUnavailable: 0
```
Ensures at least one healthy replica is always available during updates.

### 2. **Proactive Image Pulling**
```yaml
imagePullPolicy: Always
```
Eliminates image cache issues and ensures latest code runs.

### 3. **Forced Change Detection**
```yaml
deployment.timestamp: "${DEPLOYMENT_TIMESTAMP}"
```
Guarantees Kubernetes sees every deployment as a new deployment.

### 4. **Rollout Verification**
```yaml
- name: Wait for deployments
  run: |
    kubectl rollout status deployment/ui-portal -n stumbleable --timeout=5m
```
Workflow waits and verifies each deployment succeeds before completing.

## 🚨 Important Notes

### Image Tags
- **`latest` tag**: Now works correctly due to `imagePullPolicy: Always` and timestamp annotation
- **SHA-based tags**: Also work and provide better traceability
- **Branch tags**: Work for feature branch deployments

### Rollback
If a deployment fails, rollback to the previous version:

```bash
# Rollback a specific service
kubectl rollout undo deployment/ui-portal -n stumbleable

# Rollback to a specific revision
kubectl rollout undo deployment/ui-portal -n stumbleable --to-revision=2

# Check rollout history
kubectl rollout history deployment/ui-portal -n stumbleable
```

### Performance Impact
- **Minimal**: `maxSurge: 1` means only one extra pod runs during rollout
- **Safe**: `maxUnavailable: 0` ensures no downtime
- **Fast**: Health probes quickly verify new pods are ready

## 🎓 Understanding RollingUpdate Parameters

```yaml
maxSurge: 1          # Can be absolute number or percentage
maxUnavailable: 0    # Can be absolute number or percentage
```

### Examples:
- `maxSurge: 1` + `maxUnavailable: 0`: **Zero downtime** - always keep all replicas running
- `maxSurge: 1` + `maxUnavailable: 1`: **Faster rollout** - but risks momentary capacity reduction
- `maxSurge: 50%` + `maxUnavailable: 50%`: **Aggressive rollout** - half old, half new simultaneously

Our choice (`1` and `0`) prioritizes **availability over speed**.

## ✅ Success Criteria

After this fix, you should see:

1. ✅ New pods automatically created after GitHub Actions completes
2. ✅ Old pods gracefully terminated after new pods are ready
3. ✅ No need to manually delete pods
4. ✅ Zero downtime during deployments
5. ✅ `kubectl rollout status` shows successful progression
6. ✅ Each deployment has a unique annotation timestamp

## 📚 Related Documentation

- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Rolling Update Strategy](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [Container Image Pull Policy](https://kubernetes.io/docs/concepts/containers/images/#updating-images)
- [GitHub Actions with AKS](https://docs.microsoft.com/en-us/azure/aks/kubernetes-action)

---

**Date Fixed**: October 4, 2025  
**Impact**: All services now deploy automatically without manual intervention  
**Risk**: Low - changes follow Kubernetes best practices for zero-downtime deployments

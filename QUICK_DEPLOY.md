# Stumbleable - Quick Deploy Guide 🚀

**Status:** Infrastructure Ready ✅  
**NGINX Ingress:** Installed ✅  
**cert-manager:** Installed ✅  
**You're 3 steps away from deployment!**

---

## 🎯 Pre-Deploy Checklist

- ✅ ACR and AKS already provisioned
- ✅ NGINX Ingress Controller installed
- ✅ cert-manager installed
- ✅ All Dockerfiles created
- ✅ All Kubernetes manifests ready
- ✅ GitHub Actions CI/CD configured

---

## 🚀 3 Steps to Deploy

### Step 1: Configure GitHub Secrets (5 minutes)

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add these **7 secrets**:

#### Azure Credentials
```bash
ACR_NAME=<your-acr-name>
AKS_CLUSTER_NAME=<your-aks-cluster-name>
AKS_RESOURCE_GROUP=<your-resource-group>
```

#### Azure Service Principal (for GitHub Actions)
```json
AZURE_CREDENTIALS={
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

**Get AZURE_CREDENTIALS:**
```powershell
# Create service principal with access to your subscription
az ad sp create-for-rbac --name "stumbleable-github-actions" `
  --role contributor `
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} `
  --sdk-auth
```

**Note:** This service principal will be used to:
- Authenticate to Azure Container Registry (ACR) for pushing images
- Connect to Azure Kubernetes Service (AKS) for deployments
- Attach ACR to AKS for automatic image pull authentication

#### Supabase Credentials
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=service-role-key
```

#### Clerk Credentials
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
```

---

### Step 2: Verify Infrastructure (2 minutes)

```powershell
# Connect to your AKS cluster
az aks get-credentials `
  --resource-group <your-resource-group> `
  --name <your-aks-cluster-name> `
  --overwrite-existing

# Verify NGINX Ingress is running
kubectl get pods -n ingress-nginx
# Should show: ingress-nginx-controller-* pods in Running state

# Verify cert-manager is running
kubectl get pods -n cert-manager
# Should show: cert-manager, cert-manager-cainjector, cert-manager-webhook in Running state

# Get the ingress external IP (you'll need this for DNS)
kubectl get svc -n ingress-nginx ingress-nginx-controller
# Note the EXTERNAL-IP address
```

---

### Step 3: Deploy! (1 minute)

```powershell
# From your project root directory
git add .
git commit -m "feat: production deployment configuration"
git push origin main
```

**That's it!** 🎉 GitHub Actions will automatically:
1. Build all 5 Docker images
2. Push them to ACR
3. Deploy to AKS
4. Run smoke tests
5. Report status

**Watch the deployment:**
- Go to GitHub → Actions tab
- Click on the running workflow
- Monitor the build-and-push and deploy jobs

---

## 📋 Post-Deployment

### Verify Deployment (2 minutes)

```powershell
# Check all pods are running
kubectl get pods -n stumbleable

# Check services
kubectl get svc -n stumbleable

# Check ingress
kubectl get ingress -n stumbleable

# View logs for a service
kubectl logs -n stumbleable deployment/ui-portal --tail=50
```

### Configure DNS (5 minutes)

1. **Get the ingress IP:**
   ```powershell
   kubectl get ingress -n stumbleable
   # Note the ADDRESS field
   ```

2. **Add DNS A records:**
   - `stumbleable.com` → `<ingress-ip>`
   - `www.stumbleable.com` → `<ingress-ip>`
   - `api.stumbleable.com` → `<ingress-ip>`

3. **Wait for DNS propagation** (5-30 minutes)
   ```powershell
   # Test DNS resolution
   nslookup stumbleable.com
   ```

4. **Verify SSL certificate** (cert-manager will auto-provision)
   ```powershell
   kubectl get certificate -n stumbleable
   # Should show certificates in Ready=True state after a few minutes
   ```

---

## 🎊 You're Live!

Once DNS propagates and certificates are issued:

- **Frontend:** https://stumbleable.com
- **API:** https://api.stumbleable.com

### Test Your Endpoints

```powershell
# Test UI health
curl https://stumbleable.com/api/health

# Test Discovery API
curl https://api.stumbleable.com/discovery/health

# Test Interaction API
curl https://api.stumbleable.com/interaction/health

# Test User API
curl https://api.stumbleable.com/user/health
```

---

## 🔧 Useful Commands

### View Logs
```powershell
# UI Portal logs
kubectl logs -n stumbleable deployment/ui-portal --tail=100 -f

# Discovery Service logs
kubectl logs -n stumbleable deployment/discovery-service --tail=100 -f

# All pods in namespace
kubectl logs -n stumbleable --all-containers=true --tail=50
```

### Scale Services
```powershell
# Scale manually
kubectl scale deployment ui-portal -n stumbleable --replicas=4

# Or use GitHub Actions workflow: .github/workflows/scale.yml
```

### Rollback
```powershell
# Rollback a deployment
kubectl rollout undo deployment/ui-portal -n stumbleable

# Rollback to specific revision
kubectl rollout undo deployment/ui-portal -n stumbleable --to-revision=2

# Or use GitHub Actions workflow: .github/workflows/rollback.yml
```

### Check Resource Usage
```powershell
# Pod resource usage
kubectl top pods -n stumbleable

# Node resource usage
kubectl top nodes
```

---

## 📚 Reference Documentation

For more details, see:
- **[AZURE_DEPLOYMENT_GUIDE.md](docs/AZURE_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)** - Environment variables reference
- **[PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)** - Pre-launch checklist
- **[DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md)** - Infrastructure summary

---

## 🐛 Troubleshooting

### Pods not starting?
```powershell
# Check pod status
kubectl describe pod <pod-name> -n stumbleable

# Check pod logs
kubectl logs <pod-name> -n stumbleable

# Check events
kubectl get events -n stumbleable --sort-by='.lastTimestamp'
```

### ImagePullBackOff error?
```powershell
# Verify AKS-ACR integration
az aks check-acr `
  --resource-group <your-resource-group> `
  --name <your-aks-cluster> `
  --acr <your-acr-name>.azurecr.io

# Re-attach ACR to AKS if needed
az aks update `
  --resource-group <your-resource-group> `
  --name <your-aks-cluster> `
  --attach-acr <your-acr-name>
```

### Certificate not issuing?
```powershell
# Check certificate status
kubectl describe certificate -n stumbleable

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check challenge status
kubectl get challenges -n stumbleable
```

### Ingress not working?
```powershell
# Check ingress status
kubectl describe ingress stumbleable-ingress -n stumbleable

# Check NGINX ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ All pods show `Running` status
- ✅ All services are accessible via ingress
- ✅ SSL certificates are issued and valid
- ✅ Health checks return 200 OK
- ✅ No CrashLoopBackOff or ImagePullBackOff errors
- ✅ Logs show no critical errors

---

## 🎯 What's Next?

After successful deployment, continue with:
1. **C9 Production Readiness** (monitoring, rate limiting, backups)
2. **H1.9-10 Crawler Deployment** (scale content ingestion)
3. **H3.5 Micro-Quests** (engagement features)
4. **Beta Testing** (invite users, collect feedback)
5. **Public Launch!** 🚀

---

**Need Help?** Check the troubleshooting section or refer to the comprehensive [AZURE_DEPLOYMENT_GUIDE.md](docs/AZURE_DEPLOYMENT_GUIDE.md).

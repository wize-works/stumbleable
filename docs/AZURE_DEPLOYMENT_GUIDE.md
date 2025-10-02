# Stumbleable - Azure Deployment Guide

**Last Updated:** October 1, 2025  
**Target Platform:** Azure Kubernetes Service (AKS) + Azure Container Registry (ACR)  
**Deployment Method:** GitHub Actions (No Helm)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [First Deployment](#first-deployment)
5. [DNS Configuration](#dns-configuration)
6. [SSL/TLS Certificates](#ssltls-certificates)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling](#scaling)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Azure Resources
- ✅ Azure Container Registry (ACR) - **Already set up**
- ✅ Azure Kubernetes Service (AKS) - **Already set up**
- ✅ NGINX Ingress Controller - **Already installed**
- ✅ cert-manager - **Already installed**
- ☐ Azure Key Vault (optional, for secrets management)
- ☐ Azure Monitor (optional, for observability)

### Required Tools
```bash
# Azure CLI
az --version  # Should be >= 2.50.0

# kubectl
kubectl version --client  # Should be >= 1.28.0

# Docker (for local testing)
docker --version  # Should be >= 24.0.0

# envsubst (for template substitution)
envsubst --version
```

### Install kubectl (if needed)
```bash
# Windows (PowerShell)
choco install kubernetes-cli

# Or via Azure CLI
az aks install-cli
```

---

## Initial Setup

### 1. Connect to Your AKS Cluster

```bash
# Set your variables
$AKS_CLUSTER_NAME = "your-aks-cluster-name"
$AKS_RESOURCE_GROUP = "your-resource-group"

# Get AKS credentials
az aks get-credentials `
  --resource-group $AKS_RESOURCE_GROUP `
  --name $AKS_CLUSTER_NAME `
  --overwrite-existing

# Verify connection
kubectl get nodes
```

### 2. Get ACR Credentials

```bash
# Set your ACR name
$ACR_NAME = "your-acr-name"

# Get ACR login server
az acr show --name $ACR_NAME --query loginServer --output tsv

# Get ACR credentials
$ACR_USERNAME = $ACR_NAME
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv

# Test ACR login
az acr login --name $ACR_NAME
```

### 3. Verify NGINX Ingress Controller

```bash
# Verify NGINX Ingress is running
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# Get the external IP address for DNS configuration
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

### 4. Verify cert-manager Installation

```bash
# Verify cert-manager is running
kubectl get pods -n cert-manager
kubectl get clusterissuers

# If you need to create/update the Let's Encrypt ClusterIssuer:
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@stumbleable.com  # Change this to your email!
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

**Note:** Since NGINX Ingress and cert-manager are already installed on your AKS cluster, you only need to verify they're working correctly and ensure the ClusterIssuer is configured with your email address.

---

## GitHub Secrets Configuration

### Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Azure Credentials
```
ACR_NAME
Value: your-acr-name

ACR_USERNAME
Value: your-acr-name (same as ACR_NAME)

ACR_PASSWORD
Value: <get from Azure Portal or az acr credential show>

AKS_CLUSTER_NAME
Value: your-aks-cluster-name

AKS_RESOURCE_GROUP
Value: your-resource-group-name

AZURE_CREDENTIALS
Value: {
  "clientId": "<service-principal-client-id>",
  "clientSecret": "<service-principal-secret>",
  "subscriptionId": "<azure-subscription-id>",
  "tenantId": "<azure-tenant-id>"
}
```

#### To create AZURE_CREDENTIALS:
```bash
# Create service principal
az ad sp create-for-rbac --name "stumbleable-github-actions" --role contributor `
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group> `
  --sdk-auth

# Copy the entire JSON output to AZURE_CREDENTIALS secret
```

#### Application Secrets
```
SUPABASE_URL
Value: https://your-project.supabase.co

SUPABASE_SERVICE_KEY
Value: your-supabase-service-role-key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_...

CLERK_SECRET_KEY
Value: sk_live_...

CLERK_WEBHOOK_SECRET
Value: whsec_...
```

---

## First Deployment

### Option 1: Deploy via GitHub Actions (Recommended)

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "feat: initial deployment configuration"
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the "Build and Deploy to AKS" workflow
   - Should complete in 10-15 minutes

3. **Verify deployment:**
   ```bash
   kubectl get pods -n stumbleable
   kubectl get services -n stumbleable
   kubectl get ingress -n stumbleable
   ```

### Option 2: Manual Deployment

```bash
# 1. Build and push images manually
cd ui/portal
docker build -t $ACR_NAME.azurecr.io/stumbleable-ui:latest .
docker push $ACR_NAME.azurecr.io/stumbleable-ui:latest

# Repeat for all services...

# 2. Create namespace
kubectl create namespace stumbleable

# 3. Create ACR secret
kubectl create secret docker-registry acr-secret `
  --namespace=stumbleable `
  --docker-server=$ACR_NAME.azurecr.io `
  --docker-username=$ACR_USERNAME `
  --docker-password=$ACR_PASSWORD

# 4. Create application secrets
kubectl create secret generic stumbleable-secrets `
  --namespace=stumbleable `
  --from-literal=SUPABASE_URL="your-url" `
  --from-literal=SUPABASE_SERVICE_KEY="your-key" `
  # ... add all other secrets

# 5. Deploy resources
cd k8s/base
export ACR_NAME="your-acr-name"
export IMAGE_TAG="latest"

for file in *.yaml; do
  if [[ "$file" != *"secrets.yaml.template"* ]]; then
    envsubst < "$file" | kubectl apply -f -
  fi
done

# 6. Wait for deployments
kubectl rollout status deployment/ui-portal -n stumbleable --timeout=5m
```

---

## DNS Configuration

### Get Ingress External IP

```bash
kubectl get ingress -n stumbleable
# Note the ADDRESS column
```

### Configure DNS Records

In your DNS provider (Cloudflare, Azure DNS, etc.):

```
Type  | Name              | Value (IP Address)     | TTL
------|-------------------|------------------------|------
A     | stumbleable.com   | <ingress-external-ip>  | 300
A     | www               | <ingress-external-ip>  | 300
A     | api               | <ingress-external-ip>  | 300
```

### Verify DNS

```bash
# Wait for DNS propagation (5-30 minutes)
nslookup stumbleable.com
nslookup api.stumbleable.com
```

---

## SSL/TLS Certificates

### Automatic (Let's Encrypt via cert-manager)

Certificates are automatically issued and renewed by cert-manager. The ingress.yaml already includes the necessary annotations.

### Verify Certificate

```bash
# Check certificate status
kubectl get certificate -n stumbleable

# Describe certificate for details
kubectl describe certificate stumbleable-tls -n stumbleable

# Check cert-manager logs if issues
kubectl logs -n cert-manager deployment/cert-manager
```

### Manual Certificate (if needed)

```bash
# Create TLS secret manually
kubectl create secret tls stumbleable-tls `
  --namespace=stumbleable `
  --cert=path/to/tls.crt `
  --key=path/to/tls.key
```

---

## Monitoring & Logging

### View Logs

```bash
# View logs for specific pod
kubectl logs -f <pod-name> -n stumbleable

# View logs for all pods of a service
kubectl logs -f -l app=ui-portal -n stumbleable

# View logs with timestamps
kubectl logs --timestamps -f <pod-name> -n stumbleable

# View previous pod logs (if crashed)
kubectl logs --previous <pod-name> -n stumbleable
```

### Pod Status

```bash
# Get pod status
kubectl get pods -n stumbleable

# Describe pod (shows events)
kubectl describe pod <pod-name> -n stumbleable

# Get pod metrics
kubectl top pods -n stumbleable
```

### Service Status

```bash
# Check service endpoints
kubectl get endpoints -n stumbleable

# Test service internally
kubectl run curl-test --image=curlimages/curl:latest --restart=Never -n stumbleable -- curl -f http://ui-portal:3000/api/health

# Cleanup test pod
kubectl delete pod curl-test -n stumbleable
```

---

## Scaling

### Manual Scaling

```bash
# Scale specific deployment
kubectl scale deployment/ui-portal --replicas=5 -n stumbleable

# Scale via GitHub Actions workflow
# Go to Actions → Scale Deployment → Run workflow
# Select service and number of replicas
```

### Auto-Scaling (HPA)

Horizontal Pod Autoscalers are already configured in `k8s/base/hpa.yaml`

```bash
# Check HPA status
kubectl get hpa -n stumbleable

# Describe HPA for details
kubectl describe hpa ui-portal-hpa -n stumbleable

# View HPA metrics
kubectl top pods -n stumbleable
```

### Adjust HPA Limits

Edit `k8s/base/hpa.yaml` and push to trigger redeployment, or:

```bash
kubectl edit hpa ui-portal-hpa -n stumbleable
# Update minReplicas, maxReplicas, or target CPU/memory
```

---

## Rollback Procedures

### View Deployment History

```bash
# View rollout history
kubectl rollout history deployment/ui-portal -n stumbleable

# View specific revision
kubectl rollout history deployment/ui-portal --revision=2 -n stumbleable
```

### Rollback to Previous Version

```bash
# Rollback to previous version
kubectl rollout undo deployment/ui-portal -n stumbleable

# Rollback to specific revision
kubectl rollout undo deployment/ui-portal --to-revision=2 -n stumbleable

# Check rollout status
kubectl rollout status deployment/ui-portal -n stumbleable
```

### Rollback via GitHub Actions

1. Go to Actions → Rollback Deployment
2. Click "Run workflow"
3. Select service (or "all")
4. Enter revision number (or leave empty for previous)
5. Click "Run workflow"

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n stumbleable

# Describe pod for events
kubectl describe pod <pod-name> -n stumbleable

# Common issues:
# 1. ImagePullBackOff - Check ACR credentials
kubectl get secret acr-secret -n stumbleable

# 2. CrashLoopBackOff - Check application logs
kubectl logs <pod-name> -n stumbleable

# 3. Pending - Check node resources
kubectl describe nodes
```

### Service Not Accessible

```bash
# Check service
kubectl get service -n stumbleable

# Check endpoints
kubectl get endpoints -n stumbleable

# Check ingress
kubectl get ingress -n stumbleable
kubectl describe ingress stumbleable-ingress -n stumbleable

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/nginx-ingress-ingress-nginx-controller
```

### Certificate Issues

```bash
# Check certificate
kubectl get certificate -n stumbleable
kubectl describe certificate stumbleable-tls -n stumbleable

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate challenges
kubectl get challenges -n stumbleable
kubectl describe challenge <challenge-name> -n stumbleable
```

### Database Connection Issues

```bash
# Check if secrets are correctly set
kubectl get secret stumbleable-secrets -n stumbleable -o yaml

# Test connection from pod
kubectl exec -it <pod-name> -n stumbleable -- sh
# Inside pod:
# curl https://your-supabase-url.supabase.co/rest/v1/
```

### High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n stumbleable
kubectl top nodes

# Adjust resource limits
kubectl edit deployment/ui-portal -n stumbleable
# Update resources.limits and resources.requests
```

---

## Emergency Procedures

### Complete Rollback

```bash
# Rollback all services
kubectl rollout undo deployment/ui-portal -n stumbleable
kubectl rollout undo deployment/discovery-service -n stumbleable
kubectl rollout undo deployment/interaction-service -n stumbleable
kubectl rollout undo deployment/user-service -n stumbleable
kubectl rollout undo deployment/crawler-service -n stumbleable
```

### Scale Down to Zero (Maintenance)

```bash
# Scale all deployments to zero
kubectl scale deployment --all --replicas=0 -n stumbleable

# Scale back up
kubectl scale deployment/ui-portal --replicas=2 -n stumbleable
# etc...
```

### Delete and Redeploy

```bash
# ⚠️ WARNING: This will delete all running pods

# Delete all deployments
kubectl delete deployment --all -n stumbleable

# Redeploy
cd k8s/base
for file in *-service.yaml ui-portal.yaml; do
  envsubst < "$file" | kubectl apply -f -
done
```

---

## Maintenance Checklist

### Weekly
- [ ] Check pod health: `kubectl get pods -n stumbleable`
- [ ] Review logs for errors
- [ ] Check resource usage: `kubectl top pods -n stumbleable`
- [ ] Verify backups are running

### Monthly
- [ ] Review HPA metrics and adjust if needed
- [ ] Update Docker base images
- [ ] Review and rotate secrets
- [ ] Check for K8s updates
- [ ] Load test production environment

---

## Useful Commands Reference

```bash
# Quick status check
kubectl get all -n stumbleable

# Watch pod status in real-time
kubectl get pods -n stumbleable --watch

# Port forward for local testing
kubectl port-forward service/ui-portal 3000:3000 -n stumbleable

# Execute command in pod
kubectl exec -it <pod-name> -n stumbleable -- sh

# Copy files from pod
kubectl cp <pod-name>:/path/to/file ./local-file -n stumbleable

# Delete a stuck pod
kubectl delete pod <pod-name> --force --grace-period=0 -n stumbleable

# Restart deployment (rolling restart)
kubectl rollout restart deployment/ui-portal -n stumbleable
```

---

## Support & Resources

- **Kubernetes Docs:** https://kubernetes.io/docs/
- **Azure AKS Docs:** https://learn.microsoft.com/en-us/azure/aks/
- **NGINX Ingress:** https://kubernetes.github.io/ingress-nginx/
- **cert-manager:** https://cert-manager.io/docs/

---

**Next Steps:** [Production Readiness Checklist](./PRODUCTION_CHECKLIST.md)

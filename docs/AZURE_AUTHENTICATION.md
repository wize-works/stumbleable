# Azure Authentication for Stumbleable Deployment

**Last Updated:** October 1, 2025  
**Authentication Method:** Azure Service Principal (Modern & Secure)

---

## 🔐 Why Service Principal Instead of Username/Password?

### ❌ Old Method (ACR Username/Password)
- Less secure
- Requires storing credentials as secrets
- Needs `imagePullSecrets` in every Kubernetes manifest
- Manual credential rotation
- Not recommended by Microsoft

### ✅ New Method (Azure Service Principal + AKS-ACR Integration)
- **More secure** - Uses Azure AD authentication
- **Automatic** - AKS pulls images without secrets
- **Centralized** - One service principal for all operations
- **Azure-native** - Follows Microsoft best practices
- **Easier rotation** - Managed through Azure AD

---

## 🏗️ How It Works

### GitHub Actions Workflow

```yaml
# 1. Log in to Azure using service principal
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

# 2. Log in to ACR (uses the Azure login above)
- name: Log in to Azure Container Registry
  run: az acr login --name ${{ env.ACR_NAME }}

# 3. Build and push images to ACR
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  # ... builds and pushes to ACR

# 4. Connect to AKS
- name: Set AKS context
  uses: azure/aks-set-context@v3
  # ... connects to AKS cluster

# 5. Attach ACR to AKS (enables automatic image pulls)
- name: Attach ACR to AKS
  run: |
    az aks update \
      --resource-group ${{ env.AKS_RESOURCE_GROUP }} \
      --name ${{ env.AKS_CLUSTER_NAME }} \
      --attach-acr ${{ env.ACR_NAME }}
```

### Kubernetes Deployment

```yaml
# No imagePullSecrets needed! 🎉
spec:
  containers:
  - name: ui-portal
    image: ${ACR_NAME}.azurecr.io/stumbleable-ui:${IMAGE_TAG}
    # AKS automatically authenticates to ACR via integration
```

---

## 🚀 Setup Instructions

### Step 1: Create Azure Service Principal

Run the helper script:

```powershell
# From project root
.\scripts\create-azure-credentials.ps1
```

This will:
1. Check your Azure CLI login status
2. Prompt for your AKS resource group name
3. Create a service principal with `Contributor` role
4. Generate the `AZURE_CREDENTIALS` JSON
5. Save it to `azure-credentials.json` (for reference)

**Output example:**
```json
{
  "clientId": "12345678-1234-1234-1234-123456789abc",
  "clientSecret": "your-secret-here",
  "subscriptionId": "87654321-4321-4321-4321-cba987654321",
  "tenantId": "abcdefgh-ijkl-mnop-qrst-uvwxyz123456"
}
```

### Step 2: Add to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `AZURE_CREDENTIALS` | JSON from Step 1 | Output of create-azure-credentials.ps1 |
| `ACR_NAME` | Your ACR name | Azure Portal → Container Registries |
| `AKS_CLUSTER_NAME` | Your AKS cluster name | Azure Portal → Kubernetes services |
| `AKS_RESOURCE_GROUP` | Resource group | Azure Portal (same RG for AKS/ACR) |
| `SUPABASE_URL` | https://xxx.supabase.co | Supabase project settings |
| `SUPABASE_ANON_KEY` | eyJhbGc... | Supabase project API settings |
| `SUPABASE_SERVICE_KEY` | eyJhbGc... | Supabase project API settings |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | pk_live_... | Clerk dashboard |
| `CLERK_SECRET_KEY` | sk_live_... | Clerk dashboard |
| `CLERK_WEBHOOK_SECRET` | whsec_... | Clerk dashboard → Webhooks |

### Step 3: Verify Service Principal Permissions

```powershell
# Get your service principal details
$appId = "<clientId from AZURE_CREDENTIALS>"
az ad sp show --id $appId

# Verify it has access to your resource group
az role assignment list --assignee $appId --resource-group <your-rg>
```

---

## 🔒 Security Best Practices

### Service Principal Scope

The service principal is scoped to your resource group only:
```
/subscriptions/{subscription-id}/resourceGroups/{resource-group}
```

This means it can only:
- ✅ Push images to ACR in this resource group
- ✅ Deploy to AKS in this resource group
- ✅ Attach ACR to AKS
- ❌ Cannot access other resource groups
- ❌ Cannot create/delete the resource group itself

### Credential Rotation

To rotate the service principal secret:

```powershell
# Reset the service principal credential
az ad sp credential reset --name stumbleable-github-actions

# Update GitHub secret with new JSON
```

### Alternative: Managed Identity (Future Enhancement)

For even better security, you can use:
- **GitHub OIDC** - No secrets stored at all
- **AKS Managed Identity** - AKS uses its own identity to access ACR

We use service principal for now because it's:
- Simple to set up
- Works immediately
- Easy to understand
- Sufficient for most deployments

---

## 🔍 Verification

### Verify AKS Can Pull from ACR

```powershell
# Check if ACR is attached to AKS
az aks show `
  --resource-group <your-rg> `
  --name <your-aks-cluster> `
  --query "servicePrincipalProfile.clientId" -o tsv

# Or check via kubectl
kubectl get serviceaccount default -n stumbleable -o yaml
# Should NOT see imagePullSecrets
```

### Test Manual Image Pull

```powershell
# Log in to Azure with service principal
az login --service-principal `
  --username <clientId> `
  --password <clientSecret> `
  --tenant <tenantId>

# Test ACR access
az acr login --name <your-acr-name>

# List repositories
az acr repository list --name <your-acr-name>
```

---

## 🐛 Troubleshooting

### "Failed to pull image" errors

**Check AKS-ACR integration:**
```powershell
az aks check-acr `
  --resource-group <your-rg> `
  --name <your-aks-cluster> `
  --acr <your-acr-name>.azurecr.io
```

**Manually attach ACR to AKS:**
```powershell
az aks update `
  --resource-group <your-rg> `
  --name <your-aks-cluster> `
  --attach-acr <your-acr-name>
```

### "Insufficient privileges" errors

The service principal needs `Contributor` role on the resource group:
```powershell
az role assignment create `
  --assignee <clientId> `
  --role Contributor `
  --resource-group <your-rg>
```

### GitHub Actions authentication fails

Verify the JSON format is correct:
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

Make sure:
- No trailing commas
- Proper quotes around strings
- Valid JSON structure

---

## 📚 References

- [Azure Service Principals](https://learn.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli)
- [AKS-ACR Integration](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration)
- [GitHub Actions Azure Login](https://github.com/Azure/login)
- [Azure RBAC Roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles)

---

## ✅ Benefits Summary

| Aspect | Old Method | New Method |
|--------|------------|------------|
| **Security** | Store ACR password | Azure AD auth |
| **Secrets** | 2 secrets (username/password) | 1 secret (service principal) |
| **Kubernetes** | imagePullSecrets in every manifest | No secrets needed |
| **Rotation** | Manual password reset | Azure AD managed |
| **Permissions** | ACR-specific | Full Azure RBAC |
| **Best Practice** | ❌ Deprecated | ✅ Recommended |

---

**You're now using the modern, secure way to deploy to Azure!** 🎉

# GitHub Secrets Configuration Guide

## Required GitHub Secrets

Here's the complete list of secrets you need to configure in your GitHub repository.

### Current Secrets Status

✅ **You Already Have:**
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_KEY` ⚠️ (should be `SUPABASE_SERVICE_ROLE_KEY`)
- `SUPABASE_URL`
- `ACR_NAME`
- `AKS_CLUSTER_NAME`
- `AKS_RESOURCE_GROUP`
- `AZURE_CREDENTIALS`

### ⚠️ Missing Secrets (Need to Add)

#### 1. **CLERK_WEBHOOK_SECRET**
**Purpose**: Validates Clerk webhook requests for user events
**Where to get it**: 
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** section
3. Create or view an existing webhook
4. Copy the **Signing Secret**

**Example format**: `whsec_...`

#### 2. **SUPABASE_SERVICE_ROLE_KEY** (Rename existing)
**Current**: You have `SUPABASE_SERVICE_KEY`
**Should be**: `SUPABASE_SERVICE_ROLE_KEY`

**Action needed**: 
1. Copy the value from `SUPABASE_SERVICE_KEY`
2. Create new secret: `SUPABASE_SERVICE_ROLE_KEY`
3. Optionally delete old `SUPABASE_SERVICE_KEY`

**Where to get it**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (not the anon key!)

---

## Complete Secrets List

### Authentication & Authorization
```
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Database
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Azure Infrastructure
```
ACR_NAME=your-registry-name
AKS_CLUSTER_NAME=your-aks-cluster-name
AKS_RESOURCE_GROUP=your-resource-group-name
AZURE_CREDENTIALS={
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

---

## API URLs for AKS Deployment

Since all services run in the **same AKS cluster** under the **stumbleable namespace**, they communicate using Kubernetes internal DNS.

### Internal Service Communication (Server-to-Server)

Services use **internal DNS names** which are already configured in `k8s/base/configmap.yaml`:

```yaml
# These are ALREADY SET in ConfigMap - no secrets needed!
DISCOVERY_API_URL: "http://discovery-service:7001"
INTERACTION_API_URL: "http://interaction-service:7002"
USER_API_URL: "http://user-service:7003"
CRAWLER_API_URL: "http://crawler-service:7004"
```

**Format**: `http://<service-name>:<port>`
- No namespace needed (they're in the same namespace)
- No external domain needed
- No HTTPS needed (internal traffic)

### Client-Side API URLs (Browser to Server)

The Next.js frontend makes calls from the **browser**, so it needs **public URLs**. These are in the ConfigMap and need to match your ingress configuration:

```yaml
# Update these in k8s/base/configmap.yaml with your actual domain
NEXT_PUBLIC_DISCOVERY_API_URL: "https://api.stumbleable.com/discovery"
NEXT_PUBLIC_INTERACTION_API_URL: "https://api.stumbleable.com/interaction"
NEXT_PUBLIC_USER_API_URL: "https://api.stumbleable.com/user"
```

**Options for Client URLs:**

#### Option 1: Using Ingress with Path-Based Routing (Recommended)
```yaml
# All APIs through single ingress
NEXT_PUBLIC_DISCOVERY_API_URL: "https://api.stumbleable.com/discovery"
NEXT_PUBLIC_INTERACTION_API_URL: "https://api.stumbleable.com/interaction"
NEXT_PUBLIC_USER_API_URL: "https://api.stumbleable.com/user"
```

#### Option 2: Using LoadBalancer Public IPs
```yaml
# Each service gets its own public IP
NEXT_PUBLIC_DISCOVERY_API_URL: "http://<discovery-service-public-ip>:7001"
NEXT_PUBLIC_INTERACTION_API_URL: "http://<interaction-service-public-ip>:7002"
NEXT_PUBLIC_USER_API_URL: "http://<user-service-public-ip>:7003"
```

#### Option 3: Development/Testing with Port Forwarding
```yaml
# For local testing only
NEXT_PUBLIC_DISCOVERY_API_URL: "http://localhost:7001"
NEXT_PUBLIC_INTERACTION_API_URL: "http://localhost:7002"
NEXT_PUBLIC_USER_API_URL: "http://localhost:7003"
```

---

## How to Add Secrets to GitHub

### Via GitHub UI
1. Go to your repository: `https://github.com/wize-works/stumbleable`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value

### Via GitHub CLI
```bash
# Add missing secret
gh secret set CLERK_WEBHOOK_SECRET --body "whsec_your_secret_here"

# Rename/add the corrected Supabase key
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your_service_role_key_here"
```

---

## Verification Checklist

After adding secrets, verify:

### ✅ Required Secrets (9 total)
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_WEBHOOK_SECRET` ⬅️ **ADD THIS**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⬅️ **RENAME/ADD THIS**
- [ ] `ACR_NAME`
- [ ] `AKS_CLUSTER_NAME`
- [ ] `AKS_RESOURCE_GROUP`
- [ ] `AZURE_CREDENTIALS`

### ✅ ConfigMap Values (No secrets needed)
These are already in `k8s/base/configmap.yaml`:
- [x] Internal service URLs (e.g., `http://discovery-service:7001`)
- [ ] Client-side public URLs (update with your domain)

---

## Common Issues

### Issue: Services can't communicate
**Symptom**: 500 errors, connection refused
**Cause**: Incorrect internal URLs
**Solution**: Ensure ConfigMap uses internal DNS names like `http://discovery-service:7001`

### Issue: Browser can't reach APIs
**Symptom**: Network errors in browser console
**Cause**: `NEXT_PUBLIC_*` URLs are wrong
**Solution**: Update ConfigMap with correct public URLs matching your ingress

### Issue: Webhook validation fails
**Symptom**: Clerk webhooks fail with signature errors
**Cause**: Missing or wrong `CLERK_WEBHOOK_SECRET`
**Solution**: Copy the correct signing secret from Clerk Dashboard

### Issue: Database connection fails
**Symptom**: Supabase connection errors
**Cause**: Using wrong key type
**Solution**: Use `service_role` key, not `anon` key

---

## Testing Secrets

After configuring secrets, test with:

```bash
# Trigger deployment manually
gh workflow run deploy-aks.yml

# Watch the deployment
gh run watch

# Check pod logs for any missing env vars
kubectl logs -n stumbleable deployment/ui-portal
kubectl logs -n stumbleable deployment/discovery-service
```

---

## Security Best Practices

### ✅ DO:
- Use GitHub Secrets for all sensitive values
- Rotate secrets regularly (every 90 days)
- Use service principals with minimum required permissions
- Use different secrets for dev/staging/prod

### ❌ DON'T:
- Commit secrets to git
- Use the same secrets across environments
- Share secrets in Slack/email
- Use `anon` keys where `service_role` is needed

---

## Next Steps

1. **Add missing secrets**:
   ```bash
   gh secret set CLERK_WEBHOOK_SECRET
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Update ConfigMap** with your actual domain:
   ```bash
   # Edit k8s/base/configmap.yaml
   # Change api.stumbleable.com to your actual domain
   ```

3. **Deploy and test**:
   ```bash
   git add .
   git commit -m "Add missing secrets and update ConfigMap"
   git push
   ```

4. **Verify deployment**:
   ```bash
   kubectl get pods -n stumbleable
   kubectl get services -n stumbleable
   kubectl get ingress -n stumbleable
   ```

---

## Related Documentation
- [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [GitHub Actions Kubelogin Fix](./GITHUB_ACTIONS_KUBELOGIN_FIX.md)

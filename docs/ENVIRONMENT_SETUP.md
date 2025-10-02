# Environment Configuration Guide

**Last Updated:** October 1, 2025  
**Purpose:** Configure environment variables for all Stumbleable services

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Required Services](#required-services)
3. [Environment Variables by Service](#environment-variables-by-service)
4. [Setup Instructions](#setup-instructions)
5. [Production vs Development](#production-vs-development)
6. [Secrets Management](#secrets-management)

---

## Overview

Stumbleable uses environment variables for configuration across all services. This guide covers:
- What variables are needed
- Where to get the values
- How to set them up locally and in production

---

## Required Services

Before configuring environment variables, ensure you have accounts for:

### 1. Supabase (Database)
- **URL:** https://supabase.com
- **Purpose:** PostgreSQL database with real-time capabilities
- **What you need:**
  - Project URL
  - Anon key (public)
  - Service role key (private)

### 2. Clerk (Authentication)
- **URL:** https://clerk.com
- **Purpose:** User authentication and management
- **What you need:**
  - Publishable key (public)
  - Secret key (private)
  - Webhook secret (for user events)

### 3. Azure (Deployment)
- **URL:** https://portal.azure.com
- **Purpose:** Container registry and Kubernetes hosting
- **What you need:**
  - ACR name and credentials
  - AKS cluster details
  - Service principal credentials

---

## Environment Variables by Service

### UI Portal (Next.js)

**File:** `ui/portal/.env.local` (development) or K8s secrets (production)

```bash
# Node Environment
NODE_ENV=production

# Clerk Authentication (PUBLIC - embedded in browser bundle)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# API URLs (PUBLIC - used by browser)
NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery
NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction
NEXT_PUBLIC_USER_API_URL=https://api.stumbleable.com/user

# Optional: Analytics & Monitoring
# NEXT_PUBLIC_SENTRY_DSN=https://...
# NEXT_PUBLIC_GA_TRACKING_ID=G-...

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1
```

### Discovery Service

**File:** `apis/discovery-service/.env`

```bash
# Node Environment
NODE_ENV=production
PORT=7001
LOG_LEVEL=info

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk Authentication (for API auth)
CLERK_SECRET_KEY=sk_live_...

# Optional: Performance Monitoring
# SENTRY_DSN=https://...
# DATADOG_API_KEY=...
```

### Interaction Service

**File:** `apis/interaction-service/.env`

```bash
# Node Environment
NODE_ENV=production
PORT=7002
LOG_LEVEL=info

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...

# Optional: Monitoring
# SENTRY_DSN=https://...
```

### User Service

**File:** `apis/user-service/.env`

```bash
# Node Environment
NODE_ENV=production
PORT=7003
LOG_LEVEL=info

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=service-role-key

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Optional: Monitoring
# SENTRY_DSN=https://...
```

### Crawler Service

**File:** `apis/crawler-service/.env`

```bash
# Node Environment
NODE_ENV=production
PORT=7004
LOG_LEVEL=info

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=service-role-key

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...

# Crawler Configuration
CRAWLER_USER_AGENT=StumbleableBot/1.0
CRAWLER_MAX_CONCURRENT=5
CRAWLER_RATE_LIMIT_MS=1000

# Optional: Monitoring
# SENTRY_DSN=https://...
```

---

## Setup Instructions

### Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role** key (keep this secret!)

### Step 2: Get Clerk Credentials

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application (or create one)
3. Go to **API Keys**
4. Copy the following:
   - **Publishable Key** (starts with `pk_live_` or `pk_test_`)
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)
5. Go to **Webhooks**
6. Create webhook endpoint (e.g., `https://api.stumbleable.com/user/webhooks/clerk`)
7. Copy the **Signing Secret** (starts with `whsec_`)

### Step 3: Set Up Local Development

```bash
# UI Portal
cd ui/portal
cp .env.example .env.local
# Edit .env.local with your credentials

# Discovery Service
cd apis/discovery-service
cp .env.example .env
# Edit .env with your credentials

# Repeat for all services...
```

### Step 4: Set Up GitHub Secrets (Production)

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add each secret:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `ACR_NAME`
- `AKS_CLUSTER_NAME`
- `AKS_RESOURCE_GROUP`
- `AZURE_CREDENTIALS` (JSON - service principal for ACR/AKS authentication)

### Step 5: Verify Configuration

```bash
# Start all services locally
npm run dev

# Check health endpoints
curl http://localhost:3000/api/health
curl http://localhost:7001/health
curl http://localhost:7002/health
curl http://localhost:7003/health
curl http://localhost:7004/health

# All should return 200 OK
```

---

## Production vs Development

### Development Environment

```bash
# Use test/development keys
NODE_ENV=development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Use localhost URLs
NEXT_PUBLIC_DISCOVERY_API_URL=http://localhost:7001
NEXT_PUBLIC_INTERACTION_API_URL=http://localhost:7002
NEXT_PUBLIC_USER_API_URL=http://localhost:7003

# More verbose logging
LOG_LEVEL=debug
```

### Production Environment

```bash
# Use production keys
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Use production URLs
NEXT_PUBLIC_DISCOVERY_API_URL=https://api.stumbleable.com/discovery
NEXT_PUBLIC_INTERACTION_API_URL=https://api.stumbleable.com/interaction
NEXT_PUBLIC_USER_API_URL=https://api.stumbleable.com/user

# Less verbose logging
LOG_LEVEL=info
```

---

## Secrets Management

### Local Development

**Option 1: .env files (Recommended)**
```bash
# Create .env files (already in .gitignore)
# Never commit these files!
```

**Option 2: direnv**
```bash
# Install direnv
# https://direnv.net/

# Create .envrc file
echo 'export SUPABASE_URL="..."' >> .envrc
direnv allow
```

### Production (Kubernetes)

**Option 1: Kubernetes Secrets (Current)**
```bash
# Secrets are created via GitHub Actions
# See .github/workflows/deploy-aks.yml
```

**Option 2: Azure Key Vault (Recommended for large teams)**
```bash
# Install Azure Key Vault provider
kubectl apply -f https://raw.githubusercontent.com/Azure/secrets-store-csi-driver-provider-azure/master/deployment/provider-azure-installer.yaml

# Create SecretProviderClass
kubectl apply -f - <<EOF
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: stumbleable-secrets-provider
  namespace: stumbleable
spec:
  provider: azure
  parameters:
    keyvaultName: "your-keyvault-name"
    objects: |
      array:
        - |
          objectName: SUPABASE-URL
          objectType: secret
        - |
          objectName: SUPABASE-ANON-KEY
          objectType: secret
EOF
```

**Option 3: Sealed Secrets**
```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Encrypt secrets
kubeseal --format yaml < secrets.yaml > sealed-secrets.yaml
# Commit sealed-secrets.yaml to Git (safe)
```

---

## Environment Variable Checklist

### Before Deployment
- [ ] All Supabase credentials obtained
- [ ] All Clerk credentials obtained
- [ ] GitHub secrets configured
- [ ] ACR and AKS credentials ready
- [ ] Local .env files created (not committed)
- [ ] All services start successfully locally
- [ ] Health checks return 200 OK

### After Deployment
- [ ] Kubernetes secrets created successfully
- [ ] Pods can connect to Supabase
- [ ] Clerk authentication works
- [ ] Services can communicate internally
- [ ] External URLs accessible via Ingress

---

## Troubleshooting

### "Missing Environment Variable" Error

```bash
# Check if variable is set in K8s secret
kubectl get secret stumbleable-secrets -n stumbleable -o yaml

# Check if pod has access to secret
kubectl exec -it <pod-name> -n stumbleable -- printenv | grep SUPABASE
```

### "Cannot Connect to Supabase" Error

```bash
# Test connection from pod
kubectl exec -it <pod-name> -n stumbleable -- sh
wget -O- https://your-project.supabase.co

# Check if URL is correct
echo $SUPABASE_URL
```

### "Clerk Authentication Failed" Error

```bash
# Check if keys are correct
# Publishable keys start with pk_
# Secret keys start with sk_

# Ensure you're using matching environment keys
# pk_test_ with sk_test_
# pk_live_ with sk_live_
```

---

## Security Best Practices

### ✅ DO
- Use different keys for development and production
- Rotate secrets regularly (quarterly)
- Use Azure Key Vault for production
- Never commit `.env` files to Git
- Use separate Supabase projects for dev/prod
- Restrict access to GitHub secrets

### ❌ DON'T
- Never commit secrets to Git
- Don't share secrets via email/Slack
- Don't use production keys in development
- Don't hardcode secrets in code
- Don't give everyone access to production secrets

---

## Quick Reference

### Get All Current Environment Variables (Local)

```bash
# PowerShell
Get-ChildItem Env: | Sort-Object Name

# Bash
printenv | sort
```

### Get All Kubernetes Secrets

```bash
kubectl get secrets -n stumbleable
kubectl describe secret stumbleable-secrets -n stumbleable
```

### Update a Secret in Kubernetes

```bash
# Update specific key
kubectl patch secret stumbleable-secrets -n stumbleable \
  -p '{"stringData":{"SUPABASE_URL":"new-value"}}'

# Or recreate entire secret
kubectl delete secret stumbleable-secrets -n stumbleable
kubectl create secret generic stumbleable-secrets \
  --namespace=stumbleable \
  --from-literal=SUPABASE_URL="..." \
  --from-literal=SUPABASE_SERVICE_KEY="..." \
  # ... etc

# Restart deployments to pick up new secrets
kubectl rollout restart deployment/ui-portal -n stumbleable
```

---

**Next Steps:** [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)

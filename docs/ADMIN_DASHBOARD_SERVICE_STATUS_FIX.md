# Admin Dashboard Service Status Fix

## Issue
The admin dashboard was showing the **Scheduler Service** and **Email Service** as **offline** even though the services were running correctly in Kubernetes.

## Root Cause
The UI Portal deployment was missing environment variable mappings for:
- `NEXT_PUBLIC_EMAIL_API_URL`
- `NEXT_PUBLIC_SCHEDULER_API_URL`

### How the Health Check Works
The admin dashboard (`components/admin-dashboard.tsx`) performs client-side health checks by fetching from service health endpoints:

```typescript
const services = [
    { name: 'Discovery Service', url: process.env.NEXT_PUBLIC_DISCOVERY_API_URL },
    { name: 'User Service', url: process.env.NEXT_PUBLIC_USER_API_URL },
    { name: 'Interaction Service', url: process.env.NEXT_PUBLIC_INTERACTION_API_URL },
    { name: 'Moderation Service', url: process.env.NEXT_PUBLIC_MODERATION_API_URL },
    { name: 'Crawler Service', url: process.env.NEXT_PUBLIC_CRAWLER_API_URL },
    { name: 'Email Service', url: process.env.NEXT_PUBLIC_EMAIL_API_URL },      // ❌ Was undefined
    { name: 'Scheduler Service', url: process.env.NEXT_PUBLIC_SCHEDULER_API_URL }, // ❌ Was undefined
];
```

When these environment variables are undefined, the health check URLs default to `undefined/health`, causing the fetch to fail and marking the services as offline.

## Solution
Added the missing environment variable mappings to `k8s/base/ui-portal.yaml`:

```yaml
- name: NEXT_PUBLIC_EMAIL_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NEXT_PUBLIC_EMAIL_API_URL
- name: NEXT_PUBLIC_SCHEDULER_API_URL
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NEXT_PUBLIC_SCHEDULER_API_URL
```

### ConfigMap Values
The values were already correctly defined in `k8s/base/configmap.yaml`:

```yaml
NEXT_PUBLIC_EMAIL_API_URL: "https://api.stumbleable.com/email"
NEXT_PUBLIC_SCHEDULER_API_URL: "https://api.stumbleable.com/scheduler"
```

## Deployment
To apply the fix to production:

```bash
# From the root directory
kubectl apply -f k8s/base/ui-portal.yaml

# Or trigger a redeployment via GitHub Actions
# The next deployment will automatically include these variables
```

## Verification
After deployment, the admin dashboard should show both services as online:

1. Navigate to `/admin` dashboard
2. Check the "System Status" section
3. Verify Email Service and Scheduler Service show as "Online" with response times

## Prevention
When adding new services to the system:

1. ✅ Add service URLs to `k8s/base/configmap.yaml`
2. ✅ Add environment variable mappings to `k8s/base/ui-portal.yaml`
3. ✅ Update `components/admin-dashboard.tsx` to include the new service in health checks
4. ✅ Test the admin dashboard locally before deploying

## Related Files
- `k8s/base/ui-portal.yaml` - UI Portal deployment configuration
- `k8s/base/configmap.yaml` - Centralized configuration values
- `ui/portal/components/admin-dashboard.tsx` - Admin dashboard component
- `ui/portal/app/admin/page.tsx` - Admin page

## Notes
- This issue only affected the **admin dashboard UI display**
- The services themselves were **running correctly**
- Server-side API calls (non-NEXT_PUBLIC_ vars) were working fine
- Only client-side health checks from the browser were failing

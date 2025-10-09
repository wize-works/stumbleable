# Email Service Logger Fix - Pino-Pretty in Production

**Date:** October 8, 2025  
**Issue:** Email service crashing with pino-pretty transport error after ES modules fix

## Problem

After fixing the ES modules issue, the email-service deployed but immediately crashed with:

```
Error: unable to determine transport target for "pino-pretty"
    at fixTarget (/app/node_modules/pino/lib/transport.js:160:13)
```

### Root Cause

The Fastify logger was configured to **always** use `pino-pretty`:

```typescript
// ❌ WRONG - pino-pretty not available in production
const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',  // Always uses this!
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});
```

**Why this fails in production:**

1. `pino-pretty` is listed as a **devDependency** in `package.json`
2. The Docker build uses `npm install --omit=dev` (production only)
3. `pino-pretty` is **not installed** in the production container
4. The logger tries to load `pino-pretty` and fails

**Why it worked locally:**

- Development runs `npm install` (includes devDependencies)
- `pino-pretty` is available
- No error occurs

## Solution

Conditionally use `pino-pretty` only in development:

```typescript
// ✅ CORRECT - Use pino-pretty only in development
const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});
```

**File:** `apis/email-service/src/server.ts`

## How It Works

### Development Environment (`NODE_ENV !== 'production'`)

**Logger output:**
```
[14:23:45] INFO: 📧 Email Service Running
    service: "email-service"
    port: 8080
[14:23:46] INFO: Email sent successfully
    to: "user@example.com"
    template: "welcome"
```

**Characteristics:**
- ✅ Human-readable formatting
- ✅ Colorized output
- ✅ Pretty-printed JSON
- ✅ Timestamps in readable format
- ✅ Great for debugging

### Production Environment (`NODE_ENV === 'production'`)

**Logger output:**
```json
{"level":30,"time":1728392625000,"msg":"📧 Email Service Running","service":"email-service","port":8080}
{"level":30,"time":1728392626000,"msg":"Email sent successfully","to":"user@example.com","template":"welcome"}
```

**Characteristics:**
- ✅ Structured JSON (one line per log)
- ✅ Machine-parseable
- ✅ Works with log aggregation tools (CloudWatch, DataDog, etc.)
- ✅ No external dependencies needed
- ✅ Better performance (no pretty-printing overhead)

## Comparison with Other Services

### Discovery Service (Already Correct)

```typescript
const fastify = Fastify({
    logger: {
        level: getLogLevel(),
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss.l Z',
                ignore: 'pid,hostname',
                colorize: true,
                singleLine: false
            }
        },
    }
});
```

✅ Already follows best practices!

### Email Service (Now Fixed)

```typescript
const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});
```

✅ Now matches the pattern!

## Why Production Uses JSON Logs

### 1. **Log Aggregation**
```bash
# Easy to parse and filter
kubectl logs deployment/email-service | jq '.level == 30'
```

### 2. **Structured Queries**
```bash
# Search for specific fields
kubectl logs deployment/email-service | jq 'select(.to == "user@example.com")'
```

### 3. **Performance**
- No pretty-printing overhead
- Faster log writes
- Less CPU usage

### 4. **Machine Integration**
- CloudWatch Logs Insights
- Azure Monitor
- DataDog
- Elasticsearch/Kibana

## Dockerfile Alignment

This fix aligns with our standardized Dockerfile which uses:

```dockerfile
# Stage 1: deps - Production dependencies only
FROM node:20-alpine AS deps
RUN npm install --omit=dev  # No devDependencies!

# Stage 3: runner - Uses production dependencies
COPY --from=deps /app/node_modules ./node_modules
```

**Result:** `pino-pretty` is **not** in the production image.

## Testing

### Local Development Test
```bash
cd apis/email-service

# Development (should use pino-pretty)
NODE_ENV=development npm run dev

# Should see colored, pretty output:
# [14:23:45] INFO: 📧 Email Service Running
```

### Production Simulation Test
```bash
# Build the service
npm run build

# Run as production (should use JSON)
NODE_ENV=production npm start

# Should see JSON output:
# {"level":30,"time":1728392625000,"msg":"📧 Email Service Running"}
```

### Docker Test
```bash
# Build image
docker build -t test-email-service -f Dockerfile .

# Run container (NODE_ENV=production set in Dockerfile)
docker run -p 8080:8080 --env-file .env test-email-service

# Logs should be JSON
docker logs <container-id>
```

### Kubernetes Deployment
```bash
# After deployment
kubectl logs -n stumbleable deployment/email-service --tail=50

# Should see:
# {"level":30,"msg":"📧 Email Service Running","port":8080}
# No pino-pretty errors!
```

## Prevention Checklist

When creating new Fastify services:

- [ ] Always check `NODE_ENV` before using `pino-pretty`
- [ ] Use `undefined` transport in production
- [ ] Keep `pino-pretty` in **devDependencies** only
- [ ] Test production build before deploying: `npm run build && NODE_ENV=production npm start`
- [ ] Copy logger config from existing services (discovery-service is a good template)

## Common Mistakes

### ❌ Mistake 1: Always Using pino-pretty
```typescript
logger: {
    transport: {
        target: 'pino-pretty'  // Will fail in production!
    }
}
```

### ❌ Mistake 2: Adding pino-pretty to dependencies
```json
{
  "dependencies": {
    "pino-pretty": "^10.0.0"  // Wrong! Should be devDependency
  }
}
```

### ❌ Mistake 3: Wrong Environment Check
```typescript
logger: {
    transport: process.env.NODE_ENV === 'development' ? {  // Too specific!
        target: 'pino-pretty'
    } : undefined
}
```
**Problem:** Doesn't work for `NODE_ENV=test`, `NODE_ENV=local`, etc.

### ✅ Correct Pattern
```typescript
logger: {
    transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
        }
    }
}
```
**Why:** Anything **not** production gets pretty logs (dev, test, local, etc.)

## Environment Variables

The Kubernetes deployment sets `NODE_ENV=production`:

**File:** `k8s/base/email-service.yaml`

```yaml
env:
- name: NODE_ENV
  valueFrom:
    configMapKeyRef:
      name: stumbleable-config
      key: NODE_ENV  # Should be "production"
```

**Verify in ConfigMap:**
```bash
kubectl get configmap stumbleable-config -n stumbleable -o yaml | grep NODE_ENV
```

Should show:
```yaml
NODE_ENV: production
```

## Related Issues

This pattern is **already correct** in:
- ✅ discovery-service
- ✅ interaction-service
- ✅ user-service
- ✅ crawler-service
- ✅ moderation-service

Only **email-service** had this issue because it was created separately with a different logger configuration.

## Summary

✅ **Fixed:** Logger transport now conditionally uses pino-pretty  
✅ **Development:** Pretty-printed, colorized logs for debugging  
✅ **Production:** Structured JSON logs for aggregation  
✅ **Aligned:** Matches pattern used in all other services  

The email service will now start successfully in production with proper JSON logging! 🎉

## Related Documentation

- [Email Service ES Modules Fix](./EMAIL_SERVICE_ES_MODULES_FIX.md)
- [Dockerfile Standardization](./DOCKERFILE_STANDARDIZATION.md)
- [Kubernetes YAML Alignment](./K8S_YAML_ALIGNMENT_REVIEW.md)
- [Pino Documentation](https://getpino.io/)

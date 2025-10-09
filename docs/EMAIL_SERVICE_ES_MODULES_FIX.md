# Email Service ES Modules Fix

**Date:** October 8, 2025  
**Issue:** Email service crashing on deployment with module resolution errors

## Problem

The email-service was crashing in production with the following error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/dist/templates/components/EmailLayout' 
imported from /app/dist/templates/deletion-cancelled.js
```

### Root Cause

The email-service uses **ES modules** (`"type": "module"` in package.json), but the TypeScript import statements didn't include `.js` extensions. While TypeScript resolves these during development, Node.js ES modules require explicit file extensions at runtime.

```typescript
// ❌ WRONG - Works in development, fails in production
import { EmailLayout } from './components/EmailLayout';

// ✅ CORRECT - Works everywhere
import { EmailLayout } from './components/EmailLayout.js';
```

## Solution

### 1. Updated TypeScript Configuration

Changed `moduleResolution` from `"node"` to `"bundler"`:

**File:** `apis/email-service/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "moduleResolution": "bundler",  // Changed from "node"
    // ... rest of config
  }
}
```

**Why this matters:**
- `"node"` resolution is for CommonJS-style modules
- `"bundler"` resolution properly handles ES modules with `.js` extensions
- This tells TypeScript to expect and allow `.js` extensions in import paths

### 2. Added .js Extensions to All Imports

Updated all relative imports across 12 template files:

```typescript
// Before
import type { WelcomeEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';
import { PartyIcon } from './components/Icons';

// After
import type { WelcomeEmailProps } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';
import { PartyIcon } from './components/Icons.js';
```

**Files Updated:**
- ✅ `deletion-cancelled.tsx`
- ✅ `deletion-complete.tsx`
- ✅ `deletion-reminder.tsx`
- ✅ `deletion-request.tsx`
- ✅ `re-engagement.tsx`
- ✅ `saved-digest.tsx`
- ✅ `submission-approved.tsx`
- ✅ `submission-received.tsx`
- ✅ `submission-rejected.tsx`
- ✅ `weekly-new.tsx`
- ✅ `weekly-trending.tsx`
- ✅ `welcome.tsx`

## Technical Background

### ES Modules vs CommonJS

**CommonJS (Old Style):**
```javascript
// No file extension needed
const { something } = require('./module');
```

**ES Modules (New Style):**
```javascript
// File extension REQUIRED
import { something } from './module.js';
```

### Why TypeScript Needs .js Extensions

When you write TypeScript with ES modules:

1. **Source (.tsx):**
   ```typescript
   import { EmailLayout } from './components/EmailLayout.js';
   ```

2. **Compiled (.js):**
   ```javascript
   import { EmailLayout } from './components/EmailLayout.js';
   ```

3. **Runtime:** Node.js looks for `EmailLayout.js` - it exists! ✅

**Without `.js` extension:**

1. **Source (.tsx):**
   ```typescript
   import { EmailLayout } from './components/EmailLayout';
   ```

2. **Compiled (.js):**
   ```javascript
   import { EmailLayout } from './components/EmailLayout';
   ```

3. **Runtime:** Node.js looks for `EmailLayout` - file not found! ❌

### Why It Worked Locally

During local development with `tsx watch`:
- `tsx` resolves TypeScript files automatically
- It knows to look for `.ts` or `.tsx` files
- No explicit extension needed

In production with `node dist/server.js`:
- Node.js only knows about JavaScript files
- It requires explicit `.js` extensions for ES modules
- TypeScript's `.tsx` files are compiled to `.js`

## Verification

To verify the fix works:

### 1. Build the Service
```bash
cd apis/email-service
npm run build
```

### 2. Check Compiled Output
```bash
# Compiled imports should have .js extensions
cat dist/templates/welcome.js | grep "import.*from"
```

You should see:
```javascript
import { EmailLayout } from './components/EmailLayout.js';
import { PartyIcon } from './components/Icons.js';
```

### 3. Test Locally
```bash
npm start
```

### 4. Test in Docker
```bash
docker build -t test-email-service -f Dockerfile .
docker run -p 8080:8080 --env-file .env test-email-service
```

### 5. Check Health
```bash
curl http://localhost:8080/health
```

## Kubernetes Deployment

After pushing the fixed image, check deployment:

```bash
# Check pod status
kubectl get pods -n stumbleable -l app=email-service

# Should show Running (not CrashLoopBackOff)
NAME                            READY   STATUS    RESTARTS   AGE
email-service-xxxxx-yyyyy      1/1     Running   0          2m

# Check logs
kubectl logs -n stumbleable deployment/email-service --tail=50

# Should see:
# 🚀 Email Service running on http://0.0.0.0:8080
# 📧 Email API: POST http://0.0.0.0:8080/api/send
```

## Best Practices for ES Modules

When using ES modules in Node.js/TypeScript projects:

### 1. Always Include File Extensions
```typescript
// ✅ DO
import { something } from './module.js';
import type { Type } from '../types.js';

// ❌ DON'T
import { something } from './module';
import type { Type } from '../types';
```

### 2. Use Correct ModuleResolution
```jsonc
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"  // or "nodenext"
  }
}
```

### 3. Mark Package as ES Module
```json
{
  "type": "module"
}
```

### 4. Test Compiled Output
Always test the compiled JavaScript, not just the TypeScript:
```bash
npm run build
npm start  # Not npm run dev
```

## Related Issues

This same pattern should be followed for any service using:
- ✅ `"type": "module"` in package.json
- ✅ TypeScript with ES module target
- ✅ React components (.tsx files)

Currently only affects:
- **email-service** (fixed)

Other services use CommonJS or don't have this issue.

## Prevention

To prevent this in future services:

1. **Use the standard API service template** (all other services use CommonJS)
2. **If using ES modules, always test production build:**
   ```bash
   npm run build && node dist/server.js
   ```
3. **Add to CI/CD:** Test compiled output before deployment
4. **Lint rule:** Add ESLint rule to enforce `.js` extensions:
   ```javascript
   rules: {
     'import/extensions': ['error', 'always', { js: 'always' }]
   }
   ```

## Why Email Service Is Different

The email-service uses ES modules because:
- React Email requires ES modules
- Modern React components use ES module syntax
- Better tree-shaking for email templates

Most other API services use CommonJS because:
- Simpler configuration
- No file extension issues
- Better compatibility with older tools

**Both are valid** - just need different configurations!

## Summary

✅ **Fixed:** Added `.js` extensions to all imports in email templates  
✅ **Updated:** TypeScript config to use `"moduleResolution": "bundler"`  
✅ **Result:** Email service now starts successfully in production

The issue was specific to ES modules requiring explicit file extensions. Development worked fine because `tsx` auto-resolves, but production Node.js needs the extensions explicitly stated.

## Related Documentation

- [Dockerfile Standardization](./DOCKERFILE_STANDARDIZATION.md)
- [Kubernetes YAML Alignment](./K8S_YAML_ALIGNMENT_REVIEW.md)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

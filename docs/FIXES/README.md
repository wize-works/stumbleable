# Bug Fixes & Issue Resolutions

**Purpose:** Historical documentation of bugs, issues, and their resolutions. These docs capture the problem, solution, and implementation details for future reference.

---

## 📁 Organization

All fix documentation is organized chronologically and by service/feature area.

**File Naming Convention:**
- `[FEATURE]_[ISSUE]_FIX.md` - e.g., `SCHEDULER_DOCKERFILE_FIX.md`
- `[SERVICE]_[ISSUE]_FIX.md` - e.g., `EMAIL_SERVICE_ES_MODULES_FIX.md`
- `[AREA]_FIX_[DATE].md` - e.g., `BUILD_FIXES_OCT_2025.md`

---

## 🔍 Quick Reference by Category

### Build & Deployment Fixes
- [BUILD_FIXES_OCT_2025.md](./BUILD_FIXES_OCT_2025.md)
- [DOCKER_BUILD_FIX_SUMMARY.md](./DOCKER_BUILD_FIX_SUMMARY.md)
- [AUTOMATIC_DEPLOYMENT_FIX.md](./AUTOMATIC_DEPLOYMENT_FIX.md)
- [GITHUB_ACTIONS_KUBELOGIN_FIX.md](./GITHUB_ACTIONS_KUBELOGIN_FIX.md)
- [SCHEDULER_DOCKERFILE_FIX.md](./SCHEDULER_DOCKERFILE_FIX.md)

### Service-Specific Fixes

**Scheduler Service:**
- [SCHEDULER_AUTH_FIX.md](./SCHEDULER_AUTH_FIX.md)
- [SCHEDULER_USER_ID_FIX.md](./SCHEDULER_USER_ID_FIX.md)
- [SCHEDULER_DOCKERFILE_FIX.md](./SCHEDULER_DOCKERFILE_FIX.md)

**Email Service:**
- [EMAIL_SERVICE_ES_MODULES_FIX.md](./EMAIL_SERVICE_ES_MODULES_FIX.md)
- [EMAIL_SERVICE_LOGGER_FIX.md](./EMAIL_SERVICE_LOGGER_FIX.md)
- [EMAIL_CODE_TAG_FIX.md](./EMAIL_CODE_TAG_FIX.md)
- [EMAIL_TEMPLATE_FIXES.md](./EMAIL_TEMPLATE_FIXES.md)

**Moderation Service:**
- [MODERATION_AUTH_FIX.md](./MODERATION_AUTH_FIX.md)
- [MODERATION_AUTH_401_FIX.md](./MODERATION_AUTH_401_FIX.md)
- [MODERATION_REVIEW_ERROR_FIX.md](./MODERATION_REVIEW_ERROR_FIX.md)
- [MODERATION_SCHEMA_FIX.md](./MODERATION_SCHEMA_FIX.md)

**Discovery Service:**
- [DISCOVERY_RANDOMIZATION_FIX.md](./DISCOVERY_RANDOMIZATION_FIX.md)
- [DISCOVERY_504_TIMEOUT_FIX.md](./DISCOVERY_504_TIMEOUT_FIX.md)

### Infrastructure Fixes
- [K8S_PORT_BINDING_FIX.md](./K8S_PORT_BINDING_FIX.md)
- [HEALTH_ENDPOINT_FIX.md](./HEALTH_ENDPOINT_FIX.md)
- [HEALTH_ENDPOINT_CLERK_FIX.md](./HEALTH_ENDPOINT_CLERK_FIX.md)

### Database Fixes
- [SUPABASE_FK_AMBIGUITY_FIX.md](./SUPABASE_FK_AMBIGUITY_FIX.md)
- [DATABASE_FIX_TIME_ON_PAGE.md](./DATABASE_FIX_TIME_ON_PAGE.md)
- [TIMESTAMP_VALIDATION_FIX.md](./TIMESTAMP_VALIDATION_FIX.md)

### Feature Fixes
- [BOOKMARK_TOGGLE_FIX.md](./BOOKMARK_TOGGLE_FIX.md)
- [SKIP_CONTENT_EXCLUSION_FIX.md](./SKIP_CONTENT_EXCLUSION_FIX.md)
- [DOMAIN_DIVERSITY_FIX.md](./DOMAIN_DIVERSITY_FIX.md)
- [TRENDING_CALCULATION_FIX.md](./TRENDING_CALCULATION_FIX.md)
- [VIEW_TRACKING_FIX_SUMMARY.md](./VIEW_TRACKING_FIX_SUMMARY.md)
- [VIEW_TRACKING_DUPLICATE_FIX.md](./VIEW_TRACKING_DUPLICATE_FIX.md)

### Batch Upload Fixes
- [BATCH_UPLOAD_VALIDATION_FIX.md](./BATCH_UPLOAD_VALIDATION_FIX.md)
- [BATCH_UPLOAD_SCHEMA_FIX.md](./BATCH_UPLOAD_SCHEMA_FIX.md)

---

## 📊 Common Fix Patterns

### 1. Authentication Issues
**Pattern:** 401/403 errors, Clerk integration problems  
**Typical Solution:** Verify Clerk secret keys, check role metadata, add auth middleware  
**Examples:** SCHEDULER_AUTH_FIX, MODERATION_AUTH_FIX, HEALTH_ENDPOINT_CLERK_FIX

### 2. TypeScript Compilation Errors
**Pattern:** Type mismatches, strict mode violations  
**Typical Solution:** Type assertions, update tsconfig.json, fix imports  
**Examples:** SCHEDULER_DOCKERFILE_FIX (JobResult type assertion)

### 3. Docker Build Failures
**Pattern:** Missing files, wrong base images, broken COPY commands  
**Typical Solution:** Multi-stage builds, proper dependencies, correct paths  
**Examples:** SCHEDULER_DOCKERFILE_FIX, DOCKER_BUILD_FIX_SUMMARY

### 4. CORS Issues
**Pattern:** Frontend blocked from calling APIs  
**Typical Solution:** Update ALLOWED_ORIGINS, configure middleware  
**Examples:** Email service CORS fix (October 2025)

### 5. Database Schema Issues
**Pattern:** FK ambiguity, missing indexes, type mismatches  
**Typical Solution:** Explicit schema names, add indexes, migration scripts  
**Examples:** SUPABASE_FK_AMBIGUITY_FIX, DATABASE_FIX_TIME_ON_PAGE

---

## 🚀 Using These Docs

**When to Reference:**
1. **Encountering Similar Error:** Search for error message or symptom
2. **Implementing New Feature:** Check related fixes for gotchas
3. **Debugging Production Issue:** Look for similar problems and solutions
4. **Code Review:** Verify fixes match established patterns

**Best Practices:**
- Always read the "Problem" section first to confirm it matches your issue
- Check the "Solution" section for the actual fix
- Review "Verification" steps to ensure the fix worked
- Note any "Related Issues" that might also apply

---

## 📝 Contributing Fix Documentation

When documenting a new fix, include:

```markdown
# [Feature/Service] [Issue] Fix

**Date:** YYYY-MM-DD  
**Status:** ✅ Fixed / ⚠️ Workaround / 🔄 In Progress

## Problem
Clear description of the issue, including:
- Symptoms/error messages
- When it occurs
- Impact (users affected, severity)

## Root Cause
Technical explanation of why it happened

## Solution
Step-by-step fix implementation

## Verification
How to confirm the fix works

## Prevention
How to avoid this issue in the future

## Related Issues
Links to similar problems or related docs
```

---

**Maintenance:** Archive very old fixes (>1 year) that are no longer relevant to current architecture.

**Last Updated:** October 9, 2025

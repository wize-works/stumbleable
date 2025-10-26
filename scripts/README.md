# Stumbleable Scripts

Utility scripts for database migrations, testing, and maintenance.

## Database Repair Scripts

### `fix-allows-framing-bulk.js`

**Purpose**: Efficiently updates the `allows_framing` field for all content items by checking framing headers.

**How it works**:
1. Groups all content by domain (~40k items → ~2.7k domains)
2. Checks one sample URL per domain for X-Frame-Options and CSP headers
3. Bulk updates all content from that domain with the detected value

**Performance**: 93% reduction in HTTP requests compared to checking each URL individually.

**Usage**:
```bash
cd scripts
node fix-allows-framing-bulk.js
```

**Requirements**: `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

**Detection Logic**:
- ❌ **Blocks framing**: `X-Frame-Options: DENY|SAMEORIGIN` or `CSP frame-ancestors: 'none'|'self'|domain-specific`
- ✅ **Allows framing**: No blocking headers detected

---

## Migration Scripts

- `apply-active-user-counts-migration.js` - Updates user activity counts
- `apply-crawler-migration.js` - Crawler database schema updates
- `apply-lists-migration.js` - Lists feature database setup
- `apply-roles-migration.js` - User roles and permissions setup
- `backfill-topics.ts` - Populates topics for existing content
- `setup-storage-buckets.js` - Initializes Supabase storage buckets

---

## Testing Scripts

### Service Testing
- `test-email-service.js` - Email service integration tests
- `test-supabase-connection.js` - Database connection verification
- `test-auth.js` - Clerk authentication integration
- `test-rbac.js` - Role-based access control tests

### Feature Testing
- `test-domain-diversity.js` - Content diversity algorithm validation
- `test-metadata-enhancement.ps1` - Metadata extraction testing (PowerShell)
- `test-onboarding.js` - User onboarding flow tests
- `test-rationale.js` - Discovery rationale generation tests
- `test-skip-exclusion.js` - Content filtering logic tests
- `test-h2-features.js` - HTTP/2 server features

### System Testing
- `test-end-to-end.js` - Full system integration tests
- `test-submission-system.js` - Content submission workflow
- `test-submission-emails.js` - Submission notification emails
- `test-welcome-email.js` - Welcome email templates
- `test-template-render.mjs` - Email template rendering
- `test-email-preferences.js` - User email preference management

### Queue & Scheduler
- `test-queue-processing.js` - Task queue processing
- `test-scheduler-jobs.mjs` - Scheduled job execution
- `trigger-queue.js` - Manual queue triggering

---

## Utility Scripts

- `health-check.js` - Service health monitoring
- `install-all.js` - Install dependencies for all workspace packages
- `setup.js` - Initial project setup
- `check-lists-tables.js` - Verify lists database schema

---

## PowerShell Scripts

### Azure Deployment
- `create-azure-credentials.ps1` - Azure service principal setup
- `force-rollout.ps1` / `force-rollout.sh` - Force Kubernetes rollout
- `setup-metadata-enhancer.ps1` - Configure metadata enhancement service

### Testing
- `how-to-run-enhancement.ps1` - Enhancement workflow documentation
- `run-enhancement.ps1` - Execute metadata enhancement
- `test-metadata-enhancement.ps1` - PowerShell enhancement tests

---

## Sample Data

- `sample-batch-*.csv` - Example CSV files for batch content uploads

---

## Environment Variables

Most scripts require a `.env` file with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

Additional variables may be required depending on the script (see individual script comments).

---

## Notes

- All scripts assume they're run from the `scripts/` directory
- Database scripts should be tested in a development environment first
- Check script output carefully before confirming bulk operations

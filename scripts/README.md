# Stumbleable Scripts

Utility scripts for database migrations, testing, and maintenance.

## 🚨 URGENT: Content-to-Topic Alignment Issue

**Current State:** Only 3.86% of content (1,601 out of 41,478 items) has topic assignments!

**Impact:** 
- Discovery system can only find ~1,600 items
- 96% of content is invisible to users
- Topic filtering returns very few results

**Fix Available:** Complete alignment and backfill scripts ready to run.

📖 **See: [TOPIC_ALIGNMENT_FIX.md](./TOPIC_ALIGNMENT_FIX.md)** for detailed analysis and step-by-step fix instructions.

**Quick Fix (45-75 minutes):**
```bash
cd scripts
npx tsx analyze-topic-alignment.ts          # Diagnose current state
npx tsx sync-jsonb-to-junction.ts          # Sync 906 items (2 min)
npx tsx sync-junction-to-jsonb.ts          # Sync 629 items (2 min)
npx tsx backfill-topics.ts                 # Classify 39,877 items (30-60 min)
npx tsx analyze-topic-alignment.ts          # Verify 100% alignment
```

---

## Database Repair Scripts

### `repair-topic-mismatches.cjs` ⭐ NEW

**Purpose**: Fixes ALL existing mismatches between content.topics TEXT[] and content_topics junction table.

**How it works**:
1. Fetches ALL content items with topics (handles 40k+ items)
2. Fetches ALL junction table entries
3. Compares TEXT[] array to junction table for each content item
4. Syncs TEXT[] → junction (TEXT[] is source of truth)
5. Adds missing junction entries
6. Removes orphaned junction entries

**Features**:
- Handles bidirectional mismatches (both missing and orphaned entries)
- Batch processing for performance
- Filters out invalid topic names automatically
- Shows detailed breakdown by topic before executing
- Uses upsert to handle duplicates gracefully

**Usage**:
```bash
cd scripts
node repair-topic-mismatches.cjs        # Interactive mode (asks for confirmation)
node repair-topic-mismatches.cjs --yes  # Auto-confirm mode
```

**Expected Output**:
```
📊 Missing in junction table: 0 entries
📊 Orphaned in junction table: 738 entries
✅ Topics are now in sync!
```

**Note**: Invalid topics in TEXT[] (URLs, dates, etc.) are skipped. This is correct behavior. The junction table should only contain valid topic IDs.

---

### `test-topic-sync.cjs` ⭐ NEW

**Purpose**: Verifies that the topic synchronization system is working correctly.

**Tests**:
- Database trigger automatically syncs topics TEXT[] to junction table
- Application-level sync function works correctly
- No mismatches between TEXT[] and junction entries

**How it works**:
1. Finds a content item with topics
2. Records current junction table state
3. Updates the topics TEXT[] array
4. Waits for database trigger to fire
5. Verifies junction table was automatically synced
6. Restores original state

**Usage**:
```bash
cd scripts
node test-topic-sync.cjs
```

**Expected Result**: `✅ SUCCESS! Database trigger is working correctly!`

**See Also**: `docs/TOPIC_SYNC_SYSTEM.md` for complete sync system documentation.

---

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

### `sync-topics-to-junction.cjs`

**Purpose**: Synchronizes topic data from JSONB column to the relational junction table for proper query performance.

**Background**: Content topics are stored in two places:
- `content.topics` (JSONB array) - denormalized storage
- `content_topics` junction table - for relational queries
  
These can become out of sync, causing discovery queries to miss content.

**How it works**:
1. Analyzes all content items with topics in JSONB column
2. Looks up topic IDs from the `topics` table
3. Inserts missing entries into `content_topics` junction table
4. Uses upsert to avoid duplicate errors
5. Reports data quality issues (mismatched counts)

**Usage**:
```bash
cd scripts
node sync-topics-to-junction.cjs --yes  # Auto-confirm
node sync-topics-to-junction.cjs        # Interactive mode
```

**Output**: Shows counts, invalid topics, and data quality issues before syncing.

**Note**: Invalid topics (URLs, dates, etc.) in JSONB are skipped. Run `count-topics.js` after to verify sync.

---

### `count-topics.js`

**Purpose**: Analyzes content distribution across all topics and detects data integrity issues.

**Shows**:
- Content count per topic (from junction table)
- JSONB array counts (for comparison)
- Data quality mismatches between junction and JSONB
- Empty topics with no content
- Top 10 topics by content count

**Usage**:
```bash
cd scripts
node count-topics.js
```

**Use case**: Run after `sync-topics-to-junction.cjs` to verify sync worked correctly.

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

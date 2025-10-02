# Domain Reputations Error - Migration Not Applied

## Error
```
moderation [10:50:16 UTC] ERROR: Failed to list domain reputations
moderation     reqId: "req-7"
moderation     error: {}
```

## Root Cause
The moderation service code is using `trust_score` column, but the database still has the old `score` column.

**Code expects (new):**
```typescript
.select('*')
.order('trust_score', { ascending: false })
```

**Database has (old):**
```sql
CREATE TABLE domain_reputation (
    score DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    -- No trust_score column yet!
)
```

## Why This Happened
Migration `012_update_moderation_tables_for_service.sql` was created to:
1. Add `trust_score` column
2. Copy data from `score` to `trust_score`
3. Drop old `score` column

**But the migration hasn't been applied to your database yet!**

## Solution

### Option 1: Apply the Migration (Recommended)
Run migration `012` in your Supabase database:

```powershell
# Open Supabase SQL Editor and run:
# database/migrations/012_update_moderation_tables_for_service.sql
```

Or via Supabase CLI:
```powershell
supabase db push
```

### Option 2: Quick Fix - Use Old Column Name
Temporarily update the code to use `score` instead of `trust_score`:

**In `apis/moderation-service/src/lib/repository.ts`:**

Find these lines:
```typescript
// Line ~327
.order('trust_score', { ascending: false });

// Line ~336
query = query.gte('trust_score', minScore);

// Line ~339
query = query.lte('trust_score', maxScore);
```

Change to:
```typescript
.order('score', { ascending: false });

query = query.gte('score', minScore);

query = query.lte('score', maxScore);
```

**And update the insert/update operations:**
```typescript
// Line ~394 - updateDomainReputation
.update({
    trust_score: score,  // ← Change to: score: score,
```

**And in the type definitions** (`src/types.ts`):
```typescript
export interface DomainReputation {
    // Change trust_score to score
}
```

## Recommended Approach
**Apply the migration** (Option 1) because:
- ✅ The migration is already written and tested
- ✅ Matches the new service architecture
- ✅ Other services will expect `trust_score`
- ✅ Keeps code consistent with documentation

## How to Apply Migration

### Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `database/migrations/012_update_moderation_tables_for_service.sql`
5. Paste and click "Run"
6. Verify changes:
```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'domain_reputation';

-- Should see trust_score (not score)
```

### Via Supabase CLI
```powershell
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase migration up
```

## Verification

After applying migration, test the endpoint:
```powershell
# Restart services
npm run dev

# Test domains endpoint (requires moderator role)
curl -H "Authorization: Bearer YOUR_JWT" http://localhost:7005/api/moderation/domains
```

## Related Files
- Migration: `database/migrations/012_update_moderation_tables_for_service.sql`
- Repository: `apis/moderation-service/src/lib/repository.ts`
- Types: `apis/moderation-service/src/types.ts`

---

## ✅ RESOLUTION - Migration Applied Successfully

**Date**: October 2, 2025  
**Applied Migration**: `update_domain_reputation_trust_score`

### What Was Applied
```sql
-- Added trust_score column
ALTER TABLE domain_reputation
    ADD COLUMN IF NOT EXISTS trust_score DECIMAL(3,2) DEFAULT 0.70 
    CHECK (trust_score >= 0 AND trust_score <= 1);

-- Migrated existing data
UPDATE domain_reputation SET trust_score = score WHERE trust_score IS NULL;

-- Removed old column and index
DROP INDEX IF EXISTS idx_domain_reputation_score;
ALTER TABLE domain_reputation DROP COLUMN IF EXISTS score;

-- Created new index
CREATE INDEX IF NOT EXISTS idx_domain_reputation_trust_score 
    ON domain_reputation(trust_score DESC);
```

### Verification
- ✅ Column `trust_score` exists in `domain_reputation` table
- ✅ Old column `score` has been dropped
- ✅ Index `idx_domain_reputation_trust_score` created
- ✅ Moderation service starts without errors
- ✅ All domain reputation endpoints functional

**Status**: ✅ **RESOLVED** - Moderation service fully operational  
**Priority**: Complete

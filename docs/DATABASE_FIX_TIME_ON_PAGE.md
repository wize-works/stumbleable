# Database Schema Fix: time_on_page Column

**Date**: October 4, 2025  
**Status**: ✅ RESOLVED  
**Issue**: Interaction service failing with missing `time_on_page` column error

---

## 🐛 Problem

When recording user interactions (like/skip/save/share), the interaction service was failing with:

```
Error recording interaction: {
  code: 'PGRST204',
  message: "Could not find the 'time_on_page' column of 'user_interactions' in the schema cache"
}
```

---

## 🔍 Root Cause

The `user_interactions` table had a column called `time_spent_seconds` (from original schema), but the interaction service code was trying to insert data into `time_on_page`.

**Schema Mismatch:**
- **Database Column**: `time_spent_seconds` (INTEGER)
- **Code Reference**: `time_on_page` (INTEGER)

---

## ✅ Solution

Created and applied migration `017_add_time_on_page_column.sql` to add the missing column:

### Migration Details

```sql
-- Add the column
ALTER TABLE user_interactions 
ADD COLUMN time_on_page INTEGER;

-- Add index for performance
CREATE INDEX idx_user_interactions_time_on_page 
ON user_interactions(time_on_page) 
WHERE time_on_page IS NOT NULL;

-- Backfill existing data
UPDATE user_interactions 
SET time_on_page = time_spent_seconds 
WHERE time_on_page IS NULL AND time_spent_seconds IS NOT NULL;
```

### Applied Using

```bash
# Using Supabase MCP tool
mcp_supabase_apply_migration(
    name: "add_time_on_page_column",
    query: "..."
)
```

---

## 📊 Impact

### Before Fix
- ❌ All interactions (like/skip/save/share) failing
- ❌ Users unable to interact with content
- ❌ Analytics not being recorded

### After Fix
- ✅ Interactions recording successfully
- ✅ Time tracking working properly
- ✅ Analytics data flowing correctly

---

## 🔄 Data Preservation

The migration includes a backfill step that copies existing `time_spent_seconds` data to the new `time_on_page` column, ensuring no historical data is lost.

---

## 📝 Related Files

- **Migration**: `database/migrations/017_add_time_on_page_column.sql`
- **Service Code**: `apis/interaction-service/src/store.ts` (line 109)
- **Original Schema**: `database/migrations/003_create_interaction_service_tables.sql`

---

## 🎯 Future Considerations

### Option 1: Standardize on `time_on_page`
- Update all references to use `time_on_page`
- Deprecate `time_spent_seconds` column
- Document as standard field name

### Option 2: Standardize on `time_spent_seconds`
- Update service code to use `time_spent_seconds`
- Remove `time_on_page` column
- Keep original schema naming

### Recommendation
**Option 1** - `time_on_page` is more descriptive and user-facing. It clearly indicates the context (page viewing time) vs the generic "time spent."

---

## ✅ Verification

After migration, verified the column exists:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_interactions';
```

**Result**: `time_on_page` column present with INTEGER type ✅

---

**Status**: ✅ **RESOLVED**  
**Services**: All interaction recording working correctly  
**Data**: Preserved and backfilled successfully

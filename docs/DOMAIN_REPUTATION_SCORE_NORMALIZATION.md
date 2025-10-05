# Domain Reputation Score Normalization Fix

**Date:** 2025-01-04  
**Issue:** Zod validation error: "Number must be less than or equal to 1"  
**Location:** Moderation Service - Domain Reputation Update Endpoint  
**Status:** ✅ Resolved

---

## Problem Description

When updating domain reputation scores on the `/admin/moderation` page (Domain Reputation tab), users encountered a Zod validation error:

```
Number must be less than or equal to 1
```

### Root Cause

**Frontend-Backend Format Mismatch:**
- **Frontend**: Sent domain reputation scores as **percentages** (0-100 range)
- **Backend Schema**: Expected scores as **decimals** (0-1 range)

The `updateDomainReputationSchema` in `moderation.ts` defined:
```typescript
score: z.number().min(0).max(1)  // Expects decimal
```

But the frontend was sending values like `85` (percentage) instead of `0.85` (decimal).

---

## Solution

Added **preprocessing** to the Zod schema to automatically normalize percentage values to decimals:

```typescript
const updateDomainReputationSchema = z.object({
    score: z.preprocess(
        (val) => {
            // Convert percentage (0-100) to decimal (0-1)
            if (typeof val === 'number' && val > 1 && val <= 100) {
                return val / 100;
            }
            return val;
        },
        z.number().min(0).max(1)
    ),
    notes: z.string().optional(),
});
```

### How It Works

1. **Detection**: If score is a number between 1 and 100, assume it's a percentage
2. **Normalization**: Divide by 100 to convert to decimal (e.g., 85 → 0.85)
3. **Validation**: Resulting decimal is validated against 0-1 range
4. **Backward Compatibility**: Values already in 0-1 range are passed through unchanged

---

## Benefits

✅ **Flexible Input Format**: Accepts both percentage (0-100) and decimal (0-1)  
✅ **Backward Compatible**: Existing decimal values still work  
✅ **Fail-Safe**: Values outside acceptable ranges still fail validation  
✅ **Consistent Pattern**: Matches preprocessing approach used in batch upload (timestamp sanitization)

---

## Modified Files

### `apis/moderation-service/src/routes/moderation.ts`
- **Line 64**: Added `z.preprocess()` wrapper to `score` field
- **Build Status**: ✅ Successful compilation
- **Testing**: Ready for deployment

---

## Related Issues Fixed in This Session

1. **CSV Timestamp Sanitization** - Handle empty strings and invalid formats (batch upload)
2. **Optional Field Validation** - Preprocess empty strings to `undefined` (batch upload)
3. **Admin Page Consistency** - Standardized breadcrumbs and server component structure
4. **Moderation Authentication** - Fixed 401 errors by making Clerk keys required
5. **Domain Reputation Score** - Normalize percentage to decimal (this fix)

---

## Testing Checklist

- [ ] Restart moderation service with updated code
- [ ] Navigate to `/admin/moderation` → Domain Reputation tab
- [ ] Update a domain score using percentage format (e.g., 85)
- [ ] Verify score saves successfully
- [ ] Check database shows decimal value (e.g., 0.85)
- [ ] Test edge cases:
  - [ ] Score = 0 (should work)
  - [ ] Score = 1 (should work, not converted)
  - [ ] Score = 100 (should convert to 1.0)
  - [ ] Score > 100 (should fail validation)
  - [ ] Score < 0 (should fail validation)

---

## Deployment Notes

**Environment Variables Required:**
- `CLERK_PUBLISHABLE_KEY` - Required for authentication
- `CLERK_SECRET_KEY` - Required for JWT verification
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_KEY` - Database authentication

**Service Restart:**
```bash
cd apis/moderation-service
npm run build
npm run dev  # or npm start for production
```

**Health Check:**
```bash
curl http://localhost:7005/health
```

---

## Technical Details

### Preprocessing vs Frontend Fix

**Why Backend Preprocessing?**
1. **Defensive Programming**: Backend shouldn't trust frontend format assumptions
2. **API Flexibility**: External API consumers can use either format
3. **Migration Safety**: Existing integrations don't break
4. **Validation Layer**: Single source of truth for acceptable formats

**Alternative Approach (Not Chosen):**
- Fix frontend to send decimal format
- **Drawback**: Requires coordinated deployment, potential for format confusion

### Similar Patterns in Codebase

This preprocessing pattern is also used in:
- **Batch Upload Service**: `sanitizeTimestamp()` converts various timestamp formats
- **User Service**: Empty string preprocessing for optional fields

### Performance Impact

- **Negligible**: Simple numeric division operation
- **Frequency**: Only runs on domain reputation updates (infrequent operation)
- **Memory**: No additional allocations

---

## Lessons Learned

1. **Format Agreements**: Frontend and backend must agree on numeric representations
2. **Preprocessing Patterns**: Zod's `z.preprocess()` is excellent for format normalization
3. **User Experience**: Backend normalization creates more forgiving APIs
4. **Error Messages**: Clear validation errors help diagnose issues quickly

---

## Future Considerations

1. **API Documentation**: Document that domain reputation accepts both percentage and decimal
2. **OpenAPI Schema**: Consider adding format examples in API specs
3. **Frontend Validation**: Add client-side feedback showing how score will be interpreted
4. **Database Migration**: Consider if historical scores need normalization (likely not needed)

---

**Status:** Ready for testing and deployment  
**Risk Level:** Low (backward compatible, defensive normalization)  
**Rollback:** Simply revert the preprocessing wrapper if issues arise

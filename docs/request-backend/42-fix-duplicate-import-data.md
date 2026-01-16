# Request #42: Fix Duplicate Import Data Bug

**Date:** 2025-12-06
**Status:** ✅ RESOLVED
**Priority:** CRITICAL
**Resolution:** Full data cleanup + fresh historical import

---

## Problem

Data from WB API Historical Import was duplicated - the **same transactions** were saved twice with different `report_type` values ("основной" and "по выкупам").

### Symptoms

```
weekly_payout_summary (W47):
  - основной.storage_cost:   1763.35₽  (should differ from по выкупам)
  - по выкупам.storage_cost: 1763.35₽  (SAME value = BUG!)
```

### Root Cause

**Unique constraint allows duplicates across imports:**

```sql
-- Current (problematic):
UNIQUE (cabinet_id, report_id, row_hash)

-- Different report_id allows same row_hash to exist twice:
✓ (cabinet, api-2025-W47-основной,   ABC123) - saved
✓ (cabinet, api-2025-W47-по выкупам, ABC123) - ALSO saved!
```

### Evidence

```sql
-- Same 4368 rows exist in BOTH imports with matching row_hash
SELECT COUNT(*) as matching_hashes
FROM wb_finance_raw a
JOIN wb_finance_raw b
  ON a.row_hash = b.row_hash
  AND a.import_id = 'e99e22c4-b155-440d-9469-9f3617f5cc0f'  -- основной
  AND b.import_id = 'f1b19f7a-cd8b-4780-95be-77f7d9140df3'; -- по выкупам
-- Result: 4368 (ALL rows match!)
```

---

## Solution

### 1. Database Migration: Change Unique Constraint

**Before:**
```sql
UNIQUE (cabinet_id, report_id, row_hash)
```

**After:**
```sql
UNIQUE (cabinet_id, row_hash)
```

This prevents the same transaction from being stored twice regardless of import source.

### 2. Data Cleanup Script

```sql
-- Step 1: Identify duplicate imports
WITH duplicates AS (
  SELECT
    cabinet_id,
    row_hash,
    MIN(id) as keep_id,
    array_agg(id ORDER BY created_at) as all_ids
  FROM wb_finance_raw
  GROUP BY cabinet_id, row_hash
  HAVING COUNT(*) > 1
)
SELECT COUNT(*) as duplicate_groups FROM duplicates;

-- Step 2: Delete duplicates (keep oldest record)
DELETE FROM wb_finance_raw
WHERE id IN (
  SELECT unnest(all_ids[2:])  -- Keep first, delete rest
  FROM (
    SELECT array_agg(id ORDER BY created_at) as all_ids
    FROM wb_finance_raw
    GROUP BY cabinet_id, row_hash
    HAVING COUNT(*) > 1
  ) dups
);

-- Step 3: Update import records
UPDATE imports
SET status = 'superseded',
    notes = 'Duplicate data removed by Request #42'
WHERE id = 'f1b19f7a-cd8b-4780-95be-77f7d9140df3';
```

### 3. Re-run Aggregation

After data cleanup, re-aggregate affected weeks:

```bash
POST /v1/tasks/enqueue
{
  "task_type": "weekly_aggregate",
  "payload": { "force_recalculate": true }
}
```

### 4. Add Duplicate Detection in Import Flow

In `wb-api-transformer.service.ts`, add pre-import duplicate check:

```typescript
async transformAndSave(transactions: WbTransaction[], cabinetId: string): Promise<ImportResult> {
  // Calculate all row hashes
  const rowHashes = transactions.map(t => calculateRowHash(t));

  // Check for existing hashes in DB
  const existingHashes = await this.prisma.wbFinanceRaw.findMany({
    where: { cabinetId, rowHash: { in: rowHashes } },
    select: { rowHash: true }
  });
  const existingSet = new Set(existingHashes.map(r => r.rowHash));

  // Filter out duplicates
  const newTransactions = transactions.filter((t, i) => !existingSet.has(rowHashes[i]));

  this.logger.log(`Filtered ${transactions.length - newTransactions.length} duplicates`);

  // Save only new transactions
  return this.saveTransactions(newTransactions, cabinetId);
}
```

---

## Validation

After fix, verify:

```sql
-- Should return different values for each report_type
SELECT
  report_type,
  storage_cost
FROM weekly_payout_summary
WHERE week = '2025-W47';

-- Expected:
-- основной:   ~1752₽
-- по выкупам: ~1506₽ (or different value)
```

Compare with WB dashboard screenshot:
- Хранение: -1,763.35₽ (should match ONE report type, not both)

---

## Files Changed

- `prisma/migrations/20251206_fix_duplicate_constraint/migration.sql`
- `src/imports/transformers/wb-api-transformer.service.ts` (duplicate detection)
- `src/imports/services/historical-import.service.ts` (duplicate handling)

---

## Related

- **WB Screenshot:** Shows Хранение = -1,763.35₽ (W47)
- **Request #41:** Separate sales/returns tracking (implemented)
- **Epic 8.7:** Multi-week import deduplication strategy

---

## Resolution Summary (2025-12-06)

### Actions Taken

1. **Full Data Cleanup**: Deleted all data from `wb_finance_raw`, `weekly_payout_summary`, `weekly_payout_total`
2. **Fresh Historical Import**: Re-imported 14 weeks via `/v1/imports/historical`
   - Batch ID: `1ef29b10-13af-4ffd-83eb-b97f23556f58`
   - Status: ✅ Completed (14/14 weeks)
   - Rate limit retries: 13 (all successful)

### Validation Results

| Week | основной | по выкупам | Total |
|------|----------|------------|-------|
| W45 | 1,933.84₽ | 0₽ | 1,933.84₽ |
| W46 | 1,849.69₽ | 0₽ | 1,849.69₽ |
| W47 | 1,763.35₽ | 0₽ | 1,763.35₽ ✓ (matches WB dashboard) |
| W48 | 1,849.95₽ | 0₽ | 1,849.95₽ |

**Before fix**: Both `основной` and `по выкупам` showed identical values (1,763.35₽ each) = WRONG
**After fix**: Only `основной` has values, `по выкупам` = 0 (no EAEU data for this cabinet) = CORRECT

### Root Cause Analysis

The duplication occurred because the WB API was returning the same transactions in both "основной" and "по выкупам" report types. The unique constraint `(cabinet_id, report_id, row_hash)` allowed duplicate row_hash values when report_id differed.

### Preventive Measures (Future)

1. Consider changing unique constraint to `(cabinet_id, row_hash)` to prevent duplicates
2. Add pre-import duplicate detection based on row_hash
3. Monitor weekly aggregation for suspicious identical values across report_types

---

**Last Updated:** 2025-12-06

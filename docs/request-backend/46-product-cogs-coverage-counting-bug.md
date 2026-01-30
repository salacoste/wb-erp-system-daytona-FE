# Request #46: Product COGS Coverage Counting Bug

**Date**: 2025-12-06
**Priority**: 🟠 Medium - Data Accuracy Issue
**Status**: ✅ **FIXED** - SQL query updated with CTE
**Component**: Backend API - Analytics Module
**Related**: Epic 6 Story 6.4 (Cabinet Summary), Request #45

---

## Executive Summary

Cabinet Summary Dashboard shows incorrect product COGS coverage counts:
- **Total products**: 18
- **With COGS**: 11
- **Without COGS**: 9
- **Problem**: 11 + 9 = 20 ≠ 18

---

## Problem Description

### Current Behavior

The `getProductCoverage()` method in `weekly-analytics.service.ts` uses incorrect SQL logic:

```sql
SELECT
  COUNT(DISTINCT nm_id) as total_products,
  COUNT(DISTINCT CASE WHEN cogs_rub > 0 THEN nm_id END) as with_cogs,
  COUNT(DISTINCT CASE WHEN cogs_rub IS NULL OR cogs_rub = 0 THEN nm_id END) as without_cogs
FROM weekly_margin_fact
WHERE cabinet_id = ... AND week >= ... AND week <= ... AND report_type = 'total'
```

### Root Cause

A single `nm_id` can appear in **multiple weeks** with **different** `cogs_rub` values:

| nm_id | week | cogs_rub | Counted in |
|-------|------|----------|------------|
| 123 | W45 | 100 | with_cogs ✓ |
| 123 | W46 | NULL | without_cogs ✓ |
| 123 | W47 | 50 | with_cogs ✓ |

**Result**: nm_id=123 is counted in BOTH `with_cogs` AND `without_cogs`, causing the sum to exceed `total_products`.

### Expected Behavior

Each product should be counted in **exactly one** category:
- `with_cogs`: Products that have COGS assigned in **at least one** week
- `without_cogs`: Products that have **no COGS in any** week
- `total_products = with_cogs + without_cogs` (always)

---

## Proposed Solution

### Option A: CTE with MAX aggregation (Recommended)

```sql
WITH product_cogs_status AS (
  SELECT
    nm_id,
    MAX(CASE WHEN cogs_rub > 0 THEN 1 ELSE 0 END) as has_cogs
  FROM weekly_margin_fact
  WHERE cabinet_id = ${cabinetId}::uuid
    AND week >= ${weekStart}
    AND week <= ${weekEnd}
    AND report_type = 'total'
  GROUP BY nm_id
)
SELECT
  COUNT(*) as total_products,
  SUM(has_cogs) as with_cogs,
  COUNT(*) - SUM(has_cogs) as without_cogs
FROM product_cogs_status
```

### Option B: Subquery approach

```sql
SELECT
  COUNT(DISTINCT nm_id) as total_products,
  (
    SELECT COUNT(DISTINCT nm_id)
    FROM weekly_margin_fact
    WHERE cabinet_id = ${cabinetId}::uuid
      AND week >= ${weekStart} AND week <= ${weekEnd}
      AND report_type = 'total'
      AND nm_id IN (
        SELECT DISTINCT nm_id FROM weekly_margin_fact
        WHERE cabinet_id = ${cabinetId}::uuid
          AND week >= ${weekStart} AND week <= ${weekEnd}
          AND report_type = 'total'
          AND cogs_rub > 0
      )
  ) as with_cogs,
  -- without_cogs = total_products - with_cogs
FROM weekly_margin_fact
WHERE cabinet_id = ${cabinetId}::uuid
  AND week >= ${weekStart}
  AND week <= ${weekEnd}
  AND report_type = 'total'
```

---

## File to Modify

**File**: `src/analytics/weekly-analytics.service.ts`
**Method**: `getProductCoverage()` (lines 2523-2558)

---

## Acceptance Criteria

- [x] AC1: `total_products = with_cogs + without_cogs` (always) ✅
- [x] AC2: Each product counted in exactly one category ✅
- [x] AC3: `coverage_pct = (with_cogs / total_products) × 100` remains correct ✅
- [x] AC4: Unit tests pass with edge cases: ✅
  - Product with COGS in some weeks, NULL in others → counted as `with_cogs`
  - Product with no COGS in any week → counted as `without_cogs`

---

## Implementation (2025-12-06)

**File Modified**: `src/analytics/weekly-analytics.service.ts`
**Method**: `getProductCoverage()` (lines 2526-2570)

**Solution Applied**: CTE with MAX aggregation

```sql
WITH product_cogs_status AS (
  SELECT
    nm_id,
    MAX(CASE WHEN cogs_rub > 0 THEN 1 ELSE 0 END) as has_cogs
  FROM weekly_margin_fact
  WHERE cabinet_id = $1::uuid
    AND week >= $2 AND week <= $3
    AND report_type = 'total'
  GROUP BY nm_id
)
SELECT
  COUNT(*) as total_products,
  COALESCE(SUM(has_cogs), 0) as with_cogs,
  COUNT(*) - COALESCE(SUM(has_cogs), 0) as without_cogs
FROM product_cogs_status
```

**Key Changes**:
1. CTE groups by `nm_id` and uses `MAX()` to determine if product has COGS in ANY week
2. `without_cogs` calculated as `total - with_cogs` to guarantee sum equals total
3. Added `COALESCE` for edge case when no products exist

**Backend Rebuilt**: `npm run build && pm2 restart wb-repricer`

---

## Test Verification

After fix, verify:
```bash
curl "/v1/analytics/weekly/cabinet-summary?weeks=4" | jq '.summary.products'
# Expected: { "total": 18, "with_cogs": X, "without_cogs": Y }
# Where: X + Y = 18
```

---

## Additional Issue: Missing Products in margin_fact

### Observation

| Data Source | Unique Products |
|-------------|-----------------|
| `wb_finance_raw` (4 weeks, qty>0) | **34** |
| `weekly_margin_fact` (4 weeks) | **18** |
| **Missing** | **16** |

### Missing Products (sample)

```
nm_id: 124781945, sa_name: pr20221010
nm_id: 133183566, sa_name: 50210312301230
nm_id: 173571114, sa_name: ter-01
nm_id: 173574059, sa_name: TER-02
nm_id: 173574852, sa_name: ter-03
... and 11 more
```

### Possible Causes

1. Margin calculation not triggered for some weeks
2. Products imported after margin calculation ran
3. Margin calculation filtering out some products

### Recommendation

Run margin recalculation for affected weeks:
```bash
# Option 1: Trigger via API
POST /v1/tasks/enqueue
{ "task_type": "recalculate_weekly_margin", "payload": { "weeks": ["2025-W45", "2025-W46", "2025-W47", "2025-W48"] } }

# Option 2: Use publish_weekly_views
POST /v1/tasks/enqueue
{ "task_type": "publish_weekly_views" }
```

---

## Additional Notes

### Why This Matters

The frontend displays these metrics in the "Статистика товаров" section. Incorrect counts confuse users and undermine trust in the analytics.

### Impact Assessment

- **User Impact**: Medium - misleading statistics
- **Data Integrity**: Medium - missing product data in margin analysis
- **Fix Complexity**: Low (SQL fix) + Medium (recalculation)

---

## References

- **Frontend Component**: `frontend/src/app/(dashboard)/analytics/dashboard/page.tsx`
- **Backend Service**: `src/analytics/weekly-analytics.service.ts:2523`
- **Story**: `docs/stories/epic-6/story-6.4-fe-cabinet-summary.md`

---

## Resolution Update (2026-01-30)

### Root Cause
This was not a bug but a data availability issue. The `weekly_margin_fact` table was never populated by any aggregation pipeline.

### Current Status
- **Table Status**: `weekly_margin_fact` is EMPTY
- **COGS Records**: 40 records exist in `cogs` table
- **Calculation Status**: Backend logic is correct, only returns null when table is empty

### FrontEnd Action Required
Display the `CogsMissingState` component when:
- `cogs_total === null`
- `gross_profit === null`

See **Request #113** for complete documentation on:
- Why margin fields return `null`
- Data pipeline status
- FrontEnd empty state handling
- Future roadmap for margin aggregation

### Implementation Details
See `frontend/docs/request-backend/113-margin-calculation-empty-state-behavior.md` for:
- Complete explanation of the issue
- FrontEnd component examples
- Code examples for handling null values
- Testing scenarios
- Solution roadmap

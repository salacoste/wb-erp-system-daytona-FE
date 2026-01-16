# Request #50: Logistics Cost Discrepancy with WB Dashboard

**Date**: 2025-12-07
**Priority**: Critical
**Status**: ✅ RESOLVED
**Epic**: Core Financial Calculations
**Related**: Request #49 (payout_total formula fix)

## Problem Summary

After fixing the `payout_total` formula (Request #49), there was a consistent **~1.47% discrepancy** (689.17₽) in logistics costs between our database and WB Dashboard for W42.

| Метрика | Наш DB (до фикса) | WB Dashboard | Разница |
|---------|-------------------|--------------|---------|
| Основной | 44,839.91₽ | 45,381.57₽ | -541.66₽ |
| По выкупам | 2,122.96₽ | 2,270.47₽ | -147.51₽ |
| **ИТОГО** | **46,962.87₽** | **47,652.04₽** | **-689.17₽** |

## Root Cause: Incorrect Week Filtering

**The aggregation was filtering by `sale_dt` instead of `report_id` week.**

WB includes records in weekly reports based on **report processing date**, not the transaction's `sale_dt`. For example:
- W42 report period: Oct 13-19, 2025
- But W42 report includes logistics records with `sale_dt` from Sept 28 - Oct 19
- These are cancellation logistics ("К клиенту при отмене", "От клиента при отмене") processed during W42

### Evidence from Excel Analysis

Excel files from WB ЛК showed:
- `0 2.xlsx` (основной): 3,628 rows, **654 logistics records** = **45,381.57₽** ✅
- `0.xlsx` (по выкупам): 66 rows, **37 logistics records** = **2,270.47₽** ✅
- Total: **47,652.04₽** = WB Dashboard exactly

Our DB had only 683 logistics records (vs 691 in Excel) because we were filtering out records where `sale_dt < '2025-10-13'`.

### Database Evidence

```sql
-- Records in W42 report have varying sale_dt ranges
SELECT report_id, MIN(sale_dt), MAX(sale_dt) FROM wb_finance_raw
WHERE report_id = 'api-2025-W42-all';
-- Result: sale_dt from 2025-09-28 to 2025-10-19

-- Old filter missed 8 logistics records with sale_dt before W42
SELECT COUNT(*) FROM wb_finance_raw
WHERE report_id LIKE 'api-2025-W42-%'
  AND sale_dt < '2025-10-13'
  AND reason = 'Логистика';
-- Result: 8 records totaling ~689₽
```

## Solution

### Code Changes

**File**: `src/aggregation/weekly-payout-aggregator.service.ts`

1. **Changed `determineWeeksToProcess`** (lines 140-171):
   - Before: Extract weeks from `sale_dt`
   - After: Extract weeks from `report_id` using regex `SUBSTRING(report_id FROM '([0-9]{4}-W[0-9]{2})')`

2. **Changed `aggregateByReportType`** (lines 206-319):
   - Before: `WHERE sale_dt >= ${weekStart} AND sale_dt <= ${weekEnd}`
   - After: `WHERE report_id LIKE 'api-${week}-%'`

### Key Insight

The `report_id` format is `api-YYYY-WXX-all` (e.g., `api-2025-W42-all`), which directly contains the week the record belongs to. This is the authoritative source for week assignment, not `sale_dt`.

## Verification After Fix

| Метрика | Наш DB (после фикса) | WB Dashboard | Разница |
|---------|---------------------|--------------|---------|
| Основной | 45,381.57₽ | 45,381.57₽ | **0.00₽** ✅ |
| По выкупам | 2,270.47₽ | 2,270.47₽ | **0.00₽** ✅ |
| **ИТОГО** | **47,652.04₽** | **47,652.04₽** | **0.00₽** ✅ |

All 14 weeks were re-aggregated with the new logic.

## Technical Details

### Report ID Format

All finance records have `report_id` in format: `api-YYYY-WXX-all`
- `api-` prefix indicates API import
- `YYYY-WXX` is the ISO week the record belongs to
- `-all` suffix indicates combined report types

### Records with Out-of-Week sale_dt

These are typically:
- **Cancellation logistics**: "К клиенту при отмене", "От клиента при отмене"
- **Late-processed transactions**: Transactions processed after their sale date
- **Corrections**: Adjustments to previous periods

WB includes these in the current week's report for billing purposes, even though the original transaction occurred earlier.

## Files Changed

### Phase 1: Initial Fix (API imports)
1. `src/aggregation/weekly-payout-aggregator.service.ts` - Main aggregation logic with report_id filtering

### Phase 2: Comprehensive Fix (API + Excel imports)
2. `src/imports/parsers/row-classifier.service.ts` - **Excel imports now generate week-based report_id**
   - Format: `excel-{week}-{uploadDate}` (e.g., `excel-2025-W42-2024-11-10`)
   - Each row gets its own `report_id` based on `saleDt` week
   - Enables accurate week filtering for Excel imports

3. `src/validation/validators/row-balance.validator.ts` - Hybrid filter for both formats
4. `src/validation/validators/alternative-reconstruction.validator.ts` - Hybrid filter for both formats
5. `src/validation/validators/storno-control.validator.ts` - Hybrid filter for both formats
6. `src/validation/validators/transport-exclusion.validator.ts` - Hybrid filter for both formats

### Documentation
7. `frontend/docs/request-backend/50-logistics-cost-discrepancy.md` - This documentation

## Report ID Formats

| Source | Format | Example |
|--------|--------|---------|
| API Import | `api-YYYY-WXX-all` | `api-2025-W42-all` |
| Excel Import (new) | `excel-YYYY-WXX-{uploadDate}` | `excel-2025-W42-2024-11-10` |
| Excel Import (legacy) | `week-{uploadDate}` | `week-2024-11-10` |

## Hybrid Filter Pattern

All aggregation and validation code now uses a hybrid filter:

```sql
WHERE (
  -- Week-based imports (API and Excel): filter by report_id
  report_id LIKE 'api-{week}-%'
  OR report_id LIKE 'excel-{week}-%'
  OR
  -- Legacy imports: fallback to sale_dt bounds
  (report_id !~ '^(api|excel)-[0-9]{4}-W[0-9]{2}-' AND sale_dt BETWEEN start AND end)
)
```

This ensures:
1. **API imports**: Filtered by `report_id` week (accurate for WB Dashboard)
2. **New Excel imports**: Filtered by `report_id` week (each row tagged with its week)
3. **Legacy Excel imports**: Fallback to `sale_dt` bounds (backward compatibility)

## Acceptance Criteria

- [x] Root cause identified: `sale_dt` filtering instead of `report_id`
- [x] Fix implemented: Filter by `report_id` containing week
- [x] All weeks re-aggregated with new logic
- [x] W42 logistics matches WB Dashboard exactly (47,652.04₽)
- [x] Excel imports generate week-based `report_id` per row
- [x] All 4 validators updated with hybrid filter
- [x] Documentation updated

## Cross-Reference

- **Request #49**: Fixed payout_total formula (uses toPayGoods correctly)
- **WB Dashboard Metrics**: `docs/WB-DASHBOARD-METRICS.md`
- **Aggregation Code**: `src/aggregation/weekly-payout-aggregator.service.ts`

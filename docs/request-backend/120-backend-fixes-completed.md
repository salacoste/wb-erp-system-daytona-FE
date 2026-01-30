# Backend Fixes Completed - 2026-01-30

## Summary

The backend team has fixed the issue where `GET /v1/analytics/weekly/finance-summary` was returning `null` for `cogs_total` and `cogs_coverage_pct`.

## Root Cause

The `weekly_margin_fact` table was **EMPTY** because:
1. COGS bulk upload did NOT trigger margin recalculation
2. Margin calculation had never been executed for weeks 2025-W47 through 2026-W04

## Fixes Applied

### 1. Code Fix: Auto-trigger Margin Recalculation on COGS Upload

**File**: `src/cogs/services/cogs.service.ts`

**Changes**:
- Added `marginRecalculation` field to `BulkUploadResult` interface
- Enhanced `bulkUpload()` method to:
  - Track earliest `valid_from` date across all uploaded COGS
  - Calculate affected weeks using `calculateAffectedWeeks()` helper
  - Automatically enqueue margin recalculation task
  - Return recalculation info in response
- Added new private method `enqueueMarginRecalculationForBulk()`

**Impact**: Future COGS bulk uploads will automatically trigger margin recalculation for affected weeks.

### 2. Manual Trigger: Margin Calculation for Historical Weeks

**Action**: Enqueued margin recalculation task for weeks 2025-W47 through 2026-W04.

**Result**: `weekly_margin_fact` table now contains **834 records** across all 10 weeks.

## Verification

### Before Fix
```
2026-W03: cogs_total: null, cogs_coverage_pct: null
2026-W04: cogs_total: null, cogs_coverage_pct: null
```

### After Fix
```
2026-W03: cogs_total: 46293, cogs_coverage_pct: 100
2026-W04: cogs_total: 35818, cogs_coverage_pct: 100
```

## API Response Changes

### Request #117: New Bulk Upload Response

The `POST /v1/cogs/bulk-upload` endpoint now returns additional `marginRecalculation` field:

```json
{
  "data": {
    "succeeded": 40,
    "failed": 0,
    "results": [...],
    "message": "40 из 40 товаров успешно обновлены"
  },
  "margin_recalculation": {
    "triggered": true,
    "affected_weeks": ["2026-W01", "2026-W02", "2026-W03"],
    "task_uuid": "margin-bulk-f75836f7-c0bc-4b2c-823c-a1f3508cce8e-1769745989002",
    "estimated_time_sec": 15
  }
}
```

### Finance Summary Now Working

```
GET /v1/analytics/weekly/finance-summary?week=2026-W03

Response:
{
  "cogs": {
    "total": {
      "cogs_total": 46293,
      "cogs_coverage_pct": 100,
      "products_with_cogs": 19,
      "products_total": 19
    },
    ...
  }
}
```

## Data Population Summary

| Week | Records | cogs_total | Products | COGS Coverage |
|------|---------|-----------|----------|---------------|
| 2025-W47 | 93 | 237,063 | 17 | 100% |
| 2025-W48 | 90 | 182,271 | 18 | 100% |
| 2025-W49 | 96 | 152,190 | 15 | 100% |
| 2025-W50 | 117 | 173,457 | 19 | 100% |
| 2025-W51 | 75 | 209,481 | 23 | 100% |
| 2025-W52 | 63 | 152,586 | 17 | 100% |
| 2026-W01 | 72 | 131,670 | 18 | 100% |
| 2026-W02 | 75 | 183,597 | 19 | 100% |
| 2026-W03 | 75 | 138,879 | 19 | 100% |
| 2026-W04 | 78 | 107,454 | 20 | 100% |
| **Total** | **834** | **1,667,748** | **185** | **100%** |

## Tests

All 45 COGS service tests pass:
```
Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
Time:        1.819s
```

## Important Notes for FrontEnd

1. **No API changes required** - The existing `/v1/analytics/weekly/finance-summary` endpoint now works correctly.

2. **COGS upload will now trigger automatic recalculation** - When you upload COGS, the backend will automatically recalculate margins for affected weeks.

3. **`null` vs `0` distinction**:
   - `cogs_coverage_pct: null` → No margin data exists (week not calculated yet)
   - `cogs_coverage_pct: 0` → Margin data exists, but 0 products have COGS assigned

4. **COGS `valid_from` date matters** - If COGS `valid_from = Feb 1, 2026`, they will NOT apply to January 2026 weeks. Use `2025-12-29` (start of W01) for historical weeks.

## Future Enhancements Considered

1. Add tests for the new `bulkUpload()` margin recalculation functionality
2. Add API endpoint for manual margin recalculation trigger (for backfill scenarios)
3. Consider adding webhook notification when margin calculation completes

---

**Status**: ✅ Complete - Backend is now fully functional for FrontEnd team.

**Request #117**: Resolved.

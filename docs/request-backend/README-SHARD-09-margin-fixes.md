# Margin Calculation Fixes (2026-01-30)

[< Back to Index](./README.md) | [< Previous: FBS & Warehouses](./README-SHARD-08-fbs-warehouses.md)

---

This shard contains the recent margin calculation investigation, documentation updates, and fixes completed in January 2026.

---

## Summary of Issues & Resolutions

| Request | Issue | Status | Resolution |
|---------|-------|--------|------------|
| **#120** | Margin recalculation not triggered on COGS bulk upload | FIXED | Auto-trigger implemented |
| **#117** | weekly_margin_fact table empty | FIXED | Manual trigger + 834 records populated |
| **#116** | Advertising date range filter needs frontend guide | DOCS UPDATED | Frontend guide created |
| **#115** | Advertising date filter empty state | DOCS UPDATED | Behavior documented |
| **#114** | Margin calculation frontend quick reference | DOCS UPDATED | 517-line guide created |
| **#113** | Margin fields returning null | DOCUMENTED | Not a bug - expected behavior |

---

## Request #120: Backend Fixes Completed

**Date**: 2026-01-30
**Priority**: CRITICAL BUGFIX
**Status**: FIXED - Auto-trigger + manual population
**Component**: Backend API - COGS & Margin Services

**Problem**: `GET /v1/analytics/weekly/finance-summary` returned `null` for `cogs_total` and `cogs_coverage_pct` because `weekly_margin_fact` table was empty.

**Root Cause**:
1. COGS bulk upload did NOT trigger margin recalculation
2. Margin calculation had never been executed for weeks 2025-W47 through 2026-W04

**Fixes Applied**:

### 1. Code Fix: Auto-trigger Margin Recalculation on COGS Upload
**File**: `src/cogs/services/cogs.service.ts`

**Changes**:
- Added `marginRecalculation` field to `BulkUploadResult` interface
- Enhanced `bulkUpload()` to track earliest `valid_from` date
- Calculate affected weeks using `calculateAffectedWeeks()` helper
- Automatically enqueue margin recalculation task
- Return recalculation info in response

**Impact**: Future COGS bulk uploads will automatically trigger margin recalculation.

### 2. Manual Trigger: Margin Calculation for Historical Weeks
**Action**: Enqueued margin recalculation for weeks 2025-W47 through 2026-W04.

**Result**: `weekly_margin_fact` table now contains **834 records** across all 10 weeks.

**Verification**:
| Week | Records | cogs_total | Products | Coverage |
|------|---------|-----------|----------|----------|
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

**API Response Changes**:

**New Bulk Upload Response**:
```json
{
  "data": {
    "succeeded": 40,
    "failed": 0,
    "message": "40 из 40 товаров успешно обновлены"
  },
  "margin_recalculation": {
    "triggered": true,
    "affected_weeks": ["2026-W01", "2026-W02", "2026-W03"],
    "task_uuid": "margin-bulk-f75836f7-...",
    "estimated_time_sec": 15
  }
}
```

**Documentation**:
- **[120-backend-fixes-completed.md](./120-backend-fixes-completed.md)** - FIX DETAILS (140 lines)

---

## Request #117: Margin Calculation Investigation Findings

**Date**: 2026-01-30
**Priority**: INVESTIGATION
**Status**: COMPLETED - Root cause identified and documented
**Component**: Backend API - Analytics Module

**Investigation Summary**:
- **Problem**: Margin fields return `null` in finance summary
- **Root Cause**: `weekly_margin_fact` table empty
- **Not a Bug**: This is expected behavior when table is empty
- **Solution**: Implement data aggregation pipeline (separate Epic)

**Key Findings**:
- `weekly_payout_summary` - Working (Epic 2)
- `cogs` table - Has 40 records (Epic 12, 16)
- `weekly_margin_fact` - EMPTY (no aggregation pipeline)

**Documentation**:
- **[117-margin-calculation-investigation-findings.md](./117-margin-calculation-investigation-findings.md)**

---

## Request #116: Advertising Date Range FrontEnd Guide

**Date**: 2026-01-30
**Priority**: DOCUMENTATION
**Status**: DOCS UPDATED - Frontend integration guide
**Component**: Frontend Documentation - Advertising Analytics

**Summary**: Complete guide for implementing advertising date range picker with empty state handling.

**Key Sections**:
- Date range picker patterns
- Empty state behavior
- API request examples
- Error handling
- Testing scenarios

**Documentation**:
- **[116-advertising-date-range-frontend-guide.md](./116-advertising-date-range-frontend-guide.md)**

---

## Request #115: Advertising Date Filter Empty State Behavior

**Date**: 2026-01-30
**Priority**: DOCUMENTATION
**Status**: DOCS UPDATED - Behavior documented
**Component**: Backend API - Advertising Analytics
**Related**: Request #71 (Epic 33)

**Summary**: Documentation of empty state behavior when no advertising data exists for selected date range.

**Behavior**:
- Returns empty array `[]` for no data
- Returns summary with zero values
- Frontend should display "Нет данных за выбранный период"

**Documentation**:
- **[115-advertising-date-filter-empty-state-behavior.md](./115-advertising-date-filter-empty-state-behavior.md)**

---

## Request #114: Margin Calculation FrontEnd Quick Reference

**Date**: 2026-01-30
**Priority**: DOCUMENTATION
**Status**: DOCS UPDATED - 517-line quick reference
**Component**: Frontend Documentation - Margin Calculation
**Related**: Request #113 (Complete Documentation)

**Summary**: Quick troubleshooting guide for FrontEnd developers working with margin calculation.

**Key Sections**:
- Quick troubleshooting card
- API response examples (all scenarios)
- Empty state handling patterns
- Common scenarios (new cabinet, partial coverage, calculation in progress)
- Testing scenarios with test code
- Quick reference card
- Component props reference
- FAQ section

**Scenarios Covered**:
1. No margin data available (all fields null)
2. Margin data available (full metrics)
3. Partial COGS coverage (warning banner)
4. Margin calculation in progress (polling)

**Documentation**:
- **[114-margin-calculation-frontend-guide.md](./114-margin-calculation-frontend-guide.md)** - QUICK REFERENCE (517 lines)

---

## Request #113: Margin Calculation Empty State Behavior

**Date**: 2026-01-30
**Priority**: DOCUMENTATION
**Status**: DOCUMENTED - Not a Bug
**Component**: Backend API - Analytics Module

**Finding**: **NOT A BUG** - Margin fields returning `null` is expected behavior when `weekly_margin_fact` table is empty.

**Executive Summary**:
- **Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`
- **Observed**: `{ "sale_gross_total": 305778.32, "cogs_total": null, "gross_profit": null }`
- **Root Cause**: `weekly_margin_fact` table is EMPTY (data pipeline not implemented)
- **Epic 56 Status**: Completed 2026-01-29, but does NOT populate `weekly_margin_fact`

**Data Pipeline Status**:
| Component | Status | Details |
|-----------|--------|---------|
| COGS Import | Working | 40 records in `cogs` table |
| Margin Aggregation | Not Implemented | `weekly_margin_fact` is EMPTY |
| Finance Summary | Working | Returns `null` for margin fields when table empty |

**FrontEnd Handling**:
1. **Empty State Component** (Recommended)
   ```tsx
   <CogsMissingState
     coveragePercentage={0}
     onAssignCogs={() => navigate('/products')}
   />
   ```

2. **Warning Badge**
   ```tsx
   <Badge variant="warning">
     Недостаточно данных для расчёта маржи. Назначьте себестоимость.
   </Badge>
   ```

3. **Metrics with Empty State**
   ```tsx
   <MetricCard
     label="Себестоимость"
     value={data.cogs_total ? formatCurrency(data.cogs_total) : '—'}
     empty={!data.cogs_total}
   />
   ```

**Documentation**:
- **[113-margin-calculation-empty-state-behavior.md](./113-margin-calculation-empty-state-behavior.md)** - COMPLETE (416 lines)

---

## Documentation Summary File

**Date**: 2026-01-30
**Purpose**: Summary of all margin calculation documentation updates

**Summary**:
- 2 new documentation files created (933 total lines)
- 3 existing documentation files updated
- Complete explanation of issue and solutions
- FrontEnd implementation examples provided
- Testing scenarios documented
- Roadmap for future backend work outlined

**Documentation**:
- **[MARGIN-CALCULATION-DOCUMENTATION-SUMMARY.md](./MARGIN-CALCULATION-DOCUMENTATION-SUMMARY.md)** - SUMMARY (265 lines)

---

## Related Documentation Updated

### Existing Files Updated

1. **#06**: Missing Expense Fields in Finance Summary
   - Added "Margin Fields Returning Null" section
   - Explained why `cogs_total` returns `null`
   - FrontEnd handling guidance

2. **#21**: Margin Calculation Status Endpoint
   - Added "Current Status (2026-01-30)" section
   - Implementation status table
   - Expected behavior when data is available

3. **#46**: Product COGS Coverage Counting Bug
   - Added "Resolution Update (2026-01-30)" section
   - Root cause clarification (data availability, not a bug)
   - Reference to Request #113

---

## Epic Status Updates

| Epic | Name | Status | Completion Date |
|------|------|--------|-----------------|
| **Epic 20** | Auto Margin Recalculation | COMPLETE | 2025-01 |
| **Epic 56** | Historical Inventory Import | COMPLETE | 2026-01-29 |
| **Epic 57** | FBS Analytics Enhancement | COMPLETE | 2026-01-30 |

**Epic 56 Note**: Epic 56 implemented COGS import from WB Analytics API but does NOT populate `weekly_margin_fact`. A separate Epic is needed for margin data aggregation pipeline.

---

## Component Reference

**Existing Components** (from Request #114):
- `MissingCogsAlert` - Displays warning with CTA
- `CogsMissingState` - Full empty state component
- `MetricCardEnhanced` - Metric card with empty state support

**File Locations**:
- `frontend/src/components/custom/MissingCogsAlert.tsx`
- `frontend/src/components/custom/CogsMissingState.tsx`
- `frontend/src/components/custom/MetricCardEnhanced.tsx`

---

## Testing Checklist

### Unit Tests
- [x] Test empty state component renders when `cogs_total === null`
- [x] Test warning banner displays when coverage < 100%
- [x] Test metrics display when margin data is available
- [x] Test formatCurrency/formatPercentage with null values

### Integration Tests
- [x] Test API response parsing with null values
- [x] Test component state transitions (empty → loading → data)
- [x] Test error handling when API call fails

### E2E Tests
- [x] Test complete flow: No COGS → Assign COGS → View margin data
- [x] Test polling after COGS assignment
- [x] Test margin status endpoint integration

---

## Backend Tests Status

All 45 COGS service tests pass:
```
Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
Time:        1.819s
```

---

## Quick Reference Card

### Null Value Handling

| Field | When Null | FrontEnd Action |
|-------|-----------|-----------------|
| `cogs_total` | No COGS data | Display empty state |
| `gross_profit` | No margin calculation | Display empty state |
| `margin_pct` | Cannot calculate | Display empty state |
| `cogs_coverage_pct` | No products with COGS | Show 0% coverage |

### Coverage Percentage Thresholds

| Coverage | Display | Action |
|----------|---------|--------|
| 0% | Empty state | Assign COGS to all products |
| 1-99% | Warning banner | Assign COGS to remaining products |
| 100% | Full metrics | No action needed |

---

[< Back to Index](./README.md) | [< Previous: FBS & Warehouses](./README-SHARD-08-fbs-warehouses.md)

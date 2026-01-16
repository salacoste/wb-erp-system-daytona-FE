# Changelog: Expense Categories Implementation

**Date:** 2025-11-22
**Story:** 3.3 - Expense Breakdown Visualization
**Request:** #06 - Missing Expense Fields in Finance Summary

---

## Overview

This document tracks the implementation of the complete expense breakdown feature with all 9 expense categories, including backend fixes for missing fields.

---

## Timeline

### 2025-11-22 - Story 3.3 v1.1 (Initial Implementation)
**Enhancement: Expanded expense categories from 4 to 9**

**Frontend Changes:**
- Added support for all 9 expense categories based on SDK → DB mapping
- Added new fields: `paid_acceptance_cost`, `wb_commission_adj`, `loyalty_points_withheld`, `acquiring_fee`, `commission_sales`
- Expanded color palette to 9 colors
- Improved chart readability (height 450px, interval=0, bottom margin 120px)

**Files Modified:**
- `src/hooks/useDashboard.ts` - Extended FinanceSummary interface
- `src/hooks/useExpenses.ts` - Added extraction for all 9 categories
- `src/components/custom/ExpenseChart.tsx` - Improved layout and colors
- `src/hooks/useExpenses.test.tsx` - Updated test expectations

**Issue Identified:**
- Backend missing `acquiring_fee_total` and `commission_sales_total` fields
- Submitted Request #06 to backend team

---

### 2025-11-22 - Request #06 (Backend Fix)
**Backend Response: Added missing expense fields**

**Backend Changes:**
- ✅ Added `acquiring_fee_total` column to database schema
- ✅ Added `commission_sales_total` column to database schema
- ✅ Updated SQL aggregation to calculate both fields separately
- ✅ Fixed commission calculation: `wb_commission_adj` now contains **only** `commission_other`
- ✅ Updated DTOs and API response to include new fields
- ✅ Applied migration: `20251122000000_add_acquiring_fee_and_commission_sales_totals`

**Critical Change:**
- **Before:** `wb_commission_adj = commission_other + commission_sales`
- **After:** `wb_commission_adj = commission_other only`, `commission_sales` tracked separately

**Updated payout_total Formula:**
```
payout_total = to_pay_goods
  - logistics_cost
  - storage_cost
  - paid_acceptance_cost
  - penalties_total
  - wb_commission_adj          // Now only commission_other
  - acquiring_fee_total         // NEW
  - commission_sales_total      // NEW
  - loyalty_fee
  - loyalty_points_withheld
  + loyalty_compensation
  ± other_adjustments_net
```

---

### 2025-11-22 - Story 3.3 v1.2 (Integration)
**Frontend integration of backend fixes**

**Frontend Changes:**
- ✅ Removed DEBUG logging from useExpenses.ts
- ✅ Updated category name: "Корректировка комиссии WB" → "**Прочие комиссии WB**"
- ✅ Added comments about Request #06 in code
- ✅ Updated documentation to reflect backend changes

**Files Modified:**
- `src/hooks/useExpenses.ts` - Removed DEBUG logging, updated category name
- `src/hooks/useExpenses.test.tsx` - Added Request #06 comments
- `docs/stories/3.3.expense-breakdown-visualization.md` - Updated documentation
- `docs/request-backend/06-missing-expense-fields-in-finance-summary.md` - Marked as RESOLVED

**Testing:**
- ✅ All 15 tests passing (9 useExpenses + 6 ExpenseChart)
- ✅ Chart displays all categories with non-zero values
- ✅ Total expense sum remains identical (before/after split)

---

### 2025-11-22 - Story 3.3 v1.3 (UI Enhancement)
**Always display all 9 categories + smart sorting**

**UI Changes:**
- ✅ Removed zero-value filtering - always display all 9 categories
- ✅ Added smart sorting: non-zero expenses first (left to right), zero expenses on the right
- ✅ Within non-zero group: sorted by amount descending (largest to smallest)
- ✅ Better visual consistency across different weeks

**Files Modified:**
- `src/hooks/useExpenses.ts` - Removed `.filter()`, added `.sort()` for smart ordering
- `src/hooks/useExpenses.test.tsx` - Updated test "filters out zero-value expenses" → "displays all 9 categories including zero values"
- `docs/stories/3.3.expense-breakdown-visualization.md` - Version 1.3

**Testing:**
- ✅ All 15 tests passing (9 useExpenses + 6 ExpenseChart)
- ✅ Chart always displays 9 columns consistently
- ✅ Non-zero expenses appear on the left for better visibility

**Rationale:**
- Consistent column count makes it easier to compare weeks
- Zero expenses explicitly visible (transparency)
- Non-zero values prioritized visually (left-to-right reading)

---

### 2025-11-22 - Story 3.3 v1.4 (Mobile Enhancement)
**Responsive margins for small screens**

**UI Changes:**
- ✅ Removed horizontal margins (left/right) on mobile screens (<640px)
- ✅ Reduced Y-axis width from 80px to 60px on mobile
- ✅ Chart now uses full available width on small devices
- ✅ Added responsive breakpoint detection using window resize listener
- ✅ Better readability and space utilization on mobile devices

**Files Modified:**
- `src/components/custom/ExpenseChart.tsx` - Added mobile detection with useState/useEffect, conditional margins

**Technical Details:**
```typescript
// Desktop (≥640px): margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
// Mobile (<640px):   margin={{ top: 20, right: 0, left: 0, bottom: 100 }}
// Y-axis width: 60px on mobile vs 80px on desktop
```

**Testing:**
- ✅ All 6 ExpenseChart tests passing
- ✅ No linter errors
- ✅ Chart renders correctly on mobile and desktop

**Rationale:**
- Maximize chart width on small screens for better category label readability
- Remove wasted horizontal space on mobile devices
- Maintain proper spacing on desktop for comfortable viewing

---

## All 9 Expense Categories

| # | Category (Russian) | API Field (summary_total) | Status |
|---|-------------------|--------------------------|--------|
| 1 | Логистика | `logistics_cost_total` | ✅ Working |
| 2 | Хранение | `storage_cost_total` | ✅ Working |
| 3 | Платная приёмка | `paid_acceptance_cost_total` | ✅ Working |
| 4 | Штрафы | `penalties_total` | ✅ Working |
| 5 | Прочие комиссии WB | `wb_commission_adj_total` | ✅ Working (commission_other only, see details below) |
| 6 | Комиссия лояльности | `loyalty_fee_total` | ✅ Working |
| 7 | Удержание баллов лояльности | `loyalty_points_withheld_total` | ✅ Working |
| 8 | Эквайринг | `acquiring_fee_total` | ✅ Fixed (Request #06) |
| 9 | Комиссия продаж | `commission_sales_total` | ✅ Fixed (Request #06) |

### "Прочие комиссии WB" Category Details

**Source Data:**
- **Excel Column:** "Прочие удержания/начисления"
- **SDK Field:** `ppvz_reward`
- **Alternative:** `additional_payment` (fallback if ppvz_reward missing)

**What's Included:**
- Various deductions and payments from Wildberries
- WB promotion services ("ВБ.Продвижение") paid from balance
- One-time compensations to seller
- Other miscellaneous WB charges/credits

**Characteristics:**
- Not tied to specific orders (product info columns empty: Barcode, Supply Number, etc.)
- Reason visible in "Виды логистики, штрафов и корректировок ВВ" column
- **Deduction:** displayed as positive number
- **Payment to seller:** displayed with negative sign (becomes positive after ABS() aggregation)

**Important:** After Request #06, this category contains **ONLY** `commission_other`. The `commission_sales` is now tracked separately as a dedicated expense category.

---

## API Response Structure (Current)

**Endpoint:** `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

**Response:**
```typescript
{
  data: {
    summary_rus: {
      // All 9 expense categories (positive values)
      logistics_cost: number,
      storage_cost: number,
      paid_acceptance_cost: number,
      penalties_total: number,
      wb_commission_adj: number,          // commission_other only
      acquiring_fee_total: number,         // Request #06
      commission_sales_total: number,      // Request #06
      loyalty_fee: number,
      loyalty_points_withheld: number,
      // ... other fields
    },
    summary_eaeu: { /* Same structure */ },
    summary_total: {
      // All fields with _total suffix
      logistics_cost_total: number,
      storage_cost_total: number,
      paid_acceptance_cost_total: number,
      penalties_total: number,
      wb_commission_adj_total: number,     // commission_other only
      acquiring_fee_total: number,         // Request #06
      commission_sales_total: number,      // Request #06
      loyalty_fee_total: number,
      loyalty_points_withheld_total: number,
      // ... other fields
    }
  },
  meta: { week, cabinet_id, generated_at, timezone }
}
```

---

## Impact Analysis

### User-Facing Changes
**Before:**
- Graph showed 2-4 expense categories
- "Корректировка комиссии WB" combined commission_other + commission_sales

**After:**
- Graph shows up to 9 expense categories (only non-zero values)
- "Прочие комиссии WB" shows only commission_other
- "Комиссия продаж" shown separately
- More detailed expense analytics

### Technical Changes
**Frontend:**
- ✅ All 9 categories supported
- ✅ Backward compatible (supports both `_total` and legacy fields)
- ✅ Automatic filtering of zero-value expenses
- ✅ Improved chart layout for readability

**Backend:**
- ✅ Database schema updated
- ✅ API response includes all fields
- ✅ Historical data compatible (new fields return 0 until re-aggregation)
- ✅ payout_total formula updated

### Validation
**Formula Validation:**
- ✅ Total expense sum remains identical (before/after split)
- ✅ `payout_total` formula mathematically correct
- ✅ All expense values positive (absolute values)

**Compatibility:**
- ✅ Backward compatible with old backend (fallback to legacy fields)
- ✅ Forward compatible with new backend (uses `_total` fields)
- ✅ No breaking changes for existing functionality

---

## Documentation Updates

**Updated Files:**
1. ✅ `README.md` - Added "Financial Data Structure" section
2. ✅ `docs/api-integration-guide.md` - Updated finance-summary endpoint
3. ✅ `docs/stories/3.3.expense-breakdown-visualization.md` - Version 1.2
4. ✅ `docs/request-backend/06-missing-expense-fields-in-finance-summary.md` - Marked RESOLVED
5. ✅ `docs/CHANGELOG-EXPENSE-CATEGORIES.md` - This file

---

## References

**Code:**
- Expense Chart: `src/components/custom/ExpenseChart.tsx`
- Expense Hook: `src/hooks/useExpenses.ts`
- Finance Types: `src/hooks/useDashboard.ts`
- Tests: `src/hooks/useExpenses.test.tsx`, `src/components/custom/ExpenseChart.test.tsx`

**Documentation:**
- Story 3.3: `docs/stories/3.3.expense-breakdown-visualization.md`
- Request #06: `docs/request-backend/06-missing-expense-fields-in-finance-summary.md`
- QA Gate: `docs/qa/gates/3.3-expense-breakdown-visualization.yml`
- API Guide: `docs/api-integration-guide.md`
- Main README: `README.md`

**Backend:**
- Migration: `prisma/migrations/20251122000000_add_acquiring_fee_and_commission_sales_totals/migration.sql`
- Recalculation script: `scripts/recalculate-direct.ts` (optional for historical data)

---

## Next Steps

**No further action required** - All 9 expense categories are now fully implemented and tested.

**Optional Enhancements:**
- Consider adding drill-down functionality for expense details
- Consider adding time-series trend charts for each expense category
- Consider adding expense budget/threshold alerts

---

**Last Updated:** 2025-11-22
**Status:** ✅ Complete

---

## Appendix: Category Documentation Updates

### 2025-11-22 - Added Detailed "Прочие комиссии WB" Description

**Based on official Wildberries documentation:**
- Added comprehensive description of what's included in this category
- Documented source fields (Excel column, SDK field, fallback)
- Clarified characteristics (not tied to orders, reason in separate column)
- Added sign convention (deduction vs payment to seller)

**Files Updated:**
- `README.md` - Added detailed description in Financial Data Structure section
- `docs/CHANGELOG-EXPENSE-CATEGORIES.md` - Added dedicated section with full details

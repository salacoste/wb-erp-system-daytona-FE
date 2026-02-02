# Resolved Requests - Financial Analytics

[< Back to Index](./README.md) | [< Previous: Pending](./README-SHARD-02-pending-financial.md) | [Next: COGS & Analytics >](./README-SHARD-04-cogs-analytics.md)

---

This shard contains resolved requests for Per-SKU financial analytics, Storage data sources, WB Dashboard matching, and commission adjustments.

---

## Request #64: Per-SKU Margin Missing Expenses - Complete SKU Financial Analytics

**Date**: 2025-12-18
**Priority**: High - Core Financial Feature
**Status**: IMPLEMENTED - Epic 31 Complete (26 unit tests)
**Component**: Backend API - Analytics Module (Epic 31)
**Related**: Request #47 (Epic 26 Operating Profit), Request #60 (Per-SKU Ops Costs), Epic 24 (Paid Storage)
**File**: [64-per-sku-margin-missing-expenses-backend-response.md](./64-per-sku-margin-missing-expenses-backend-response.md)

**Problem Solved**: Frontend requested complete per-SKU financial breakdown including all operating expenses, storage costs from paid_storage_daily, and profitability classification.

**New API Endpoint**:
```http
GET /v1/analytics/sku-financials?week=2025-W49&cabinetId=<uuid>
Authorization: Bearer <token>
X-Cabinet-Id: <uuid>
```

**Response Structure**:
```json
{
  "items": [{
    "nmId": "173589742",
    "productName": "Tape Dispenser...",
    "revenue": { "gross": 1500, "net": 1200 },
    "costs": {
      "cogs": 300, "logistics": 150, "storage": 25,
      "penalties": 0, "paidAcceptance": 0
    },
    "visibility": { "commission": 180, "acquiring": 15 },
    "profit": {
      "gross": 900,
      "operating": 725,
      "operatingMarginPct": 60.42
    },
    "profitabilityStatus": "excellent",
    "missingCogs": false
  }],
  "summary": { "totalItems": 34, "withCogs": 32, "withoutCogs": 2 },
  "meta": { "week": "2025-W49", "cacheHit": false }
}
```

**Key Design Decisions**:
| Aspect | Implementation |
|--------|----------------|
| Storage source | `paid_storage_daily` (Epic 24), NOT `wb_finance_raw` |
| Commission/Acquiring | **Visibility only** - NOT operating expenses (already in net_for_pay) |
| Operating Profit | `grossProfit - logistics - storage - penalties - paidAcceptance` |
| COGS lookup | Week Midpoint Strategy (Thursday) |
| Cache | Redis 30min TTL, event-based invalidation |

**Profitability Classification**:
| Status | Margin % | Color |
|--------|----------|-------|
| excellent | > 25% | Green |
| good | 15-25% | Light Green |
| warning | 5-15% | Yellow |
| critical | 0-5% | Orange |
| loss | < 0% | Red |
| unknown | N/A (no COGS) | Gray |

**Documentation**:
- **[64-per-sku-margin-missing-expenses-backend-response.md](./64-per-sku-margin-missing-expenses-backend-response.md)** - FRONTEND INTEGRATION GUIDE
- [Epic 31 Documentation](../../../docs/epics/epic-31-complete-per-sku-financial-analytics.md)
- [test-api/06-analytics-advanced.http](../../../test-api/06-analytics-advanced.http) - API Examples

---

## Request #62: Storage Data Sources Comparison Guide

**Date**: 2025-12-16
**Priority**: Documentation
**Status**: COMPLETE - Integration guide published
**Component**: Frontend Integration Guide
**Related**: Request #36 (Epic 24 Storage API), Request #51 (paid-storage-import)
**File**: [62-storage-data-sources-comparison.md](./62-storage-data-sources-comparison.md)

**Summary**: Guide for working with two storage data sources:

| Source | Table | Use Case |
|--------|-------|----------|
| **Storage API** | `paid_storage_daily` | SKU details, top consumers, trends |
| **Weekly Reports** | `weekly_payout_summary` | Financial summary, payout_total |

**Key Finding**: Both sources show **identical amounts** (~100% match):
| Week | Weekly Report | Storage API | Match |
|------|---------------|-------------|-------|
| W49 | 1,923.34 | 1,923.38 | 100.00% |
| W48 | 1,849.95 | 1,850.21 | 100.01% |
| W47 | 1,763.35 | 1,763.75 | 100.02% |
| W46 | 1,849.69 | 1,849.85 | 100.01% |

**Documentation includes**:
- API endpoints for both sources
- TypeScript types
- React hooks examples
- UI integration examples
- When to use which source

---

## Request #59: Loyalty Fields Verification Against WB Dashboard

**Date**: 2025-12-14
**Priority**: Low - Verification/Documentation
**Status**: VERIFIED - All loyalty fields match WB Dashboard exactly
**Component**: Backend API - Analytics Module
**Related**: Request #51 (payout formula), Request #57 (wb_sales_gross)
**File**: [59-loyalty-fields-verification.md](./59-loyalty-fields-verification.md)

**Summary**: Full verification of loyalty fields against WB Dashboard for W49:

| Field | WB Dashboard | Backend | Match |
|-------|--------------|---------|-------|
| Loyalty participation cost | 0 | `loyalty_fee` = 0 | Yes |
| Loyalty points amount | 0 | `loyalty_points_withheld` = 0 | Yes |
| Including discount compensation | 336 | `loyalty_compensation` = 336 | Yes |

**Key Finding**: `loyalty_compensation` is shown as "Including" under "Sale" - it's **already included in `gross`**, NOT a separate addition to payout_total.

**Conclusion**:
- Current formula is correct - loyalty fields are informational only
- No changes needed to payout_total calculation
- 100% match with WB Dashboard

---

## Request #57: WB Dashboard Exact Match Fields (`wb_sales_gross`)

**Date**: 2025-12-13
**Priority**: Medium - UX Enhancement
**Status**: IMPLEMENTED - Backend + Frontend Complete
**Component**: Backend API - Analytics Module + Frontend Integration
**Related**: PM Request #01, Request #41 (sales/returns), Request #51 (payout formula)
**File**: [57-wb-dashboard-exact-match-fields.md](./57-wb-dashboard-exact-match-fields.md)

**Problem Solved**: "Sales" indicator now **exactly matches** WB Dashboard:
- `wb_sales_gross` = SUM(gross) WHERE doc_type='sale' - **exact match WB "Sale"**
- `wb_returns_gross` = SUM(gross) WHERE doc_type='return' - **exact match WB "Return"**

**New API Fields**:
```json
{
  "summary_rus": {
    "wb_sales_gross": 131134.76,
    "wb_returns_gross": 809.00
  },
  "summary_total": {
    "wb_sales_gross_total": 135285.09,
    "wb_returns_gross_total": 809.00
  }
}
```

**Verification (W49)**:
| Field | API Value | WB Dashboard | Match |
|-------|-----------|--------------|-------|
| wb_sales_gross | 131,134.76 | "Sale" | 100% |
| wb_returns_gross | 809.00 | "Return" | 100% |

---

## Request #56: WB Services Expenses Visibility (Advertising, Jam, Other services)

**Date**: 2025-12-13
**Priority**: Medium - Financial Visibility Gap
**Status**: DEPLOYED - Backend + Frontend Complete
**Component**: Backend API - Analytics Module + Frontend Integration
**Related**: Request #51 (wb_commission_adj), Technical Debt (commission-separation.md)
**File**: [137-wb-services-expenses-visibility.md](./137-wb-services-expenses-visibility.md) | [56-wb-services-breakdown.md](./56-wb-services-breakdown.md)

**Problem Solved**: Expenses for **advertising (WB.Promotion)**, **Jam subscription** and **other WB services** are now **VISIBLE** in UI (previously hidden in `other_adjustments_net`).

**Backend Implementation** (2025-12-13):
- Added 4 new fields to `weekly_payout_summary` and `weekly_payout_total` tables
- SQL CASE statements with `bonus_type_name` pattern matching
- API endpoints return `wb_services_cost`, `wb_promotion_cost`, `wb_jam_cost`, `wb_other_services_cost`
- Cabinet Summary includes `wb_services_breakdown` object

**Frontend Integration** (2025-12-13):
- `src/hooks/useDashboard.ts` - Added WB services fields to `FinanceSummary` interface
- `src/types/analytics.ts` - Added WB services fields to `CabinetSummaryTotals` interface
- `src/hooks/useExpenses.ts` - Added WB.Promotion, Jam, Other WB services categories
- `src/components/custom/ExpenseChart.tsx` - New colors for WB services categories
- `src/components/custom/FinancialSummaryTable.tsx` - New "WB Services" section with breakdown
- `src/components/custom/PnLWaterfall.tsx` - WB services breakdown in "Other deductions" section

**Example Data (W49)**:
| Service | Amount | Pattern |
|---------|--------|---------|
| WB.Promotion | 32,073 | `Provision of WB Promotion services` |
| Jam | 18,990 | `Provision of Jam subscription services` |
| **Total** | **51,063** | = other_adjustments_net |

**Documentation**: [56-wb-services-breakdown.md](./56-wb-services-breakdown.md)

---

## Request #51: WB Commission Adjustment Missing from Payout Formula

**Date**: 2025-12-12
**Priority**: Critical - Financial Calculation Error
**Status**: FIXED - Formula corrected, 100% WB Dashboard match
**Component**: Backend API - Analytics Module
**Related**: Request #49 (payout_total fix), Request #43 (WB Dashboard alignment)
**File**: [136-wb-commission-adj-payout.md](./136-wb-commission-adj-payout.md)

**Problem**: `payout_total` was missing "Commission adjustment" deduction, causing **2,153.28 discrepancy** with WB Dashboard for W49.

**Root Cause**:
1. Formula didn't subtract `wbCommissionAdj`
2. Aggregator summed ALL `commission_other` instead of only `reason='Withholding'`

**Fix Applied**:
```typescript
// src/aggregation/formulas/payout-total.formula.ts
payout_total = toPayGoods - logistics - storage - acceptance - penalties - otherAdjustments - wbCommissionAdj

// src/aggregation/weekly-payout-aggregator.service.ts (line 302-304)
SUM(CASE WHEN reason = 'Withholding' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj
```

**Verification (W49)**:
| Report | WB Dashboard | Backend | Match |
|--------|--------------|---------|-------|
| Main | 53,907.27 | 53,907.27 | 100% |
| By redemptions | 3,034.09 | 3,034.09 | 100% |
| **TOTAL** | **56,941.36** | **56,941.36** | 100% |

**Additional Verification (W47 - 17-23 Nov 2025)**:
| Report | WB Dashboard | Backend | Match |
|--------|--------------|---------|-------|
| Main | 132,213.73 | 132,213.73 | 100% |
| By redemptions | 6,767.95 | 6,767.95 | 100% |
| **TOTAL** | **138,981.68** | **138,981.68** | 100% |

**commission_other Filtering** (Critical):
```sql
-- CORRECT: Only reason='Withholding'
SUM(CASE WHEN reason = 'Withholding' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj

-- WRONG: All commission_other (double-counting!)
SUM(ABS(commission_other)) as wb_commission_adj
```

| reason | Include? | Why |
|--------|----------|-----|
| Sale | NO | Already in `total_commission_rub` |
| Return | NO | Already in `total_commission_rub` |
| PVZ compensation | NO | This is INCOME, not expense |
| **Withholding** | YES | Real deduction = WB "Commission adjustment" |

**Full Documentation**: [136-wb-commission-adj-payout.md](./136-wb-commission-adj-payout.md) | [docs/WB-DASHBOARD-METRICS.md](../../../docs/WB-DASHBOARD-METRICS.md)

---

## Request #50: Logistics Cost Discrepancy with WB Dashboard

**Date**: 2025-12-07
**Priority**: Low - Informational (Root Cause Found)
**Status**: RESOLVED - WB Dashboard Platform Fee Identified
**Component**: Backend API - Analytics Module
**Related**: Request #49 (payout_total fix)
**File**: [50-logistics-cost-discrepancy.md](./50-logistics-cost-discrepancy.md)

**Root Cause**: WB Dashboard adds **~1.47% hidden platform fee** to logistics costs that is NOT present in Excel/API data.

**Evidence** (W42):
| Metric | Our DB (Excel/API) | x 1.01467 | WB Dashboard | Diff |
|--------|-------------------|-----------|--------------|------|
| Total | 46,962.87 | 47,653.22 | 47,652.04 | **1.18** |

**Multiplier by Report Type**:
| Report Type | Our DB | WB Dashboard | Multiplier |
|-------------|--------|--------------|------------|
| Main (RUS) | 44,839.91 | 45,381.57 | **+1.21%** |
| By redemptions (EAEU) | 2,122.96 | 2,270.47 | **+6.95%** |
| **Weighted Avg** | | | **+1.47%** |

**Resolution**: Document as known difference. Our data correctly reflects Excel/API - no code change needed.

---

## Request #49: Payout Total Formula Bug - Wrong Base Value

**Date**: 2025-12-07
**Priority**: Critical - Financial Calculation Error
**Status**: FIXED - Formula corrected, all weeks recalculated
**Component**: Backend API - Analytics Module
**File**: [49-payout-total-formula-bug.md](./49-payout-total-formula-bug.md)

**Problem**: `payout_total` used wrong base value (`saleGross - totalCommissionRub` instead of `toPayGoods`), causing **~100K discrepancy** with WB Dashboard.

**Root Cause**:
```typescript
// WRONG (before):
payout = saleGross - totalCommissionRub - logistics - storage - other

// CORRECT (after):
payout = toPayGoods - logistics - storage - paidAcceptance - penalties - other
```

**Key Insight**: `toPayGoods != saleGross - totalCommissionRub` (difference can be >100K)

**Fix Applied**:
1. Updated formula in `src/aggregation/formulas/payout-total.formula.ts`
2. Updated 11 unit tests - all passing
3. Recalculated 26 WeeklyPayoutSummary records across 13 weeks
4. Verified against WB Dashboard (W42: diff reduced from 139K to 689)

---

## Request #48: Storage Analytics Multi-Brand Filter Bug

**Date**: 2025-12-06
**Priority**: High - Feature Not Working
**Status**: FIXED - Backend updated with IN clause support
**Component**: Backend API - Storage Analytics Module
**File**: [48-storage-multi-brand-filter-bug.md](./48-storage-multi-brand-filter-bug.md)

**Problem**: Multi-brand selection (e.g., "Protape,Space Chemical") returned no results - backend was matching literal string instead of parsing into array.

**Solution**:
- Added `parseMultiValueFilter()` helper to split comma-separated values
- Refactored `getStorageBySku()` to use `IN` clause for multi-value brand/warehouse filters
- Uses `Prisma.join()` for parameterized queries (SQL injection safe)

**Files Changed**:
- `src/analytics/services/storage-analytics.service.ts`
- `src/analytics/dto/query/storage-by-sku-query.dto.ts`

---

## Request #47: Epic 26 - Per-SKU Operating Profit & Expense Tracking

**Date**: 2025-12-06
**Priority**: Complete - Backend & Frontend Implemented
**Status**: COMPLETE - Backend implemented, Frontend integrated
**Component**: Backend API + Frontend Integration
**Related**: Epic 26, Request #45 (Cabinet Summary P&L), Request #46 (COGS Coverage)

**Summary**: Full **Operating Profit & Expense Tracking** at SKU, Brand, Category, and Cabinet levels.

**Backend Fields Available** (when `includeCogs=true`):
- **Expenses**: `logistics_cost_rub`, `storage_cost_rub`, `penalties_rub`, `paid_acceptance_cost_rub`, `acquiring_fee_rub`, `loyalty_fee_rub`, `loyalty_compensation_rub`, `commission_rub`
- **Calculated**: `total_expenses_rub`, `operating_profit_rub`, `operating_margin_pct`
- **Dormant Inventory**: `has_revenue` (false = expense-only SKU), `skus_with_expenses_only` (count)

**Frontend Implementation**:
- TypeScript types updated (`src/types/analytics.ts`, `src/types/cogs.ts`)
- "Operating profit" column added to all 3 margin tables (SKU/Brand/Category)
- Operating Profit section added to Cabinet Summary Dashboard
- Dormant inventory indicator for expense-only products
- Red color for losses (negative operating profit)

**Key Formula**:
```
Operating Profit = Gross Profit - Total Expenses
(can be negative = loss)
```

**Documentation**:
- **[47-epic-26-operating-profit-expense-tracking.md](./47-epic-26-operating-profit-expense-tracking.md)** - Backend API Guide
- **[CHANGELOG-EPIC-26.md](../CHANGELOG-EPIC-26.md)** - Frontend Implementation Details

---

## Request #46: Product COGS Coverage Counting Bug

**Date**: 2025-12-06
**Priority**: Medium - Data Accuracy Issue
**Status**: FIXED - SQL query updated with CTE
**Component**: Backend API - Analytics Module
**File**: [46-product-cogs-coverage-counting-bug.md](./46-product-cogs-coverage-counting-bug.md)

**Problem**: Cabinet Summary showed `with_cogs: 11` + `without_cogs: 9` = 20, but `total: 18`

**Root Cause**: SQL logic counted same product in both categories if it had COGS in some weeks but not others.

**Solution**: CTE with MAX aggregation - each product counted in exactly one category (with_cogs if ANY week has COGS).

**Additional Issue** (unrelated): Only 18 products in `margin_fact` vs 34 in `wb_finance_raw` - may need margin recalculation.

---

## Request #45: Cabinet Summary Missing P&L Fields

**Date**: 2025-12-06
**Priority**: High - Dashboard Not Functional
**Status**: RESOLVED - Backend rebuilt, all fields now returned
**Component**: Backend API - Analytics Module
**Endpoint**: `GET /v1/analytics/weekly/cabinet-summary` (WITH `/weekly/` prefix!)

**Resolution**:
1. Backend was not rebuilt after Story 25.3 - fixed with `npm run build && pm2 restart`
2. API now returns `total_commission_rub_total` correctly
- Clear browser cache

**Documentation**:
- **[45-cabinet-summary-missing-pnl-fields.md](./45-cabinet-summary-missing-pnl-fields.md)** - FULL INVESTIGATION

---

[< Back to Index](./README.md) | [< Previous: Pending](./README-SHARD-02-pending-financial.md) | [Next: COGS & Analytics >](./README-SHARD-04-cogs-analytics.md)

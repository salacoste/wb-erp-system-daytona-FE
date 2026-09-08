# Changelog: Epic 25 - Dashboard Data Accuracy

**Version:** 1.0
**Date:** 2025-12-06
**Author:** Claude (Opus 4.5)

---

## Overview

Epic 25 addresses Dashboard Data Accuracy issues, ensuring financial data displayed in the frontend matches WB Dashboard metrics. The epic includes fixes for margin calculation, WB commission display, COGS section, and P&L structure alignment.

**Problem Statement**: Dashboard showed incorrect data not matching WB Dashboard metrics.

**Root Cause Analysis**:

1. Cabinet Summary Dashboard used `weekly_margin_fact.revenue_net_rub` instead of WB-compatible metrics
2. Missing WB Commission (`total_commission_rub`) in expenses
3. No COGS section and net profit calculation
4. Bug in MarginCalculationService (returns added instead of subtracted)

---

## Completed Stories

### Story 25.5: Audit MarginCalculationService ✅ CRITICAL FIX

**Purpose:** Fix sign handling for returns in margin calculation.

**Root Cause:** WB Excel provides POSITIVE values for both sales AND returns. The code was adding all `net_for_pay` values without considering `doc_type`, causing returns to INCREASE revenue instead of DECREASE it.

**Fix Applied:**

```typescript
// BEFORE (WRONG):
existing.revenueNetRub = existing.revenueNetRub.plus(tx.netForPay);
existing.quantitySold += tx.qty;

// AFTER (CORRECT):
if (tx.docType === 'sale') {
  existing.revenueNetRub = existing.revenueNetRub.plus(tx.netForPay);
  existing.quantitySold += tx.qty;
} else if (tx.docType === 'return') {
  existing.revenueNetRub = existing.revenueNetRub.minus(tx.netForPay);
  existing.quantitySold -= tx.qty;
}
```

**Evidence (W47 2025-11-17 to 2025-11-23)**:

- Raw sale: 212,803.18₽ (positive)
- Raw return: 2,750.67₽ (positive - should be subtracted!)
- WRONG: 212,803.18 + 2,750.67 = 215,553.85₽
- CORRECT: 212,803.18 - 2,750.67 = 210,052.51₽

**Files Changed:**

- `src/analytics/services/margin-calculation.service.ts` - Core fix
- `src/analytics/services/__tests__/margin-calculation.service.spec.ts` - Updated tests
- `scripts/recalculate-margin-facts.ts` - Recalculation script

---

### Story 25.3: Add WB Commission to Expenses ✅

**Purpose:** Display WB Commission (`total_commission_rub`) in expense breakdowns.

**Changes Applied:**

**Backend DTO Updates:**

- `src/analytics/dto/weekly-payout-total.dto.ts` - Added `total_commission_rub_total` field
- `src/analytics/dto/weekly-payout-summary.dto.ts` - Added `total_commission_rub` field
- `src/analytics/weekly-analytics.service.ts` - Added mapping for commission fields

**Frontend Updates:**

- `src/hooks/useDashboard.ts` - Added `total_commission_rub_total?` and `total_commission_rub?` to FinanceSummary
- `src/components/custom/FinancialSummaryTable.tsx` - Added "Комиссия WB" row as first expense

---

### Story 25.1: Fix Cabinet Summary Dashboard ✅

**Purpose:** Redesign Cabinet Summary Dashboard with CFO-approved P&L structure.

**P&L Structure Implemented:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    P&L МАРКЕТПЛЕЙСА                              │
├─────────────────────────────────────────────────────────────────┤
│  📈 ВЫРУЧКА (Revenue)                                           │
│  ├── Продажи (gross)        = sales_gross_total                 │
│  ├── Возвраты (gross)       = returns_gross_total (показать -)  │
│  └── Чистые продажи (NET)   = sale_gross_total                  │
│                                                                  │
│  📉 УДЕРЖАНИЯ МАРКЕТПЛЕЙСА (Deductions)                         │
│  ├── Комиссия WB            = total_commission_rub_total        │
│  ├── Логистика              = logistics_cost_total              │
│  ├── Хранение               = storage_cost_total                │
│  └── ... (other deductions)                                     │
│                                                                  │
│  💰 МАРЖИНАЛЬНЫЙ ДОХОД ДО COGS                                  │
│  └── К перечислению         = payout_total                      │
│                                                                  │
│  📦 СЕБЕСТОИМОСТЬ (COGS) - если 100% покрытие                   │
│  └── COGS                   = SUM(cogs_rub) из weekly_margin_fact│
│                                                                  │
│  💎 ЧИСТАЯ ПРИБЫЛЬ (только при 100% COGS покрытии)              │
│  └── Чистая прибыль         = payout_total - COGS               │
└─────────────────────────────────────────────────────────────────┘
```

**Files Changed:**

- `src/app/(dashboard)/analytics/dashboard/page.tsx` - Redesigned with P&L sections
- `src/types/analytics.ts` - Extended CabinetSummaryTotals interface

---

### Story 25.4: Fix Top Products / Top Brands ✅

**Purpose:** Verify ranking uses correct `net_for_pay` per SKU.

**Analysis:** After Story 25.5 fix, `revenue_net_rub` in `weekly_margin_fact` is correctly calculated as:

```
revenue_net_rub = SUM(net_for_pay for sales) - SUM(net_for_pay for returns)
```

**Result:** Existing ranking logic was confirmed correct - ranks by `net_for_pay` per SKU.

**Files Changed:**

- `src/analytics/weekly-analytics.service.ts` - Added clarifying comments

---

### Story 25.2: Add COGS Section to Financial Summary ✅

**Purpose:** Display COGS coverage and net profit in FinancialSummaryTable.

**Backend Request:** Request #44 - Extended finance-summary endpoint with COGS data from `weekly_margin_fact`.

**New Fields Added:**

```typescript
{
  cogs_total: number | null;           // SUM(cogs_rub) from weekly_margin_fact
  cogs_coverage_pct: number | null;    // % of products with COGS assigned
  products_with_cogs: number | null;   // Count of products with COGS
  products_total: number | null;       // Total unique products in week
  gross_profit: number | null;         // payout_total - cogs_total (only when coverage = 100%)
}
```

**Frontend Implementation:**

**Files Created/Modified:**

- `src/hooks/useDashboard.ts` - Added 5 COGS fields to FinanceSummary interface
- `src/components/custom/FinancialSummaryTable.tsx`:
  - New imports: Alert, AlertDescription, Package, AlertTriangle, Gem icons
  - New "Себестоимость (COGS)" Card section after "Итого к оплате"
  - Shows COGS total, coverage %, products count
  - Alert when no COGS data available
  - Warning when coverage < 100%
  - "Чистая прибыль" Card (emerald border) when coverage = 100%
  - Comparison mode support with pp (percentage points) delta

**UI Features:**

- COGS coverage percentage display (e.g., "92.5%")
- Products with COGS counter (e.g., "45 / 50 товаров")
- Alert: "Внесите себестоимости для N товаров" when < 100%
- Profit section only shown when COGS coverage = 100%

---

## API Changes

### Finance Summary Endpoint Enhanced

**Endpoint:** `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

**New Fields in Response:**

```typescript
{
  summary_total: {
    // ... existing fields

    // Story 25.3: WB Commission
    total_commission_rub_total: number;

    // Story 25.2: COGS Section (Request #44)
    cogs_total: number | null;
    cogs_coverage_pct: number | null;
    products_with_cogs: number | null;
    products_total: number | null;
    gross_profit: number | null;
  }
}
```

---

## File Tree

```
src/
├── components/custom/
│   └── FinancialSummaryTable.tsx  # Updated with COGS section
├── hooks/
│   └── useDashboard.ts            # Extended FinanceSummary interface
├── types/
│   └── analytics.ts               # Extended CabinetSummaryTotals
└── app/(dashboard)/analytics/
    └── dashboard/
        └── page.tsx               # P&L structure redesign

docs/
├── stories/
│   └── epic-25-dashboard-data-accuracy.md  # Epic documentation
├── request-backend/
│   └── 44-cogs-section-in-finance-summary.md  # Backend request
└── CHANGELOG-EPIC-25.md           # This file
```

---

## Related Documentation

- **Epic Document:** `docs/stories/epic-25-dashboard-data-accuracy.md`
- **Backend Request:** `docs/request-backend/44-cogs-section-in-finance-summary.md`
- **WB Dashboard Metrics:** `docs/WB-DASHBOARD-METRICS.md`
- **Request #43:** `docs/request-backend/43-wb-dashboard-data-discrepancy.md`

---

## Epic Complete

**Total Stories:** 5/5 (100%) ✅
**Completion Date:** 2025-12-06

| Story | Title                                 | Status       |
| ----- | ------------------------------------- | ------------ |
| 25.1  | Fix Cabinet Summary Dashboard         | ✅ COMPLETED |
| 25.2  | Add COGS Section to Financial Summary | ✅ COMPLETED |
| 25.3  | Add WB Commission to Expenses         | ✅ COMPLETED |
| 25.4  | Fix Top Products / Top Brands         | ✅ COMPLETED |
| 25.5  | Audit MarginCalculationService        | ✅ COMPLETED |

---

## Post-Fix Actions

### Margin Recalculation Required

After Story 25.5 fix, historical margin data needs recalculation:

```bash
npx ts-node scripts/recalculate-margin-facts.ts
```

This script recalculates all `weekly_margin_fact` records to apply the corrected sign handling for returns.

---

## Deployment Issue (2025-12-06)

### Problem

After Epic 25 completion, "Комиссия WB" field showed "—" on `/analytics` page while other fields (Логистика, etc.) displayed correctly.

### Root Cause

**Backend was not rebuilt after Story 25.3 changes.** The compiled `dist/` code was missing the `total_commission_rub_total` field in `mapTotalToDto()`.

### Solution

```bash
npm run build    # Recompile TypeScript
pm2 restart wb-repricer  # Apply changes
```

### Verification

```bash
curl "/v1/analytics/weekly/finance-summary?week=2025-W48" | jq '.summary_total.total_commission_rub_total'
# Returns: 70055.52 ✅
```

### Lesson Learned

**Always run `npm run build` after backend code changes before restarting PM2.**

---

## Next Epic

**Epic 26: Per-SKU Operating Profit & Expense Tracking** - See `docs/CHANGELOG-EPIC-26.md`

# Epic 25: Dashboard Data Accuracy

## Overview

**Problem Statement**: Dashboard показывает некорректные данные, не соответствующие метрикам WB Dashboard.

**Root Cause Analysis**:

1. Cabinet Summary Dashboard использует `weekly_margin_fact.revenue_net_rub` (SUM of net_for_pay) вместо WB-совместимых метрик
2. Отсутствует комиссия WB (`total_commission_rub`) в расходах
3. Нет секции COGS и расчёта чистой прибыли
4. Потенциальная ошибка знаков для возвратов в MarginCalculationService

**Business Value**: Корректное отображение финансовых данных для принятия бизнес-решений.

---

## Data Model Reference

### Источники данных

| Таблица                 | Назначение                           | Ключевые поля                                                                                                |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `weekly_payout_total`   | WB-совместимые агрегаты              | `sale_gross_total`, `sales_gross_total`, `returns_gross_total`, `total_commission_rub_total`, `payout_total` |
| `weekly_payout_summary` | По report_type (основной/по выкупам) | То же, без `_total` суффикса                                                                                 |
| `weekly_margin_fact`    | Маржинальность по SKU                | `revenue_net_rub`, `cogs_rub`, `gross_profit_rub`                                                            |

### CFO-одобренная структура P&L

```
┌─────────────────────────────────────────────────────────────────┐
│                    P&L МАРКЕТПЛЕЙСА                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📈 ВЫРУЧКА (Revenue)                                           │
│  ├── Продажи (gross)        = sales_gross_total                 │
│  ├── Возвраты (gross)       = returns_gross_total (показать -)  │
│  └── Чистые продажи (NET)   = sale_gross_total                  │
│                                                                  │
│  📉 УДЕРЖАНИЯ МАРКЕТПЛЕЙСА (Deductions)                         │
│  ├── Комиссия WB            = total_commission_rub_total        │
│  ├── Логистика              = logistics_cost_total              │
│  ├── Хранение               = storage_cost_total                │
│  ├── Платная приёмка        = paid_acceptance_cost_total        │
│  ├── Штрафы                 = penalties_total                   │
│  ├── Эквайринг              = acquiring_fee_total               │
│  ├── Программа лояльности   = loyalty_fee_total                 │
│  └── Прочие удержания       = other_adjustments_net_total       │
│                                                                  │
│  💰 МАРЖИНАЛЬНЫЙ ДОХОД ДО COGS                                  │
│  └── К перечислению         = payout_total                      │
│                                                                  │
│  📦 СЕБЕСТОИМОСТЬ (COGS) - если 100% покрытие                   │
│  └── COGS                   = SUM(cogs_rub) из weekly_margin_fact│
│                                                                  │
│  💎 ЧИСТАЯ ПРИБЫЛЬ (только при 100% COGS покрытии)              │
│  └── Чистая прибыль         = payout_total - COGS               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stories

### Story 25.1: Исправить Cabinet Summary Dashboard ✅ COMPLETED

**File**: `src/app/(dashboard)/analytics/dashboard/page.tsx`

**Status**: ✅ **COMPLETED** (2025-12-06)

**Changes Applied**:

1. **Backend DTO** (`src/analytics/dto/response/cabinet-summary-response.dto.ts`):
   - Extended `CabinetSummaryTotalsDto` with P&L fields:
     - `sales_gross`, `returns_gross`, `sale_gross` (NET)
     - `total_commission_rub`
     - `logistics_cost`, `storage_cost`, `paid_acceptance_cost`, `penalties`
     - `payout_total` (Маржинальный доход до COGS)

2. **Backend Service** (`src/analytics/weekly-analytics.service.ts`):
   - Modified `aggregateCabinetTotals()` to query BOTH:
     - `weekly_margin_fact` (margin data)
     - `weekly_payout_total` (P&L data)

3. **Frontend Types** (`src/types/analytics.ts`):
   - Extended `CabinetSummaryTotals` interface with P&L fields

4. **Frontend Dashboard** (`src/app/(dashboard)/analytics/dashboard/page.tsx`):
   - Revenue Section: Продажи, Возвраты (negative), Чистые продажи, К перечислению
   - Expenses Section: Комиссия WB, Логистика, Хранение, Платная приёмка, Штрафы
   - COGS/Profit Section:
     - Покрытие COGS, Себестоимость
     - Чистая прибыль (only when coverage ≥ 100%)
     - Alert when COGS coverage < 100%
     - ROI (when available)

**API Endpoint**: `GET /v1/analytics/weekly/cabinet-summary?weeks=N`

**Acceptance Criteria**:

- [x] AC1: KPI Card "Продажи" shows `sales_gross_total`
- [x] AC2: KPI Card "Возвраты" shows `returns_gross_total` with negative indicator
- [x] AC3: KPI Card "Чистые продажи" shows `sale_gross_total`
- [x] AC4: KPI Card "Комиссия WB" shows `total_commission_rub_total`
- [x] AC5: Expenses breakdown shows logistics, storage, penalties separately
- [x] AC6: KPI Card "К перечислению" shows `payout_total`
- [x] AC7: "Чистая прибыль" shown only when COGS coverage = 100%
- [x] AC8: Alert displayed when COGS coverage < 100%
- [ ] AC9: Top Products ranked by `net_for_pay` per SKU (Story 25.4)

---

### Story 25.2: Добавить секцию COGS в Финансовую сводку ✅ COMPLETED

**File**: `src/components/custom/FinancialSummaryTable.tsx`

**Status**: ✅ **COMPLETED** (2025-12-06)

**Changes Applied**:

1. **Backend API** (`src/analytics/weekly-analytics.service.ts`):
   - Added `getWeeklyCogsData()` method to query `weekly_margin_fact`
   - Extended `getWeeklySummary()` to include COGS data
   - New fields: `cogs_total`, `cogs_coverage_pct`, `products_with_cogs`, `products_total`, `gross_profit`

2. **Frontend Types** (`src/hooks/useDashboard.ts`):
   - Added 5 COGS fields to `FinanceSummary` interface

3. **Frontend UI** (`src/components/custom/FinancialSummaryTable.tsx`):
   - New "Себестоимость (COGS)" Card after "Итого к оплате"
   - Shows COGS total, coverage %, products count
   - Alert when no COGS data available
   - Warning when coverage < 100%
   - "Чистая прибыль" Card (emerald border) when coverage = 100%
   - Comparison mode support with pp (percentage points) delta for coverage

**API Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

**Acceptance Criteria**:

- [x] AC1: New Card "Себестоимость" after "Итого к оплате"
- [x] AC2: Shows `cogs_total` value
- [x] AC3: Shows COGS coverage percentage (e.g., "92.5%")
- [x] AC4: "Чистая прибыль" row when coverage = 100%
- [x] AC5: Alert "Внесите себестоимости для N товаров" when < 100%

**Backend Request**: `docs/request-backend/44-cogs-section-in-finance-summary.md` ✅ COMPLETED

---

### Story 25.3: Добавить Комиссию WB в расходы ✅ COMPLETED

**File**: `src/components/custom/FinancialSummaryTable.tsx`

**Status**: ✅ **COMPLETED** (2025-12-06)

**Changes Applied**:

1. **Backend DTO** (`src/analytics/dto/weekly-payout-total.dto.ts`):
   - Added `total_commission_rub_total` field

2. **Backend DTO** (`src/analytics/dto/weekly-payout-summary.dto.ts`):
   - Added `total_commission_rub` field

3. **Backend Mapping** (`src/analytics/weekly-analytics.service.ts`):
   - Added mapping for `totalCommissionRub` → `total_commission_rub`
   - Added mapping for `totalCommissionRubTotal` → `total_commission_rub_total`

4. **Frontend Type** (`src/hooks/useDashboard.ts`):
   - Added `total_commission_rub_total?` and `total_commission_rub?` to `FinanceSummary`

5. **Frontend UI** (`src/components/custom/FinancialSummaryTable.tsx`):
   - Added "Комиссия WB" row as first expense in list

**API Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

**Acceptance Criteria**:

- [x] AC1: New row "Комиссия WB" in Expenses section
- [x] AC2: Shows `total_commission_rub_total` value
- [x] AC3: Position: first in expenses list (most significant)

---

### Story 25.4: Исправить Top Products / Top Brands ✅ COMPLETED

**Files**:

- `src/analytics/weekly-analytics.service.ts` (backend)

**Status**: ✅ **COMPLETED** (2025-12-06)

**Analysis**:
After Story 25.5 fix, `revenue_net_rub` in `weekly_margin_fact` is now correctly calculated as:

```
revenue_net_rub = SUM(net_for_pay for sales) - SUM(net_for_pay for returns)
```

This means the existing ranking logic is already correct - it ranks by `net_for_pay` per SKU.

**Changes Applied**:

- Added clarifying comments to `getTopProducts()` and `getTopBrands()` methods
- Verified ranking is by `net_for_pay` (which is `revenue_net_rub` after Story 25.5 fix)

**Note**: The field is named `revenue_net` in DTO for backward compatibility, but represents `net_for_pay` sum.

**Acceptance Criteria**:

- [x] AC1: Top Products sorted by `net_for_pay` descending (via `revenue_net_rub`)
- [x] AC2: Top Brands aggregated by `net_for_pay` per brand (via `revenue_net_rub`)
- [x] AC3: Contribution % calculated correctly (based on total `revenue_net`)

---

### Story 25.5: Аудит MarginCalculationService ✅ COMPLETED

**File**: `src/analytics/services/margin-calculation.service.ts`

**Status**: ✅ **BUG CONFIRMED AND FIXED**

**Root Cause**:
WB Excel provides POSITIVE values for both sales AND returns. The code was adding
all `net_for_pay` values without considering `doc_type`, causing returns to INCREASE
revenue instead of DECREASE it.

**Evidence (W47 2025-11-17 to 2025-11-23)**:

```sql
-- Raw data shows positive values for returns
SELECT doc_type, SUM(net_for_pay) FROM wb_finance_raw WHERE week = '2025-W47';
-- sale:   212,803.18 (positive)
-- return:   2,750.67 (positive - should be subtracted!)

-- weekly_margin_fact had WRONG value:
-- 212,803.18 + 2,750.67 = 215,553.85 ❌

-- CORRECT value should be:
-- 212,803.18 - 2,750.67 = 210,052.51 ✅
```

**Fix Applied** (2025-12-06):

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

**Files Changed**:

- `src/analytics/services/margin-calculation.service.ts` - Core fix
- `src/analytics/services/__tests__/margin-calculation.service.spec.ts` - Updated test mocks
- `scripts/recalculate-margin-facts.ts` - Recalculation script

**Acceptance Criteria**:

- [x] AC1: Document expected sign convention for all doc_types
- [x] AC2: Verify `calculateRevenueBySku` handles returns correctly
- [x] AC3: Add unit tests for edge cases (sales only, returns only, mixed)
- [x] AC4: Bug confirmed, fixed, recalculation script created

**Post-Fix Action Required**:
Run margin recalculation for all weeks to apply the fix to historical data:

```bash
npx ts-node scripts/recalculate-margin-facts.ts
```

---

## Dependencies

- Backend: `weekly_payout_total` table must have all required columns
- Backend: May need new/updated endpoints for COGS coverage data
- Frontend: May need new hooks for combined data fetching

## Out of Scope

- Detailed analytics page (`/analytics`) redesign (separate discussion)
- SKU/Brand/Category analytics pages (to be audited separately)

## References

- `docs/WB-DASHBOARD-METRICS.md` - WB Dashboard metric definitions
- `frontend/docs/request-backend/43-wb-dashboard-data-discrepancy.md` - Request #43 documentation
- `CLAUDE.md` - Formula definitions and sign conventions

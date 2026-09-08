# Epic 61-FE: Dashboard Data Integration (API Layer)

**Status**: ✅ Complete
**Priority**: P0 (Critical)
**Backend Epics**: N/A (Backend APIs exist, frontend integration issues)
**Story Points**: 34 SP
**Stories**: 13 (all complete)
**Completion Date**: 2026-01-31

---

## Overview

### Problem Statement

Comprehensive API analysis (2026-01-31) identified **critical mismatches** between backend documentation and frontend implementation for the main dashboard page. These issues cause:

1. **Wrong revenue data** - Using `sale_gross` instead of `wb_sales_gross` (retail vs seller revenue)
2. **Incorrect profit formula** - `payout_total - cogs` instead of `sale_gross_total - cogs`
3. **Missing business entities** - Orders volume, COGS по заказам not displayed
4. **No period comparison** - Comparison endpoint not implemented
5. **Wrong period format** - Date ranges instead of ISO weeks for presets
6. **Duplicated logic** - ISO week calculation in 3+ files
7. **Missing daily breakdown** - Business requires day-by-day data

### Business Requirements (from stakeholder diagram)

**8 Required Metrics**:

1. Заказы (Orders volume)
2. COGS по заказам (COGS for orders)
3. Выкупы (Actual sales/redemptions)
4. COGS по выкупам (COGS for sales)
5. Рекламные затраты (Advertising spend)
6. Логистика (Logistics costs)
7. Хранение (Storage costs)
8. **Теор. прибыль = Заказы - COGS - реклама - логистика - хранение**

**Period Modes**:

- По дням за последнюю (актуальную) неделю
- По дням за последний (завершённый) месяц

### Solution

Fix all API integration issues at the data layer:

1. Correct API field mappings
2. Add missing API integrations (Orders, Comparison)
3. Implement proper period handling with ISO weeks
4. Add daily breakdown support
5. Implement theoretical profit calculation

**Note**: This epic focuses on DATA LAYER only. UI/UX changes will be in Epic 62-FE.

---

## Analysis Source

Based on comprehensive subagent analysis of backend documentation:

- `docs/request-backend/121-DASHBOARD-MAIN-PAGE-ORDERS-API.md`
- `docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md`
- `docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md`
- `docs/request-backend/124-DASHBOARD-MAIN-PAGE-PERIODS-API.md`
- `docs/request-backend/125-DASHBOARD-MAIN-PAGE-GUIDE.md`

---

## Dependencies

| Type     | Dependency                             | Status       |
| -------- | -------------------------------------- | ------------ |
| Backend  | `/v1/analytics/orders/volume`          | ✅ Available |
| Backend  | `/v1/analytics/weekly/finance-summary` | ✅ Available |
| Backend  | `/v1/analytics/weekly/comparison`      | ✅ Available |
| Backend  | `/v1/analytics/weekly/trends`          | ✅ Available |
| Backend  | `/v1/analytics/advertising`            | ✅ Available |
| Frontend | Epic 60-FE (Period Context)            | ✅ Completed |

---

## API Endpoints

### Currently Used (with issues)

| Method | Endpoint                               | Issue                                               |
| ------ | -------------------------------------- | --------------------------------------------------- |
| GET    | `/v1/analytics/weekly/finance-summary` | Using wrong field `sale_gross`                      |
| GET    | `/v1/analytics/weekly/trends`          | Requesting `sale_gross` instead of `wb_sales_gross` |
| GET    | `/v1/analytics/advertising`            | Only ROAS, missing total spend                      |

### Need to Add

| Method | Endpoint                                       | Purpose                     |
| ------ | ---------------------------------------------- | --------------------------- |
| GET    | `/v1/analytics/orders/volume`                  | Orders volume for dashboard |
| GET    | `/v1/analytics/weekly/comparison`              | Period comparison           |
| GET    | `/v1/analytics/weekly/by-sku?includeCogs=true` | COGS per order              |
| GET    | `/v1/analytics/unit-economics`                 | Unit economics breakdown    |

---

## Stories

### 🔴 Critical Fixes (P0)

---

### Story 61.1-FE: Fix Revenue Field Mapping

**Estimate**: 2 SP | **Priority**: P0

**Title**: Исправить маппинг поля выручки (sale_gross → wb_sales_gross)

**Problem**:

- `useTrends.ts:80` requests `metrics=sale_gross` instead of `wb_sales_gross`
- `sale_gross` = retail price (цена для покупателя)
- `wb_sales_gross` = seller revenue (выручка продавца после комиссии WB)
- Dashboard shows **incorrect revenue** approximately 33% higher than actual

**Acceptance Criteria**:

- [ ] Change `useTrends.ts` to request `metrics=wb_sales_gross,to_pay_goods`
- [ ] Update `TrendsResponse` type to use `wb_sales_gross`
- [ ] Verify TrendGraph displays correct values
- [ ] Add migration comment explaining the change
- [ ] Update any components consuming trends data

**Files**:

- `src/hooks/useTrends.ts` (line 80)
- `src/types/api.ts` (TrendsDataPoint)

**Verification**:

```typescript
// Before: metrics=sale_gross (WRONG - retail price)
// After: metrics=wb_sales_gross (CORRECT - seller revenue)
```

---

### Story 61.2-FE: Fix Gross Profit Formula

**Estimate**: 2 SP | **Priority**: P0

**Title**: Исправить формулу валовой прибыли

**Problem**:

- `useFinancialSummary.ts:345` calculates: `gross_profit = payout_total - cogs_total`
- `payout_total` already has logistics/storage deducted (это маржинальный доход)
- Correct formula: `gross_profit = sale_gross_total - cogs_total`

**Acceptance Criteria**:

- [ ] Fix formula in `aggregateFinanceSummaries()` function
- [ ] Update `FinanceSummary` type documentation
- [ ] Add unit tests for gross profit calculation
- [ ] Verify dashboard margin % is correct

**Files**:

- `src/hooks/useFinancialSummary.ts` (line 344-346)
- `src/types/finance-summary.ts`

**Verification**:

```typescript
// Before: gross_profit = payout_total - cogs_total (WRONG)
// After: gross_profit = (sale_gross_total || wb_sales_gross) - cogs_total (CORRECT)
```

---

### Story 61.3-FE: Implement Orders Volume API Integration

**Estimate**: 5 SP | **Priority**: P0

**Title**: Интегрировать API объёма заказов

**Problem**:

- Business requires "Заказы" metric on dashboard
- Endpoint exists: `GET /v1/analytics/orders/volume`
- Currently **not used** on dashboard

**Acceptance Criteria**:

- [ ] Create `src/lib/api/orders-volume.ts` with API functions
- [ ] Create TypeScript types for OrdersVolumeResponse
- [ ] Create `useOrdersVolume` hook with proper caching
- [ ] Support `aggregation=day` parameter for daily breakdown
- [ ] Support date range filtering (from, to)
- [ ] Add to query keys factory
- [ ] Export from hooks index

**API Contract** (from backend docs):

```typescript
interface OrdersVolumeParams {
  from: string;      // YYYY-MM-DD
  to: string;        // YYYY-MM-DD
  aggregation?: 'day' | 'hour';
}

interface OrdersVolumeResponse {
  total_orders: number;
  total_amount: number;      // Potential revenue (Заказы)
  avg_order_value: number;
  by_status: {
    new: number;
    confirm: number;
    complete: number;
    cancel: number;
  };
  by_day?: DailyVolume[];    // When aggregation=day
}
```

**Files**:

- `src/lib/api/orders-volume.ts` (NEW)
- `src/types/orders-volume.ts` (NEW)
- `src/hooks/useOrdersVolume.ts` (NEW)

---

### Story 61.4-FE: Implement COGS for Orders

**Estimate**: 3 SP | **Priority**: P0

**Title**: Реализовать COGS по заказам

**Problem**:

- Business requires "COGS по заказам" metric
- Need to calculate COGS based on orders (not just sales)
- Endpoint: `GET /v1/analytics/weekly/by-sku?includeCogs=true`

**Acceptance Criteria**:

- [ ] Add `includeCogs` parameter to by-sku API call
- [ ] Create helper function to calculate total COGS for orders
- [ ] Handle missing COGS flag (`missing_cogs_flag`)
- [ ] Return aggregated COGS amount for order items
- [ ] Add to existing analytics hooks

**Calculation Logic**:

```typescript
// For each order item with nm_id:
// 1. Get COGS from /v1/cogs?nm_id=X or from by-sku response
// 2. Multiply by quantity
// 3. Sum for total COGS по заказам
```

**Files**:

- `src/hooks/useOrdersCogs.ts` (NEW)
- `src/lib/api/analytics.ts` (modify)

---

### Story 61.5-FE: Implement Comparison Endpoint Integration

**Estimate**: 5 SP | **Priority**: P0

**Title**: Интегрировать эндпоинт сравнения периодов

**Problem**:

- Backend provides `GET /v1/analytics/weekly/comparison`
- Frontend does **2 separate requests** instead of using comparison endpoint
- Period presets use date ranges instead of ISO weeks

**Acceptance Criteria**:

- [ ] Create `src/lib/api/analytics-comparison.ts`
- [ ] Create `useAnalyticsComparison` hook
- [ ] Support ISO week format for periods: `period1=2026-W04&period2=2026-W03`
- [ ] Support range format: `period1=2026-W01:W04`
- [ ] Parse comparison response with delta values
- [ ] Return both absolute and percentage changes
- [ ] Support optional `groupBy` (sku, brand, category)

**API Contract**:

```typescript
interface ComparisonParams {
  period1: string;  // "2026-W04" or "2026-W01:W04"
  period2: string;  // "2026-W03" or "2025-W49:W52"
  groupBy?: 'sku' | 'brand' | 'category';
}

interface ComparisonResponse {
  period1: { week: string; ... };
  period2: { week: string; ... };
  delta: {
    revenue: { absolute: number; percent: number };
    profit: { absolute: number; percent: number };
    // ... other metrics
  };
}
```

**Files**:

- `src/lib/api/analytics-comparison.ts` (NEW)
- `src/types/analytics-comparison.ts` (NEW)
- `src/hooks/useAnalyticsComparison.ts` (NEW)

---

### Story 61.6-FE: Fix Period Presets to Use ISO Weeks

**Estimate**: 3 SP | **Priority**: P1

**Title**: Исправить пресеты периодов на ISO-недели

**Problem**:

- `period-presets.ts` generates date ranges (YYYY-MM-DD)
- Comparison endpoint requires ISO weeks (YYYY-Www)
- MoM/QoQ/YoY presets incompatible with backend

**Acceptance Criteria**:

- [ ] Convert calendar months to ISO week ranges
- [ ] MoM: `period1=2026-W01:W05` (Jan weeks) vs `period2=2025-W49:W52` (Dec weeks)
- [ ] QoQ: Convert quarters to week ranges
- [ ] YoY: Same week(s) previous year
- [ ] Use `date-fns` functions for accurate conversion
- [ ] Handle year boundaries correctly

**Files**:

- `src/components/custom/analytics/period-presets.ts`
- `src/lib/period-helpers.ts` (add helper functions)

**Example Conversion**:

```typescript
// Before (WRONG):
period1: { from: '2026-01-01', to: '2026-01-31' }

// After (CORRECT):
period1: '2026-W01:W05'  // January 2026 in ISO weeks
```

---

### Story 61.7-FE: Unify ISO Week Calculation Logic

**Estimate**: 2 SP | **Priority**: P1

**Title**: Унифицировать логику расчёта ISO-недель

**Problem**:

- ISO week calculation duplicated in 3+ files:
  - `useFinancialSummary.ts:148-164`
  - `useTrends.ts:52-63`
  - `useMarginTrends.ts:155-162`
- Risk of divergence if bug in one version

**Acceptance Criteria**:

- [ ] Consolidate all ISO week logic in `src/lib/period-helpers.ts`
- [ ] Export single `getCurrentIsoWeek()` function
- [ ] Export `getWeekRange(numWeeks)` helper
- [ ] Remove duplicate implementations from hooks
- [ ] Add JSDoc documentation
- [ ] Add unit tests

**Files**:

- `src/lib/period-helpers.ts` (enhance)
- `src/hooks/useFinancialSummary.ts` (refactor)
- `src/hooks/useTrends.ts` (refactor)
- `src/hooks/useMarginTrends.ts` (refactor)

---

### 🟡 Important Improvements (P1)

---

### Story 61.8-FE: Add Advertising Total Spend

**Estimate**: 2 SP | **Priority**: P1

**Title**: Добавить общие рекламные затраты

**Problem**:

- Dashboard shows ROAS but not total advertising spend
- Business requires "Рекламные затраты" as separate metric
- Data available in advertising API response

**Acceptance Criteria**:

- [ ] Extract `total_spend` from advertising response
- [ ] Add to dashboard metrics alongside ROAS
- [ ] Include in theoretical profit calculation
- [ ] Handle null/zero spend gracefully

**Files**:

- `src/hooks/useAdvertisingAnalytics.ts`
- `src/lib/advertising-helpers.ts` (if needed)

---

### Story 61.9-FE: Implement Daily Breakdown Support

**Estimate**: 5 SP | **Priority**: P1

**Title**: Реализовать разбивку по дням

**Problem**:

- Business requires "По дням за неделю/месяц" view
- APIs support daily aggregation but not used
- No daily data structure in frontend

**Acceptance Criteria**:

- [ ] Add `aggregation=day` to trends API calls when needed
- [ ] Add `aggregation=day` to orders volume API
- [ ] Create `DailyMetrics` type for daily breakdown
- [ ] Create helper to aggregate daily data by metric
- [ ] Support week mode (7 days) and month mode (28-31 days)
- [ ] Export daily data for chart consumption

**Data Structure**:

```typescript
interface DailyMetrics {
  date: string;        // YYYY-MM-DD
  dayOfWeek: number;   // 1-7 (Monday-Sunday)
  orders: number;
  sales: number;       // wb_sales_gross
  cogs: number;
  advertising: number;
  logistics: number;
  storage: number;
  theoreticalProfit: number;
}
```

**Files**:

- `src/types/daily-metrics.ts` (NEW)
- `src/hooks/useDailyMetrics.ts` (NEW)
- `src/lib/daily-helpers.ts` (NEW)

---

### Story 61.10-FE: Implement Theoretical Profit Calculation

**Estimate**: 3 SP | **Priority**: P0

**Title**: Реализовать расчёт теоретической прибыли

**Problem**:

- Business formula: `Теор. прибыль = Заказы - COGS - реклама - логистика - хранение`
- Current implementation uses different formula
- Need dedicated calculation with all components

**Acceptance Criteria**:

- [ ] Create `calculateTheoreticalProfit()` function
- [ ] Accept all required inputs (orders, cogs, advertising, logistics, storage)
- [ ] Handle null/missing values gracefully
- [ ] Return both value and breakdown
- [ ] Add unit tests with edge cases
- [ ] Document formula in code comments

**Implementation**:

```typescript
interface TheoreticalProfitInput {
  ordersAmount: number;      // From orders volume API
  cogs: number;              // COGS по заказам
  advertisingSpend: number;  // From advertising API
  logisticsCost: number;     // From finance-summary
  storageCost: number;       // From finance-summary
}

interface TheoreticalProfitResult {
  value: number;
  breakdown: {
    orders: number;
    cogs: number;
    advertising: number;
    logistics: number;
    storage: number;
  };
  isComplete: boolean;  // All values present
}

function calculateTheoreticalProfit(input: TheoreticalProfitInput): TheoreticalProfitResult
```

**Files**:

- `src/lib/theoretical-profit.ts` (NEW)
- `src/lib/__tests__/theoretical-profit.test.ts` (NEW)

---

### Story 61.11-FE: Fix 53-Week Year Handling

**Estimate**: 1 SP | **Priority**: P2

**Title**: Исправить обработку годов с 53 неделями

**Problem**:

- `useGeneratedWeeks.ts:37` hardcodes 52 weeks
- Some years have 53 weeks (2020, 2026)
- Causes incorrect week generation at year boundary

**Acceptance Criteria**:

- [ ] Use `date-fns` `getISOWeeksInYear()` instead of hardcoded 52
- [ ] Test year boundary transitions
- [ ] Verify week dropdown shows correct weeks

**Files**:

- `src/components/custom/period-selector/useGeneratedWeeks.ts`

---

### Story 61.12-FE: Increase Advertising Cache Time

**Estimate**: 1 SP | **Priority**: P2

**Title**: Увеличить время кэширования рекламы

**Problem**:

- Backend recommends 30 min cache for advertising
- Frontend uses 30 seconds (staleTime: 30000)
- Causes excessive API calls

**Acceptance Criteria**:

- [ ] Change `staleTime` from 30s to 30min (1800000ms)
- [ ] Verify cache invalidation still works on manual refresh
- [ ] Update comments with cache strategy

**Files**:

- `src/hooks/useAdvertisingAnalytics.ts` (line 135-136)

---

## Technical Notes

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Dashboard Page                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Period      │  │ useDashboard│  │ Theoretical │              │
│  │ Context     │──│ Metrics     │──│ Profit Calc │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │               │                 │                      │
│         ▼               ▼                 ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Aggregated Dashboard Data                   │    │
│  │  - ordersVolume (from useOrdersVolume)                   │    │
│  │  - ordersCogs (from useOrdersCogs)                       │    │
│  │  - sales/wb_sales_gross (from useFinancialSummary)       │    │
│  │  - salesCogs (from useFinancialSummary)                  │    │
│  │  - advertisingSpend (from useAdvertisingAnalytics)       │    │
│  │  - logistics (from useFinancialSummary)                  │    │
│  │  - storage (from useFinancialSummary)                    │    │
│  │  - theoreticalProfit (calculated)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Formulas

```typescript
// Theoretical Profit (Business Formula)
theoreticalProfit = ordersAmount - cogs - advertising - logistics - storage

// Gross Profit (Corrected)
grossProfit = saleGrossTotal - cogsTotal

// Margin Percentage
marginPct = (grossProfit / saleGrossTotal) * 100
```

### API Field Reference

| Business Term     | API Field        | Endpoint                                    |
| ----------------- | ---------------- | ------------------------------------------- |
| Заказы            | `total_amount`   | `/analytics/orders/volume`                  |
| COGS по заказам   | calculated       | `/analytics/weekly/by-sku?includeCogs=true` |
| Выкупы            | `wb_sales_gross` | `/analytics/weekly/finance-summary`         |
| COGS по выкупам   | `cogs_total`     | `/analytics/weekly/finance-summary`         |
| Рекламные затраты | `total_spend`    | `/analytics/advertising`                    |
| Логистика         | `logistics_cost` | `/analytics/weekly/finance-summary`         |
| Хранение          | `storage_cost`   | `/analytics/weekly/finance-summary`         |

---

## File Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── orders-volume.ts          # NEW
│   │   └── analytics-comparison.ts   # NEW
│   ├── period-helpers.ts             # ENHANCE (unified ISO week)
│   ├── theoretical-profit.ts         # NEW
│   ├── daily-helpers.ts              # NEW
│   └── __tests__/
│       └── theoretical-profit.test.ts # NEW
├── types/
│   ├── orders-volume.ts              # NEW
│   ├── analytics-comparison.ts       # NEW
│   └── daily-metrics.ts              # NEW
├── hooks/
│   ├── useOrdersVolume.ts            # NEW
│   ├── useOrdersCogs.ts              # NEW
│   ├── useAnalyticsComparison.ts     # NEW
│   ├── useDailyMetrics.ts            # NEW
│   ├── useTrends.ts                  # MODIFY (fix metrics param)
│   ├── useFinancialSummary.ts        # MODIFY (fix formula)
│   └── useAdvertisingAnalytics.ts    # MODIFY (add spend, fix cache)
└── components/custom/
    ├── period-selector/
    │   └── useGeneratedWeeks.ts      # MODIFY (53-week fix)
    └── analytics/
        └── period-presets.ts         # MODIFY (ISO weeks)
```

---

## Sprint Allocation

| Sprint   | Stories                  |  SP | Focus                                    |
| -------- | ------------------------ | --: | ---------------------------------------- |
| Sprint 1 | 61.1, 61.2, 61.3, 61.10  |  12 | Critical fixes + Orders + Profit formula |
| Sprint 2 | 61.4, 61.5, 61.6, 61.7   |  13 | COGS, Comparison, Period handling        |
| Sprint 3 | 61.8, 61.9, 61.11, 61.12 |   9 | Improvements + Daily breakdown           |

---

## Success Metrics

| Metric                     | Current                             | Target     |
| -------------------------- | ----------------------------------- | ---------- |
| Revenue accuracy           | ~67% (sale_gross vs wb_sales_gross) | 100%       |
| Profit formula correctness | ❌ Wrong                            | ✅ Correct |
| Business metrics coverage  | 4/8                                 | 8/8        |
| Daily breakdown support    | None                                | Full       |
| API calls for comparison   | 2                                   | 1          |
| ISO week handling          | Duplicated                          | Unified    |

---

## Risks & Mitigations

| Risk                                    | Impact | Mitigation                       |
| --------------------------------------- | ------ | -------------------------------- |
| Breaking existing dashboard             | High   | Feature flag for gradual rollout |
| Performance regression (more API calls) | Medium | Parallel fetching, caching       |
| Data inconsistency during migration     | Medium | Side-by-side comparison period   |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests for calculations (≥80% coverage)
- [ ] TypeScript strict mode passes
- [ ] No ESLint errors
- [ ] API responses properly typed
- [ ] Error handling for all API calls
- [ ] Loading states for new data
- [ ] Code review approved

---

## References

- **Backend Docs**: `docs/request-backend/121-125-*.md`
- **Business Diagram**: Stakeholder requirements (2026-01-31)
- **Epic 60-FE**: Dashboard UX Improvements (period context)
- **API Reference**: `../test-api/*.http`

---

**Created**: 2026-01-31
**Author**: Analysis by 5 subagents + consolidation

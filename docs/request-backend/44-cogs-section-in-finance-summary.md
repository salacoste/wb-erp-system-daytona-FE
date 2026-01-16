# Request #44: Add COGS Section to Finance Summary Endpoint

**Date**: 2025-12-06
**Priority**: 🟡 Medium - UX Enhancement
**Status**: ✅ **COMPLETED** - Backend Implementation Ready
**Component**: Backend API - Analytics Module
**Related**: Epic 25 Story 25.2, Story 6.4 (Cabinet Summary)
**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

---

## Executive Summary

Frontend FinancialSummaryTable component on `/analytics` page needs COGS and profit data to display complete P&L information. Currently, the `/v1/analytics/weekly/finance-summary` endpoint returns only payout data from `weekly_payout_summary/total` tables, but does not include COGS/margin data from `weekly_margin_fact`.

**Requested Enhancement**: Extend `finance-summary` endpoint response to include COGS section with:
- COGS total amount
- Product COGS coverage percentage
- Gross profit (only when coverage = 100%)

---

## Current State

### Endpoint: `GET /v1/analytics/weekly/finance-summary?week=2025-W47`

**Current Response Structure** (simplified):
```json
{
  "summary_total": {
    "week": "2025-W47",
    "sales_gross_total": 305778.32,
    "returns_gross_total": 12500.00,
    "sale_gross_total": 293278.32,
    "total_commission_rub_total": 95725.81,
    "logistics_cost_total": 36424.48,
    "storage_cost_total": 1763.35,
    "paid_acceptance_cost_total": 500.00,
    "penalties_total": 150.00,
    "payout_total": 138981.68
    // ❌ No COGS data
  },
  "summary_rus": { /* ... */ },
  "summary_eaeu": { /* ... */ },
  "meta": { "week": "2025-W47", "cabinet_id": "..." }
}
```

**Missing Fields**:
- `cogs_total` - Total COGS amount for week
- `cogs_coverage_pct` - Percentage of products with COGS
- `products_with_cogs` - Count of products with COGS
- `products_total` - Total products in week
- `gross_profit` - Profit when COGS coverage = 100%

---

## Requested Enhancement

### New Fields in `summary_total` Response

```typescript
interface FinanceSummaryTotal {
  // ... existing fields ...

  // NEW: COGS Section (Story 25.2)
  cogs_total: number | null;           // SUM(cogs_rub) from weekly_margin_fact
  cogs_coverage_pct: number | null;    // % of products with COGS assigned
  products_with_cogs: number | null;   // Count of products with COGS
  products_total: number | null;       // Total unique products in week
  gross_profit: number | null;         // payout_total - cogs_total (only when coverage = 100%)
}
```

### Expected Response (with enhancement):
```json
{
  "summary_total": {
    "week": "2025-W47",
    "sales_gross_total": 305778.32,
    "returns_gross_total": 12500.00,
    "sale_gross_total": 293278.32,
    "total_commission_rub_total": 95725.81,
    "logistics_cost_total": 36424.48,
    "storage_cost_total": 1763.35,
    "paid_acceptance_cost_total": 500.00,
    "penalties_total": 150.00,
    "payout_total": 138981.68,

    // NEW COGS Section
    "cogs_total": 85000.00,
    "cogs_coverage_pct": 92.5,
    "products_with_cogs": 74,
    "products_total": 80,
    "gross_profit": null  // null because coverage < 100%
  },
  "summary_rus": { /* ... same new fields ... */ },
  "summary_eaeu": { /* ... same new fields ... */ },
  "meta": { "week": "2025-W47", "cabinet_id": "..." }
}
```

---

## Business Rules

### COGS Coverage Calculation
```sql
-- From weekly_margin_fact for the week
products_total = COUNT(DISTINCT nm_id) WHERE qty > 0
products_with_cogs = COUNT(DISTINCT nm_id) WHERE cogs_rub IS NOT NULL AND cogs_rub > 0
cogs_coverage_pct = (products_with_cogs / products_total) * 100
```

### Gross Profit Calculation
```typescript
// Only calculate when coverage = 100%
if (cogs_coverage_pct === 100) {
  gross_profit = payout_total - cogs_total;
} else {
  gross_profit = null;
}
```

### Edge Cases

| Scenario | Expected Response |
|----------|-------------------|
| No margin data for week | All COGS fields = `null` |
| Zero products | `products_total = 0`, other COGS fields = `null` |
| All products have COGS | `cogs_coverage_pct = 100`, `gross_profit` calculated |
| Partial COGS coverage | `cogs_coverage_pct < 100`, `gross_profit = null` |

---

## SQL Query Reference

```sql
-- COGS aggregation from weekly_margin_fact
SELECT
  COUNT(DISTINCT nm_id) FILTER (WHERE quantity_sold > 0) AS products_total,
  COUNT(DISTINCT nm_id) FILTER (WHERE cogs_rub IS NOT NULL AND cogs_rub > 0) AS products_with_cogs,
  COALESCE(SUM(cogs_rub), 0) AS cogs_total
FROM weekly_margin_fact
WHERE cabinet_id = $1::uuid
  AND week = $2;
```

---

## Impact on Frontend

### Component: `FinancialSummaryTable.tsx`

**New UI Section** (after "Итого к оплате"):

```
┌─────────────────────────────────────────────────────────────┐
│  📦 СЕБЕСТОИМОСТЬ                                           │
├─────────────────────────────────────────────────────────────┤
│  Показатель               │ Значение    │ Сравнение │ Δ%   │
├───────────────────────────┼─────────────┼───────────┼──────┤
│  Себестоимость (COGS)     │ 85 000 ₽    │ 80 000 ₽  │ +6%  │
│  Покрытие COGS            │ 92.5%       │ 88.0%     │ +4pp │
│  Товаров с COGS           │ 74 / 80     │ 66 / 75   │ —    │
├───────────────────────────┴─────────────┴───────────┴──────┤
│  ⚠️ Внесите себестоимости для 6 товаров для расчёта       │
│     чистой прибыли                                          │
└─────────────────────────────────────────────────────────────┘
```

**When COGS coverage = 100%**:
```
┌─────────────────────────────────────────────────────────────┐
│  💎 ЧИСТАЯ ПРИБЫЛЬ                                          │
├─────────────────────────────────────────────────────────────┤
│  Показатель               │ Значение    │ Сравнение │ Δ%   │
├───────────────────────────┼─────────────┼───────────┼──────┤
│  Чистая прибыль           │ 53 981 ₽    │ 48 500 ₽  │ +11% │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- [x] AC1: `cogs_total` field added to `summary_total`, `summary_rus`, `summary_eaeu`
- [x] AC2: `cogs_coverage_pct` field returns percentage (0-100)
- [x] AC3: `products_with_cogs` and `products_total` fields added
- [x] AC4: `gross_profit` calculated only when `cogs_coverage_pct = 100`
- [x] AC5: All new fields return `null` when no margin data exists for week
- [x] AC6: Performance: <500ms additional latency (single JOIN query)
- [ ] AC7: Unit tests for COGS aggregation logic (deferred - existing tests pass)

---

## Implementation Suggestions

### Option A: Extend existing aggregation (Recommended)

Modify `getFinanceSummary()` in `weekly-analytics.service.ts` to:
1. Query `weekly_margin_fact` for COGS aggregates
2. Add new fields to response DTO

**Changes**:
- `src/analytics/dto/weekly-payout-total.dto.ts` - Add COGS fields
- `src/analytics/dto/weekly-payout-summary.dto.ts` - Add COGS fields
- `src/analytics/weekly-analytics.service.ts` - Add COGS query in `getFinanceSummary()`

### Option B: Reuse cabinet-summary logic

The `/v1/analytics/cabinet-summary` endpoint already has COGS aggregation logic in `aggregateCabinetTotals()`. Consider extracting common helper for reuse.

---

## Related Documentation

- **Story 25.2**: `frontend/docs/stories/epic-25-dashboard-data-accuracy.md`
- **Story 6.4**: Cabinet Summary has similar COGS aggregation
- **Data Model**: `weekly_margin_fact` table in CLAUDE.md
- **COGS Guide**: `docs/request-backend/29-cogs-temporal-versioning-and-margin-calculation.md`

---

## Contact

**Reporter**: Frontend Team (Epic 25 Implementation)
**Stakeholders**: Frontend, Backend, Product (CFO Dashboard Requirements)

---

## Status Updates

### 2025-12-06 - ✅ Backend Implementation Completed
**Implemented by**: Backend Team (Story 25.2)

**Files Modified**:
- `src/analytics/dto/weekly-payout-total.dto.ts` - Added 5 COGS fields to `WeeklyPayoutTotalDto`
- `src/analytics/dto/weekly-payout-summary.dto.ts` - Added 5 COGS fields to `WeeklyPayoutSummaryDto`
- `src/analytics/weekly-analytics.service.ts`:
  - Added `CogsMetrics` interface
  - Added `getWeeklyCogsData()` private method (queries `weekly_margin_fact`)
  - Modified `getWeeklySummary()` to fetch and include COGS data
  - Modified `mapSummaryToDto()` and `mapTotalToDto()` to include COGS fields

**Implementation Details**:
1. COGS data is fetched separately by `report_type` (total, основной, по выкупам)
2. SQL uses PostgreSQL `COUNT(DISTINCT) FILTER (WHERE ...)` for efficient aggregation
3. Coverage percentage calculated as `(products_with_cogs / products_total) * 100`
4. `gross_profit` only calculated when `cogs_coverage_pct === 100`
5. All fields return `null` when no margin data exists for the week

**Testing**:
- API endpoint available at: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`
- Test file: `test-api/05-analytics-basic.http`
- Swagger documentation updated automatically via `@ApiProperty` decorators

**Frontend Integration Ready**:
- COGS section now included in all `summary_*` response objects
- Type definitions match requested interface exactly

---

## Backend Response - Full API Example

### Endpoint: `GET /v1/analytics/weekly/finance-summary?week=2025-W47`

**Full Response (with COGS section)**:

```json
{
  "summary_rus": {
    "week": "2025-W47",
    "report_type": "основной",
    "sales_gross": 295808.00,
    "returns_gross": 3143.00,
    "sale_gross": 292665.00,
    "to_pay_goods": 200752.66,
    "total_commission_rub": 91856.34,
    "logistics_cost": 34576.48,
    "storage_cost": 1763.35,
    "paid_acceptance_cost": 500.00,
    "penalties_total": 150.00,
    "wb_commission_adj": 0.00,
    "acquiring_fee_total": 2500.00,
    "commission_sales_total": 7500.00,
    "loyalty_fee": 8000.00,
    "loyalty_points_withheld": 15000.00,
    "loyalty_compensation": 25000.00,
    "other_adjustments_net": 32883.00,
    "seller_delivery_revenue": 0.00,
    "transport_reimbursement_neutral": 0.00,
    "payout_total": 131673.83,
    "transaction_count": 12450,
    "product_transactions": 11200,
    "service_transactions": 1250,
    "cogs_total": 78500.00,
    "cogs_coverage_pct": 92.5,
    "products_with_cogs": 74,
    "products_total": 80,
    "gross_profit": null,
    "created_at": "2025-12-06T10:00:00.000Z",
    "updated_at": "2025-12-06T10:00:00.000Z"
  },
  "summary_eaeu": {
    "week": "2025-W47",
    "report_type": "по выкупам",
    "sales_gross": 9970.32,
    "returns_gross": 856.00,
    "sale_gross": 9114.32,
    "to_pay_goods": 7247.59,
    "total_commission_rub": 3869.00,
    "logistics_cost": 1848.00,
    "storage_cost": 0.00,
    "paid_acceptance_cost": 0.00,
    "penalties_total": 0.00,
    "wb_commission_adj": 0.00,
    "acquiring_fee_total": 0.00,
    "commission_sales_total": 0.00,
    "loyalty_fee": 0.00,
    "loyalty_points_withheld": 0.00,
    "loyalty_compensation": 0.00,
    "other_adjustments_net": 0.00,
    "seller_delivery_revenue": 0.00,
    "transport_reimbursement_neutral": 0.00,
    "payout_total": 5399.59,
    "transaction_count": 250,
    "product_transactions": 225,
    "service_transactions": 25,
    "cogs_total": 6500.00,
    "cogs_coverage_pct": 100.0,
    "products_with_cogs": 8,
    "products_total": 8,
    "gross_profit": -1100.41,
    "created_at": "2025-12-06T10:00:00.000Z",
    "updated_at": "2025-12-06T10:00:00.000Z"
  },
  "summary_total": {
    "week": "2025-W47",
    "sales_gross_total": 305778.32,
    "returns_gross_total": 3999.00,
    "sale_gross_total": 301779.32,
    "to_pay_goods_total": 208000.25,
    "total_commission_rub_total": 95725.34,
    "logistics_cost_total": 36424.48,
    "storage_cost_total": 1763.35,
    "paid_acceptance_cost_total": 500.00,
    "penalties_total": 150.00,
    "wb_commission_adj_total": 0.00,
    "acquiring_fee_total": 2500.00,
    "commission_sales_total": 7500.00,
    "loyalty_fee_total": 8000.00,
    "loyalty_points_withheld_total": 15000.00,
    "loyalty_compensation_total": 25000.00,
    "other_adjustments_net_total": 32883.00,
    "seller_delivery_revenue_total": 0.00,
    "transport_reimbursement_neutral_total": 0.00,
    "payout_total": 137073.42,
    "transaction_count_total": 12700,
    "cogs_total": 85000.00,
    "cogs_coverage_pct": 93.2,
    "products_with_cogs": 82,
    "products_total": 88,
    "gross_profit": null,
    "created_at": "2025-12-06T10:00:00.000Z",
    "updated_at": "2025-12-06T10:00:00.000Z"
  },
  "meta": {
    "week": "2025-W47",
    "cabinet_id": "63e9ebc3-0203-4819-82ed-390f19f92e14",
    "generated_at": "2025-12-06T14:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

---

## Frontend TypeScript Types

**Update your types to include new COGS fields**:

```typescript
// frontend/src/types/analytics.ts or similar

interface FinanceSummaryBase {
  // ... existing fields ...

  // NEW: COGS Section (Request #44)
  cogs_total: number | null;
  cogs_coverage_pct: number | null;
  products_with_cogs: number | null;
  products_total: number | null;
  gross_profit: number | null;  // Only calculated when coverage = 100%
}

interface WeeklyPayoutSummaryDto extends FinanceSummaryBase {
  week: string;
  report_type: 'основной' | 'по выкупам';
  // ... other fields
}

interface WeeklyPayoutTotalDto extends FinanceSummaryBase {
  week: string;
  // *_total fields
}
```

---

## Frontend Integration Notes

### Display Logic for COGS Section

```typescript
// Example React component logic
const renderCogsSection = (summary: WeeklyPayoutTotalDto) => {
  // Case 1: No margin data at all
  if (summary.cogs_total === null) {
    return <EmptyState message="Нет данных о себестоимости" />;
  }

  // Case 2: Partial COGS coverage
  const missingCount = summary.products_total! - summary.products_with_cogs!;
  if (summary.cogs_coverage_pct! < 100) {
    return (
      <>
        <MetricRow label="Себестоимость" value={formatCurrency(summary.cogs_total)} />
        <MetricRow label="Покрытие COGS" value={`${summary.cogs_coverage_pct}%`} />
        <MetricRow label="Товаров с COGS" value={`${summary.products_with_cogs} / ${summary.products_total}`} />
        <Warning>Внесите себестоимости для {missingCount} товаров</Warning>
      </>
    );
  }

  // Case 3: Full coverage - show profit
  return (
    <>
      <MetricRow label="Себестоимость" value={formatCurrency(summary.cogs_total)} />
      <MetricRow label="Чистая прибыль" value={formatCurrency(summary.gross_profit!)} highlight />
    </>
  );
};
```

### Comparison Mode (Story 6.2)

When comparing periods, calculate deltas for COGS fields:

```typescript
const calculateCogsDelta = (current: WeeklyPayoutTotalDto, previous: WeeklyPayoutTotalDto) => ({
  cogs_delta: current.cogs_total !== null && previous.cogs_total !== null
    ? current.cogs_total - previous.cogs_total
    : null,
  coverage_delta_pp: current.cogs_coverage_pct !== null && previous.cogs_coverage_pct !== null
    ? current.cogs_coverage_pct - previous.cogs_coverage_pct  // percentage points
    : null,
  profit_delta: current.gross_profit !== null && previous.gross_profit !== null
    ? current.gross_profit - previous.gross_profit
    : null,
});
```

---

### 2025-12-06 - Request Created
- Documented need for COGS data in finance-summary endpoint
- Specified new fields and business rules
- Frontend implementation blocked until backend provides data

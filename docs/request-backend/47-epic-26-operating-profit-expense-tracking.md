# Request #47: Epic 26 - Per-SKU Operating Profit & Expense Tracking

**Date**: 2025-12-06
**Priority**: 🟢 Complete - New Feature Available
**Status**: ✅ **IMPLEMENTED** - Backend fully implemented, data populated
**Component**: Backend API - Analytics Module
**Related**: Epic 26, Request #45 (Cabinet Summary P&L), Request #46 (COGS Coverage)

---

## Executive Summary

Backend now provides complete **Operating Profit & Expense Tracking** at SKU, Brand, Category, and Cabinet levels:

- **Per-SKU expenses**: Логистика, хранение, штрафы, эквайринг, лояльность, комиссии
- **Operating Profit**: Валовая прибыль минус все операционные расходы
- **Dormant Inventory**: Товары с расходами, но без продаж (has_revenue = false)

---

## New API Fields Available

### By SKU Analytics (`/v1/analytics/weekly/by-sku?includeCogs=true`)

```typescript
interface SkuAnalyticsDto {
  // Existing fields...
  nm_id: string;
  sa_name: string;
  revenue_net_rub: string;
  profit_rub?: string;
  margin_pct?: number;

  // NEW: Epic 26 Operating Expenses
  logistics_cost_rub?: string;       // Логистика
  storage_cost_rub?: string;         // Хранение
  penalties_rub?: string;            // Штрафы
  paid_acceptance_cost_rub?: string; // Платная приёмка
  acquiring_fee_rub?: string;        // Эквайринг
  loyalty_fee_rub?: string;          // Лояльность
  loyalty_compensation_rub?: string; // Компенсация лояльности
  commission_rub?: string;           // Комиссия
  other_adjustments_rub?: string;    // Прочие корректировки

  // NEW: Calculated Operating Metrics
  total_expenses_rub?: string;       // Сумма всех расходов
  operating_profit_rub?: string;     // Операционная прибыль (может быть отрицательной!)
  operating_margin_pct?: number;     // Операционная маржа %

  // NEW: Dormant Inventory Flag
  has_revenue?: boolean;             // false = товар с расходами без продаж
}
```

### By Brand Analytics (`/v1/analytics/weekly/by-brand?includeCogs=true`)

```typescript
interface BrandAnalyticsDto {
  // Existing fields...
  brand: string;
  total_skus: number;
  revenue_net: number;
  profit?: number;
  margin_pct?: number;

  // NEW: Epic 26 Aggregated Expenses
  storage_cost?: number;
  penalties?: number;
  paid_acceptance_cost?: number;
  acquiring_fee?: number;
  loyalty_fee?: number;
  loyalty_compensation?: number;
  commission?: number;
  other_adjustments?: number;
  total_expenses?: number;
  operating_profit?: number;
  operating_margin_pct?: number | null;

  // NEW: Dormant SKU count
  skus_with_expenses_only?: number;  // Кол-во SKU без продаж, но с расходами
}
```

### By Category Analytics (`/v1/analytics/weekly/by-category?includeCogs=true`)

Same fields as Brand Analytics, aggregated by category (subject_name).

### Cabinet Summary (`/v1/analytics/weekly/cabinet-summary`)

```typescript
interface CabinetSummaryTotals {
  // Existing P&L from weekly_payout_total (Request #45)
  sales_gross: number | null;
  returns_gross: number | null;
  sale_gross: number | null;
  total_commission_rub: number | null;
  logistics_cost: number | null;
  storage_cost: number | null;
  paid_acceptance_cost: number | null;
  penalties: number | null;
  payout_total: number | null;

  // Existing margin fields
  revenue_net: number;
  cogs_total: number | null;
  profit: number | null;
  margin_pct: number | null;
  qty: number;
  profit_per_unit: number | null;
  roi: number | null;

  // NEW: Epic 26 Operating Expenses from weekly_margin_fact
  acquiring_fee: number | null;         // Эквайринг (aggregated)
  loyalty_fee: number | null;           // Лояльность (aggregated)
  loyalty_compensation: number | null;  // Компенсация лояльности (aggregated)
  other_adjustments: number | null;     // Прочие корректировки (aggregated)
  commission: number | null;            // Комиссия из margin_fact
  total_expenses: number | null;        // Общие расходы (SUM from margin_fact)
  operating_profit: number | null;      // Операционная прибыль
  operating_margin_pct: number | null;  // Операционная маржа %
  skus_with_expenses_only: number | null; // SKU без продаж с расходами
}
```

---

## Business Logic

### Operating Profit Formula

```
Выручка нетто (revenue_net)
- COGS (себестоимость)
= Валовая прибыль (gross_profit)

- Логистика (logistics_cost)
- Хранение (storage_cost)
- Штрафы (penalties)
- Платная приёмка (paid_acceptance)
- Эквайринг (acquiring_fee)
- Лояльность (loyalty_fee)
+ Компенсация лояльности (loyalty_compensation)
- Комиссия (commission)
± Прочие корректировки (other_adjustments)
= ОПЕРАЦИОННАЯ ПРИБЫЛЬ (operating_profit)
```

### Key Metrics

| Метрика | Формула | Описание |
|---------|---------|----------|
| `total_expenses` | SUM(все расходы) | Общие операционные расходы |
| `operating_profit` | gross_profit - total_expenses | Может быть отрицательной (убыток) |
| `operating_margin_pct` | (operating_profit / revenue_net) × 100 | Операционная рентабельность |
| `skus_with_expenses_only` | COUNT(WHERE has_revenue = false) | Товары на складе без продаж |

### Dormant Inventory (Товары без продаж)

Товары с `has_revenue = false`:
- Есть расходы (логистика, хранение)
- Нет продаж (revenue_net = 0)
- Operating profit = отрицательный (чистый убыток)

**Пример:**
```json
{
  "nm_id": "255211393",
  "sa_name": "dormant-product",
  "revenue_net_rub": "0",
  "logistics_cost_rub": "173.17",
  "storage_cost_rub": "50.00",
  "total_expenses_rub": "223.17",
  "operating_profit_rub": "-223.17",
  "operating_margin_pct": null,
  "has_revenue": false
}
```

---

## Sample API Responses

### By SKU (with expenses)

```bash
curl -s "/v1/analytics/weekly/by-sku?week=2025-W47&includeCogs=true&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"
```

```json
{
  "data": [
    {
      "nm_id": "321678606",
      "sa_name": "product-123",
      "revenue_net_rub": "18037.04",
      "cogs_rub": "29700.00",
      "profit_rub": "-11662.96",
      "margin_pct": -64.66,
      "logistics_cost_rub": "7683.26",
      "storage_cost_rub": "245.50",
      "acquiring_fee_rub": "180.37",
      "loyalty_fee_rub": "90.19",
      "total_expenses_rub": "8199.32",
      "operating_profit_rub": "-19862.28",
      "operating_margin_pct": -110.12,
      "has_revenue": true
    }
  ]
}
```

### Cabinet Summary

```bash
curl -s "/v1/analytics/weekly/cabinet-summary?weeks=4" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"
```

```json
{
  "summary": {
    "period": { "start": "2025-W45", "end": "2025-W48", "weeks_count": 4 },
    "totals": {
      "sales_gross": 850000.00,
      "returns_gross": 15000.00,
      "sale_gross": 835000.00,
      "revenue_net": 483500.00,
      "cogs_total": 180000.00,
      "profit": 303500.00,
      "margin_pct": 62.77,

      "acquiring_fee": 8500.00,
      "loyalty_fee": 4250.00,
      "loyalty_compensation": 2500.00,
      "other_adjustments": 1500.00,
      "commission": 75000.00,
      "total_expenses": 188750.00,
      "operating_profit": 114750.00,
      "operating_margin_pct": 23.73,
      "skus_with_expenses_only": 36
    },
    "products": { "total": 120, "with_cogs": 95, "coverage_pct": 79.17 }
  }
}
```

---

## Frontend Integration Guide

### 1. Update TypeScript Types

Add to `frontend/src/types/analytics.ts`:

```typescript
// Epic 26: Operating Expenses (SKU level)
interface SkuOperatingExpenses {
  logistics_cost_rub?: string;
  storage_cost_rub?: string;
  penalties_rub?: string;
  paid_acceptance_cost_rub?: string;
  acquiring_fee_rub?: string;
  loyalty_fee_rub?: string;
  loyalty_compensation_rub?: string;
  commission_rub?: string;
  other_adjustments_rub?: string;
  total_expenses_rub?: string;
  operating_profit_rub?: string;
  operating_margin_pct?: number | null;
  has_revenue?: boolean;
}

// Epic 26: Operating Expenses (aggregated level)
interface AggregatedOperatingExpenses {
  storage_cost?: number;
  penalties?: number;
  paid_acceptance_cost?: number;
  acquiring_fee?: number;
  loyalty_fee?: number;
  loyalty_compensation?: number;
  commission?: number;
  other_adjustments?: number;
  total_expenses?: number;
  operating_profit?: number;
  operating_margin_pct?: number | null;
  skus_with_expenses_only?: number;
}
```

### 2. Display Operating Profit

```tsx
// Negative values = loss (display in red)
const OperatingProfitCell = ({ value }: { value: number | null }) => {
  if (value === null) return <span>—</span>;

  const isLoss = value < 0;
  return (
    <span className={isLoss ? 'text-red-600' : 'text-green-600'}>
      {formatCurrency(value)}
    </span>
  );
};
```

### 3. Display Dormant Inventory Warning

```tsx
const DormantInventoryBadge = ({ count }: { count: number | null }) => {
  if (!count || count === 0) return null;

  return (
    <Badge variant="warning">
      {count} товаров без продаж (только расходы)
    </Badge>
  );
};
```

### 4. Operating Margin Formatting

```tsx
// operating_margin_pct can be null (for expense-only SKUs with revenue=0)
// and can be very negative (losses exceed revenue)
const formatOperatingMargin = (pct: number | null): string => {
  if (pct === null) return '—';
  return `${pct.toFixed(2)}%`;
};
```

---

## Database Schema (Reference)

`weekly_margin_fact` table now includes:

```sql
-- Epic 26: Operating Expenses per SKU
logistics_cost_rub         DECIMAL(18,2)
storage_cost_rub           DECIMAL(18,2)
paid_acceptance_cost_rub   DECIMAL(18,2)
penalties_rub              DECIMAL(18,2)
acquiring_fee_rub          DECIMAL(18,2)
loyalty_fee_rub            DECIMAL(18,2)
loyalty_compensation_rub   DECIMAL(18,2)
other_adjustments_rub      DECIMAL(18,2)
commission_rub             DECIMAL(18,2)

-- Calculated Operating Metrics
total_expenses_rub         DECIMAL(18,2)
operating_profit_rub       DECIMAL(18,2)
operating_margin_percent   DECIMAL(8,4)

-- Dormant inventory flag
has_revenue                BOOLEAN DEFAULT true
```

---

## Acceptance Criteria

- [x] AC1: SKU analytics includes all expense fields when `includeCogs=true` ✅
- [x] AC2: Brand/Category analytics aggregates expenses correctly ✅
- [x] AC3: Cabinet Summary includes `total_expenses`, `operating_profit`, `operating_margin_pct` ✅
- [x] AC4: Negative operating profit values returned correctly (losses) ✅
- [x] AC5: `skus_with_expenses_only` counts dormant inventory ✅
- [x] AC6: Historical data recalculated (16 weeks) ✅

---

## Data Verification

### Current Data (2025-12-06)

```
Week     | Rows | Logistics  | Total Expenses | Op.Profit  | Expense-Only SKUs
---------|------|------------|----------------|------------|------------------
2025-W48 | 90   | 263,108 ₽  | 339,301 ₽      | -64,292 ₽  | 36
2025-W47 | 93   | 180,777 ₽  | 278,879 ₽      | 154,363 ₽  | 42
2025-W46 | 78   | 139,390 ₽  | 230,741 ₽      | 150,350 ₽  | 27
2025-W45 | 54   | 118,244 ₽  | 207,769 ₽      | 210,936 ₽  | 6
```

**Note**: W48 shows negative operating profit (убыток) - this is expected when expenses exceed gross profit.

---

## References

- **Epic 26 PRD**: `docs/epics/epic-26-per-sku-operating-profit.md`
- **Backend Service**: `src/analytics/weekly-analytics.service.ts`
- **DTOs**:
  - `src/analytics/dto/response/sku-analytics.dto.ts`
  - `src/analytics/dto/response/brand-analytics.dto.ts`
  - `src/analytics/dto/response/category-analytics.dto.ts`
  - `src/analytics/dto/response/cabinet-summary-response.dto.ts`
- **API Tests**: `test-api/05-analytics-basic.http`, `test-api/06-analytics-advanced.http`

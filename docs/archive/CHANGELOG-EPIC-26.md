# CHANGELOG: Epic 26 - Per-SKU Operating Profit & Expense Tracking

**Date**: 2025-12-06
**Status**: ✅ COMPLETE
**Reference**: `docs/request-backend/47-epic-26-operating-profit-expense-tracking.md`

---

## Summary

Epic 26 adds **Operating Profit & Expense Tracking** at SKU, Brand, Category, and Cabinet levels. This enables sellers to see the true profitability after all operating expenses (logistics, storage, penalties, commissions, etc.) are deducted from gross profit.

---

## Features Implemented

### 1. TypeScript Types Updated

**Files Modified:**

- `src/types/analytics.ts`
- `src/types/cogs.ts`

**New Interfaces:**

```typescript
// Epic 26: Operating Expenses at SKU level
interface SkuOperatingExpenses {
  logistics_cost_rub?: string
  storage_cost_rub?: string
  penalties_rub?: string
  paid_acceptance_cost_rub?: string
  acquiring_fee_rub?: string
  loyalty_fee_rub?: string
  loyalty_compensation_rub?: string
  commission_rub?: string
  other_adjustments_rub?: string
  total_expenses_rub?: string
  operating_profit_rub?: string
  operating_margin_pct?: number | null
  has_revenue?: boolean  // false = dormant inventory
}

// Epic 26: Operating Expenses at aggregated level
interface AggregatedOperatingExpenses {
  storage_cost?: number
  penalties?: number
  paid_acceptance_cost?: number
  acquiring_fee?: number
  loyalty_fee?: number
  loyalty_compensation?: number
  commission?: number
  other_adjustments?: number
  total_expenses?: number
  operating_profit?: number
  operating_margin_pct?: number | null
  skus_with_expenses_only?: number
}
```

**Extended Interfaces:**

- `CabinetSummaryTotals` - Added Epic 26 operating expense fields
- `TopProductItem` - Added operating metrics
- `TopBrandItem` - Added operating metrics and dormant SKU count
- `MarginAnalyticsSku` - Added 13 new expense fields
- `MarginAnalyticsAggregated` - Added 12 new expense fields

---

### 2. Margin Tables Updated (3 tables)

**Files Modified:**

- `src/components/custom/MarginBySkuTable.tsx`
- `src/components/custom/MarginByBrandTable.tsx`
- `src/components/custom/MarginByCategoryTable.tsx`

**New Features:**

- **New Column**: "Опер. прибыль" (Operating Profit) with sortable header
- **Color Coding**: Green for profit, Red for loss
- **Dormant Indicator**: 💤 emoji for products with `has_revenue = false`
- **Tooltip**: Shows total expenses, operating margin %, and dormant SKU count

**Sort Field Added:**

```typescript
export type SortField = '...' | 'operating_profit'
```

---

### 3. Cabinet Summary Dashboard Updated

**File Modified:**

- `src/app/(dashboard)/analytics/dashboard/page.tsx`

**New Section: "Операционная прибыль"**

Displays after COGS and Profit section when `operating_profit` data is available:

| Metric        | Description                                           |
| ------------- | ----------------------------------------------------- |
| Общие расходы | Total operating expenses                              |
| Опер. прибыль | Operating profit (green) or Операционный убыток (red) |
| Опер. маржа % | Operating margin percentage                           |
| Без продаж    | Count of dormant inventory (💤)                       |

**Visual Design:**

- Card border turns red when operating profit is negative
- Dormant inventory count shown with 💤 emoji in amber color
- All values colored appropriately (red for negative, green for positive)

---

### 4. Test Updates

**File Modified:**

- `src/hooks/__tests__/useCabinetSummary.test.ts`

**Changes:**

- Updated mock data to include all required `CabinetSummaryTotals` fields
- Added Epic 26 fields to mock response
- Fixed API URL path: `/v1/analytics/weekly/cabinet-summary`

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

### Dormant Inventory

Products with `has_revenue = false`:

- Have expenses (logistics, storage) but no sales
- Operating profit is always negative (pure loss)
- Marked with 💤 indicator in UI
- Counted in `skus_with_expenses_only`

---

## API Integration

### Endpoints Used

| Endpoint                                            | Epic 26 Fields            |
| --------------------------------------------------- | ------------------------- |
| `/v1/analytics/weekly/by-sku?includeCogs=true`      | SKU-level expenses        |
| `/v1/analytics/weekly/by-brand?includeCogs=true`    | Brand-level aggregates    |
| `/v1/analytics/weekly/by-category?includeCogs=true` | Category-level aggregates |
| `/v1/analytics/weekly/cabinet-summary`              | Cabinet-level totals      |

### Field Types

**SKU Level** (strings - API returns Decimal as string):

- `logistics_cost_rub`, `storage_cost_rub`, `penalties_rub`, etc.
- `operating_profit_rub`, `total_expenses_rub`

**Aggregated Level** (numbers - already converted):

- `storage_cost`, `penalties`, `paid_acceptance_cost`, etc.
- `operating_profit`, `total_expenses`

---

## UI Components

### Color Coding

| Value      | Color | CSS Class        |
| ---------- | ----- | ---------------- |
| Profit > 0 | Green | `text-green-600` |
| Loss < 0   | Red   | `text-red-600`   |
| Null       | Gray  | `text-gray-400`  |

### Dormant Inventory Indicator

```tsx
{isDormant && <span className="ml-1 text-xs">💤</span>}
```

Shown when:

- SKU level: `item.has_revenue === false`
- Aggregated level: `item.skus_with_expenses_only > 0`

---

## Files Changed

| File                                               | Changes                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/types/analytics.ts`                           | Added `SkuOperatingExpenses`, `AggregatedOperatingExpenses`, extended existing types |
| `src/types/cogs.ts`                                | Extended `MarginAnalyticsSku`, `MarginAnalyticsAggregated`                           |
| `src/components/custom/MarginBySkuTable.tsx`       | Added operating_profit sort, column, and cell                                        |
| `src/components/custom/MarginByBrandTable.tsx`     | Added operating_profit sort, column, and cell                                        |
| `src/components/custom/MarginByCategoryTable.tsx`  | Added operating_profit sort, column, and cell                                        |
| `src/app/(dashboard)/analytics/dashboard/page.tsx` | Added "Операционная прибыль" section                                                 |
| `src/hooks/__tests__/useCabinetSummary.test.ts`    | Updated mock data and URL paths                                                      |

---

## Related Documentation

- **Backend Request**: `docs/request-backend/47-epic-26-operating-profit-expense-tracking.md`
- **Epic 25**: `docs/CHANGELOG-EPIC-25.md` (Dashboard Data Accuracy)
- **Epic 6**: `docs/CHANGELOG-EPIC-6-FE.md` (Advanced Analytics)

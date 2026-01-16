# Request #65: Operating Margin Consistency for Category & Brand Pages

**Date**: 2025-12-21
**Status**: IMPLEMENTED
**Priority**: High
**Epic**: Epic 26 - Per-SKU Operating Profit & Expense Tracking

## Problem Description

### Symptom
Category page (`/analytics/category`) showed **66.52%** margin while SKU page (`/analytics/sku`) showed **46.8%** for the same week (W50). Both pages displayed "операционная маржа" label, but values were drastically different.

### Root Cause Analysis

1. **Different margin types were displayed**:
   - SKU page: **Operating margin** = (revenue - COGS - all expenses) / revenue ≈ 46.8%
   - Category page: **Gross margin** = (revenue - COGS) / revenue ≈ 66.52%

2. **Backend methods returned different fields**:
   - `getWeeklyBySku` and single-week methods: Include `operating_margin_pct`
   - `aggregateByCategoryForRange`: Did NOT include `operating_margin_pct` or expense fields
   - `aggregateByBrandForRange`: Did NOT include `operating_margin_pct` or expense fields

3. **Frontend used date range even for single week**:
   - When user selects Week 50, frontend sends `weekStart=2024-W50&weekEnd=2024-W50`
   - This triggers the "range" endpoint which was missing operating expense fields
   - Frontend fallback logic used `margin_pct` (gross margin) when `operating_margin_pct` was unavailable

## Solution

### Backend Changes

#### File: `src/analytics/weekly-analytics.service.ts`

##### 1. Method `aggregateByCategoryForRange` (lines 2731-2838)

**Added to SQL query type definition:**
```typescript
// Epic 26: Operating expenses
storage_cost_rub: Decimal;
penalties_rub: Decimal;
paid_acceptance_cost_rub: Decimal;
acquiring_fee_rub: Decimal;
loyalty_fee_rub: Decimal;
loyalty_compensation_rub: Decimal;
commission_rub: Decimal;
other_adjustments_rub: Decimal;
total_expenses_rub: Decimal;
operating_profit_rub: Decimal;
operating_margin_pct: Decimal | null;
```

**Added to SQL SELECT:**
```sql
-- Epic 26: Operating expenses aggregates
COALESCE(SUM(storage_cost_rub), 0) as storage_cost_rub,
COALESCE(SUM(penalties_rub), 0) as penalties_rub,
COALESCE(SUM(paid_acceptance_cost_rub), 0) as paid_acceptance_cost_rub,
COALESCE(SUM(acquiring_fee_rub), 0) as acquiring_fee_rub,
COALESCE(SUM(loyalty_fee_rub), 0) as loyalty_fee_rub,
COALESCE(SUM(loyalty_compensation_rub), 0) as loyalty_compensation_rub,
COALESCE(SUM(commission_rub), 0) as commission_rub,
COALESCE(SUM(other_adjustments_rub), 0) as other_adjustments_rub,
COALESCE(SUM(total_expenses_rub), 0) as total_expenses_rub,
COALESCE(SUM(operating_profit_rub), 0) as operating_profit_rub,
CASE
  WHEN ABS(SUM(revenue_net_rub)) > 0
  THEN (SUM(operating_profit_rub) / ABS(SUM(revenue_net_rub))) * 100
  ELSE NULL
END as operating_margin_pct
```

**Added to response mapping:**
```typescript
// Epic 26: Operating expenses
storage_cost_rub: row.storage_cost_rub.toString(),
penalties_rub: row.penalties_rub.toString(),
paid_acceptance_cost_rub: row.paid_acceptance_cost_rub.toString(),
acquiring_fee_rub: row.acquiring_fee_rub.toString(),
loyalty_fee_rub: row.loyalty_fee_rub.toString(),
loyalty_compensation_rub: row.loyalty_compensation_rub.toString(),
commission_rub: row.commission_rub.toString(),
other_adjustments_rub: row.other_adjustments_rub.toString(),
total_expenses_rub: row.total_expenses_rub.toString(),
operating_profit_rub: row.operating_profit_rub.toString(),
operating_margin_pct: row.operating_margin_pct ? Number(row.operating_margin_pct) : null,
```

##### 2. Method `aggregateByBrandForRange` (lines 2591-2704)

**Same additions as category method, but with different field naming convention:**

```typescript
// Epic 26: Operating expenses
storage_cost: Decimal;
penalties: Decimal;
paid_acceptance_cost: Decimal;
acquiring_fee: Decimal;
loyalty_fee: Decimal;
loyalty_compensation: Decimal;
commission: Decimal;
other_adjustments: Decimal;
total_expenses: Decimal;
operating_profit: Decimal;
operating_margin_pct: Decimal | null;
```

**Response mapping:**
```typescript
// Epic 26: Operating expenses
storage_cost: Number(row.storage_cost),
penalties: Number(row.penalties),
paid_acceptance_cost: Number(row.paid_acceptance_cost),
acquiring_fee: Number(row.acquiring_fee),
loyalty_fee: Number(row.loyalty_fee),
loyalty_compensation: Number(row.loyalty_compensation),
commission: Number(row.commission),
other_adjustments: Number(row.other_adjustments),
total_expenses: Number(row.total_expenses),
operating_profit: Number(row.operating_profit),
operating_margin_pct: row.operating_margin_pct ? Number(row.operating_margin_pct) : null,
```

### Frontend Changes

#### File: `frontend/src/hooks/useMarginAnalytics.ts`

##### 1. Hook `useMarginAnalyticsByCategory` (lines 409-441)

**Added field mapping in transformation:**
```typescript
// Epic 26: Operating expenses and profit
storage_cost: item.storage_cost_rub ? parseFloat(item.storage_cost_rub) : undefined,
penalties: item.penalties_rub ? parseFloat(item.penalties_rub) : undefined,
paid_acceptance_cost: item.paid_acceptance_cost_rub ? parseFloat(item.paid_acceptance_cost_rub) : undefined,
acquiring_fee: item.acquiring_fee_rub ? parseFloat(item.acquiring_fee_rub) : undefined,
loyalty_fee: item.loyalty_fee_rub ? parseFloat(item.loyalty_fee_rub) : undefined,
loyalty_compensation: item.loyalty_compensation_rub ? parseFloat(item.loyalty_compensation_rub) : undefined,
commission: item.commission_rub ? parseFloat(item.commission_rub) : undefined,
other_adjustments: item.other_adjustments_rub ? parseFloat(item.other_adjustments_rub) : undefined,
total_expenses: item.total_expenses_rub ? parseFloat(item.total_expenses_rub) : undefined,
operating_profit: item.operating_profit_rub ? parseFloat(item.operating_profit_rub) : undefined,
operating_margin_pct: item.operating_margin_pct,
skus_with_expenses_only: item.skus_with_expenses_only,
```

##### 2. Hook `useMarginAnalyticsByBrand` (lines 290-322)

**Same additions for brand transformation.**

#### File: `frontend/src/app/(dashboard)/analytics/category/page.tsx`

**Added fallback logic for margin calculation:**
```typescript
avgMargin: (() => {
  // Epic 31 fix: Use operating_margin_pct for consistency with SKU page
  // Fallback chain: operating_margin_pct → calculated from operating_profit → margin_pct
  const getOperatingMargin = (item: typeof data.data[0]): number | null => {
    // 1. Direct operating_margin_pct from API
    if (item.operating_margin_pct !== undefined && item.operating_margin_pct !== null) {
      return item.operating_margin_pct
    }
    // 2. Calculate from operating_profit / revenue_net
    if (item.operating_profit !== undefined && item.operating_profit !== null && item.revenue_net > 0) {
      return (item.operating_profit / item.revenue_net) * 100
    }
    // 3. Fallback to margin_pct (gross margin)
    if (item.margin_pct !== undefined && item.margin_pct !== null) {
      return item.margin_pct
    }
    return null
  }

  const margins = data.data.map(getOperatingMargin).filter((m): m is number => m !== null)
  if (margins.length === 0) return null

  return margins.reduce((sum, m) => sum + m, 0) / margins.length
})(),
```

#### File: `frontend/src/app/(dashboard)/analytics/brand/page.tsx`

**Same fallback logic as category page.**

## Data Flow

### Before Fix
```
Frontend (category page)
    ↓ weekStart=2024-W50&weekEnd=2024-W50
Backend aggregateByCategoryForRange
    ↓ Returns: margin_pct (gross margin only)
Frontend hook transformation
    ↓ operating_margin_pct = undefined
Frontend page calculation
    ↓ Fallback to margin_pct = 66.52%
Display: "операционная маржа: 66.52%" ❌ WRONG
```

### After Fix
```
Frontend (category page)
    ↓ weekStart=2024-W50&weekEnd=2024-W50
Backend aggregateByCategoryForRange
    ↓ Returns: margin_pct, operating_margin_pct, operating_profit_rub, etc.
Frontend hook transformation
    ↓ operating_margin_pct = 46.8
Frontend page calculation
    ↓ Uses operating_margin_pct directly
Display: "операционная маржа: 46.8%" ✅ CORRECT
```

## Database Source

All expense data comes from `weekly_margin_fact` table which contains:

| Column | Description |
|--------|-------------|
| `revenue_net_rub` | Net revenue (К перечислению) |
| `cogs_rub` | Cost of Goods Sold |
| `gross_profit_rub` | Gross Profit = revenue - COGS |
| `logistics_cost_rub` | Logistics (delivery + return) |
| `storage_cost_rub` | Storage costs |
| `penalties_rub` | Penalties |
| `paid_acceptance_cost_rub` | Paid acceptance |
| `acquiring_fee_rub` | Acquiring fee |
| `loyalty_fee_rub` | Loyalty program fee |
| `loyalty_compensation_rub` | Loyalty compensation |
| `commission_rub` | WB Commission |
| `other_adjustments_rub` | Other adjustments |
| `total_expenses_rub` | Sum of all expenses |
| `operating_profit_rub` | Operating Profit = gross_profit - total_expenses |
| `operating_margin_percent` | Operating Margin % = (operating_profit / revenue) × 100 |

## Verification

After fix, all three pages should show consistent margin values:

| Page | Week | Margin Type | Expected Value |
|------|------|-------------|----------------|
| `/analytics/sku` | W50 | Operating | ~46-47% |
| `/analytics/category` | W50 | Operating | ~46-47% |
| `/analytics/brand` | W50 | Operating | ~46-47% |

Note: Slight variations are possible due to:
- Rounding during aggregation
- Different averaging methods (simple average vs weighted average)

## Related Files

- `src/analytics/weekly-analytics.service.ts` - Backend service
- `src/analytics/dto/response/category-analytics.dto.ts` - Category DTO
- `src/analytics/dto/response/brand-analytics.dto.ts` - Brand DTO
- `frontend/src/hooks/useMarginAnalytics.ts` - Frontend hooks
- `frontend/src/app/(dashboard)/analytics/category/page.tsx` - Category page
- `frontend/src/app/(dashboard)/analytics/brand/page.tsx` - Brand page
- `frontend/src/types/cogs.ts` - Frontend types

## Related Requests

- Request #47: Epic 26 - Operating Profit & Expense Tracking
- Request #60: Per-SKU Operational Costs
- Request #63: Operating Profit Formula Clarification

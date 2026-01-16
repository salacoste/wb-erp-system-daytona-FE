# Request #69: Add revenue_gross to Category/Brand Analytics API

**Date**: 2025-12-22
**Status**: ✅ COMPLETED
**Completed**: 2025-12-22
**Priority**: MEDIUM
**Related**: Request #68 (SKU Financials other_adjustments)

## Problem

Operating margin calculation uses different revenue bases across analytics pages:

| Page | Revenue Base | Formula | Result |
|------|--------------|---------|--------|
| **SKU** | `revenue.gross` | profit / gross_revenue | ~15% |
| **Category** | `revenue_net` | profit / net_revenue | ~21% |
| **Brand** | `revenue_net` | profit / net_revenue | ~21% |
| **Cashflow** | `sales_gross` | profit / sales_gross | ~15% |

This causes **user confusion** when comparing margins across different views.

## Business Requirement

User specified:
> "маржа должна считаться за сумму от цены продажи до комиссий маркетплейса и эквайринга"

Translation: Margin should be calculated from the sale price **BEFORE** marketplace commission and acquiring fees.

## Current State

### SKU Financials API (`/v1/analytics/sku-financials`)
✅ Returns both:
- `sales.revenue_gross` - gross revenue (retail_price_with_discount)
- `sales.revenue_net` - net revenue (net_for_pay, after commission)

Frontend updated to use `revenue.gross` for margin calculation.

### Category API (`/v1/analytics/weekly/by-category`)
❌ Only returns:
- `revenue_net` - net revenue per category

Missing: `revenue_gross`

### Brand API (`/v1/analytics/weekly/by-brand`)
❌ Only returns:
- `revenue_net` - net revenue per brand

Missing: `revenue_gross`

## Requested Changes

### 1. Category Analytics Response

Add `revenue_gross` field to each category item:

```typescript
interface CategoryAnalyticsItem {
  category: string
  revenue_net: number       // existing
  revenue_gross: number     // NEW: sum of retail_price_with_discount
  operating_profit: number
  operating_margin_pct: number  // should be: operating_profit / revenue_gross * 100
  // ... other fields
}
```

### 2. Brand Analytics Response

Add `revenue_gross` field to each brand item:

```typescript
interface BrandAnalyticsItem {
  brand: string
  revenue_net: number       // existing
  revenue_gross: number     // NEW: sum of retail_price_with_discount
  operating_profit: number
  operating_margin_pct: number  // should be: operating_profit / revenue_gross * 100
  // ... other fields
}
```

### 3. Margin Calculation Update

Update `operating_margin_pct` calculation in both APIs:

```typescript
// Current (INCONSISTENT with SKU page):
operating_margin_pct = (operating_profit / revenue_net) * 100

// Should be (CONSISTENT with SKU page):
operating_margin_pct = (operating_profit / revenue_gross) * 100
```

## SQL Reference

`revenue_gross` can be aggregated from `wb_finance_raw`:

```sql
-- For Category aggregation
SELECT
  category,
  SUM(CASE WHEN doc_type = 'Продажа' THEN retail_price_with_discount ELSE 0 END) as sales_gross,
  SUM(CASE WHEN doc_type = 'Возврат' THEN retail_price_with_discount ELSE 0 END) as returns_gross,
  (sales_gross - returns_gross) as revenue_gross
FROM wb_finance_raw
WHERE cabinet_id = ? AND sale_dt >= ? AND sale_dt < ?
GROUP BY category
```

## Expected Result

After implementation:
- **SKU page**: ~15% margin (profit / revenue_gross)
- **Category page**: ~15% margin (same formula)
- **Brand page**: ~15% margin (same formula)
- **Cashflow section**: ~15% margin (profit / sales_gross)

All views show **consistent margin** based on gross revenue (before commissions).

## Frontend Changes (2025-12-22)

✅ All frontend changes completed:

1. **`useMarginAnalytics.ts`**: Already updated by backend to map `revenue_gross`
2. **Category page** (`analytics/category/page.tsx`): Updated `avgMargin` to use `revenue_gross`
3. **Brand page** (`analytics/brand/page.tsx`): Updated `avgMargin` to use `revenue_gross`
4. **SKU page** (`analytics/sku/page.tsx`): Updated `avgMargin` to use `revenue.gross`

All pages now use consistent margin formula:
```
operating_margin = operating_profit / revenue_gross * 100
```

## Related Documentation

- [Request #68: SKU Financials other_adjustments](./68-sku-financials-missing-other-adjustments.md)
- [docs/63-operating-profit-formula-clarification.md](../63-operating-profit-formula-clarification.md)

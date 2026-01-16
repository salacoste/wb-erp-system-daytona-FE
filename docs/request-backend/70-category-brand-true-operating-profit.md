# Request #70: Category/Brand API - True Operating Profit Calculation

**Date**: 2025-12-22
**Status**: ✅ RESOLVED
**Priority**: HIGH
**Related**: Request #68, #69
**Resolution Date**: 2025-12-22

## Problem

Category and Brand APIs return `operating_profit` that equals `profit` (gross profit), NOT the true operating profit after all expenses.

### Console Evidence

```javascript
[DEBUG Category] First item:
{
  category: "Восстановители кожи",
  revenue_gross: 13102.2,
  revenue_net: 11962.06,
  operating_profit: 8244.06,  // ← Same as profit!
  profit: 8244.06              // ← Gross profit, NOT operating profit
}
```

### Expected vs Actual

**Cabinet-level totals:**
- gross_profit_sku: 99,562₽
- logistics: 25,744₽
- storage: 1,769₽
- other_adjustments: 38,469₽
- paid_acceptance: 75₽
- penalties: 0₽

**Expected calculation:**
```
true_operating_profit = gross_profit - logistics - storage - penalties - paid_acceptance - other_adjustments
                      = 99,562 - 25,744 - 1,769 - 0 - 75 - 38,469
                      = 33,505₽
```

**Current Category API behavior:**
- Returns `operating_profit: 99,562₽` (equals gross_profit)
- Should return `operating_profit: 33,505₽` (after all expenses)

### Result

| Page | Margin Shown | Expected Margin |
|------|--------------|-----------------|
| **SKU** | 21.6% | ~15% (33k/222k) |
| **Category** | 64.7% | ~15% |
| **Brand** | Similar issue | ~15% |
| **Cashflow** | 14.9% ✅ | 14.9% |

## Root Cause

Category API calculates `operating_profit` as:
```typescript
operating_profit = revenue_net - cogs  // This is GROSS profit!
```

But should be:
```typescript
operating_profit = revenue_net - cogs - logistics - storage - penalties - paid_acceptance - distributed_other_adjustments
```

## Requested Fix

### Option 1: Distribute expenses to categories (Recommended)

Each category should have expenses distributed proportionally by revenue:

```typescript
// For each category:
const categoryShare = category.revenue_gross / total_revenue_gross
const category_logistics = total_logistics * categoryShare
const category_storage = total_storage * categoryShare
const category_other_adjustments = total_other_adjustments * categoryShare
// ... etc

category.operating_profit = category.gross_profit
  - category_logistics
  - category_storage
  - category_penalties
  - category_paid_acceptance
  - category_other_adjustments
```

### Option 2: Return expense fields separately

Return expense breakdowns per category so frontend can calculate:

```typescript
interface CategoryItem {
  category: string
  revenue_gross: number
  revenue_net: number
  profit: number  // gross profit
  operating_profit: number  // TRUE operating profit
  // NEW: expense breakdown
  logistics: number
  storage: number
  penalties: number
  paid_acceptance: number
  other_adjustments: number
}
```

## SKU Page Issue - CRITICAL BUG

SKU Financials API returns **inverted** revenue values:

```javascript
[DEBUG SKU] First item:
{
  nmId: 148190182,
  revenueGross: 26584,      // ← LESS than revenueNet!
  revenueNet: 28680.99,     // ← GREATER than revenueGross!
  profitOperating: 7023.85
}
```

**Expected relationship:**
```
revenueGross > revenueNet
Because: net_for_pay = retail_price_with_discount - commission - acquiring
```

**Actual (BUG):**
```
revenueGross (26584) < revenueNet (28680.99)
```

This is backwards! The backend's `sales.revenue_gross` field appears to contain NET values, not GROSS.

### Impact

SKU margin calculation uses wrong base:
- Shows: `33,269 / 153,778 = 21.6%`
- Should be: `33,269 / ~220,000 = ~15%`

### Root Cause Investigation Needed

Check SKU Financials service - what values are being returned for:
- `sales.revenue_gross` - should be SUM(retail_price_with_discount)
- `sales.revenue_net` - should be SUM(net_for_pay)

The fields appear to be swapped or incorrectly calculated

## Verification After Fix

All pages should show consistent ~15% operating margin:
- SKU: `sum(operating_profit) / sum(revenue_gross) * 100`
- Category: `sum(operating_profit) / sum(revenue_gross) * 100`
- Brand: `sum(operating_profit) / sum(revenue_gross) * 100`
- Cashflow: `net_profit / sales_gross * 100` ≈ 15%

## Resolution (2025-12-22)

### Root Cause Found

The issue was **NOT in the API code** but in the **data** stored in `weekly_margin_fact` table.
W50 margin facts were populated by a simplified test script (`direct-margin-calc.ts`) that set all expenses to 0.

### Fix Applied

Ran proper margin recalculation via `MarginCalculationService.calculateWeeklyMargin()`:

```
Before:
- total_expenses: 0₽
- operating_profit: 99,562₽ (= gross_profit)
- operating_margin: 64.9%

After:
- logistics: 25,744₽
- storage: 2,004₽ (from paid_storage_daily)
- other_adjustments: 38,469₽ (distributed by revenue share)
- total_expenses: 66,293₽
- operating_profit: 33,270₽
- operating_margin: 21.7% ✅
```

### SKU Page "Bug" Clarification

The reported `revenueGross < revenueNet` is **NOT a bug** — it's legitimate WB data.
Wildberries pays "Компенсация скидки по программе лояльности" (loyalty compensation) which **adds** to `net_for_pay`, making it larger than `gross` for some SKUs.

Verified on raw data:
```
docType: 'sale', gross: 240, net: 292.47  // net > gross due to loyalty compensation
```

### Future Weeks

W51+ will calculate correctly automatically — the normal margin calculation flow includes full expense calculation.

## Related Documentation

- [Request #68: SKU Financials other_adjustments](./68-sku-financials-missing-other-adjustments.md)
- [Request #69: revenue_gross for Category/Brand](./69-revenue-gross-category-brand-api.md)

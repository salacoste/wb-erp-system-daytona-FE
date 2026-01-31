# Story 61.1-FE: Fix Revenue Field Mapping

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 2 SP

---

## Title

Исправить маппинг поля выручки (sale_gross → wb_sales_gross)

---

## Problem Statement

The trends API request uses incorrect field `sale_gross` instead of `wb_sales_gross`:

| Field | Value | What It Means |
|-------|-------|---------------|
| `sale_gross` | ~197,000₽ | Retail price (цена для покупателя) |
| `wb_sales_gross` | ~131,000₽ | Seller revenue after WB commission (выручка продавца) |

**Impact**: Dashboard shows **~50% higher revenue** than actual seller earnings.

---

## Root Cause

**File**: `src/hooks/useTrends.ts`, line 80

```typescript
// CURRENT (WRONG):
const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=sale_gross,to_pay_goods`

// CORRECT:
const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=wb_sales_gross,to_pay_goods`
```

---

## Acceptance Criteria

- [ ] Change `useTrends.ts` to request `metrics=wb_sales_gross,to_pay_goods`
- [ ] Update `TrendsDataPoint` type if field name changes
- [ ] Update any data transformations that reference `sale_gross`
- [ ] Verify TrendGraph component displays correct values
- [ ] Add comment explaining the difference between fields
- [ ] Manually verify dashboard shows lower (correct) revenue

---

## Technical Implementation

### 1. Update useTrends.ts

```typescript
// src/hooks/useTrends.ts

// Line ~80: Change metrics parameter
const endpoint = `/v1/analytics/weekly/trends?from=${from}&to=${to}&metrics=wb_sales_gross,to_pay_goods`;

// Add explanatory comment above the line:
// NOTE: Use wb_sales_gross (seller revenue after WB commission), NOT sale_gross (retail price)
// Difference: sale_gross includes WB's ~33% commission, wb_sales_gross is actual seller earnings
```

### 2. Update Types (if needed)

```typescript
// src/types/api.ts

interface TrendsDataPoint {
  week: string;
  // CHANGED: was sale_gross, now wb_sales_gross
  wb_sales_gross: number;  // Seller revenue after WB commission
  to_pay_goods: number;    // Amount to be paid to seller
}
```

### 3. Update TrendGraph data mapping (if needed)

```typescript
// src/components/custom/TrendGraph.tsx

// If there's a mapping like:
data.map(d => ({ revenue: d.sale_gross, ... }))

// Change to:
data.map(d => ({ revenue: d.wb_sales_gross, ... }))
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useTrends.ts` | Change `metrics=sale_gross` → `metrics=wb_sales_gross` |
| `src/types/api.ts` | Update `TrendsDataPoint` interface (if field name differs) |
| `src/components/custom/TrendGraph.tsx` | Update data mapping (if needed) |

---

## Verification Steps

1. **Before fix**: Note current revenue value on dashboard (e.g., 197,000₽)
2. **Apply fix**: Change the metrics parameter
3. **After fix**: Verify revenue shows lower value (e.g., ~131,000₽)
4. **Cross-check**: Compare with WB Seller Dashboard for same period

---

## Definition of Done

- [ ] Code change implemented
- [ ] TypeScript compiles without errors
- [ ] Dashboard shows correct revenue (lower than before)
- [ ] TrendGraph tooltip shows "wb_sales_gross" or equivalent label
- [ ] Code review approved
- [ ] Comment added explaining field difference

---

## References

- Backend doc: `docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md` (section: sales_gross vs wb_sales_gross)
- Related: Story 61.2-FE (Gross Profit formula also affected)

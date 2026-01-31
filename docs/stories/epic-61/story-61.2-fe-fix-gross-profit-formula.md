# Story 61.2-FE: Fix Gross Profit Formula

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 2 SP

---

## Title

Исправить формулу валовой прибыли

---

## Problem Statement

The `aggregateFinanceSummaries()` function calculates gross profit incorrectly:

| Formula | Calculation | Result |
|---------|-------------|--------|
| **Current (WRONG)** | `payout_total - cogs_total` | Uses post-deduction amount |
| **Correct** | `sale_gross_total - cogs_total` | Uses actual revenue |

**Why it's wrong**: `payout_total` already has logistics, storage, commissions deducted. It's "маржинальный доход" (marginal income), not gross revenue.

---

## Root Cause

**File**: `src/hooks/useFinancialSummary.ts`, lines 344-346

```typescript
// CURRENT (WRONG):
if (result.cogs_coverage_pct === 100 && result.payout_total && result.cogs_total) {
  result.gross_profit = result.payout_total - result.cogs_total
}

// CORRECT:
if (result.cogs_coverage_pct === 100 && result.sale_gross_total && result.cogs_total) {
  result.gross_profit = result.sale_gross_total - result.cogs_total
}
```

---

## Acceptance Criteria

- [ ] Fix formula in `aggregateFinanceSummaries()` function
- [ ] Use `sale_gross_total` (or `wb_sales_gross` if that's what we want) as revenue base
- [ ] Add fallback: `sale_gross_total || wb_sales_gross` for compatibility
- [ ] Update margin percentage calculation to use same base
- [ ] Add unit tests for gross profit calculation
- [ ] Document the correct formula in code comments

---

## Technical Implementation

### 1. Fix aggregateFinanceSummaries()

```typescript
// src/hooks/useFinancialSummary.ts, line ~344

// Add explanatory comment:
/**
 * Gross Profit Calculation:
 * gross_profit = revenue - COGS
 *
 * Where revenue = sale_gross_total (net sales after returns)
 * NOT payout_total (which already has logistics/storage deducted)
 *
 * Formula: gross_profit = sale_gross_total - cogs_total
 * Margin %: margin_pct = (gross_profit / sale_gross_total) * 100
 */

// Fix the calculation:
if (result.cogs_coverage_pct === 100 && result.cogs_total !== null) {
  // Use sale_gross_total as the revenue base (net sales after returns)
  const revenue = result.sale_gross_total ?? result.wb_sales_gross ?? 0;

  if (revenue > 0) {
    result.gross_profit = revenue - result.cogs_total;
    result.margin_pct = (result.gross_profit / revenue) * 100;
  }
}
```

### 2. Add Unit Test

```typescript
// src/hooks/__tests__/useFinancialSummary.test.ts

describe('aggregateFinanceSummaries', () => {
  it('calculates gross_profit correctly using sale_gross_total', () => {
    const summaries = [{
      sale_gross_total: 100000,  // Revenue
      payout_total: 60000,       // After deductions (NOT used)
      cogs_total: 40000,         // COGS
      cogs_coverage_pct: 100,
    }];

    const result = aggregateFinanceSummaries(summaries);

    // Correct: 100000 - 40000 = 60000
    expect(result.gross_profit).toBe(60000);

    // Wrong would be: 60000 - 40000 = 20000
    expect(result.gross_profit).not.toBe(20000);

    // Margin: 60000 / 100000 * 100 = 60%
    expect(result.margin_pct).toBe(60);
  });

  it('handles missing sale_gross_total by falling back to wb_sales_gross', () => {
    const summaries = [{
      wb_sales_gross: 80000,
      cogs_total: 30000,
      cogs_coverage_pct: 100,
    }];

    const result = aggregateFinanceSummaries(summaries);

    expect(result.gross_profit).toBe(50000);
  });
});
```

---

## Financial Concepts Reference

| Term | API Field | Description |
|------|-----------|-------------|
| **Gross Revenue** | `sales_gross` | Total sales at retail price |
| **Net Sales** | `sale_gross_total` | Sales minus returns |
| **Seller Revenue** | `wb_sales_gross` | After WB commission |
| **Payout** | `payout_total` | After ALL deductions (logistics, storage, etc.) |
| **COGS** | `cogs_total` | Cost of Goods Sold |
| **Gross Profit** | calculated | `sale_gross_total - cogs_total` |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useFinancialSummary.ts` | Fix formula in `aggregateFinanceSummaries()` |
| `src/hooks/__tests__/useFinancialSummary.test.ts` | Add unit tests (NEW or modify) |
| `src/types/finance-summary.ts` | Add documentation comments |

---

## Verification Steps

1. **Before fix**: Note gross_profit and margin_pct values
2. **Apply fix**: Change the formula
3. **After fix**: Gross profit should be HIGHER (using larger revenue base)
4. **Sanity check**: `gross_profit = sale_gross_total - cogs_total`
5. **Run tests**: `npm test useFinancialSummary`

---

## Definition of Done

- [ ] Formula fixed in aggregateFinanceSummaries()
- [ ] Fallback logic for missing fields
- [ ] Unit tests added and passing
- [ ] TypeScript compiles
- [ ] Margin % on dashboard shows correct value
- [ ] Code comments explain the formula
- [ ] Code review approved

---

## References

- Backend doc: `docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md`
- Related: Story 61.1-FE (Revenue field also needs fixing)

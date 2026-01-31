# Story 61.13-FE: Fix Inconsistent Margin Calculation Between Week and Month Views

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 3 SP

---

## Title

Исправить несоответствие расчёта маржи между недельным и месячным периодами

---

## User Story

**As a** business owner reviewing dashboard metrics,
**I want** margin percentage to be calculated consistently across all time periods,
**So that** I can trust the metrics and make accurate business decisions without confusion.

---

## Problem Statement

The Dashboard displays **different margin formulas** depending on the selected period:

| Period | Formula Used | Margin Type | Example Value |
|--------|-------------|-------------|---------------|
| **Week (W04)** | `(payout_total - cogs) / sale_gross` | Net Margin | 12.92% |
| **Month (January)** | `(sale_gross - cogs) / sale_gross` | Gross Margin | 72.32% |

**User Impact**: A 5x difference in margin values (12% vs 72%) causes significant confusion and undermines trust in the dashboard.

---

## Root Cause Analysis

**Investigation Date**: 2026-01-31
**Validation Script**: `scripts/validate-margin-data.ts`

### Evidence from Data Validation

**Week W04 (2025-01-20 to 2025-01-26)**:
```
sale_gross_total: 126,922.45 ₽
payout_total: 52,219.92 ₽
cogs_total: 35,818 ₽
gross_profit (API): 16,401.92 ₽

Expected Net Margin: (52,219.92 - 35,818) / 126,922.45 = 12.92%
Expected Gross Margin: (126,922.45 - 35,818) / 126,922.45 = 71.77%
```

**Month (4 weeks aggregated)**:
```
sale_gross_total: 676,244.80 ₽
payout_total: 226,248.26 ₽
cogs_total: 187,200 ₽
gross_profit (API): 46,538.93 ₽

If using Gross Margin formula: (676,244.80 - 187,200) / 676,244.80 = 72.32%
If using Net Margin formula: (226,248.26 - 187,200) / 676,244.80 = 5.77%
```

### Affected Files

| File | Line | Issue |
|------|------|-------|
| `src/hooks/financial/aggregation.ts` | 109-111 | Calculates `gross_profit` but not `margin_pct` |
| `src/components/custom/FinancialSummaryTable.tsx` | 446 | Uses `payout_total` in margin display |
| `src/hooks/financial/hooks.ts` | 65-66 | Month aggregation loses margin context |

### Code Evidence

**aggregation.ts (line 109-111)**:
```typescript
// Only calculates gross_profit, no margin_pct
if (result.cogs_coverage_pct === 100 && result.sale_gross_total && result.cogs_total) {
  result.gross_profit = result.sale_gross_total - result.cogs_total
}
// Missing: result.margin_pct calculation
```

**FinancialSummaryTable.tsx (line 446)**:
```typescript
// Uses payout_total (Net Margin) not sale_gross_total (Gross Margin)
Маржа: {payoutTotal > 0 ? ((grossProfit / payoutTotal) * 100).toFixed(1) : 0}%
```

---

## Acceptance Criteria

### Required
- [ ] **AC1**: Define single source of truth for margin formula across entire frontend
- [ ] **AC2**: Margin % shows identical formula for week and month periods
- [ ] **AC3**: `aggregateFinanceSummaries()` calculates `margin_pct` field after aggregation
- [ ] **AC4**: All margin displays use the same base (either `sale_gross_total` OR `payout_total`, not both)
- [ ] **AC5**: Unit tests validate margin consistency across period types
- [ ] **AC6**: TypeScript types include `margin_pct` field in aggregation result

### Nice to Have
- [ ] **AC7**: Add tooltip explaining margin calculation to user
- [ ] **AC8**: E2E test comparing week vs month margin values

---

## Technical Implementation

### Step 1: Add margin_pct to aggregation.ts

```typescript
// src/hooks/financial/aggregation.ts, after line 110

/**
 * Story 61.13: Margin Calculation Consistency Fix
 * margin_pct = (gross_profit / revenue) * 100
 *
 * DECISION: Use sale_gross_total (Gross Margin) as the standard
 * This represents margin before WB deductions (logistics, storage, etc.)
 *
 * Alternative: Use payout_total (Net Margin) for "after WB fees" margin
 * Business must decide which metric is more valuable.
 */
if (result.gross_profit !== undefined && result.sale_gross_total && result.sale_gross_total > 0) {
  result.margin_pct = (result.gross_profit / result.sale_gross_total) * 100
}
```

### Step 2: Update FinancialSummaryTable.tsx (line 446)

```typescript
// BEFORE (inconsistent):
Маржа: {payoutTotal > 0 ? ((grossProfit / payoutTotal) * 100).toFixed(1) : 0}%

// AFTER (consistent with aggregation.ts):
Маржа: {saleGross > 0 ? ((grossProfit / saleGross) * 100).toFixed(1) : 0}%
```

### Step 3: Add TypeScript type

```typescript
// src/hooks/financial/types.ts or wherever FinanceSummary is defined
interface FinanceSummary {
  // ... existing fields ...
  margin_pct?: number  // Calculated: (gross_profit / sale_gross_total) * 100
}
```

### Step 4: Unit Tests

```typescript
// src/hooks/__tests__/useFinancialSummary.test.ts

describe('Story 61.13: Margin Calculation Consistency', () => {
  describe('aggregateFinanceSummaries', () => {
    it('calculates margin_pct using sale_gross_total (Gross Margin)', () => {
      const summaries = [{
        sale_gross_total: 100000,
        payout_total: 60000,
        cogs_total: 40000,
        gross_profit: 60000, // sale_gross - cogs
        cogs_coverage_pct: 100,
      }]

      const result = aggregateFinanceSummaries(summaries)

      // Gross Margin: (100000 - 40000) / 100000 = 60%
      expect(result.margin_pct).toBe(60)

      // NOT Net Margin: (60000 - 40000) / 100000 = 20%
      expect(result.margin_pct).not.toBe(20)
    })

    it('produces same margin_pct for single week and aggregated weeks', () => {
      const weekData = {
        sale_gross_total: 50000,
        cogs_total: 20000,
        cogs_coverage_pct: 100,
      }

      // Single week
      const singleResult = aggregateFinanceSummaries([weekData])

      // 4 weeks (same proportions)
      const monthData = [weekData, weekData, weekData, weekData]
      const monthResult = aggregateFinanceSummaries(monthData)

      // Both should have 60% margin
      expect(singleResult.margin_pct).toBe(60)
      expect(monthResult.margin_pct).toBe(60)
    })
  })
})
```

---

## Business Decision Required

**QUESTION**: Which margin formula should be the standard?

| Option | Formula | Pros | Cons |
|--------|---------|------|------|
| **Gross Margin** | `(sale_gross - cogs) / sale_gross` | Industry standard, higher values look better | Doesn't reflect WB fees impact |
| **Net Margin** | `(payout - cogs) / sale_gross` | Shows real profit after WB fees | Lower values may alarm users |

**Recommendation**: Use **Gross Margin** as the primary metric with clear labeling ("Валовая маржа" vs "Чистая маржа").

---

## Test Cases

### Manual Testing

1. **Compare Week vs Month**
   - Select Week W04 → Note margin %
   - Select Month January → Note margin %
   - EXPECTED: Same margin % (or very close, proportional to data)

2. **Boundary Cases**
   - 0 revenue → Should show "—" not "0%" or error
   - 0 COGS → Should show 100% (or close to it)
   - Negative gross_profit → Should show negative %

### Automated Testing

```bash
npm test -- --grep "61.13"
npm run test:e2e -- --grep "margin consistency"
```

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/financial/aggregation.ts` | MODIFY | Add `margin_pct` calculation |
| `src/hooks/financial/types.ts` | MODIFY | Add `margin_pct` to FinanceSummary type |
| `src/components/custom/FinancialSummaryTable.tsx` | MODIFY | Use consistent margin formula |
| `src/components/custom/dashboard/PeriodComparisonSection.tsx` | CHECK | Verify uses same formula |
| `src/components/custom/dashboard/trends-config.ts` | CHECK | Verify margin_pct source |
| `src/hooks/__tests__/useFinancialSummary.test.ts` | MODIFY | Add consistency tests |

---

## Verification Steps

1. **Before Fix**:
   - Week W04: 12.92%
   - Month January: 72.32%
   - Difference: ~59 percentage points

2. **After Fix**:
   - Week W04: ~72% (if using Gross Margin)
   - Month January: ~72%
   - Difference: < 1 percentage point (due to rounding)

3. **Validation Command**:
   ```bash
   npx ts-node scripts/validate-margin-data.ts
   ```

---

## Definition of Done

- [ ] Single margin formula applied across all period types
- [ ] `aggregateFinanceSummaries()` calculates `margin_pct`
- [ ] All margin displays use the aggregated `margin_pct` value
- [ ] Unit tests for margin calculation consistency
- [ ] E2E test comparing week vs month (optional)
- [ ] TypeScript compiles without errors
- [ ] No regression in existing functionality
- [ ] Code review approved
- [ ] Documentation updated with chosen formula

---

## Related Stories

- **Story 61.2-FE**: Fix Gross Profit Formula (prerequisite)
- **Story 61.1-FE**: Fix Revenue Field (related)
- **Story 62.8-FE**: Period Comparison Section (uses margin_pct)

---

## References

- Investigation notes: 2026-01-31 margin bug analysis
- Validation script: `scripts/validate-margin-data.ts`
- Backend API: `GET /v1/analytics/weekly/finance-summary`
- Business Logic: `docs/BUSINESS-LOGIC-REFERENCE.md`

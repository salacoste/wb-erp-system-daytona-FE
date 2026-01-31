# Story 61.10-FE: Theoretical Profit Calculation

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 3 SP

---

## Title

Реализовать расчёт теоретической прибыли

---

## Business Requirement

From stakeholder diagram (2026-01-31):

```
Теор. прибыль = Заказы - COGS - рекламные затраты - логистика - хранение
```

This is **different** from current "Валовая прибыль" (Gross Profit) calculation.

---

## Problem Statement

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Gross Profit** (current) | `revenue - COGS` | Margin on actual sales |
| **Theoretical Profit** (needed) | `orders - COGS - ads - logistics - storage` | Potential profit from ALL orders |

The theoretical profit shows **potential earnings** if all orders were fulfilled, accounting for all major costs.

---

## Acceptance Criteria

- [ ] Create `calculateTheoreticalProfit()` function
- [ ] Accept all 5 inputs: orders, COGS, advertising, logistics, storage
- [ ] Return value and breakdown object
- [ ] Handle null/undefined values gracefully
- [ ] Return `isComplete` flag if all values present
- [ ] Add comprehensive unit tests
- [ ] Export from lib/index for easy import

---

## Technical Implementation

### 1. Create theoretical-profit.ts

```typescript
// src/lib/theoretical-profit.ts

/**
 * Theoretical Profit Calculation
 *
 * Business Formula:
 * Теор. прибыль = Заказы - COGS - рекламные затраты - логистика - хранение
 *
 * This represents POTENTIAL profit from all orders (not just sales),
 * accounting for all major operational costs.
 */

export interface TheoreticalProfitInput {
  /** Total order amount (Заказы) - potential revenue */
  ordersAmount: number | null;

  /** Cost of Goods Sold for orders (COGS по заказам) */
  cogs: number | null;

  /** Total advertising spend (Рекламные затраты) */
  advertisingSpend: number | null;

  /** Logistics costs (Логистика) */
  logisticsCost: number | null;

  /** Storage costs (Хранение) */
  storageCost: number | null;
}

export interface TheoreticalProfitBreakdown {
  orders: number;
  cogs: number;
  advertising: number;
  logistics: number;
  storage: number;
}

export interface TheoreticalProfitResult {
  /** Calculated theoretical profit value */
  value: number;

  /** Breakdown of all components */
  breakdown: TheoreticalProfitBreakdown;

  /** True if all input values were present (non-null) */
  isComplete: boolean;

  /** List of missing fields if any */
  missingFields: string[];
}

/**
 * Calculate theoretical profit based on business formula
 *
 * @param input - All required cost components
 * @returns Profit value with breakdown and completeness indicator
 *
 * @example
 * const result = calculateTheoreticalProfit({
 *   ordersAmount: 500000,
 *   cogs: 200000,
 *   advertisingSpend: 50000,
 *   logisticsCost: 30000,
 *   storageCost: 10000,
 * });
 * // result.value = 210000
 * // result.isComplete = true
 */
export function calculateTheoreticalProfit(
  input: TheoreticalProfitInput
): TheoreticalProfitResult {
  const missingFields: string[] = [];

  // Check for missing values
  if (input.ordersAmount === null || input.ordersAmount === undefined) {
    missingFields.push('ordersAmount');
  }
  if (input.cogs === null || input.cogs === undefined) {
    missingFields.push('cogs');
  }
  if (input.advertisingSpend === null || input.advertisingSpend === undefined) {
    missingFields.push('advertisingSpend');
  }
  if (input.logisticsCost === null || input.logisticsCost === undefined) {
    missingFields.push('logisticsCost');
  }
  if (input.storageCost === null || input.storageCost === undefined) {
    missingFields.push('storageCost');
  }

  // Use 0 for null values in calculation
  const orders = input.ordersAmount ?? 0;
  const cogs = input.cogs ?? 0;
  const advertising = input.advertisingSpend ?? 0;
  const logistics = input.logisticsCost ?? 0;
  const storage = input.storageCost ?? 0;

  // Calculate: Orders - COGS - Advertising - Logistics - Storage
  const value = orders - cogs - advertising - logistics - storage;

  return {
    value,
    breakdown: {
      orders,
      cogs,
      advertising,
      logistics,
      storage,
    },
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Calculate theoretical profit margin percentage
 *
 * @param profitValue - Calculated profit
 * @param ordersAmount - Total orders amount (base)
 * @returns Margin percentage (0-100) or null if orders is 0
 */
export function calculateTheoreticalMarginPct(
  profitValue: number,
  ordersAmount: number
): number | null {
  if (ordersAmount === 0) return null;
  return (profitValue / ordersAmount) * 100;
}
```

### 2. Create Unit Tests

```typescript
// src/lib/__tests__/theoretical-profit.test.ts

import {
  calculateTheoreticalProfit,
  calculateTheoreticalMarginPct
} from '../theoretical-profit';

describe('calculateTheoreticalProfit', () => {
  it('calculates correctly with all values present', () => {
    const result = calculateTheoreticalProfit({
      ordersAmount: 500000,
      cogs: 200000,
      advertisingSpend: 50000,
      logisticsCost: 30000,
      storageCost: 10000,
    });

    expect(result.value).toBe(210000);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.breakdown).toEqual({
      orders: 500000,
      cogs: 200000,
      advertising: 50000,
      logistics: 30000,
      storage: 10000,
    });
  });

  it('handles null values gracefully', () => {
    const result = calculateTheoreticalProfit({
      ordersAmount: 100000,
      cogs: null,
      advertisingSpend: 10000,
      logisticsCost: null,
      storageCost: 5000,
    });

    // 100000 - 0 - 10000 - 0 - 5000 = 85000
    expect(result.value).toBe(85000);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('cogs');
    expect(result.missingFields).toContain('logisticsCost');
  });

  it('returns negative profit when costs exceed orders', () => {
    const result = calculateTheoreticalProfit({
      ordersAmount: 100000,
      cogs: 80000,
      advertisingSpend: 30000,
      logisticsCost: 10000,
      storageCost: 5000,
    });

    // 100000 - 80000 - 30000 - 10000 - 5000 = -25000
    expect(result.value).toBe(-25000);
    expect(result.isComplete).toBe(true);
  });

  it('handles all null values', () => {
    const result = calculateTheoreticalProfit({
      ordersAmount: null,
      cogs: null,
      advertisingSpend: null,
      logisticsCost: null,
      storageCost: null,
    });

    expect(result.value).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields.length).toBe(5);
  });
});

describe('calculateTheoreticalMarginPct', () => {
  it('calculates margin percentage correctly', () => {
    expect(calculateTheoreticalMarginPct(210000, 500000)).toBe(42);
  });

  it('returns null when orders is 0', () => {
    expect(calculateTheoreticalMarginPct(1000, 0)).toBeNull();
  });

  it('handles negative profit', () => {
    expect(calculateTheoreticalMarginPct(-25000, 100000)).toBe(-25);
  });
});
```

---

## Integration Example

```typescript
// In a dashboard component or hook:

import { calculateTheoreticalProfit } from '@/lib/theoretical-profit';
import { useOrdersVolume } from '@/hooks/useOrdersVolume';
import { useOrdersCogs } from '@/hooks/useOrdersCogs';
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';

function useDashboardTheoreticalProfit(period: string) {
  const { data: ordersVolume } = useOrdersVolume(period);
  const { data: ordersCogs } = useOrdersCogs(period);
  const { data: advertising } = useAdvertisingAnalytics(period);
  const { data: financeSummary } = useFinancialSummary(period);

  const theoreticalProfit = useMemo(() => {
    return calculateTheoreticalProfit({
      ordersAmount: ordersVolume?.total_amount ?? null,
      cogs: ordersCogs?.total ?? null,
      advertisingSpend: advertising?.summary?.total_spend ?? null,
      logisticsCost: financeSummary?.logistics_cost ?? null,
      storageCost: financeSummary?.storage_cost ?? null,
    });
  }, [ordersVolume, ordersCogs, advertising, financeSummary]);

  return theoreticalProfit;
}
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/lib/theoretical-profit.ts` | Main calculation function |
| `src/lib/__tests__/theoretical-profit.test.ts` | Unit tests |

---

## Definition of Done

- [ ] `calculateTheoreticalProfit()` function implemented
- [ ] `calculateTheoreticalMarginPct()` helper implemented
- [ ] TypeScript interfaces exported
- [ ] Unit tests cover all edge cases (≥90% coverage)
- [ ] JSDoc comments with examples
- [ ] Exported from `src/lib/index.ts`
- [ ] Code review approved

---

## References

- Business requirement: Stakeholder diagram (2026-01-31)
- Dependent stories: 61.3-FE (Orders Volume), 61.4-FE (COGS for Orders)

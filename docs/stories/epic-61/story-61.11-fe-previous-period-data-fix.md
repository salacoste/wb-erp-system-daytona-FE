# Story 61.11-FE: Fix Missing Previous Period Comparison Data

**Epic**: 61-FE Dashboard Data Integration
**Status**: P0 (Critical Bug)
**Priority**: P0 (Critical)
**Estimate**: 5 SP

---

## Title

Fix missing previous period comparison data for Dashboard metrics

---

## Bug Discovery

**Discovered**: 2026-01-31
**Reporter**: QA / Product Team
**Severity**: High - 6 of 8 metrics show "No data for previous period"

---

## Problem Statement

On the Dashboard, only **2 of 8 metrics** show comparison with the previous period. The remaining **6 metrics always show "No data for previous period"** even when data exists.

| Metric | Current Data | Previous Period Comparison | Status |
|--------|--------------|---------------------------|--------|
| Заказы (Orders) | Works | Works | OK |
| COGS заказов (Orders COGS) | Works | **Always null** | **BUG** |
| Выкупы (Sales) | Placeholder | N/A | Placeholder |
| COGS выкупов (Sales COGS) | Placeholder | N/A | Placeholder |
| Реклама (Advertising) | Works | Works | OK |
| Логистика (Logistics) | Works | **Always null** | **BUG** |
| Хранение (Storage) | Works | **Always null** | **BUG** |
| Теор.прибыль (Theoretical Profit) | Works | **Always null** | **BUG** |

**Impact**: Users cannot see trends or compare metrics between periods, which is a core feature of the analytics dashboard.

---

## Root Cause Analysis

### Location of Bug

**File**: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx`
**Lines**: 107-119

### Current Code (Buggy)

```typescript
// Previous period data for comparison
const previousPeriodData = useMemo<PreviousPeriodData | undefined>(() => {
  if (!ordersQuery.previous && !advertisingQuery.previous) return undefined
  return {
    ordersAmount: ordersQuery.previous?.totalAmount ?? null,  // OK - uses hook
    ordersCogs: null,                // BUG: Always null!
    salesAmount: null,               // N/A - placeholder
    salesCogs: null,                 // N/A - placeholder
    advertisingSpend: advertisingQuery.previous?.summary?.total_spend ?? null,  // OK
    logisticsCost: null,             // BUG: Always null!
    storageCost: null,               // BUG: Always null!
    theoreticalProfit: null,         // BUG: Always null!
  }
}, [ordersQuery.previous, advertisingQuery.previous])
```

### Why This Happens

1. **ordersCogs**: `useOrdersCogs` hook does NOT support comparison mode (unlike `useOrdersVolumeWithComparison`)
2. **logisticsCost, storageCost**: `useFinancialSummary` hook is called for current period only - no previous period query
3. **theoreticalProfit**: Requires all previous period values to calculate - cascades from above bugs

---

## Solution Design

### Required Changes

| Field | Fix Required | Implementation |
|-------|-------------|----------------|
| `ordersCogs` | Create `useOrdersCogsWithComparison` hook | Similar to `useOrdersVolumeWithComparison` |
| `logisticsCost` | Add `useFinancialSummaryComparison` call | Hook already exists, need to use it |
| `storageCost` | Same as above | From `useFinancialSummaryComparison` |
| `theoreticalProfit` | Calculate from previous period values | Use `calculateTheoreticalProfit` with previous values |

### Data Flow (After Fix)

```
DashboardContent.tsx
  |
  +-- useOrdersVolumeWithComparison     --> ordersAmount (previous)
  +-- useOrdersCogsWithComparison (NEW) --> ordersCogs (previous)
  +-- useAdvertisingAnalyticsComparison --> advertisingSpend (previous)
  +-- useFinancialSummaryComparison     --> logisticsCost, storageCost (previous)
  |
  +-- calculateTheoreticalProfit(previous) --> theoreticalProfit (previous)
```

---

## Acceptance Criteria

### AC-1: Orders COGS Previous Period

- [ ] Create `useOrdersCogsWithComparison` hook in `src/hooks/useOrdersCogs.ts`
- [ ] Hook returns `{ current, previous, isLoading, isError }` structure
- [ ] Previous period is calculated same way as in `useOrdersVolumeWithComparison`
- [ ] Dashboard shows COGS comparison badge with delta percentage

### AC-2: Logistics Previous Period

- [ ] Use existing `useFinancialSummaryComparison` or add second `useFinancialSummary` call
- [ ] Extract `logistics_cost` from previous period summary
- [ ] Dashboard shows Logistics comparison badge with delta percentage

### AC-3: Storage Previous Period

- [ ] Extract `storage_cost` from previous period summary
- [ ] Dashboard shows Storage comparison badge with delta percentage

### AC-4: Theoretical Profit Previous Period

- [ ] Calculate previous period profit using `calculateTheoreticalProfit` with all previous values
- [ ] Show comparison only when `isComplete` is true for both current and previous
- [ ] Dashboard shows Theoretical Profit comparison badge with delta percentage

### AC-5: Unit Tests

- [ ] Add test for `useOrdersCogsWithComparison` hook
- [ ] Add test for previous period data assembly in DashboardContent
- [ ] Test edge cases: missing previous data, partial data

### AC-6: Visual Verification

- [ ] All 4 fixed metrics show delta badges when previous data exists
- [ ] Delta badges show correct direction (green for improvement, red for regression)
- [ ] "No previous data" message only shows when data truly doesn't exist

---

## Technical Implementation

### 1. Create useOrdersCogsWithComparison Hook

```typescript
// src/hooks/useOrdersCogs.ts - Add to existing file

/**
 * Hook to fetch orders COGS with comparison to previous period
 */
export function useOrdersCogsWithComparison(options: UseOrdersCogsOptions) {
  const currentQuery = useOrdersCogs(options)

  // Calculate previous period
  const previousPeriod = options.periodType === 'week'
    ? getPreviousWeek(options.period)
    : getPreviousMonth(options.period)

  const previousQuery = useOrdersCogs({
    ...options,
    period: previousPeriod,
  })

  return {
    current: currentQuery.data,
    previous: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    isError: currentQuery.isError || previousQuery.isError,
    error: currentQuery.error || previousQuery.error,
  }
}

// Helper functions (can be imported from useOrdersVolume.ts or shared utils)
function getPreviousWeek(week: string): string {
  // "2026-W05" -> "2026-W04"
  // Handle year boundary: "2026-W01" -> "2025-W52"
}

function getPreviousMonth(month: string): string {
  // "2026-01" -> "2025-12"
}
```

### 2. Update DashboardContent.tsx

```typescript
// src/app/(dashboard)/dashboard/components/DashboardContent.tsx

// NEW: Import comparison hooks
import { useOrdersCogsWithComparison } from '@/hooks/useOrdersCogs'

// NEW: Use comparison hook instead of single hook
const ordersCogsQuery = useOrdersCogsWithComparison({
  periodType,
  period: selectedPeriod,
})

// NEW: Fetch previous period financial summary
const { previousWeek, previousMonth } = useDashboardPeriod()
const previousPeriod = periodType === 'week' ? previousWeek : previousMonth

const { data: previousFinanceSummary } = useFinancialSummary(
  previousPeriod,
  periodType
)
const previousSummary = previousFinanceSummary?.summary_total || previousFinanceSummary?.summary_rus

// NEW: Calculate previous theoretical profit
const previousTheoreticalProfit = useMemo(() => {
  if (!ordersQuery.previous) return null

  const result = calculateTheoreticalProfit({
    ordersAmount: ordersQuery.previous?.totalAmount ?? null,
    cogs: ordersCogsQuery.previous?.cogsTotal ?? null,
    advertisingSpend: advertisingQuery.previous?.summary?.total_spend ?? null,
    logisticsCost: previousSummary?.logistics_cost ?? null,
    storageCost: previousSummary?.storage_cost ?? null,
  })

  return result.isComplete ? result.value : null
}, [ordersQuery.previous, ordersCogsQuery.previous, advertisingQuery.previous, previousSummary])

// FIXED: Previous period data with all values populated
const previousPeriodData = useMemo<PreviousPeriodData | undefined>(() => {
  const hasAnyPreviousData =
    ordersQuery.previous ||
    advertisingQuery.previous ||
    previousSummary

  if (!hasAnyPreviousData) return undefined

  return {
    ordersAmount: ordersQuery.previous?.totalAmount ?? null,
    ordersCogs: ordersCogsQuery.previous?.cogsTotal ?? null,  // FIXED
    salesAmount: null,  // Placeholder - requires Sales API
    salesCogs: null,    // Placeholder - requires Sales COGS API
    advertisingSpend: advertisingQuery.previous?.summary?.total_spend ?? null,
    logisticsCost: previousSummary?.logistics_cost ?? null,   // FIXED
    storageCost: previousSummary?.storage_cost ?? null,       // FIXED
    theoreticalProfit: previousTheoreticalProfit,             // FIXED
  }
}, [
  ordersQuery.previous,
  ordersCogsQuery.previous,
  advertisingQuery.previous,
  previousSummary,
  previousTheoreticalProfit,
])
```

---

## Files to Create

| File | Description |
|------|-------------|
| (none) | All changes are modifications to existing files |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useOrdersCogs.ts` | Add `useOrdersCogsWithComparison` hook + helper functions |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | Use new comparison hooks, populate previousPeriodData |

---

## Test Cases

### Unit Tests

```typescript
// src/hooks/__tests__/useOrdersCogs.test.ts

describe('useOrdersCogsWithComparison', () => {
  it('returns both current and previous period data', async () => {
    // Setup mock for both periods
    // Verify both current and previous are populated
  })

  it('calculates previous week correctly', () => {
    expect(getPreviousWeek('2026-W05')).toBe('2026-W04')
    expect(getPreviousWeek('2026-W01')).toBe('2025-W52')
  })

  it('calculates previous month correctly', () => {
    expect(getPreviousMonth('2026-01')).toBe('2025-12')
    expect(getPreviousMonth('2026-06')).toBe('2026-05')
  })
})
```

### Integration Tests

```typescript
// src/app/(dashboard)/dashboard/components/__tests__/DashboardContent.test.tsx

describe('DashboardContent previousPeriodData', () => {
  it('populates all previous period fields when data exists', async () => {
    // Mock all API responses for both periods
    // Render DashboardContent
    // Verify previousPeriodData has non-null values for:
    // - ordersAmount
    // - ordersCogs
    // - advertisingSpend
    // - logisticsCost
    // - storageCost
    // - theoreticalProfit
  })

  it('shows delta badges on all metric cards', async () => {
    // Mock data with both periods
    // Verify delta indicators are visible
    // Verify correct colors (green/red based on direction)
  })

  it('handles missing previous period data gracefully', async () => {
    // Mock current period only, 404 for previous
    // Verify dashboard renders without errors
    // Verify "No previous data" messages show correctly
  })
})
```

### E2E Tests

```typescript
// e2e/dashboard-previous-period.spec.ts

test.describe('Dashboard Previous Period Comparison', () => {
  test('shows comparison badges for all metrics', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for data to load
    await page.waitForSelector('[data-testid="orders-metric-card"]')

    // Verify delta badges are visible
    await expect(page.locator('[data-testid="orders-delta"]')).toBeVisible()
    await expect(page.locator('[data-testid="orders-cogs-delta"]')).toBeVisible()
    await expect(page.locator('[data-testid="advertising-delta"]')).toBeVisible()
    await expect(page.locator('[data-testid="logistics-delta"]')).toBeVisible()
    await expect(page.locator('[data-testid="storage-delta"]')).toBeVisible()
    await expect(page.locator('[data-testid="profit-delta"]')).toBeVisible()
  })
})
```

---

## Definition of Done

- [ ] `useOrdersCogsWithComparison` hook implemented with tests
- [ ] Helper functions `getPreviousWeek`, `getPreviousMonth` implemented (or reused from existing)
- [ ] `DashboardContent.tsx` updated to fetch and use all previous period data
- [ ] All 4 affected metric cards show delta badges when previous data exists
- [ ] Edge cases handled: missing data, partial data, API errors
- [ ] Unit tests for new hook and data assembly logic
- [ ] E2E test for visual verification
- [ ] No regression in existing functionality
- [ ] Code review approved
- [ ] Verified in Chrome using visual inspection

---

## Performance Considerations

### Additional API Calls

This fix adds:
- 1 additional call for previous period COGS (`useOrdersCogsWithComparison`)
- 1 additional call for previous period financial summary

### Optimization Options

1. **Parallel fetching**: Both current and previous queries run in parallel (React Query handles this)
2. **Caching**: Previous period data changes infrequently - can increase `staleTime` to 10+ minutes
3. **Lazy loading**: Consider fetching previous period data only after current data loads (lower priority)

### Expected Impact

- Additional network latency: ~50-100ms (parallel fetch)
- Additional memory: ~1-2KB for cached previous period data
- **Acceptable trade-off** for complete dashboard functionality

---

## References

- Bug investigation: 2026-01-31 analysis
- Related stories: 61.3-FE (Orders Volume), 61.4-FE (Orders COGS), 61.10-FE (Theoretical Profit)
- Existing comparison pattern: `src/hooks/useOrdersVolume.ts` (`useOrdersVolumeWithComparison`)
- Financial summary comparison: `src/hooks/financial/hooks.ts` (`useFinancialSummaryComparison`)

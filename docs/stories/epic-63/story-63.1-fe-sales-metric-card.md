# Story 63.1-FE: Sales Metric Card (Vykypy)

**Epic**: 63-FE Dashboard Business Logic Completion
**Status**: ✅ Complete
**Priority**: P1 (Critical)
**Estimate**: 3 SP
**Completion Date**: 2026-01-31

---

## Description

Implement the Sales Metric Card component that displays the actual sales (vykypy/redemptions) metric on the main dashboard. This card shows `wb_sales_gross` from the finance summary API - the seller's actual revenue after WB commission, not the retail price.

**CRITICAL DISTINCTION**:
- `wb_sales_gross` = Seller's revenue after WB commission (use this!)
- `sales_gross` = Retail price for buyer (NOT for WB Dashboard matching)

This metric represents actual completed sales (vykypy), as opposed to orders which include cancelled and unredeemed items.

---

## Acceptance Criteria

- [ ] AC1: Display `wb_sales_gross` value from `/v1/analytics/weekly/finance-summary` endpoint
- [ ] AC2: Show comparison with previous period using `ComparisonBadge` component
- [ ] AC3: Display trend indicator (up/down/stable) with correct color coding
- [ ] AC4: Format value in Russian locale with currency symbol (`formatCurrency`)
- [ ] AC5: Show loading skeleton while data is fetching
- [ ] AC6: Display error state with retry button on API failure
- [ ] AC7: Show "No data" state when `wb_sales_gross` is null/undefined
- [ ] AC8: Use green color (#22C55E) for the metric value to indicate actual revenue
- [ ] AC9: Include info tooltip explaining the difference between sales and orders
- [ ] AC10: Accessible with ARIA labels and keyboard navigation

---

## Technical Implementation

### API Source

**Primary Endpoint**: `/v1/analytics/weekly/finance-summary?week={week}`

**Response Fields Used**:
```typescript
interface FinanceSummaryResponse {
  summary_rus: {
    week: string;                    // "2025-W47"
    wb_sales_gross: number;          // 131,134.76 - USE THIS
    wb_returns_gross: number;        // 809.00
    sales_gross: number;             // 295,808.00 - NOT THIS (retail price)
    // ... other fields
  };
  summary_total: {
    wb_sales_gross_total: number;    // Combined RUS + EAEU
  };
}
```

**Comparison Data**: Use `/v1/analytics/weekly/comparison?period1={current}&period2={previous}` or calculate from cabinet-summary trends.

### Component Structure

```
src/components/custom/dashboard/
  SalesMetricCard.tsx           # Main component (NEW)
  index.ts                      # Export update
```

### Props Interface

```typescript
export interface SalesMetricCardProps {
  /** Actual sales revenue (wb_sales_gross) */
  salesGross: number | null | undefined;
  /** Previous period sales for comparison */
  previousSalesGross: number | null | undefined;
  /** Returns amount for tooltip context */
  returnsGross?: number | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}
```

### Hook Integration

Use existing `useDashboardMetricsWithPeriod` hook or create dedicated hook:

```typescript
// Option 1: Use existing hook
const { financeSummary, isLoading, error } = useDashboardMetricsWithPeriod(period);
const salesGross = financeSummary?.summary_rus?.wb_sales_gross;

// Option 2: Direct finance-summary call
const { data, isLoading, error } = useQuery({
  queryKey: ['finance-summary', week],
  queryFn: () => getFinanceSummary(week),
});
```

---

## Design Specifications

### Visual Design

```
+----------------------------------------------------------+
|  [ShoppingBag icon]  Vykypy (Sales)          [i] Info    |
|----------------------------------------------------------|
|  131 134,76 RUB                                          |
|  [green text, 32px, bold]                                |
|----------------------------------------------------------|
|  [up arrow] +12.5%  +15 234,00 RUB  vs 115 900,76 RUB   |
|  [green badge]                                           |
|----------------------------------------------------------|
|  Net sales after returns: 130 325,76 RUB                |
|  [gray text, 12px]                                       |
+----------------------------------------------------------+
```

### Colors
| Element | Color | Hex |
|---------|-------|-----|
| Icon | Green | `#22C55E` |
| Main Value | Green | `#22C55E` |
| Positive Trend | Green | `#22C55E` |
| Negative Trend | Red | `#EF4444` |
| Stable Trend | Gray | `#9CA3AF` |
| Subtitle text | Gray | `#9CA3AF` |

### Dimensions
- Card min-height: 120px
- Icon size: 16x16px (h-4 w-4)
- Main value: 32px font-size, bold
- Comparison row: 12-14px font-size
- Padding: 16px (p-4)

### States
1. **Loading**: Skeleton with card shape, pulsing animation
2. **Error**: Red alert icon, "Error loading" message, retry button
3. **Empty**: Dash character "---" for value, no comparison row
4. **Loaded**: Full display with value, comparison, and subtitle

### Tooltip Content (Info Icon)

```
Vykypy (Actual Sales)

This shows your actual revenue from completed sales (redemptions)
after WB commission is deducted.

- wb_sales_gross = Your revenue after WB commission
- Unlike "Orders", this excludes cancelled and unredeemed items
- Returns are shown separately

Formula: Seller Revenue = Retail Price - WB Commission
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/SalesMetricCard.tsx` | Create | Main sales metric card component |
| `src/components/custom/dashboard/index.ts` | Modify | Add SalesMetricCard export |
| `src/components/custom/dashboard/__tests__/SalesMetricCard.test.tsx` | Create | Unit tests |
| `src/types/analytics.ts` | Modify | Add/verify FinanceSummaryResponse types if needed |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| API | `/v1/analytics/weekly/finance-summary` | Available |
| API | `/v1/analytics/weekly/comparison` | Available |
| Component | `ComparisonBadge` | Exists |
| Component | `TrendIndicator` | Exists |
| Component | `MetricCardSkeleton` / `StandardMetricSkeleton` | Exists |
| Component | `MetricCardError` | Exists |
| Utility | `formatCurrency` from `@/lib/utils` | Exists |
| Utility | `calculateComparison` from `@/lib/comparison-helpers` | Exists |
| Hook | `useDashboardMetricsWithPeriod` | Exists |

---

## Testing Requirements

### Unit Tests

**File**: `src/components/custom/dashboard/__tests__/SalesMetricCard.test.tsx`

```typescript
describe('SalesMetricCard', () => {
  // Rendering tests
  it('renders sales value with correct formatting', () => {});
  it('renders loading skeleton when isLoading=true', () => {});
  it('renders error state with retry button', () => {});
  it('renders empty state when salesGross is null', () => {});

  // Comparison tests
  it('shows positive comparison badge when sales increased', () => {});
  it('shows negative comparison badge when sales decreased', () => {});
  it('hides comparison when previousSalesGross is null', () => {});

  // Interaction tests
  it('calls onRetry when retry button clicked', () => {});
  it('shows tooltip on info icon hover', () => {});

  // Accessibility tests
  it('has correct ARIA labels', () => {});
  it('is keyboard navigable', () => {});

  // Color coding tests
  it('displays value in green color', () => {});
  it('displays trend arrow with correct color', () => {});
});
```

### Visual Testing

- Verify card matches design mockup in Storybook/Chromatic
- Test responsive behavior at mobile breakpoints
- Verify loading skeleton matches card dimensions
- Test hover states on info icon and retry button

---

## Definition of Done

- [ ] All 10 acceptance criteria met and verified
- [ ] TypeScript strict mode passes with no errors
- [ ] Russian locale formatting applied (`formatCurrency`)
- [ ] Component under 200 lines (split if needed)
- [ ] Unit tests written with >80% coverage
- [ ] ESLint passes with no warnings
- [ ] Accessibility audit passes (ARIA labels, keyboard nav)
- [ ] Visual review matches design specification
- [ ] Integrated into DashboardMetricsGrid
- [ ] Code reviewed and approved

---

## Implementation Notes

### Critical: Use `wb_sales_gross`, NOT `sales_gross`

```typescript
// CORRECT - matches WB Dashboard
const displayValue = data.summary_rus.wb_sales_gross;  // 131,134.76

// INCORRECT - this is retail price, won't match WB
// const displayValue = data.summary_rus.sales_gross;  // 295,808.00
```

### Net Sales Calculation (Optional Subtitle)

```typescript
// Net sales after returns
const netSales = wb_sales_gross - wb_returns_gross;
// Example: 131,134.76 - 809.00 = 130,325.76
```

### Comparison Badge Direction

For revenue metrics, higher is better:
```typescript
const comparison = calculateComparison(
  currentSales,
  previousSales,
  false  // invertComparison = false (higher is positive/green)
);
```

---

## Related Documentation

- Backend API: `docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md`
- Orders Card Pattern: `src/components/custom/dashboard/OrdersMetricCard.tsx`
- Comparison Helpers: `src/lib/comparison-helpers.ts`
- Design System: `docs/front-end-spec.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM | Initial story creation |

---

## Implementation

**Component**: `src/components/custom/dashboard/SalesMetricCard.tsx`
**Lines**: 157
**Key Features**:
- Displays `wb_sales_gross` (seller's actual revenue after WB commission)
- Comparison badge showing delta with previous period
- Net sales subtitle (after returns)
- Loading skeleton, error state, and empty state handling
- Info tooltip explaining the difference between sales and orders
- WCAG 2.1 AA compliant with ARIA labels

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useFinancialSummary hook for data.
```

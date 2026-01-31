# Story 63.2-FE: Sales COGS Metric Card (COGS Vykupov)

**Epic**: 63-FE Dashboard Business Logic Completion
**Status**: ✅ Complete
**Priority**: P1 (Critical)
**Estimate**: 3 SP
**Completion Date**: 2026-01-31

---

## Description

Implement the Sales COGS Metric Card component that displays the Cost of Goods Sold (COGS) for actual sales (vykypy/redemptions) on the main dashboard. This is distinct from "COGS by Orders" which calculates COGS for all orders including cancelled/unredeemed items.

**Key Distinction**:
- **COGS by Orders**: Calculated for ALL orders placed (potential inventory commitment)
- **COGS by Sales (this card)**: Calculated only for ACTUAL completed sales (vykypy)

The card must also show COGS coverage percentage and provide a warning when coverage is below 100%, with a direct link to the COGS assignment page.

---

## Acceptance Criteria

- [ ] AC1: Display aggregated COGS total for completed sales from by-sku endpoint
- [ ] AC2: Source data from `/v1/analytics/weekly/by-sku?includeCogs=true` with aggregation
- [ ] AC3: Show COGS coverage percentage (products with COGS / total products)
- [ ] AC4: Display warning state when COGS coverage < 100%
- [ ] AC5: Show "COGS not filled" state when coverage = 0%
- [ ] AC6: Provide link to COGS assignment page (`/cogs/single`)
- [ ] AC7: Show comparison with previous period using `ComparisonBadge`
- [ ] AC8: Format values in Russian locale with currency symbol
- [ ] AC9: Display loading skeleton while data is fetching
- [ ] AC10: Display error state with retry button on API failure
- [ ] AC11: Use gray color (#757575) for COGS value to indicate expense/cost
- [ ] AC12: Accessible with ARIA labels and keyboard navigation

---

## Technical Implementation

### API Source

**Primary Endpoint**: `/v1/analytics/weekly/by-sku?week={week}&includeCogs=true`

**Alternative (recommended for totals)**: `/v1/analytics/cabinet-summary?weeks=1`

**Response Fields Used (by-sku)**:
```typescript
interface BySkuItem {
  nm_id: string;
  sa_name: string;
  total_units: number;
  revenue_gross: number;
  cogs: number | null;           // COGS per SKU
  missing_cogs_flag: boolean;    // true if COGS not assigned
  profit: number | null;
  margin_pct: number | null;
  has_revenue: boolean;          // Only count SKUs with actual sales
}

interface BySkuResponse {
  data: BySkuItem[];
  pagination: { total: number; limit: number; offset: number; };
}

// Aggregation for card:
const cogsTotal = data
  .filter(item => item.has_revenue)  // Only items with actual sales
  .reduce((sum, item) => sum + (item.cogs || 0), 0);

const productsWithCogs = data.filter(item => item.has_revenue && !item.missing_cogs_flag).length;
const productsTotal = data.filter(item => item.has_revenue).length;
const cogsCoverage = productsTotal > 0 ? (productsWithCogs / productsTotal) * 100 : 0;
```

**Alternative Response (cabinet-summary)**:
```typescript
interface CabinetSummaryResponse {
  summary: {
    totals: {
      cogs_total: number;        // 180,000.00
      // ...
    };
    products: {
      total: number;             // 120
      with_cogs: number;         // 95
      without_cogs: number;      // 25
      coverage_pct: number;      // 79.17
    };
  };
}
```

### Component Structure

```
src/components/custom/dashboard/
  SalesCogsMetricCard.tsx       # Main component (NEW)
  index.ts                      # Export update
```

### Props Interface

```typescript
export interface SalesCogsMetricCardProps {
  /** Total COGS for completed sales */
  cogsTotal: number | null | undefined;
  /** Previous period COGS for comparison */
  previousCogsTotal: number | null | undefined;
  /** Number of products with COGS assigned */
  productsWithCogs: number;
  /** Total number of products with sales */
  totalProducts: number;
  /** COGS coverage percentage (0-100) */
  cogsCoverage: number;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Callback for "Assign COGS" action */
  onAssignCogs?: () => void;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}
```

### Data Aggregation Hook

Create or extend hook for COGS aggregation:

```typescript
// Option 1: Dedicated hook
export function useSalesCogsMetrics(week: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'by-sku', week, 'cogs'],
    queryFn: () => getAnalyticsBySku({ week, includeCogs: true, limit: 500 }),
  });

  const aggregated = useMemo(() => {
    if (!data?.data) return null;

    const itemsWithSales = data.data.filter(item => item.has_revenue);
    const cogsTotal = itemsWithSales.reduce((sum, item) => sum + (item.cogs || 0), 0);
    const productsWithCogs = itemsWithSales.filter(item => !item.missing_cogs_flag).length;
    const totalProducts = itemsWithSales.length;
    const cogsCoverage = totalProducts > 0 ? (productsWithCogs / totalProducts) * 100 : 0;

    return { cogsTotal, productsWithCogs, totalProducts, cogsCoverage };
  }, [data]);

  return { data: aggregated, isLoading, error };
}

// Option 2: Use cabinet-summary endpoint (simpler)
export function useCabinetSummary(weeks: number = 1) {
  return useQuery({
    queryKey: ['cabinet-summary', weeks],
    queryFn: () => getCabinetSummary(weeks),
    select: (data) => ({
      cogsTotal: data.summary.totals.cogs_total,
      productsWithCogs: data.summary.products.with_cogs,
      totalProducts: data.summary.products.total,
      cogsCoverage: data.summary.products.coverage_pct,
    }),
  });
}
```

---

## Design Specifications

### Visual Design - Normal State (Coverage >= 100%)

```
+----------------------------------------------------------+
|  [Package icon]  COGS vykupov              [i] Info       |
|----------------------------------------------------------|
|  85 000,00 RUB                                           |
|  [gray text, 32px, bold]                                 |
|----------------------------------------------------------|
|  [down arrow] -5.2%  -4 500,00 RUB  vs 89 500,00 RUB    |
|  [green badge - costs down is good]                      |
|----------------------------------------------------------|
|  COGS: 74 of 74 products (100%)                         |
|  [gray text, 12px]                                       |
+----------------------------------------------------------+
```

### Visual Design - Warning State (Coverage < 100%)

```
+----------------------------------------------------------+
|  [Package icon]  COGS vykupov              [i] Info       |
|----------------------------------------------------------|
|  85 000,00 RUB                                           |
|  [gray text, 32px, bold]                                 |
|----------------------------------------------------------|
|  [warn icon] -5.2%  -4 500,00 RUB  vs 89 500,00 RUB     |
|----------------------------------------------------------|
|  [!] COGS: 74 of 80 products (92.5%)                    |
|  [yellow warning text, 12px]                             |
|                                                          |
|  [Fill COGS ->]                                          |
|  [primary link, 12px]                                    |
+----------------------------------------------------------+
```

### Visual Design - Missing State (Coverage = 0%)

```
+----------------------------------------------------------+
|  [Package icon]  COGS vykupov              [i] Info       |
|----------------------------------------------------------|
|  +----------------------------------------------------+  |
|  | [!] COGS not filled                                |  |
|  |                                                    |  |
|  | 0 of 80 products (0%)                              |  |
|  |                                                    |  |
|  | [Fill COGS ->]                                     |  |
|  +----------------------------------------------------+  |
|  [yellow background panel]                               |
+----------------------------------------------------------+
```

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Icon | Gray | `#757575` |
| Main Value | Gray | `#6B7280` (text-gray-500) |
| Positive Trend (costs down) | Green | `#22C55E` |
| Negative Trend (costs up) | Red | `#EF4444` |
| Warning Background | Yellow Light | `#FEF3C7` (yellow-100) |
| Warning Text | Yellow Dark | `#CA8A04` (yellow-600) |
| Warning Icon | Yellow | `#EAB308` (yellow-500) |
| Link Text | Primary Red | `#E53935` |

### Dimensions

- Card min-height: 120px (normal), 160px (with warning)
- Icon size: 16x16px (h-4 w-4)
- Main value: 32px font-size, bold (24px when with warning panel)
- Warning panel: rounded-md, p-2, bg-yellow-100
- Padding: 16px (p-4)

### States

1. **Loading**: Skeleton matching card shape
2. **Error**: Red alert icon, error message, retry button
3. **Missing (0%)**: Full yellow panel with warning, no value displayed
4. **Incomplete (<100%)**: Value + yellow warning row + link
5. **Complete (100%)**: Value + comparison + normal coverage text

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/SalesCogsMetricCard.tsx` | Create | Main COGS metric card component |
| `src/components/custom/dashboard/index.ts` | Modify | Add SalesCogsMetricCard export |
| `src/components/custom/dashboard/__tests__/SalesCogsMetricCard.test.tsx` | Create | Unit tests |
| `src/hooks/useSalesCogsMetrics.ts` | Create | Optional: Dedicated aggregation hook |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| API | `/v1/analytics/weekly/by-sku?includeCogs=true` | Available |
| API | `/v1/analytics/cabinet-summary` | Available |
| Component | `ComparisonBadge` | Exists |
| Component | `TrendIndicator` | Exists |
| Component | `StandardMetricSkeleton` | Exists |
| Component | `MetricCardError` | Exists |
| Utility | `formatCurrency` | Exists |
| Utility | `calculateComparison` | Exists |
| Route | `ROUTES.COGS.SINGLE` | Exists in `@/lib/routes` |
| Pattern | `OrdersCogsMetricCard` | Reference implementation |

---

## Testing Requirements

### Unit Tests

**File**: `src/components/custom/dashboard/__tests__/SalesCogsMetricCard.test.tsx`

```typescript
describe('SalesCogsMetricCard', () => {
  // Rendering tests
  it('renders COGS value with correct formatting', () => {});
  it('renders loading skeleton when isLoading=true', () => {});
  it('renders error state with retry button', () => {});

  // Coverage state tests
  it('renders complete state when coverage = 100%', () => {});
  it('renders warning state when coverage < 100%', () => {});
  it('renders missing state when coverage = 0%', () => {});

  // Coverage display tests
  it('displays correct coverage ratio (X of Y products)', () => {});
  it('displays coverage percentage', () => {});

  // Comparison tests
  it('shows positive badge when costs decreased (inverted)', () => {});
  it('shows negative badge when costs increased (inverted)', () => {});
  it('hides comparison when previousCogsTotal is null', () => {});

  // Interaction tests
  it('navigates to COGS page when "Fill COGS" clicked', () => {});
  it('calls onAssignCogs callback when provided', () => {});
  it('calls onRetry when retry button clicked', () => {});
  it('shows tooltip on info icon hover', () => {});

  // Accessibility tests
  it('has correct ARIA labels', () => {});
  it('link is keyboard accessible', () => {});
  it('warning has appropriate role and aria-live', () => {});

  // Color coding tests
  it('displays value in gray color', () => {});
  it('warning has yellow background', () => {});
});
```

### Visual Testing

- Verify all three states match design mockups
- Test warning panel animation/transition
- Verify link hover states
- Test responsive behavior at mobile breakpoints

---

## Definition of Done

- [ ] All 12 acceptance criteria met and verified
- [ ] TypeScript strict mode passes with no errors
- [ ] Russian locale formatting applied
- [ ] Component under 200 lines (split helper components if needed)
- [ ] Unit tests written with >80% coverage
- [ ] ESLint passes with no warnings
- [ ] Accessibility audit passes (ARIA labels, keyboard nav, focus visible)
- [ ] Visual review matches design specification
- [ ] Integrated into DashboardMetricsGrid
- [ ] Navigation to COGS page works correctly
- [ ] Code reviewed and approved

---

## Implementation Notes

### Inverted Comparison for Costs

For cost metrics, LOWER is better, so invert the comparison:

```typescript
// Costs: lower is better, so invert comparison colors
const comparison = calculateComparison(
  currentCogs,
  previousCogs,
  true  // invertComparison = true (lower costs = green, higher = red)
);
```

### Coverage Warning Thresholds

```typescript
const isComplete = cogsCoverage >= 100;      // Green: All products have COGS
const isIncomplete = cogsCoverage > 0 && cogsCoverage < 100;  // Yellow warning
const isMissing = cogsCoverage === 0 || cogsTotal == null;    // Yellow panel
```

### Navigation to COGS Page

```typescript
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const router = useRouter();

const handleAssignCogs = () => {
  if (onAssignCogs) {
    onAssignCogs();
  } else {
    router.push(ROUTES.COGS.SINGLE);
  }
};
```

### Pluralization Helper (Russian)

```typescript
function pluralizeProducts(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${formatNumber(count)} tovarov`;
  }
  if (lastDigit === 1) {
    return `${formatNumber(count)} tovar`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${formatNumber(count)} tovara`;
  }
  return `${formatNumber(count)} tovarov`;
}
```

### Tooltip Content

```
COGS vykupov (Cost of Goods Sold for Actual Sales)

This shows the total cost of goods for your completed sales (vykypy).

- Only includes products that were actually sold (not cancelled orders)
- Used to calculate gross profit: Revenue - COGS = Gross Profit
- Coverage % shows how many products have COGS assigned

Fill in COGS for all products to get accurate profit calculations.
```

---

## Related Documentation

- Backend API: `docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md`
- Orders COGS Pattern: `src/components/custom/dashboard/OrdersCogsMetricCard.tsx`
- COGS Assignment: `src/app/(dashboard)/cogs/`
- Routes: `src/lib/routes.ts`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM | Initial story creation |

---

## Implementation

**Component**: `src/components/custom/dashboard/SalesCogsMetricCard.tsx`
**Lines**: 167
**Key Features**:
- Displays aggregated COGS total for completed sales
- COGS coverage percentage with warning state (<100%)
- "COGS not filled" state when coverage = 0%
- Link to COGS assignment page
- Inverted comparison (lower costs = green)
- Loading skeleton and error states

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useSalesCogsMetrics hook for data aggregation.
```

# Story 62.3-FE: COGS by Orders Metric Card

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 2 SP

---

## Title (RU)

Карточка COGS по заказам

---

## Description

Create a metric card showing COGS (Cost of Goods Sold) calculated for orders - not just actual sales. This represents the cost basis for all orders placed during the period, helping sellers understand their exposure before orders are fulfilled.

This card is critical for the theoretical profit calculation and must handle the common case where COGS data is incomplete (not all products have COGS assigned). When COGS coverage is below 100%, a warning badge should be displayed with a link to the COGS assignment page.

---

## Acceptance Criteria

- [ ] Display total COGS from `useOrdersCogs` hook
- [ ] Show comparison with previous period (up/down indicator)
- [ ] Format as currency (Russian Ruble format)
- [ ] Include tooltip: "Себестоимость товаров в заказах"
- [ ] Use Package icon (lucide-react)
- [ ] Gray value color (#6B7280) to indicate cost/expense
- [ ] Warning badge if COGS coverage < 100%
- [ ] Show coverage percentage: "COGS: X из Y товаров (Z%)"
- [ ] "Заполнить COGS" link navigates to COGS assignment page
- [ ] Handle missing COGS gracefully (show "—" with explanation)
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry option

---

## Design Specifications

### Card Anatomy - Normal State

```
+--------------------------------------------------+
| [Package] COGS по заказам                    [i] |  <- Title row
|                                                  |
|   234 567,00 RUB                                  |  <- Main value (Gray)
|                                                  |
|   [^+8,2%]  vs 216 789 RUB                        |  <- Comparison row
|                                                  |
|   COGS: 45 из 45 товаров (100%)                 |  <- Coverage subtitle
+--------------------------------------------------+
```

### Card Anatomy - Warning State (Incomplete COGS)

```
+--------------------------------------------------+
| [Package] COGS по заказам                    [i] |  <- Title row
|                                                  |
|   [!] COGS не заполнен                           |  <- Warning (Yellow)
|                                                  |
|   12 из 45 товаров (27%)                        |  <- Coverage info
|   [Заполнить COGS ->]                           |  <- Action link
+--------------------------------------------------+
```

### Colors

| Element | Color | Hex | Tailwind |
|---------|-------|-----|----------|
| Icon | Gray | `#6B7280` | `text-gray-500` |
| Main value | Gray | `#6B7280` | `text-gray-500` |
| Title | Muted | `#757575` | `text-muted-foreground` |
| Warning text | Yellow | `#F59E0B` | `text-yellow-600` |
| Warning bg | Light yellow | `#FEF3C7` | `bg-yellow-100` |
| Warning icon | Yellow | `#F59E0B` | `text-yellow-500` |
| Action link | Primary red | `#E53935` | `text-primary` |
| Positive comparison | Green | `#22C55E` | `bg-green-100 text-green-700` |
| Negative comparison | Red | `#EF4444` | `bg-red-100 text-red-700` |

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Title | 14px | 500 (medium) | 1.5 |
| Main value | 32px | 700 (bold) | 1.2 |
| Warning text | 14px | 500 (medium) | 1.5 |
| Coverage text | 12px | 400 (regular) | 1.5 |
| Action link | 12px | 500 (medium) | 1.5 |
| Comparison badge | 12px | 500 (medium) | 1.5 |

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Card padding | 16px | `p-4` |
| Between title and value | 8px | `mt-2` |
| Between value and comparison | 8px | `mt-2` |
| Warning padding | 8px | `p-2` |
| Warning border-radius | 6px | `rounded-md` |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  OrdersCogsMetricCard.tsx      <- Main component
```

### Props Interface

```typescript
interface OrdersCogsMetricCardProps {
  // COGS Data
  cogsTotal: number | null | undefined;
  previousCogsTotal: number | null | undefined;

  // Coverage Info
  productsWithCogs: number;
  totalProducts: number;
  cogsCoverage: number;  // 0-100 percentage

  // States
  isLoading?: boolean;
  error?: Error | null;

  // Actions
  onAssignCogs?: () => void;

  // Optional
  className?: string;
  onRetry?: () => void;
}
```

### Coverage Calculation

```typescript
function getCoverageStatus(coverage: number): 'complete' | 'partial' | 'missing' {
  if (coverage >= 100) return 'complete';
  if (coverage > 0) return 'partial';
  return 'missing';
}
```

### Dependencies

| Hook/Utility | Source | Purpose |
|--------------|--------|---------|
| `useOrdersCogs` | Story 61.4-FE | COGS for orders data |
| `formatCurrency` | `src/lib/formatters.ts` | Currency formatting |
| `formatPercentage` | `src/lib/formatters.ts` | Percentage formatting |
| `ComparisonBadge` | Existing | Comparison indicator |
| `Tooltip` | shadcn/ui | Info tooltip |
| `Package` | lucide-react | Card icon |
| `AlertTriangle` | lucide-react | Warning icon |
| `useRouter` | next/navigation | Navigation to COGS page |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/OrdersCogsMetricCard.tsx` | CREATE | COGS by orders metric card |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add export |

---

## Component Implementation

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Package, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonBadge } from '@/components/custom/ComparisonBadge';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

interface OrdersCogsMetricCardProps {
  cogsTotal: number | null | undefined;
  previousCogsTotal: number | null | undefined;
  productsWithCogs: number;
  totalProducts: number;
  cogsCoverage: number;
  isLoading?: boolean;
  error?: Error | null;
  onAssignCogs?: () => void;
  className?: string;
  onRetry?: () => void;
}

export function OrdersCogsMetricCard({
  cogsTotal,
  previousCogsTotal,
  productsWithCogs,
  totalProducts,
  cogsCoverage,
  isLoading = false,
  error,
  onAssignCogs,
  className,
  onRetry,
}: OrdersCogsMetricCardProps) {
  const router = useRouter();
  const isIncomplete = cogsCoverage < 100;
  const hasNoCogs = cogsCoverage === 0 || cogsTotal == null;

  const handleAssignCogs = () => {
    if (onAssignCogs) {
      onAssignCogs();
    } else {
      router.push(ROUTES.COGS.SINGLE);
    }
  };

  if (isLoading) {
    return <CogsMetricCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <MetricCardError
        title="COGS по заказам"
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  const comparison = !hasNoCogs
    ? calculateComparison(cogsTotal, previousCogsTotal)
    : null;

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`COGS по заказам: ${!hasNoCogs ? formatCurrency(cogsTotal!) : 'не заполнен'}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-muted-foreground">
              COGS по заказам
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Подробнее о метрике COGS по заказам"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Себестоимость товаров для всех заказов, рассчитанная
                  по COGS на момент заказа.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Content - depends on coverage */}
        {hasNoCogs ? (
          /* Missing COGS State */
          <div className="mt-2 rounded-md bg-yellow-100 p-2">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">COGS не заполнен</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700">
              {formatNumber(productsWithCogs)} из {formatNumber(totalProducts)} товаров
              ({formatPercentage(cogsCoverage)})
            </p>
            <button
              onClick={handleAssignCogs}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Заполнить COGS
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          /* Normal State */
          <>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-500">
                {formatCurrency(cogsTotal!)}
              </span>
            </div>

            {comparison && (
              <div className="mt-2 flex items-center gap-2">
                <ComparisonBadge
                  direction={comparison.direction}
                  percentage={comparison.percentageChange}
                />
                <span className="text-xs text-muted-foreground">
                  vs {formatCurrency(previousCogsTotal ?? 0)}
                </span>
              </div>
            )}

            {/* Coverage with warning if incomplete */}
            <div className="mt-1 flex items-center gap-1">
              {isIncomplete && (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              <span
                className={cn(
                  'text-xs',
                  isIncomplete ? 'text-yellow-600' : 'text-gray-400'
                )}
              >
                COGS: {formatNumber(productsWithCogs)} из{' '}
                {formatNumber(totalProducts)} товаров
                ({formatPercentage(cogsCoverage)})
              </span>
            </div>

            {isIncomplete && (
              <button
                onClick={handleAssignCogs}
                className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Заполнить COGS
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Tooltip Content (Russian)

**COGS по заказам**: Себестоимость товаров для всех заказов, рассчитанная по COGS на момент заказа.

---

## Data Flow

```
useOrdersCogs hook
       |
       v
+-----------------+
| cogsTotal       | -> cogsTotal prop
| productsWithCogs| -> productsWithCogs prop
| totalProducts   | -> totalProducts prop
| coverage        | -> cogsCoverage prop
+-----------------+

useAnalyticsComparison hook
       |
       v
+-----------------+
| period2.        |
| ordersCogs      | -> previousCogsTotal prop
+-----------------+
```

---

## Navigation Routes

When "Заполнить COGS" is clicked:
- Navigate to `ROUTES.COGS.SINGLE` (e.g., `/cogs/single`)
- Preserve current context if needed via query params

---

## Accessibility Requirements

- Card container: `role="article"` with descriptive `aria-label`
- Tooltip trigger: `aria-label="Подробнее о метрике COGS по заказам"`
- Warning state: Uses semantic colors and icons for visual users
- Action link: Keyboard focusable with clear focus indicator
- Loading state: Skeleton with `aria-busy="true"`
- Color contrast: Yellow warning passes WCAG AA on white

---

## Testing Checklist

- [ ] Displays formatted currency value correctly when COGS complete
- [ ] Shows warning state when COGS incomplete (< 100%)
- [ ] Shows missing state when no COGS data
- [ ] Coverage percentage displays correctly
- [ ] "Заполнить COGS" link navigates correctly
- [ ] Comparison badge shows correct direction
- [ ] Tooltip displays on hover/focus
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows message and retry button
- [ ] Keyboard accessible

---

## Definition of Done

- [ ] Component renders correctly with all states (complete, partial, missing)
- [ ] Warning badge displays when coverage < 100%
- [ ] Navigation to COGS assignment works
- [ ] Responsive design works
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] File under 200 lines
- [ ] No ESLint errors
- [ ] Code review approved

---

## Dependencies (Blocking)

- **Story 61.4-FE** (useOrdersCogs hook) - Required for data
- **Story 61.5-FE** (useAnalyticsComparison) - Required for comparison

**Recommendation**: Can develop component with mock data while waiting for hooks.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| 100% COGS coverage | Show value, no warning |
| Partial COGS (1-99%) | Show calculated value + warning badge + "Заполнить COGS" link |
| Zero COGS (0%) | Show warning state, no value |
| null cogsTotal | Show warning state as if 0% |
| API error | Show error state with retry |

---

## References

- Epic 62-FE: `docs/epics/epic-62-fe-dashboard-presentation.md`
- Wireframe: `docs/wireframes/dashboard-kpi-cards.md` (Section 5.4)
- Epic 61-FE Story 61.4: COGS for Orders
- Routes: `src/lib/routes.ts`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

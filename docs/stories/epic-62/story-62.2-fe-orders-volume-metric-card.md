# Story 62.2-FE: Orders Volume Metric Card

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 2 SP

---

## Title (RU)

Карточка метрики объёма заказов

---

## Description

Create a dedicated metric card for displaying Orders volume (Заказы) - the potential revenue from all orders placed during the selected period. This card represents the first metric in the 8-card grid and shows the total monetary value of all orders, regardless of their final status (completed, cancelled, returned).

The card should clearly communicate that this is "potential" revenue, not actual sales, helping users understand the difference between orders placed and orders fulfilled.

---

## Acceptance Criteria

- [ ] Display `total_amount` from `useOrdersVolume` hook
- [ ] Show comparison with previous period (up/down indicator with percentage)
- [ ] Format value as currency (Russian Ruble format: "1 234 567,89 RUB")
- [ ] Display order count in subtitle: "X заказов"
- [ ] Include tooltip explaining "Потенциальный доход от заказов"
- [ ] Use ShoppingCart icon (lucide-react)
- [ ] Blue value color (#3B82F6) to indicate potential/pending
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry option
- [ ] Handle null/undefined data gracefully (show dash)

---

## Design Specifications

### Card Anatomy

```
+--------------------------------------------------+
| [ShoppingCart] Заказы                        [i] |  <- Title row
|                                                  |
|   1 234 567,89 RUB                                |  <- Main value (Blue)
|                                                  |
|   [^+12,5%]  vs 1 098 765 RUB                     |  <- Comparison row
|                                                  |
|   15 234 заказов                                 |  <- Subtitle
+--------------------------------------------------+
```

### Colors

| Element | Color | Hex | Tailwind |
|---------|-------|-----|----------|
| Icon | Blue | `#3B82F6` | `text-blue-500` |
| Main value | Blue | `#3B82F6` | `text-blue-500` |
| Title | Gray | `#757575` | `text-muted-foreground` |
| Positive comparison | Green | `#22C55E` | `bg-green-100 text-green-700` |
| Negative comparison | Red | `#EF4444` | `bg-red-100 text-red-700` |
| Subtitle | Light gray | `#9CA3AF` | `text-gray-400` |

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Title | 14px | 500 (medium) | 1.5 |
| Main value | 32px | 700 (bold) | 1.2 |
| Comparison badge | 12px | 500 (medium) | 1.5 |
| Subtitle | 12px | 400 (regular) | 1.5 |

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Card padding | 16px | `p-4` |
| Between title and value | 8px | `mt-2` |
| Between value and comparison | 8px | `mt-2` |
| Between comparison and subtitle | 4px | `mt-1` |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  OrdersMetricCard.tsx          <- Main component
```

### Props Interface

```typescript
interface OrdersMetricCardProps {
  // Data
  totalAmount: number | null | undefined;
  totalOrders: number | null | undefined;
  previousAmount: number | null | undefined;

  // States
  isLoading?: boolean;
  error?: Error | null;

  // Optional
  className?: string;
  onRetry?: () => void;
}
```

### Comparison Calculation

```typescript
function calculateComparison(
  current: number | null | undefined,
  previous: number | null | undefined
): {
  direction: 'positive' | 'negative' | 'neutral';
  percentageChange: number;
  absoluteDifference: number;
} | null {
  if (current == null || previous == null || previous === 0) {
    return null;
  }

  const difference = current - previous;
  const percentageChange = (difference / previous) * 100;

  return {
    direction: difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral',
    percentageChange: Math.abs(percentageChange),
    absoluteDifference: difference,
  };
}
```

### Dependencies

| Hook/Utility | Source | Purpose |
|--------------|--------|---------|
| `useOrdersVolume` | Story 61.3-FE | Orders volume data |
| `formatCurrency` | `src/lib/formatters.ts` | Currency formatting |
| `formatNumber` | `src/lib/formatters.ts` | Number formatting |
| `ComparisonBadge` | Existing | Comparison indicator |
| `Tooltip` | shadcn/ui | Info tooltip |
| `ShoppingCart` | lucide-react | Card icon |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/OrdersMetricCard.tsx` | CREATE | Orders volume metric card |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add export |

---

## Component Implementation

```tsx
'use client';

import { ShoppingCart, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonBadge } from '@/components/custom/ComparisonBadge';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface OrdersMetricCardProps {
  totalAmount: number | null | undefined;
  totalOrders: number | null | undefined;
  previousAmount: number | null | undefined;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function OrdersMetricCard({
  totalAmount,
  totalOrders,
  previousAmount,
  isLoading = false,
  error,
  className,
  onRetry,
}: OrdersMetricCardProps) {
  if (isLoading) {
    return <OrdersMetricCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <MetricCardError
        title="Заказы"
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  const comparison = calculateComparison(totalAmount, previousAmount);

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Заказы: ${totalAmount != null ? formatCurrency(totalAmount) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Заказы
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Подробнее о метрике Заказы"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Сумма всех заказов за выбранный период. Включает
                  отменённые и невыкупленные заказы.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Value */}
        <div className="mt-2">
          <span className="text-2xl font-bold text-blue-500">
            {totalAmount != null ? formatCurrency(totalAmount) : '—'}
          </span>
        </div>

        {/* Comparison */}
        {comparison && (
          <div className="mt-2 flex items-center gap-2">
            <ComparisonBadge
              direction={comparison.direction}
              percentage={comparison.percentageChange}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousAmount ?? 0)}
            </span>
          </div>
        )}

        {/* Subtitle */}
        <div className="mt-1">
          <span className="text-xs text-gray-400">
            {totalOrders != null
              ? `${formatNumber(totalOrders)} заказов`
              : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Tooltip Content (Russian)

**Заказы**: Сумма всех заказов за выбранный период. Включает отменённые и невыкупленные заказы.

---

## Data Flow

```
useOrdersVolume hook
       |
       v
+------+------+
| total_amount| -> totalAmount prop
| total_orders| -> totalOrders prop
+-------------+

useAnalyticsComparison hook
       |
       v
+------+------+
| period2.    |
| ordersAmount| -> previousAmount prop
+-------------+
```

---

## Accessibility Requirements

- Card container: `role="article"` with descriptive `aria-label`
- Tooltip trigger: `aria-label="Подробнее о метрике Заказы"`
- Loading state: Skeleton with `aria-busy="true"`
- Error state: Actionable error message with retry button
- Color contrast: Blue (#3B82F6) on white passes WCAG AA

---

## Testing Checklist

- [ ] Displays formatted currency value correctly
- [ ] Shows correct order count in subtitle
- [ ] Comparison badge shows correct direction and percentage
- [ ] Tooltip displays on hover/focus
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows message and retry button
- [ ] Handles null/undefined data (shows dash)
- [ ] Keyboard accessible (can tab to tooltip)
- [ ] Screen reader announces card content

---

## Definition of Done

- [ ] Component renders correctly with all states
- [ ] Responsive design works
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] File under 200 lines
- [ ] No ESLint errors
- [ ] Code review approved

---

## Dependencies (Blocking)

- **Story 61.3-FE** (useOrdersVolume hook) - Required for data
- **Story 61.5-FE** (useAnalyticsComparison) - Required for comparison

**Recommendation**: Can develop component with mock data while waiting for hooks.

---

## References

- Epic 62-FE: `docs/epics/epic-62-fe-dashboard-presentation.md`
- Wireframe: `docs/wireframes/dashboard-kpi-cards.md`
- Epic 61-FE Story 61.3: Orders Volume API Integration
- Formatters: `src/lib/formatters.ts`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

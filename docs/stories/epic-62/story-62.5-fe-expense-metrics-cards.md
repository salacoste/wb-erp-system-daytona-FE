# Story 62.5-FE: Expense Metrics Cards (Advertising, Logistics, Storage)

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 2 SP

---

## Title (RU)

Карточки расходов (реклама, логистика, хранение)

---

## Description

Create/update three expense metric cards for Advertising (Рекламные затраты), Logistics (Логистика), and Storage (Хранение) costs. These cards display the major expense categories that impact theoretical profit.

All expense cards share similar structure but have unique icons and colors. They should show the expense value as a negative impact on profit (displayed in expense-appropriate colors), with comparison to the previous period. For expenses, a decrease is considered positive (good) while an increase is considered negative (bad) - this requires inverted comparison logic.

---

## Acceptance Criteria

### General (All 3 cards)
- [ ] All show comparison with previous period
- [ ] All formatted as currency (Russian Ruble format)
- [ ] Inverted comparison logic: decrease = positive (green), increase = negative (red)
- [ ] Subtitle shows expense as % of revenue (when available)
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry option
- [ ] Consistent styling across all expense cards

### Advertising Card (Рекламные затраты)
- [ ] Display `total_spend` from advertising analytics (not just ROAS)
- [ ] Use Megaphone icon (lucide-react)
- [ ] Yellow/Orange color (#F59E0B) for value
- [ ] Tooltip: "Общие расходы на рекламу в Wildberries за выбранный период"

### Logistics Card (Логистика)
- [ ] Display `logistics_cost` from finance summary
- [ ] Use Truck icon (lucide-react)
- [ ] Red color (#EF4444) for value
- [ ] Tooltip: "Расходы на доставку товаров покупателям и возвраты"

### Storage Card (Хранение)
- [ ] Display `storage_cost` from finance summary
- [ ] Use Warehouse icon (lucide-react)
- [ ] Purple color (#7C4DFF) for value
- [ ] Tooltip: "Расходы на хранение товаров на складах Wildberries"

---

## Design Specifications

### Card Anatomy (Advertising Example)

```
+--------------------------------------------------+
| [Megaphone] Рекламные затраты                [i] |  <- Title row
|                                                  |
|   45 678,00 RUB                                   |  <- Main value (Yellow)
|                                                  |
|   [v-3,1%]  vs 47 123 RUB                         |  <- Comparison (GREEN - decrease is good)
|                                                  |
|   3,7% от выручки                               |  <- Subtitle
+--------------------------------------------------+
```

### Card Anatomy (Logistics Example)

```
+--------------------------------------------------+
| [Truck] Логистика                            [i] |  <- Title row
|                                                  |
|   67 890,00 RUB                                   |  <- Main value (Red)
|                                                  |
|   [^+2,4%]  vs 66 298 RUB                         |  <- Comparison (RED - increase is bad)
|                                                  |
|   5,5% от выручки                               |  <- Subtitle
+--------------------------------------------------+
```

### Card Anatomy (Storage Example)

```
+--------------------------------------------------+
| [Warehouse] Хранение                         [i] |  <- Title row
|                                                  |
|   12 345,00 RUB                                   |  <- Main value (Purple)
|                                                  |
|   [^+18,9%]  vs 10 383 RUB                        |  <- Comparison (RED - increase is bad)
|                                                  |
|   1,0% от выручки                               |  <- Subtitle
+--------------------------------------------------+
```

### Colors

| Card | Icon Color | Value Color | Hex | Tailwind |
|------|------------|-------------|-----|----------|
| Advertising | Yellow | Yellow | `#F59E0B` | `text-yellow-600` |
| Logistics | Red | Red | `#EF4444` | `text-red-500` |
| Storage | Purple | Purple | `#7C4DFF` | `text-purple-500` |

| Element | Condition | Color | Tailwind |
|---------|-----------|-------|----------|
| Comparison | Decrease (good) | Green | `bg-green-100 text-green-700` |
| Comparison | Increase (bad) | Red | `bg-red-100 text-red-700` |
| Comparison | No change | Gray | `bg-gray-100 text-gray-600` |
| Title | All | Muted | `text-muted-foreground` |
| Subtitle | All | Gray | `text-gray-400` |

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
  ExpenseMetricCard.tsx          <- Base component (reusable)
  AdvertisingMetricCard.tsx      <- Advertising-specific wrapper
  LogisticsMetricCard.tsx        <- Logistics-specific wrapper
  StorageMetricCard.tsx          <- Storage-specific wrapper
```

### Base Props Interface (ExpenseMetricCard)

```typescript
interface ExpenseMetricCardProps {
  // Metadata
  title: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  valueColor: string;

  // Data
  value: number | null | undefined;
  previousValue: number | null | undefined;
  revenueTotal?: number | null;  // For calculating % of revenue

  // States
  isLoading?: boolean;
  error?: Error | null;

  // Optional
  className?: string;
  onRetry?: () => void;
}
```

### Specific Card Props

```typescript
// AdvertisingMetricCard
interface AdvertisingMetricCardProps {
  totalSpend: number | null | undefined;
  previousSpend: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

// LogisticsMetricCard
interface LogisticsMetricCardProps {
  logisticsCost: number | null | undefined;
  previousLogisticsCost: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

// StorageMetricCard
interface StorageMetricCardProps {
  storageCost: number | null | undefined;
  previousStorageCost: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}
```

### Inverted Comparison Logic

```typescript
/**
 * For expense metrics, a decrease is positive (good) and increase is negative (bad)
 * This is the opposite of revenue metrics
 */
function calculateExpenseComparison(
  current: number | null | undefined,
  previous: number | null | undefined
): ComparisonResult | null {
  if (current == null || previous == null || previous === 0) {
    return null;
  }

  const difference = current - previous;
  const percentageChange = (difference / previous) * 100;

  // INVERTED: decrease is positive, increase is negative
  return {
    direction: difference < 0 ? 'positive' : difference > 0 ? 'negative' : 'neutral',
    percentageChange: Math.abs(percentageChange),
    absoluteDifference: difference,
  };
}
```

### Revenue Percentage Calculation

```typescript
function calculateRevenuePercentage(
  expense: number | null | undefined,
  revenue: number | null | undefined
): string | null {
  if (expense == null || revenue == null || revenue === 0) {
    return null;
  }

  const percentage = (expense / revenue) * 100;
  return formatPercentage(percentage, 1); // e.g., "3,7%"
}
```

### Dependencies

| Hook/Utility | Source | Purpose |
|--------------|--------|---------|
| `useAdvertisingAnalytics` | Existing (modified 61.8) | Advertising spend |
| `useFinancialSummary` | Existing (modified 61.2) | Logistics, storage costs |
| `useAnalyticsComparison` | Story 61.5-FE | Previous period data |
| `formatCurrency` | `src/lib/formatters.ts` | Currency formatting |
| `formatPercentage` | `src/lib/formatters.ts` | Percentage formatting |
| `ComparisonBadge` | Existing (with invert support) | Comparison indicator |
| `Tooltip` | shadcn/ui | Info tooltip |
| `Megaphone` | lucide-react | Advertising icon |
| `Truck` | lucide-react | Logistics icon |
| `Warehouse` | lucide-react | Storage icon |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/ExpenseMetricCard.tsx` | CREATE | Base expense card component |
| `src/components/custom/dashboard/AdvertisingMetricCard.tsx` | CREATE | Advertising expense card |
| `src/components/custom/dashboard/LogisticsMetricCard.tsx` | CREATE | Logistics expense card |
| `src/components/custom/dashboard/StorageMetricCard.tsx` | CREATE | Storage expense card |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add exports |
| `src/components/custom/ComparisonBadge.tsx` | MODIFY | Add `invertDirection` prop if not present |

---

## Base Component Implementation (ExpenseMetricCard)

```tsx
'use client';

import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ComparisonBadge } from '@/components/custom/ComparisonBadge';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ExpenseMetricCardProps {
  title: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  valueColor: string;
  value: number | null | undefined;
  previousValue: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function ExpenseMetricCard({
  title,
  tooltip,
  icon: Icon,
  valueColor,
  value,
  previousValue,
  revenueTotal,
  isLoading = false,
  error,
  className,
  onRetry,
}: ExpenseMetricCardProps) {
  if (isLoading) {
    return <MetricCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <MetricCardError
        title={title}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  const comparison = calculateExpenseComparison(value, previousValue);
  const revenuePercentage = calculateRevenuePercentage(value, revenueTotal);

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`${title}: ${value != null ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', valueColor)} />
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Подробнее о метрике ${title}`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Value */}
        <div className="mt-2">
          <span className={cn('text-2xl font-bold', valueColor)}>
            {value != null ? formatCurrency(value) : '—'}
          </span>
        </div>

        {/* Comparison - Note: invertDirection=true for expenses */}
        {comparison && (
          <div className="mt-2 flex items-center gap-2">
            <ComparisonBadge
              direction={comparison.direction}
              percentage={comparison.percentageChange}
              invertDirection={true}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousValue ?? 0)}
            </span>
          </div>
        )}

        {/* Revenue Percentage */}
        {revenuePercentage && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">
              {revenuePercentage} от выручки
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Specific Card Implementations

### AdvertisingMetricCard

```tsx
import { Megaphone } from 'lucide-react';
import { ExpenseMetricCard } from './ExpenseMetricCard';

interface AdvertisingMetricCardProps {
  totalSpend: number | null | undefined;
  previousSpend: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function AdvertisingMetricCard({
  totalSpend,
  previousSpend,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: AdvertisingMetricCardProps) {
  return (
    <ExpenseMetricCard
      title="Рекламные затраты"
      tooltip="Общие расходы на рекламу в Wildberries за выбранный период."
      icon={Megaphone}
      valueColor="text-yellow-600"
      value={totalSpend}
      previousValue={previousSpend}
      revenueTotal={revenueTotal}
      isLoading={isLoading}
      error={error}
      className={className}
      onRetry={onRetry}
    />
  );
}
```

### LogisticsMetricCard

```tsx
import { Truck } from 'lucide-react';
import { ExpenseMetricCard } from './ExpenseMetricCard';

interface LogisticsMetricCardProps {
  logisticsCost: number | null | undefined;
  previousLogisticsCost: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function LogisticsMetricCard({
  logisticsCost,
  previousLogisticsCost,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: LogisticsMetricCardProps) {
  return (
    <ExpenseMetricCard
      title="Логистика"
      tooltip="Расходы на доставку товаров покупателям и возвраты."
      icon={Truck}
      valueColor="text-red-500"
      value={logisticsCost}
      previousValue={previousLogisticsCost}
      revenueTotal={revenueTotal}
      isLoading={isLoading}
      error={error}
      className={className}
      onRetry={onRetry}
    />
  );
}
```

### StorageMetricCard

```tsx
import { Warehouse } from 'lucide-react';
import { ExpenseMetricCard } from './ExpenseMetricCard';

interface StorageMetricCardProps {
  storageCost: number | null | undefined;
  previousStorageCost: number | null | undefined;
  revenueTotal?: number | null;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function StorageMetricCard({
  storageCost,
  previousStorageCost,
  revenueTotal,
  isLoading,
  error,
  className,
  onRetry,
}: StorageMetricCardProps) {
  return (
    <ExpenseMetricCard
      title="Хранение"
      tooltip="Расходы на хранение товаров на складах Wildberries."
      icon={Warehouse}
      valueColor="text-purple-500"
      value={storageCost}
      previousValue={previousStorageCost}
      revenueTotal={revenueTotal}
      isLoading={isLoading}
      error={error}
      className={className}
      onRetry={onRetry}
    />
  );
}
```

---

## Tooltip Content (Russian)

| Card | Tooltip |
|------|---------|
| Рекламные затраты | Общие расходы на рекламу в Wildberries за выбранный период. |
| Логистика | Расходы на доставку товаров покупателям и возвраты. |
| Хранение | Расходы на хранение товаров на складах Wildberries. |

---

## Data Flow

```
useAdvertisingAnalytics hook
       |
       v
+-----------------+
| total_spend     | -> AdvertisingMetricCard.totalSpend
+-----------------+

useFinancialSummary hook
       |
       v
+-----------------+
| logistics_cost  | -> LogisticsMetricCard.logisticsCost
| storage_cost    | -> StorageMetricCard.storageCost
| wb_sales_gross  | -> revenueTotal (for % calculation)
+-----------------+

useAnalyticsComparison hook
       |
       v
+-----------------+
| period2.        |
|   advertising   | -> previousSpend
|   logistics     | -> previousLogisticsCost
|   storage       | -> previousStorageCost
+-----------------+
```

---

## ComparisonBadge Update

If not already present, the `ComparisonBadge` component needs an `invertDirection` prop:

```typescript
interface ComparisonBadgeProps {
  direction: 'positive' | 'negative' | 'neutral';
  percentage: number;
  invertDirection?: boolean;  // NEW: For expense metrics
}

// When invertDirection=true:
// - 'positive' direction (value went down) -> green badge
// - 'negative' direction (value went up) -> red badge
```

---

## Accessibility Requirements

- Card container: `role="article"` with descriptive `aria-label`
- Tooltip trigger: `aria-label="Подробнее о метрике {title}"`
- Loading state: Skeleton with `aria-busy="true"`
- Color coding: Not sole indicator (includes text and icons)
- Color contrast: All colors pass WCAG AA on white

---

## Testing Checklist

### All Cards
- [ ] Displays formatted currency value correctly
- [ ] Shows correct icon and color
- [ ] Comparison badge shows inverted logic (decrease = green)
- [ ] Tooltip displays on hover/focus
- [ ] Revenue percentage calculates correctly
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows message and retry button
- [ ] Handles null/undefined data (shows dash)
- [ ] Keyboard accessible

### Advertising Card
- [ ] Displays total_spend from advertising API
- [ ] Yellow/orange color scheme
- [ ] Megaphone icon displayed

### Logistics Card
- [ ] Displays logistics_cost from finance summary
- [ ] Red color scheme
- [ ] Truck icon displayed

### Storage Card
- [ ] Displays storage_cost from finance summary
- [ ] Purple color scheme
- [ ] Warehouse icon displayed

---

## Definition of Done

- [ ] All 3 expense cards render correctly
- [ ] Inverted comparison logic works (decrease = positive)
- [ ] Revenue percentage displays when available
- [ ] Consistent styling across all expense cards
- [ ] Responsive design works
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] Each file under 200 lines
- [ ] No ESLint errors
- [ ] Code review approved

---

## Dependencies (Blocking)

- **Story 61.8-FE** (useAdvertisingAnalytics with total_spend) - Required for advertising
- **Story 61.2-FE** (useFinancialSummary fix) - Required for logistics/storage
- **Story 61.5-FE** (useAnalyticsComparison) - Required for comparison

**Recommendation**: Can develop components with mock data while waiting for hooks.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Zero expense | Show "0 RUB", neutral comparison |
| No previous data | Show value without comparison |
| Expense decreased | Green comparison badge (good) |
| Expense increased | Red comparison badge (bad) |
| No revenue for % | Hide "% от выручки" subtitle |
| API error | Show error state with retry |

---

## References

- Epic 62-FE: `docs/epics/epic-62-fe-dashboard-presentation.md`
- Wireframe: `docs/wireframes/dashboard-kpi-cards.md`
- Epic 61-FE Story 61.8: Advertising Total Spend
- Finance Summary: `useFinancialSummary` hook
- Design System: `docs/front-end-spec.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

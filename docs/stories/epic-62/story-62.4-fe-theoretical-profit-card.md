# Story 62.4-FE: Theoretical Profit Card with Breakdown

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 3 SP

---

## Title (RU)

Карточка теоретической прибыли с разбивкой

---

## Description

Create the highlighted "Теор. прибыль" (Theoretical Profit) card - the most important summary metric on the dashboard. This card displays the calculated theoretical profit using the business formula:

**Теор. прибыль = Заказы - COGS - Реклама - Логистика - Хранение**

The card must be visually emphasized as the "итоговая метрика" (summary metric) and include an expandable breakdown popover showing all component values. The card should clearly indicate positive (green) or negative (red) profit states.

---

## Acceptance Criteria

- [ ] Display calculated theoretical profit value from `calculateTheoreticalProfit()`
- [ ] Show comparison with previous period (up/down indicator)
- [ ] Expandable breakdown popover showing all components:
  - Заказы: +X RUB
  - COGS: -X RUB
  - Реклама: -X RUB
  - Логистика: -X RUB
  - Хранение: -X RUB
  - = Теор. прибыль: X RUB
- [ ] Color coding: Green (#22C55E) if positive, Red (#EF4444) if negative
- [ ] Visual emphasis: 2px border, larger value size (48px), gradient background
- [ ] "Incomplete" badge if any component is missing
- [ ] Use Calculator icon (lucide-react)
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry option
- [ ] Tooltip explaining the formula

---

## Design Specifications

### Card Anatomy - Positive Profit

```
+======================================================+
||  [Calculator] Теор. прибыль                    [i] ||  <- Title row
||                                                    ||
||         876 421,00 RUB                              ||  <- Main value (GREEN, 48px)
||                                                    ||
||   [^+23,4%]  vs 709 562 RUB                        ||  <- Comparison row
||                                                    ||
||   [Показать разбивку v]                           ||  <- Expand trigger
+======================================================+

Double border = Blue (#3B82F6) highlight
```

### Card Anatomy - Negative Profit

```
+======================================================+
||  [Calculator] Теор. прибыль                    [i] ||  <- Title row
||                                                    ||
||        -123 456,00 RUB                              ||  <- Main value (RED, 48px)
||                                                    ||
||   [v-18,7%]  vs -103 976 RUB                       ||  <- Comparison row
||                                                    ||
||   [Показать разбивку v]                           ||  <- Expand trigger
+======================================================+

Double border = Red (#EF4444) highlight
```

### Breakdown Popover

```
+------------------------------------------+
| Разбивка теоретической прибыли           |
+------------------------------------------+
|                                          |
|  Заказы          +1 234 567,89 RUB        |  <- Green
|  COGS               -234 567,00 RUB        |  <- Gray
|  Реклама            -45 678,00 RUB        |  <- Orange
|  Логистика          -67 890,00 RUB        |  <- Red
|  Хранение           -12 345,00 RUB        |  <- Purple
|  ─────────────────────────────────       |
|  Теор. прибыль    = 876 421,00 RUB        |  <- Green (bold)
|                                          |
+------------------------------------------+

Popover width: 300px
```

### Card Anatomy - Incomplete Data

```
+======================================================+
||  [Calculator] Теор. прибыль    [!] Неполные данные ||
||                                                    ||
||         ≈ 650 000,00 RUB                            ||  <- Approximate value
||                                                    ||
||   Не хватает: COGS, Хранение                       ||  <- Missing components
||                                                    ||
||   [Показать разбивку v]                           ||
+======================================================+

Border = Yellow (#F59E0B) for incomplete
```

### Colors

| Element | Condition | Hex | Tailwind |
|---------|-----------|-----|----------|
| Icon | Default | `#6B7280` | `text-gray-500` |
| Main value | Positive | `#22C55E` | `text-green-500` |
| Main value | Negative | `#EF4444` | `text-red-500` |
| Card border | Positive | `#3B82F6` | `border-blue-500` |
| Card border | Negative | `#EF4444` | `border-red-500` |
| Card border | Incomplete | `#F59E0B` | `border-yellow-500` |
| Card background | Positive | gradient | `from-blue-50 to-white` |
| Card background | Negative | gradient | `from-red-50 to-white` |
| Breakdown: Orders | | `#3B82F6` | `text-blue-500` |
| Breakdown: COGS | | `#6B7280` | `text-gray-500` |
| Breakdown: Advertising | | `#F59E0B` | `text-yellow-600` |
| Breakdown: Logistics | | `#EF4444` | `text-red-500` |
| Breakdown: Storage | | `#7C4DFF` | `text-purple-500` |

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Title | 14px | 500 (medium) | 1.5 |
| Main value | 48px | 700 (bold) | 1.1 |
| Comparison badge | 12px | 500 (medium) | 1.5 |
| Breakdown title | 14px | 600 (semibold) | 1.5 |
| Breakdown row | 14px | 400 (regular) | 1.5 |
| Breakdown total | 14px | 700 (bold) | 1.5 |

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Card padding | 16px | `p-4` |
| Card border | 2px | `border-2` |
| Popover width | 300px | `w-[300px]` |
| Popover padding | 16px | `p-4` |
| Breakdown row gap | 8px | `space-y-2` |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  TheoreticalProfitCard.tsx         <- Main component
  ProfitBreakdownPopover.tsx        <- Breakdown popover (optional separate file)
```

### Props Interface

```typescript
interface TheoreticalProfitCardProps {
  // Profit calculation result
  profit: TheoreticalProfitResult | null | undefined;

  // Previous period profit for comparison
  previousProfit: number | null | undefined;

  // States
  isLoading?: boolean;
  error?: Error | null;

  // Optional
  className?: string;
  onRetry?: () => void;
}

// From lib/theoretical-profit.ts (Story 61.10-FE)
interface TheoreticalProfitResult {
  value: number;
  breakdown: {
    orders: number;
    cogs: number;
    advertising: number;
    logistics: number;
    storage: number;
  };
  isComplete: boolean;
  missingComponents: string[];
}
```

### Breakdown Row Interface

```typescript
interface BreakdownRow {
  label: string;
  value: number;
  sign: '+' | '-';
  color: string;
}

const breakdownRows: BreakdownRow[] = [
  { label: 'Заказы', value: breakdown.orders, sign: '+', color: 'text-blue-500' },
  { label: 'COGS', value: breakdown.cogs, sign: '-', color: 'text-gray-500' },
  { label: 'Реклама', value: breakdown.advertising, sign: '-', color: 'text-yellow-600' },
  { label: 'Логистика', value: breakdown.logistics, sign: '-', color: 'text-red-500' },
  { label: 'Хранение', value: breakdown.storage, sign: '-', color: 'text-purple-500' },
];
```

### Dependencies

| Hook/Utility | Source | Purpose |
|--------------|--------|---------|
| `calculateTheoreticalProfit` | Story 61.10-FE | Profit calculation |
| `formatCurrency` | `src/lib/formatters.ts` | Currency formatting |
| `ComparisonBadge` | Existing | Comparison indicator |
| `Popover` | shadcn/ui | Breakdown popover |
| `Tooltip` | shadcn/ui | Info tooltip |
| `Calculator` | lucide-react | Card icon |
| `AlertTriangle` | lucide-react | Warning icon |
| `ChevronDown` | lucide-react | Expand icon |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/TheoreticalProfitCard.tsx` | CREATE | Theoretical profit card |
| `src/components/custom/dashboard/ProfitBreakdownPopover.tsx` | CREATE | Breakdown popover component |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add exports |

---

## Component Implementation (Main Card)

```tsx
'use client';

import { useState } from 'react';
import { Calculator, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ComparisonBadge } from '@/components/custom/ComparisonBadge';
import { ProfitBreakdownPopover } from './ProfitBreakdownPopover';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { TheoreticalProfitResult } from '@/lib/theoretical-profit';

interface TheoreticalProfitCardProps {
  profit: TheoreticalProfitResult | null | undefined;
  previousProfit: number | null | undefined;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function TheoreticalProfitCard({
  profit,
  previousProfit,
  isLoading = false,
  error,
  className,
  onRetry,
}: TheoreticalProfitCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  if (isLoading) {
    return <ProfitCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <MetricCardError
        title="Теор. прибыль"
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  const value = profit?.value ?? null;
  const isPositive = value != null && value >= 0;
  const isComplete = profit?.isComplete ?? false;

  const comparison = value != null && previousProfit != null
    ? calculateComparison(value, previousProfit)
    : null;

  // Determine card styling based on state
  const borderColor = !isComplete
    ? 'border-yellow-500'
    : isPositive
    ? 'border-blue-500'
    : 'border-red-500';

  const bgGradient = !isComplete
    ? 'bg-gradient-to-br from-yellow-50 to-white'
    : isPositive
    ? 'bg-gradient-to-br from-blue-50 to-white'
    : 'bg-gradient-to-br from-red-50 to-white';

  const valueColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md border-2',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      aria-label={`Теоретическая прибыль: ${value != null ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Теор. прибыль
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isComplete && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Неполные данные
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Подробнее о теоретической прибыли"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Теоретическая прибыль = Заказы - COGS - Реклама - Логистика - Хранение.
                    Показывает потенциальную прибыль до вычета комиссий WB.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Value */}
        <div className="mt-3">
          <span className={cn('text-5xl font-bold', valueColor)}>
            {value != null ? formatCurrency(value) : '—'}
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
              vs {formatCurrency(previousProfit ?? 0)}
            </span>
          </div>
        )}

        {/* Missing Components Warning */}
        {!isComplete && profit?.missingComponents && profit.missingComponents.length > 0 && (
          <div className="mt-2 text-xs text-yellow-600">
            Не хватает: {profit.missingComponents.join(', ')}
          </div>
        )}

        {/* Breakdown Toggle */}
        {profit?.breakdown && (
          <Popover open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <PopoverTrigger asChild>
              <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Показать разбивку
                {breakdownOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4">
              <ProfitBreakdownPopover
                breakdown={profit.breakdown}
                totalProfit={profit.value}
              />
            </PopoverContent>
          </Popover>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Breakdown Popover Component

```tsx
// ProfitBreakdownPopover.tsx
interface ProfitBreakdownPopoverProps {
  breakdown: {
    orders: number;
    cogs: number;
    advertising: number;
    logistics: number;
    storage: number;
  };
  totalProfit: number;
}

export function ProfitBreakdownPopover({
  breakdown,
  totalProfit,
}: ProfitBreakdownPopoverProps) {
  const rows = [
    { label: 'Заказы', value: breakdown.orders, sign: '+', color: 'text-blue-500' },
    { label: 'COGS', value: breakdown.cogs, sign: '-', color: 'text-gray-500' },
    { label: 'Реклама', value: breakdown.advertising, sign: '-', color: 'text-yellow-600' },
    { label: 'Логистика', value: breakdown.logistics, sign: '-', color: 'text-red-500' },
    { label: 'Хранение', value: breakdown.storage, sign: '-', color: 'text-purple-500' },
  ];

  const isPositive = totalProfit >= 0;

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">
        Разбивка теоретической прибыли
      </h4>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.color}>
              {row.sign}{formatCurrency(Math.abs(row.value))}
            </span>
          </div>
        ))}
        <div className="border-t pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Теор. прибыль</span>
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              = {formatCurrency(totalProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Tooltip Content (Russian)

**Теор. прибыль**: Теоретическая прибыль = Заказы - COGS - Реклама - Логистика - Хранение. Показывает потенциальную прибыль до вычета комиссий и других расходов.

---

## Accessibility Requirements

- Card container: `role="article"` with descriptive `aria-label`
- Tooltip trigger: `aria-label="Подробнее о теоретической прибыли"`
- Popover: Keyboard accessible (Enter/Space to toggle)
- Color coding: Not sole indicator (uses text labels too)
- Focus indicators: Visible on all interactive elements
- High contrast: Large text (48px) passes WCAG AA

---

## Testing Checklist

- [ ] Displays formatted currency value correctly
- [ ] Green color for positive profit
- [ ] Red color for negative profit
- [ ] Blue border for positive profit
- [ ] Red border for negative profit
- [ ] Yellow border and badge for incomplete data
- [ ] Breakdown popover opens/closes correctly
- [ ] Breakdown shows all 5 components with correct signs
- [ ] Breakdown totals match displayed value
- [ ] Comparison badge shows correct direction
- [ ] Missing components list displayed when incomplete
- [ ] Tooltip displays on hover/focus
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows message and retry button
- [ ] Keyboard accessible

---

## Definition of Done

- [ ] Component renders correctly with all states (positive, negative, incomplete)
- [ ] Breakdown popover works correctly
- [ ] Visual emphasis (border, size, gradient) applied
- [ ] Responsive design works
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] Main file under 200 lines (use separate file for popover if needed)
- [ ] No ESLint errors
- [ ] Code review approved

---

## Dependencies (Blocking)

- **Story 61.10-FE** (calculateTheoreticalProfit) - Required for calculation
- **Story 61.3-FE** (useOrdersVolume) - Orders data for calculation
- **Story 61.4-FE** (useOrdersCogs) - COGS data for calculation
- **Story 61.5-FE** (useAnalyticsComparison) - Comparison data

**Recommendation**: Can develop component with mock data while waiting for hooks.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| All components present | Show complete profit, no warning |
| Some components missing | Show partial profit with warning badge, list missing |
| Zero profit | Show 0 RUB with neutral styling (blue border) |
| Very large negative profit | Show in red, ensure formatting handles |
| All components zero | Show 0 RUB |
| API error | Show error state with retry |

---

## References

- Epic 62-FE: `docs/epics/epic-62-fe-dashboard-presentation.md`
- Wireframe: `docs/wireframes/dashboard-kpi-cards.md` (Section 6)
- Epic 61-FE Story 61.10: Theoretical Profit Calculation
- Business Formula: `docs/request-backend/125-DASHBOARD-MAIN-PAGE-GUIDE.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

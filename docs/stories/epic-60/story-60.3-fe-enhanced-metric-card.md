# Story 60.3-FE: Добавить индикаторы сравнения в MetricCard

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Story ID**: Story 60.3-FE
**Status**: ✅ Completed
**Story Points**: 3 SP
**Priority**: P0 (Core UI)
**Dependencies**: None (can be developed in parallel with 60.1 and 60.2)

---

## User Story

**As a** WB seller viewing the dashboard
**I want** to see how my metrics compare to the previous period at a glance
**So that** I can quickly understand if my business is improving or declining

---

## Acceptance Criteria

- [x] AC1: Accept `previousValue` prop for comparison calculation
- [x] AC2: Calculate percentage change: `((current - previous) / previous) * 100`
- [x] AC3: Display trend arrow: ↑ (green #22C55E), ↓ (red #EF4444), — (gray #757575)
- [x] AC4: Display percentage badge with semantic background color
- [x] AC5: Show absolute difference on hover tooltip ("vs 82 780 ₽")
- [x] AC6: Support `format` prop: 'currency' | 'percentage' | 'number'
- [x] AC7: Add optional `tooltip` prop explaining the metric definition
- [x] AC8: Maintain existing loading skeleton state
- [x] AC9: Handle edge cases: zero previous value, null values, negative values
- [x] AC10: Invert comparison logic for expense metrics (lower is better)
- [x] AC11: Accessible: ARIA labels for trend indicators

---

## Technical Specifications

### Component Interface

```typescript
// src/components/custom/MetricCardEnhanced.tsx

export type MetricFormat = 'currency' | 'percentage' | 'number'

export type TrendDirection = 'positive' | 'negative' | 'neutral'

export interface MetricCardEnhancedProps {
  /** Card title (e.g., "К перечислению") */
  title: string
  /** Current period value */
  value: number | null | undefined
  /** Previous period value for comparison */
  previousValue?: number | null
  /** Format for displaying values */
  format?: MetricFormat
  /** Icon to display (lucide-react icon component) */
  icon?: React.ComponentType<{ className?: string }>
  /** Tooltip explaining the metric */
  tooltip?: string
  /** Loading state */
  isLoading?: boolean
  /** Error state message */
  error?: string | null
  /** Invert comparison (true for expenses: lower is better) */
  invertComparison?: boolean
  /** Custom className for card wrapper */
  className?: string
  /** Callback on card click (for drill-down navigation) */
  onClick?: () => void
}

/**
 * Enhanced metric card with comparison indicators
 *
 * Features:
 * - Trend arrow (up/down/neutral)
 * - Percentage change badge
 * - Absolute difference tooltip
 * - Multiple format support
 *
 * @example
 * <MetricCardEnhanced
 *   title="К перечислению"
 *   value={87074.72}
 *   previousValue={82780}
 *   format="currency"
 *   icon={Wallet}
 *   tooltip="Сумма к перечислению продавцу за период"
 * />
 */
export function MetricCardEnhanced(props: MetricCardEnhancedProps): JSX.Element
```

### Helper Components Interface

```typescript
// src/components/custom/TrendIndicator.tsx

export interface TrendIndicatorProps {
  /** Trend direction */
  direction: TrendDirection
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
}

/**
 * Trend arrow indicator (↑/↓/—)
 */
export function TrendIndicator(props: TrendIndicatorProps): JSX.Element
```

```typescript
// src/components/custom/ComparisonBadge.tsx

export interface ComparisonBadgeProps {
  /** Percentage change value */
  percentageChange: number
  /** Trend direction (determines color) */
  direction: TrendDirection
  /** Show absolute difference on hover */
  absoluteDifference?: string
  /** Custom className */
  className?: string
}

/**
 * Percentage change badge with semantic color
 *
 * @example
 * <ComparisonBadge
 *   percentageChange={5.2}
 *   direction="positive"
 *   absoluteDifference="+4 294,72 ₽"
 * />
 */
export function ComparisonBadge(props: ComparisonBadgeProps): JSX.Element
```

### Comparison Calculation Logic

```typescript
// src/lib/comparison-helpers.ts

export interface ComparisonResult {
  /** Percentage change (-100 to +Infinity) */
  percentageChange: number
  /** Formatted percentage string ("+5,2%" or "-2,1%") */
  formattedPercentage: string
  /** Absolute difference */
  absoluteDifference: number
  /** Formatted absolute difference string */
  formattedDifference: string
  /** Trend direction */
  direction: TrendDirection
}

/**
 * Calculate comparison between current and previous values
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @param invertComparison - True if lower is better (expenses)
 * @returns Comparison result or null if cannot calculate
 */
export function calculateComparison(
  current: number,
  previous: number,
  invertComparison?: boolean
): ComparisonResult | null
```

### Implementation Notes

- Use existing `formatCurrency` and `formatPercentage` helpers from `src/lib/utils`
- Use `Tooltip` component from shadcn/ui for hover content
- TrendIndicator uses `TrendingUp`, `TrendingDown`, `Minus` icons from lucide-react
- Handle division by zero gracefully (return neutral if previous is 0)
- Threshold for neutral: |change| < 0.1% (to avoid showing +0.0% or -0.0%)

### File Structure

```
src/
├── components/
│   └── custom/
│       ├── MetricCardEnhanced.tsx       # Main enhanced card
│       ├── MetricCardEnhanced.test.tsx  # Unit tests
│       ├── TrendIndicator.tsx           # Arrow indicator
│       ├── TrendIndicator.test.tsx
│       ├── ComparisonBadge.tsx          # Percentage badge
│       └── ComparisonBadge.test.tsx
└── lib/
    ├── comparison-helpers.ts            # Calculation utilities
    └── comparison-helpers.test.ts       # Unit tests
```

---

## UI/UX Specifications

### Design Mockup (Standard Card)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  💰 К перечислению                              ⓘ             │
│      └── icon + title                           └── tooltip   │
│                                                                │
│           87 074,72 ₽                                          │
│           └── value (text-2xl font-bold)                       │
│                                                                │
│      ↑ +5,2%   (vs 82 780 ₽)                                   │
│      │    │          └── previous value (text-muted)           │
│      │    └── badge (green bg, white text)                     │
│      └── trend arrow (green)                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Mockup (Negative Trend - Revenue)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  📦 Реализовано                                                │
│                                                                │
│           45 231,89 ₽                                          │
│                                                                │
│      ↓ -12,3%  (vs 51 567 ₽)                                   │
│      └── red arrow, red badge                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Mockup (Positive Trend - Expense, Inverted)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  🚚 Логистика                                                  │
│                                                                │
│           12 450,00 ₽                                          │
│                                                                │
│      ↓ -8,5%   (vs 13 607 ₽)                                   │
│      └── GREEN arrow, GREEN badge (inverted: lower is better) │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Mockup (Neutral/No Change)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  📊 Маржа                                                      │
│                                                                │
│           24,5%                                                │
│                                                                │
│      — 0,0%    (vs 24,5%)                                      │
│      └── gray arrow, gray badge                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Mockup (Loading State)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ████████████████                                              │
│  └── skeleton for title                                        │
│                                                                │
│           ██████████████                                       │
│           └── skeleton for value                               │
│                                                                │
│      ████████  ██████████                                      │
│      └── skeleton for comparison                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Mockup (No Previous Value)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  💰 К перечислению                                             │
│                                                                │
│           87 074,72 ₽                                          │
│                                                                │
│      Нет данных за предыдущий период                           │
│      └── text-muted-foreground text-sm                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Design Tokens

| Element | Token | Value |
|---------|-------|-------|
| Card background | `bg-card` | #FFFFFF |
| Card border | `border` | #EEEEEE |
| Card shadow | `shadow-sm` | subtle |
| Title | `text-sm text-muted-foreground` | #757575, 14px |
| Value | `text-2xl font-bold` | 24px, 700 |
| Positive trend | `text-green-600` | #22C55E |
| Negative trend | `text-red-500` | #EF4444 |
| Neutral trend | `text-muted-foreground` | #757575 |
| Badge positive bg | `bg-green-100` | #DCFCE7 |
| Badge positive text | `text-green-700` | #15803D |
| Badge negative bg | `bg-red-100` | #FEE2E2 |
| Badge negative text | `text-red-700` | #B91C1C |
| Badge neutral bg | `bg-gray-100` | #F3F4F6 |
| Badge neutral text | `text-gray-600` | #4B5563 |
| Previous value | `text-sm text-muted-foreground` | #757575, 14px |

### Spacing

| Element | Spacing |
|---------|---------|
| Card padding | `p-4` |
| Gap between title and value | `gap-2` (8px) |
| Gap between value and comparison | `gap-1` (4px) |
| Badge padding | `px-1.5 py-0.5` |
| Trend arrow margin-right | `mr-1` |

### Typography

| Element | Font |
|---------|------|
| Title | `text-sm font-medium` |
| Value | `text-2xl font-bold` |
| Badge | `text-xs font-medium` |
| Previous value | `text-sm` |

### Animation

- Value change: Fade transition when value updates
- Badge: Subtle scale on hover (1.05)
- Card: `hover:shadow-md` on hover (if clickable)

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| shadcn/ui `Card` | Component | ✅ Available |
| shadcn/ui `Tooltip` | Component | ✅ Available |
| shadcn/ui `Skeleton` | Component | ✅ Available |
| `lucide-react` TrendingUp/Down | Icon | ✅ Available |
| `formatCurrency` helper | Internal | ✅ Available (`src/lib/utils`) |
| `formatPercentage` helper | Internal | ✅ Available (`src/lib/utils`) |

---

## Test Scenarios (for QA)

### Unit Tests

1. **Basic Render**
   - Test: Card renders with title and value
   - Input: `title="Test", value={1000}, format="currency"`
   - Expected: Shows "Test" title and "1 000 ₽"

2. **Positive Comparison**
   - Test: Shows green arrow and positive badge
   - Input: `value={110}, previousValue={100}`
   - Expected: Green ↑ arrow, "+10,0%" badge

3. **Negative Comparison**
   - Test: Shows red arrow and negative badge
   - Input: `value={90}, previousValue={100}`
   - Expected: Red ↓ arrow, "-10,0%" badge

4. **Neutral Comparison (Near Zero)**
   - Test: Shows neutral state for tiny changes
   - Input: `value={100.05}, previousValue={100}`
   - Expected: Gray — indicator, "0,0%" badge

5. **Inverted Comparison (Expenses)**
   - Test: Lower expense shows green (good)
   - Input: `value={90}, previousValue={100}, invertComparison={true}`
   - Expected: Green ↓ arrow (improvement)

6. **Zero Previous Value**
   - Test: Handles division by zero
   - Input: `value={100}, previousValue={0}`
   - Expected: No comparison shown, graceful fallback

7. **Null Values**
   - Test: Handles null current value
   - Input: `value={null}, previousValue={100}`
   - Expected: Shows dash or placeholder

8. **Currency Format**
   - Test: Formats currency correctly
   - Input: `value={87074.72}, format="currency"`
   - Expected: "87 074,72 ₽"

9. **Percentage Format**
   - Test: Formats percentage correctly
   - Input: `value={24.5}, format="percentage"`
   - Expected: "24,5 %"

10. **Number Format**
    - Test: Formats plain number correctly
    - Input: `value={1234}, format="number"`
    - Expected: "1 234"

11. **Loading State**
    - Test: Shows skeleton when loading
    - Input: `isLoading={true}`
    - Expected: Skeleton placeholders visible

12. **Tooltip Display**
    - Test: Tooltip shows on hover
    - Input: `tooltip="Metric explanation"`
    - Expected: Info icon visible, tooltip on hover

13. **Previous Value Tooltip**
    - Test: Absolute difference shown on badge hover
    - Input: `value={110}, previousValue={100}`
    - Expected: Hover shows "vs 100 ₽" or "+10 ₽"

14. **Click Handler**
    - Test: onClick callback fires
    - Input: `onClick={mockFn}`, click card
    - Expected: `mockFn` called once

15. **Accessibility**
    - Test: ARIA labels present
    - Expected: Trend indicator has `aria-label` describing direction

### Integration Tests

1. **With Dashboard Period**
   - Test: Card updates when period changes
   - Setup: Wrap with DashboardPeriodProvider
   - Input: Change period via selector
   - Expected: Value and comparison update

2. **Multiple Cards Consistency**
   - Test: All dashboard cards show same period comparison
   - Setup: Render 4 MetricCardEnhanced components
   - Expected: All show data from same period pair

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] TypeScript strict mode passes
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Responsive design verified
- [ ] Keyboard accessible (card can receive focus if clickable)
- [ ] WCAG 2.1 AA compliant (color contrast, ARIA labels)
- [ ] Code review approved
- [ ] No ESLint errors
- [ ] Each file under 200 lines
- [ ] Russian locale for all user-facing text

---

## Implementation Guide

### Phase 1: Comparison Helpers (30min)

Create `src/lib/comparison-helpers.ts`:
- `calculateComparison()` function
- Handle edge cases (zero, null, negative)
- Unit tests for all cases

### Phase 2: TrendIndicator Component (30min)

Create `src/components/custom/TrendIndicator.tsx`:
- Three icons: TrendingUp, TrendingDown, Minus
- Color based on direction
- Size variants

### Phase 3: ComparisonBadge Component (30min)

Create `src/components/custom/ComparisonBadge.tsx`:
- Formatted percentage display
- Semantic background colors
- Hover tooltip for absolute difference

### Phase 4: MetricCardEnhanced Component (1-1.5h)

Create `src/components/custom/MetricCardEnhanced.tsx`:
- Compose with TrendIndicator and ComparisonBadge
- Handle all format types
- Loading and error states
- Tooltip integration

### Phase 5: Tests & Polish (30min)

- Write comprehensive unit tests
- Test edge cases
- Verify accessibility

---

## Code Examples

### Comparison Helper

```typescript
// src/lib/comparison-helpers.ts

import { formatCurrency, formatPercentage } from '@/lib/utils'

const NEUTRAL_THRESHOLD = 0.1 // Changes < 0.1% considered neutral

export function calculateComparison(
  current: number,
  previous: number,
  invertComparison = false
): ComparisonResult | null {
  // Cannot compare if no previous value
  if (previous === 0 || previous === null || previous === undefined) {
    return null
  }

  const percentageChange = ((current - previous) / Math.abs(previous)) * 100
  const absoluteDifference = current - previous

  // Determine direction
  let direction: TrendDirection
  if (Math.abs(percentageChange) < NEUTRAL_THRESHOLD) {
    direction = 'neutral'
  } else if (percentageChange > 0) {
    direction = invertComparison ? 'negative' : 'positive'
  } else {
    direction = invertComparison ? 'positive' : 'negative'
  }

  // Format strings
  const sign = percentageChange >= 0 ? '+' : ''
  const formattedPercentage = `${sign}${formatPercentage(percentageChange)}`
  const diffSign = absoluteDifference >= 0 ? '+' : ''
  const formattedDifference = `${diffSign}${formatCurrency(absoluteDifference)}`

  return {
    percentageChange,
    formattedPercentage,
    absoluteDifference,
    formattedDifference,
    direction,
  }
}
```

### TrendIndicator Component

```typescript
// src/components/custom/TrendIndicator.tsx
'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { TrendIndicatorProps, TrendDirection } from './types'

const ICON_MAP: Record<TrendDirection, React.ComponentType<{ className?: string }>> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

const COLOR_MAP: Record<TrendDirection, string> = {
  positive: 'text-green-600',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
}

const SIZE_MAP = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const ARIA_LABELS: Record<TrendDirection, string> = {
  positive: 'Рост',
  negative: 'Снижение',
  neutral: 'Без изменений',
}

export function TrendIndicator({
  direction,
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const Icon = ICON_MAP[direction]

  return (
    <Icon
      className={cn(SIZE_MAP[size], COLOR_MAP[direction], className)}
      aria-label={ARIA_LABELS[direction]}
    />
  )
}
```

### MetricCardEnhanced Component (Partial)

```typescript
// src/components/custom/MetricCardEnhanced.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from './TrendIndicator'
import { ComparisonBadge } from './ComparisonBadge'

import type { MetricCardEnhancedProps, MetricFormat } from './types'

const FORMAT_FN: Record<MetricFormat, (v: number) => string> = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: formatNumber,
}

export function MetricCardEnhanced({
  title,
  value,
  previousValue,
  format = 'currency',
  icon: Icon,
  tooltip,
  isLoading,
  error,
  invertComparison = false,
  className,
  onClick,
}: MetricCardEnhancedProps) {
  if (isLoading) {
    return <MetricCardEnhancedSkeleton />
  }

  const formatValue = FORMAT_FN[format]
  const displayValue = value !== null && value !== undefined
    ? formatValue(value)
    : '—'

  const comparison = value !== null && value !== undefined && previousValue !== null
    ? calculateComparison(value, previousValue, invertComparison)
    : null

  return (
    <Card
      className={cn(
        'transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header: Icon + Title + Tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
          </div>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px]">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Value */}
        <div className="mt-2">
          <span className="text-2xl font-bold">{displayValue}</span>
        </div>

        {/* Comparison */}
        <div className="mt-1 flex items-center gap-1.5">
          {comparison ? (
            <>
              <TrendIndicator direction={comparison.direction} size="sm" />
              <ComparisonBadge
                percentageChange={comparison.percentageChange}
                direction={comparison.direction}
                absoluteDifference={comparison.formattedDifference}
              />
              <span className="text-sm text-muted-foreground">
                (vs {formatValue(previousValue!)})
              </span>
            </>
          ) : previousValue === null || previousValue === undefined ? (
            <span className="text-sm text-muted-foreground">
              Нет данных за предыдущий период
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCardEnhancedSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-40" />
      </CardContent>
    </Card>
  )
}
```

---

## Related Documents

- **Epic**: `docs/epics/epic-60-fe-dashboard-ux-improvements.md`
- **Existing MetricCard**: `src/components/custom/MetricCard.tsx` (for reference)
- **Utils**: `src/lib/utils.ts` (formatCurrency, formatPercentage)
- **shadcn Card**: https://ui.shadcn.com/docs/components/card
- **shadcn Tooltip**: https://ui.shadcn.com/docs/components/tooltip

---

**Created**: 2026-01-29
**Author**: Claude Code (PM Mode)
**Can Start**: Immediately (no story dependencies)
**Used By**: Story 60.4-FE (Connect Dashboard to Period State)

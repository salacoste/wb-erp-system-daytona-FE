# Story 51.5-FE: Trends Summary Cards

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 5 (Mar 31 - Apr 11)
- **Priority**: P1 (Core Feature)
- **Points**: 2 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.1-FE (Types), Story 51.2-FE (Hooks)

---

## User Story

**As a** WB seller analyzing my FBS order history,
**I want** to see key metrics at a glance in summary cards,
**So that** I can quickly understand my FBS performance without diving into detailed charts.

---

## Background

This story implements summary metric cards that display aggregate statistics from the FBS trends data. The cards provide an at-a-glance view of:
- Total orders and revenue for the selected period
- Average orders per day
- Cancellation rate
- Trend indicators comparing to previous period

The component consumes data from `useFbsTrends` hook (Story 51.2) and displays the `summary` object with trend indicators.

---

## Acceptance Criteria

### AC1: Summary Cards Rendering

- [ ] Display 4 metric cards in a responsive grid
- [ ] Cards show: Total Orders, Total Revenue, Avg/Day, Cancellation Rate
- [ ] Each card has title, value, and trend indicator
- [ ] Cards use consistent styling with existing project patterns

### AC2: Metric Formatting

- [ ] Total orders formatted with Russian locale (`1 234 567`)
- [ ] Revenue formatted as currency with ₽ symbol (`1 234 567,89 ₽`)
- [ ] Average per day with 1 decimal (`415,2`)
- [ ] Cancellation rate as percentage (`3,2%`)

### AC3: Trend Indicators

- [ ] Up arrow (↑) for positive trends (more orders/revenue)
- [ ] Down arrow (↓) for negative trends
- [ ] Neutral dash (—) for no change (±0.5%)
- [ ] Green color (#22C55E) for positive changes
- [ ] Red color (#EF4444) for negative changes
- [ ] Gray color (#6B7280) for neutral

### AC4: Trend Calculation Logic

- [ ] Compare current period to previous period of same length
- [ ] Display percentage change value (e.g., "+12,5%")
- [ ] Handle edge case: no previous period data (show "—")
- [ ] For cancellation rate: lower is better (green for decrease)

### AC5: Loading State

- [ ] Skeleton loader for each card during data fetch
- [ ] Skeleton matches card dimensions (maintain layout)
- [ ] Smooth transition from skeleton to content

### AC6: Error State

- [ ] Handle missing summary data gracefully
- [ ] Show placeholder values (0 or "—") when data unavailable
- [ ] No error boundary needed (parent handles errors)

### AC7: Responsive Design

- [ ] 4 columns on desktop (lg+)
- [ ] 2 columns on tablet (md)
- [ ] 1 column on mobile (sm)
- [ ] Consistent card heights across breakpoints

---

## UI Wireframe

```
Desktop (4 columns):
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ │ Всего заказов   │ │ Выручка         │ │ Средний/день    │ │ Отмены          │
│ │                 │ │                 │ │                 │ │                 │
│ │     12 450      │ │  5 234 567 ₽    │ │     415,2       │ │      3,2%       │
│ │                 │ │                 │ │                 │ │                 │
│ │   ↑ +12,5%      │ │   ↑ +8,3%       │ │   ↑ +15,0%      │ │   ↓ -1,5 п.п.   │
│ │   (зеленый)     │ │   (зеленый)     │ │   (зеленый)     │ │   (зеленый)     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘

Tablet (2 columns):
┌─────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Всего заказов   │ │ Выручка         │ │
│ │     12 450      │ │  5 234 567 ₽    │ │
│ │   ↑ +12,5%      │ │   ↑ +8,3%       │ │
│ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Средний/день    │ │ Отмены          │ │
│ │     415,2       │ │      3,2%       │ │
│ │   ↑ +15,0%      │ │   ↓ -1,5 п.п.   │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘

Mobile (1 column):
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │ Всего заказов   │ │
│ │     12 450      │ │
│ │   ↑ +12,5%      │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Выручка         │ │
│ │  5 234 567 ₽    │ │
│ │   ↑ +8,3%       │ │
│ └─────────────────┘ │
│        ...          │
└─────────────────────┘
```

---

## Components to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `TrendsSummaryCards.tsx` | ~80 | Container for all 4 summary cards |
| `SummaryMetricCard.tsx` | ~50 | Individual metric card component |
| `TrendIndicator.tsx` | ~35 | Up/down arrow with color and percentage |
| `MetricValue.tsx` | ~30 | Formatted value display |

**Total**: ~195 lines across 4 files

**Location**: `src/app/(dashboard)/analytics/orders/components/`

---

## Technical Implementation

### TrendsSummaryCards.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/TrendsSummaryCards.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { SummaryMetricCard } from './SummaryMetricCard'
import { formatCurrency } from '@/lib/utils'
import type { TrendsSummary } from '@/types/fbs-analytics'

/**
 * Metric configuration for summary cards
 */
const METRICS_CONFIG = [
  {
    key: 'totalOrders' as const,
    title: 'Всего заказов',
    format: (v: number) => v.toLocaleString('ru-RU'),
    suffix: '',
    inverseGood: false,
  },
  {
    key: 'totalRevenue' as const,
    title: 'Выручка',
    format: (v: number) => formatCurrency(v),
    suffix: '',
    inverseGood: false,
  },
  {
    key: 'avgDailyOrders' as const,
    title: 'Средний/день',
    format: (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 1 }),
    suffix: '',
    inverseGood: false,
  },
  {
    key: 'cancellationRate' as const,
    title: 'Отмены',
    format: (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 1 }),
    suffix: '%',
    inverseGood: true, // Lower is better
  },
] as const

export interface TrendsSummaryCardsProps {
  /** Summary data from trends response */
  summary: TrendsSummary | null | undefined
  /** Previous period summary for comparison (optional) */
  previousSummary?: TrendsSummary | null
  /** Loading state */
  isLoading?: boolean
  /** Additional className */
  className?: string
}

export function TrendsSummaryCards({
  summary,
  previousSummary,
  isLoading = false,
  className,
}: TrendsSummaryCardsProps) {
  // Calculate trend percentages
  const calculateTrend = (
    current: number,
    previous: number | undefined,
  ): number | null => {
    if (previous === undefined || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className ?? ''}`}>
        {METRICS_CONFIG.map((config) => (
          <Skeleton key={config.key} className="h-[120px] rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className ?? ''}`}>
      {METRICS_CONFIG.map((config) => {
        const currentValue = summary?.[config.key] ?? 0
        const previousValue = previousSummary?.[config.key]
        const trend = calculateTrend(currentValue, previousValue)

        return (
          <SummaryMetricCard
            key={config.key}
            title={config.title}
            value={config.format(currentValue)}
            suffix={config.suffix}
            trend={trend}
            inverseGood={config.inverseGood}
          />
        )
      })}
    </div>
  )
}
```

### SummaryMetricCard.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/SummaryMetricCard.tsx

import { Card, CardContent } from '@/components/ui/card'
import { TrendIndicator } from './TrendIndicator'
import { MetricValue } from './MetricValue'

export interface SummaryMetricCardProps {
  /** Card title */
  title: string
  /** Formatted metric value */
  value: string
  /** Value suffix (e.g., '%', '₽') */
  suffix?: string
  /** Trend percentage vs previous period (null if no comparison) */
  trend: number | null
  /** If true, negative trend is good (e.g., cancellation rate) */
  inverseGood?: boolean
}

export function SummaryMetricCard({
  title,
  value,
  suffix = '',
  trend,
  inverseGood = false,
}: SummaryMetricCardProps) {
  return (
    <Card className="h-[120px]">
      <CardContent className="pt-4 pb-4 flex flex-col justify-between h-full">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>

        <MetricValue value={value} suffix={suffix} />

        <TrendIndicator
          percentage={trend}
          inverseGood={inverseGood}
        />
      </CardContent>
    </Card>
  )
}
```

### TrendIndicator.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/TrendIndicator.tsx

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrendIndicatorProps {
  /** Percentage change (positive = increase, negative = decrease) */
  percentage: number | null
  /** If true, negative trend is good (e.g., lower cancellation rate) */
  inverseGood?: boolean
  /** Additional className */
  className?: string
}

/** Threshold for considering a change as neutral */
const NEUTRAL_THRESHOLD = 0.5

export function TrendIndicator({
  percentage,
  inverseGood = false,
  className,
}: TrendIndicatorProps) {
  // Handle null or undefined percentage
  if (percentage === null || percentage === undefined) {
    return (
      <div className={cn('flex items-center gap-1 text-sm text-gray-500', className)}>
        <Minus className="h-3 w-3" />
        <span>—</span>
      </div>
    )
  }

  // Determine if change is neutral
  const isNeutral = Math.abs(percentage) < NEUTRAL_THRESHOLD

  // Determine if change is positive (considering inverseGood)
  const isPositiveChange = percentage > 0
  const isGood = inverseGood ? !isPositiveChange : isPositiveChange

  // Get color class
  const colorClass = isNeutral
    ? 'text-gray-500'
    : isGood
      ? 'text-green-600'
      : 'text-red-500'

  // Get icon
  const Icon = isNeutral ? Minus : isPositiveChange ? ArrowUp : ArrowDown

  // Format percentage
  const formattedPercentage = percentage.toLocaleString('ru-RU', {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  })

  return (
    <div className={cn('flex items-center gap-1 text-sm', colorClass, className)}>
      <Icon className="h-3 w-3" />
      <span>{formattedPercentage}%</span>
    </div>
  )
}
```

### MetricValue.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/MetricValue.tsx

import { cn } from '@/lib/utils'

export interface MetricValueProps {
  /** Formatted value string */
  value: string
  /** Value suffix (displayed separately for styling) */
  suffix?: string
  /** Additional className */
  className?: string
}

export function MetricValue({
  value,
  suffix = '',
  className,
}: MetricValueProps) {
  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {suffix && (
        <span className="text-lg font-semibold text-muted-foreground">{suffix}</span>
      )}
    </div>
  )
}
```

---

## Data Structure

### Input from useFbsTrends Hook

The component receives data from the `useFbsTrends` hook response:

```typescript
interface TrendsSummary {
  /** Total orders in the period */
  totalOrders: number        // e.g., 12450
  /** Total revenue in RUB */
  totalRevenue: number       // e.g., 5234567.89
  /** Average daily order count */
  avgDailyOrders: number     // e.g., 415.2
  /** Overall cancellation rate % */
  cancellationRate: number   // e.g., 3.2
  /** Overall return rate % */
  returnRate: number         // e.g., 1.8
}
```

### Trend Calculation

To calculate trends, fetch two periods:
1. Current period (user-selected date range)
2. Previous period (same length, immediately before)

```typescript
// Example: User selects Jan 1-28 (28 days)
// Previous period: Dec 4-31 (28 days)

const currentTrends = useFbsTrends({ from: '2026-01-01', to: '2026-01-28' })
const previousTrends = useFbsTrends({ from: '2025-12-04', to: '2025-12-31' })

// Pass both summaries to component
<TrendsSummaryCards
  summary={currentTrends.data?.summary}
  previousSummary={previousTrends.data?.summary}
  isLoading={currentTrends.isLoading}
/>
```

---

## Tasks / Subtasks

### Phase 1: Base Components (0.5 SP)

- [ ] Create `MetricValue.tsx` with value + suffix display
- [ ] Create `TrendIndicator.tsx` with arrow and color logic
- [ ] Add unit tests for TrendIndicator edge cases

### Phase 2: Card Components (1 SP)

- [ ] Create `SummaryMetricCard.tsx` with Card wrapper
- [ ] Create `TrendsSummaryCards.tsx` container with grid
- [ ] Implement metrics configuration array
- [ ] Add loading skeleton state
- [ ] Test with mock data

### Phase 3: Integration & Polish (0.5 SP)

- [ ] Verify responsive grid breakpoints
- [ ] Test with real data from useFbsTrends
- [ ] Verify Russian locale formatting
- [ ] Accessibility check (color contrast, ARIA)

---

## Testing

### Unit Test Cases

```typescript
// TrendIndicator.test.tsx

describe('TrendIndicator', () => {
  describe('Direction', () => {
    it('shows up arrow for positive percentage')
    it('shows down arrow for negative percentage')
    it('shows dash for neutral (within ±0.5%)')
    it('shows dash for null percentage')
  })

  describe('Colors', () => {
    it('shows green for positive change (default)')
    it('shows red for negative change (default)')
    it('shows gray for neutral change')
  })

  describe('Inverse Good (cancellation rate)', () => {
    it('shows green for negative change when inverseGood=true')
    it('shows red for positive change when inverseGood=true')
  })

  describe('Formatting', () => {
    it('formats percentage with Russian locale')
    it('shows sign (+/-) for non-zero values')
    it('limits to 1 decimal place')
  })
})

describe('TrendsSummaryCards', () => {
  describe('Rendering', () => {
    it('renders 4 metric cards')
    it('renders loading skeletons when isLoading')
    it('handles null summary gracefully')
  })

  describe('Formatting', () => {
    it('formats totalOrders with Russian locale')
    it('formats totalRevenue as currency')
    it('formats avgDailyOrders with 1 decimal')
    it('formats cancellationRate as percentage')
  })

  describe('Responsive', () => {
    it('shows 4 columns on desktop')
    it('shows 2 columns on tablet')
    it('shows 1 column on mobile')
  })
})
```

### E2E Test Cases

```typescript
// fbs-summary-cards.spec.ts (Playwright)

test('Summary cards display correctly', async ({ page }) => {
  await page.goto('/analytics/orders')

  // Wait for cards to load
  await expect(page.getByText('Всего заказов')).toBeVisible()
  await expect(page.getByText('Выручка')).toBeVisible()
  await expect(page.getByText('Средний/день')).toBeVisible()
  await expect(page.getByText('Отмены')).toBeVisible()

  // Verify values are formatted
  await expect(page.locator('[data-testid="metric-totalOrders"]')).toContainText(/\d{1,3}(\s\d{3})*/);
})

test('Trend indicators show correct colors', async ({ page }) => {
  await page.goto('/analytics/orders')

  // Check green for positive revenue trend
  const revenueTrend = page.locator('[data-testid="trend-totalRevenue"]')
  await expect(revenueTrend).toHaveClass(/text-green/)
})
```

---

## Definition of Done

- [ ] All 4 components created and exported
- [ ] `TrendsSummaryCards` renders 4 metric cards
- [ ] Values formatted with Russian locale
- [ ] Currency displays with ₽ symbol
- [ ] Trend indicators show correct arrows and colors
- [ ] Inverse logic works for cancellation rate
- [ ] Loading skeletons render correctly
- [ ] Responsive grid works (4/2/1 columns)
- [ ] Unit tests passing (>80% coverage)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Each file under 200 lines
- [ ] WCAG 2.1 AA color contrast

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.1-FE | ✅ Complete | `TrendsSummary` type definition |
| Story 51.2-FE | ✅ Complete | `useFbsTrends` hook |
| shadcn/ui Card | Installed | Card component |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.4-FE | Ready | FbsTrendsChart (sibling component) |
| Story 51.8-FE | Pending | FBS Analytics Page (consumes this) |

---

## Related Files

### Existing Similar Components

- `src/components/custom/MetricCard.tsx` - Reference for card patterns
- `src/components/custom/KPICard.tsx` - Reference for KPI display
- `src/app/(dashboard)/analytics/storage/components/` - Storage analytics cards

### Types Used

- `src/types/fbs-analytics.ts` - `TrendsSummary`

### Utilities Used

- `src/lib/utils.ts` - `formatCurrency`, `cn`

---

## Dev Notes

### Formatting Reference

```typescript
// Russian locale formatting examples

// Numbers with thousands separator
const orders = 12450
orders.toLocaleString('ru-RU') // "12 450"

// Currency
import { formatCurrency } from '@/lib/utils'
formatCurrency(5234567.89) // "5 234 567,89 ₽"

// Decimals
const avg = 415.2
avg.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) // "415,2"

// Percentage
const rate = 3.2
`${rate.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%` // "3,2%"

// Signed percentage (for trends)
const change = 12.5
change.toLocaleString('ru-RU', { signDisplay: 'always', maximumFractionDigits: 1 })
// "+12,5"
```

### Color Reference

| State | Color | Tailwind Class |
|-------|-------|----------------|
| Positive (good) | Green | `text-green-600` (#16A34A) |
| Negative (bad) | Red | `text-red-500` (#EF4444) |
| Neutral | Gray | `text-gray-500` (#6B7280) |

### Accessibility Notes

- Color alone should not convey meaning → Use arrows
- Ensure 4.5:1 contrast ratio for text
- Add `aria-label` to trend indicators for screen readers

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial story creation |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA review_

```
Reviewer:
Date:
Gate Decision:
Quality Score:
```

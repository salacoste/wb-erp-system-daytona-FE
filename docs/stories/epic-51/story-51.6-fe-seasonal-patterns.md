# Story 51.6-FE: Seasonal Patterns Components

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 5 (Mar 31 - Apr 11)
- **Priority**: P1 (Core Feature)
- **Points**: 5 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.1-FE (Types), Story 51.2-FE (Hooks)

---

## User Story

**As a** WB seller analyzing my FBS order history,
**I want** to see seasonal patterns in my orders,
**So that** I can plan inventory and promotions based on predictable demand cycles.

---

## Background

This story implements seasonal pattern visualization for FBS Historical Analytics. The component displays aggregated patterns across different time dimensions (monthly, weekly, quarterly) to help sellers identify recurring demand patterns and optimize their business operations.

Key features:
- Tab navigation between pattern types
- Bar charts showing average orders per period
- Seasonality index highlighting peaks and lows
- Insights card with actionable recommendations

---

## Acceptance Criteria

### AC1: Tab Navigation

- [ ] Three tabs: "По месяцам", "По дням недели", "Кварталы"
- [ ] Active tab highlighted with underline
- [ ] Tab content changes on click
- [ ] Keyboard navigation (arrow keys)
- [ ] Default tab: "По месяцам"

### AC2: Monthly Pattern Chart

- [ ] 12 bars representing Jan-Dec
- [ ] Russian month abbreviations (Янв, Фев, Мар, etc.)
- [ ] Bar height = average orders for that month
- [ ] Seasonality index displayed above each bar
- [ ] Peak month highlighted in green
- [ ] Low month highlighted in orange

### AC3: Weekday Pattern Chart

- [ ] 7 bars representing Mon-Sun
- [ ] Russian day names (Пн, Вт, Ср, Чт, Пт, Сб, Вс)
- [ ] Bar height = average orders for that day
- [ ] Weekend bars visually distinct (lighter shade)
- [ ] Busiest day highlighted

### AC4: Quarterly Pattern Chart

- [ ] 4 bars representing Q1-Q4
- [ ] Labels: "Q1", "Q2", "Q3", "Q4"
- [ ] Bar height = average orders for quarter
- [ ] Best/worst quarter highlighted

### AC5: Seasonality Index Display

- [ ] Index shown as multiplier (e.g., "1.4x")
- [ ] Color coding: >1.2 green, 0.8-1.2 gray, <0.8 orange
- [ ] Tooltip explaining index meaning
- [ ] Index = period_avg / overall_avg

### AC6: Insights Card

- [ ] Shows peak period with index
- [ ] Shows low period with index
- [ ] Recommendations based on patterns
- [ ] Icons for visual clarity

### AC7: Bar Tooltips

- [ ] Tooltip on bar hover
- [ ] Shows: period name, order count, index
- [ ] Russian locale formatting
- [ ] Smooth fade animation

### AC8: Loading State

- [ ] Skeleton for chart area
- [ ] Skeleton for tabs
- [ ] Maintains layout during load

### AC9: Empty State

- [ ] Message when insufficient data
- [ ] Minimum 3 months data required
- [ ] Helpful guidance text

### AC10: Responsive Design

- [ ] Full width on all screens
- [ ] Bars scale proportionally
- [ ] Insights card stacks on mobile
- [ ] Touch-friendly interactions

---

## UI Wireframe

```
Desktop:
+-----------------------------------------------------------------------+
| [По месяцам]  [По дням недели]  [Кварталы]                           |
+-----------------------------------------------------------------------+
|                                                                       |
|  1.4x           1.2x                                                  |
|   |              |                                                    |
| +----+  +----+ +----+                                                 |
| |####|  |### | |####|  +----+                    +----+              |
| |####|  |### | |####|  |### |  +----+  +----+   |### |  +----+      |
| |####|  |### | |####|  |### |  |### |  |### |   |### |  |### |      |
| |####|  |### | |####|  |### |  |### |  |### |   |### |  |### | ...  |
| +----+  +----+ +----+  +----+  +----+  +----+   +----+  +----+      |
|  Янв    Фев    Мар     Апр     Май     Июн      Июл     Авг         |
|                                                                       |
+-----------------------------------------------------------------------+
| +-----------------------------------+  +----------------------------+ |
| | Insights                         |  | Legend                     | |
| | -------------------------------- |  | -------------------------- | |
| | Peak: Февраль (индекс 1.4)      |  | >1.2x = Высокий сезон     | |
| | Low:  Май (индекс 0.7)          |  | <0.8x = Низкий сезон       | |
| +-----------------------------------+  +----------------------------+ |
+-----------------------------------------------------------------------+

Mobile (stacked):
+---------------------------+
| [По месяцам] [По дням...] |
+---------------------------+
|  1.4x  1.2x               |
| +---+ +---+ +---+         |
| |###| |## | |###| ...     |
| +---+ +---+ +---+         |
|  Янв  Фев   Мар           |
+---------------------------+
| Insights                  |
| Peak: Февраль (1.4x)     |
| Low:  Май (0.7x)         |
+---------------------------+
```

---

## Components to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `SeasonalPatternsChart.tsx` | ~120 | Main container with tabs |
| `MonthlyPatternChart.tsx` | ~80 | 12-month bar chart |
| `WeekdayPatternChart.tsx` | ~70 | 7-day bar chart |
| `QuarterlyPatternChart.tsx` | ~60 | 4-quarter bar chart |
| `SeasonalInsightsCard.tsx` | ~60 | Peak/low insights display |
| `PatternBar.tsx` | ~50 | Individual bar with tooltip |

**Total**: ~440 lines across 6 files

**Location**: `src/app/(dashboard)/analytics/orders/components/`

---

## Technical Implementation

### SeasonalPatternsChart.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/SeasonalPatternsChart.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MonthlyPatternChart } from './MonthlyPatternChart'
import { WeekdayPatternChart } from './WeekdayPatternChart'
import { QuarterlyPatternChart } from './QuarterlyPatternChart'
import { SeasonalInsightsCard } from './SeasonalInsightsCard'
import { useFbsSeasonal } from '@/hooks/useFbsAnalytics'
import type { SeasonalPatternType } from '@/types/fbs-analytics'

type TabValue = 'monthly' | 'weekly' | 'quarterly'

export interface SeasonalPatternsChartProps {
  from: string
  to: string
  className?: string
}

export function SeasonalPatternsChart({
  from,
  to,
  className,
}: SeasonalPatternsChartProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('monthly')

  const { data, isLoading, error } = useFbsSeasonal({ from, to })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Сезонные паттерны</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Сезонные паттерны</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить данные о сезонности.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.monthlyPattern.length < 3) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Сезонные паттерны</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Недостаточно данных для анализа сезонности.
              Требуется минимум 3 месяца истории заказов.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Сезонные паттерны</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">По месяцам</TabsTrigger>
            <TabsTrigger value="weekly">По дням недели</TabsTrigger>
            <TabsTrigger value="quarterly">Кварталы</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <MonthlyPatternChart data={data.monthlyPattern} />
          </TabsContent>

          <TabsContent value="weekly">
            <WeekdayPatternChart data={data.weekdayPattern} />
          </TabsContent>

          <TabsContent value="quarterly">
            <QuarterlyPatternChart data={data.quarterlyPattern} />
          </TabsContent>
        </Tabs>

        <SeasonalInsightsCard insights={data.insights} className="mt-4" />
      </CardContent>
    </Card>
  )
}
```

### MonthlyPatternChart.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/MonthlyPatternChart.tsx

'use client'

import { PatternBar } from './PatternBar'
import type { MonthlyPattern } from '@/types/fbs-analytics'

const MONTH_LABELS = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

interface MonthlyPatternChartProps {
  data: MonthlyPattern[]
}

export function MonthlyPatternChart({ data }: MonthlyPatternChartProps) {
  const maxOrders = Math.max(...data.map((d) => d.avgOrders))
  const peakMonth = data.reduce((max, d) => d.index > max.index ? d : max, data[0])
  const lowMonth = data.reduce((min, d) => d.index < min.index ? d : min, data[0])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 h-[250px] px-2">
        {data.map((month, idx) => (
          <PatternBar
            key={month.month}
            label={MONTH_LABELS[idx]}
            value={month.avgOrders}
            maxValue={maxOrders}
            index={month.index}
            isPeak={month.month === peakMonth.month}
            isLow={month.month === lowMonth.month}
            tooltipContent={`${MONTH_LABELS[idx]}: ${month.avgOrders.toLocaleString('ru-RU')} заказов (${month.index.toFixed(2)}x)`}
          />
        ))}
      </div>
    </div>
  )
}
```

### PatternBar.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/PatternBar.tsx

'use client'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PatternBarProps {
  label: string
  value: number
  maxValue: number
  index: number
  isPeak?: boolean
  isLow?: boolean
  tooltipContent: string
  className?: string
}

export function PatternBar({
  label,
  value,
  maxValue,
  index,
  isPeak = false,
  isLow = false,
  tooltipContent,
  className,
}: PatternBarProps) {
  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0

  const getBarColor = () => {
    if (isPeak) return 'bg-green-500'
    if (isLow) return 'bg-orange-400'
    if (index > 1.2) return 'bg-green-400'
    if (index < 0.8) return 'bg-orange-300'
    return 'bg-blue-400'
  }

  const getIndexColor = () => {
    if (index > 1.2) return 'text-green-600'
    if (index < 0.8) return 'text-orange-600'
    return 'text-gray-500'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex flex-col items-center flex-1 min-w-0', className)}>
            <span className={cn('text-xs font-medium mb-1', getIndexColor())}>
              {index.toFixed(1)}x
            </span>
            <div className="w-full h-[200px] flex items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-[40px] rounded-t transition-all duration-300',
                  getBarColor(),
                  isPeak && 'ring-2 ring-green-600 ring-offset-1',
                  isLow && 'ring-2 ring-orange-600 ring-offset-1'
                )}
                style={{ height: `${heightPercent}%`, minHeight: '4px' }}
              />
            </div>
            <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### WeekdayPatternChart.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/WeekdayPatternChart.tsx

'use client'

import { PatternBar } from './PatternBar'
import type { WeekdayPattern } from '@/types/fbs-analytics'

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface WeekdayPatternChartProps {
  data: WeekdayPattern[]
}

export function WeekdayPatternChart({ data }: WeekdayPatternChartProps) {
  const maxOrders = Math.max(...data.map((d) => d.avgOrders))
  const peakDay = data.reduce((max, d) => d.index > max.index ? d : max, data[0])
  const lowDay = data.reduce((min, d) => d.index < min.index ? d : min, data[0])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 h-[250px] px-4">
        {data.map((day, idx) => (
          <PatternBar
            key={day.dayOfWeek}
            label={WEEKDAY_LABELS[idx]}
            value={day.avgOrders}
            maxValue={maxOrders}
            index={day.index}
            isPeak={day.dayOfWeek === peakDay.dayOfWeek}
            isLow={day.dayOfWeek === lowDay.dayOfWeek}
            tooltipContent={`${WEEKDAY_LABELS[idx]}: ${day.avgOrders.toLocaleString('ru-RU')} заказов (${day.index.toFixed(2)}x)`}
            className={idx >= 5 ? 'opacity-80' : ''}
          />
        ))}
      </div>
    </div>
  )
}
```

### QuarterlyPatternChart.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/QuarterlyPatternChart.tsx

'use client'

import { PatternBar } from './PatternBar'
import type { QuarterlyPattern } from '@/types/fbs-analytics'

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4']

interface QuarterlyPatternChartProps {
  data: QuarterlyPattern[]
}

export function QuarterlyPatternChart({ data }: QuarterlyPatternChartProps) {
  const maxOrders = Math.max(...data.map((d) => d.avgOrders))
  const peakQ = data.reduce((max, d) => d.index > max.index ? d : max, data[0])
  const lowQ = data.reduce((min, d) => d.index < min.index ? d : min, data[0])

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-8 h-[250px] px-8">
        {data.map((quarter) => (
          <PatternBar
            key={quarter.quarter}
            label={QUARTER_LABELS[quarter.quarter - 1]}
            value={quarter.avgOrders}
            maxValue={maxOrders}
            index={quarter.index}
            isPeak={quarter.quarter === peakQ.quarter}
            isLow={quarter.quarter === lowQ.quarter}
            tooltipContent={`${QUARTER_LABELS[quarter.quarter - 1]}: ${quarter.avgOrders.toLocaleString('ru-RU')} заказов (${quarter.index.toFixed(2)}x)`}
          />
        ))}
      </div>
    </div>
  )
}
```

### SeasonalInsightsCard.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/SeasonalInsightsCard.tsx

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeasonalInsights } from '@/types/fbs-analytics'

interface SeasonalInsightsCardProps {
  insights: SeasonalInsights
  className?: string
}

export function SeasonalInsightsCard({
  insights,
  className,
}: SeasonalInsightsCardProps) {
  return (
    <Card className={cn('bg-gray-50', className)}>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Пик продаж</p>
              <p className="font-semibold text-gray-900">
                {insights.peakPeriod}
              </p>
              <p className="text-sm text-green-600">
                Индекс {insights.peakIndex.toFixed(2)}x
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Спад продаж</p>
              <p className="font-semibold text-gray-900">
                {insights.lowPeriod}
              </p>
              <p className="text-sm text-orange-600">
                Индекс {insights.lowIndex.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>

        {insights.recommendation && (
          <p className="mt-4 text-sm text-gray-600 border-t pt-4">
            {insights.recommendation}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Data Structure

### Input from useFbsSeasonal Hook

```typescript
interface SeasonalResponse {
  monthlyPattern: MonthlyPattern[]
  weekdayPattern: WeekdayPattern[]
  quarterlyPattern: QuarterlyPattern[]
  insights: SeasonalInsights
}

interface MonthlyPattern {
  month: number        // 1-12
  avgOrders: number    // Average orders for this month
  index: number        // Seasonality index (1.0 = average)
}

interface WeekdayPattern {
  dayOfWeek: number    // 0-6 (Mon-Sun)
  avgOrders: number
  index: number
}

interface QuarterlyPattern {
  quarter: number      // 1-4
  avgOrders: number
  index: number
}

interface SeasonalInsights {
  peakPeriod: string       // e.g., "Февраль"
  peakIndex: number        // e.g., 1.4
  lowPeriod: string        // e.g., "Май"
  lowIndex: number         // e.g., 0.7
  recommendation?: string  // Optional recommendation text
}
```

---

## Tasks / Subtasks

### Phase 1: Base Components (1.5 SP)

- [ ] Create `PatternBar.tsx` with tooltip
- [ ] Test bar height calculation
- [ ] Test color coding by index
- [ ] Test peak/low highlighting

### Phase 2: Chart Components (2 SP)

- [ ] Create `MonthlyPatternChart.tsx`
- [ ] Create `WeekdayPatternChart.tsx`
- [ ] Create `QuarterlyPatternChart.tsx`
- [ ] Create `SeasonalInsightsCard.tsx`
- [ ] Unit tests for each chart

### Phase 3: Container Component (1 SP)

- [ ] Create `SeasonalPatternsChart.tsx` with tabs
- [ ] Integrate with `useFbsSeasonal` hook
- [ ] Add loading skeleton
- [ ] Add error handling
- [ ] Add empty state

### Phase 4: Polish (0.5 SP)

- [ ] Verify responsive design
- [ ] Test keyboard navigation
- [ ] Accessibility audit
- [ ] Russian locale verification

---

## Testing

### Unit Test Cases

```typescript
// SeasonalPatternsChart.test.tsx

describe('SeasonalPatternsChart', () => {
  describe('Tabs', () => {
    it('renders three tabs')
    it('defaults to monthly tab')
    it('switches content on tab click')
    it('supports keyboard navigation')
  })

  describe('States', () => {
    it('shows loading skeleton')
    it('shows error alert')
    it('shows empty state for insufficient data')
  })
})

describe('PatternBar', () => {
  describe('Rendering', () => {
    it('calculates height correctly')
    it('shows index above bar')
    it('applies peak styling')
    it('applies low styling')
  })

  describe('Colors', () => {
    it('uses green for index > 1.2')
    it('uses orange for index < 0.8')
    it('uses blue for normal range')
  })

  describe('Tooltip', () => {
    it('shows on hover')
    it('displays correct content')
  })
})

describe('SeasonalInsightsCard', () => {
  it('displays peak period')
  it('displays low period')
  it('shows recommendation when present')
  it('hides recommendation when absent')
})
```

### E2E Test Cases

```typescript
// seasonal-patterns.spec.ts (Playwright)

test('Seasonal patterns tabs work', async ({ page }) => {
  await page.goto('/analytics/orders')

  // Click seasonal tab in main page
  await page.getByRole('tab', { name: 'Сезонность' }).click()

  // Verify monthly tab is default
  await expect(page.getByText('Янв')).toBeVisible()

  // Switch to weekly
  await page.getByRole('tab', { name: 'По дням недели' }).click()
  await expect(page.getByText('Пн')).toBeVisible()

  // Switch to quarterly
  await page.getByRole('tab', { name: 'Кварталы' }).click()
  await expect(page.getByText('Q1')).toBeVisible()
})

test('Insights card displays correctly', async ({ page }) => {
  await page.goto('/analytics/orders')

  await expect(page.getByText('Пик продаж')).toBeVisible()
  await expect(page.getByText('Спад продаж')).toBeVisible()
})
```

---

## Definition of Done

- [ ] All 6 components created and exported
- [ ] Tab navigation works correctly
- [ ] Monthly chart shows 12 months
- [ ] Weekday chart shows 7 days
- [ ] Quarterly chart shows 4 quarters
- [ ] Peak/low highlighting works
- [ ] Seasonality index displays correctly
- [ ] Insights card shows peak/low
- [ ] Loading skeleton renders
- [ ] Error state handles failures
- [ ] Empty state for insufficient data
- [ ] Responsive on mobile
- [ ] Unit tests passing (>80% coverage)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Each file under 200 lines
- [ ] WCAG 2.1 AA compliant

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.1-FE | Complete | Seasonal types |
| Story 51.2-FE | Complete | `useFbsSeasonal` hook |
| shadcn/ui Tabs | Installed | Tab component |
| shadcn/ui Tooltip | Installed | Tooltip component |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.8-FE | Pending | FBS Analytics Page |

---

## Related Files

### Existing Similar Components

- `src/components/custom/ExpenseChart.tsx` - Bar chart patterns
- `src/app/(dashboard)/analytics/storage/` - Similar analytics UI

### Types Used

- `src/types/fbs-analytics.ts` - Seasonal pattern types

---

## Dev Notes

### Seasonality Index Calculation

```typescript
// Index = period average / overall average
// Example: Feb has 1400 avg orders, overall avg is 1000
// Index = 1400 / 1000 = 1.4

// Interpretation:
// 1.4x = 40% above average (high season)
// 0.7x = 30% below average (low season)
// 1.0x = exactly average
```

### Russian Labels

```typescript
const MONTH_LABELS = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
```

### Color Reference

| Condition | Color | Tailwind |
|-----------|-------|----------|
| Peak (highest) | Green | `bg-green-500` |
| High season (>1.2x) | Light green | `bg-green-400` |
| Normal (0.8-1.2x) | Blue | `bg-blue-400` |
| Low season (<0.8x) | Light orange | `bg-orange-300` |
| Lowest | Orange | `bg-orange-400` |

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

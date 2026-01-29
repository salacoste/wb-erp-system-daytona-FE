# Story 51.7-FE: Period Comparison UI

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 5 (Mar 31 - Apr 11)
- **Priority**: P1 (Core Feature)
- **Points**: 3 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.1-FE (Types), Story 51.2-FE (Hooks)

---

## User Story

**As a** WB seller analyzing my FBS order performance,
**I want** to compare two time periods side by side,
**So that** I can measure business growth, identify seasonal effects, and track improvement trends.

---

## Background

This story implements period comparison functionality for FBS Historical Analytics. The component enables sellers to compare metrics between two date ranges using the `/v1/analytics/orders/compare` endpoint, with:
- Two independent period selectors
- Side-by-side comparison table with all key metrics
- Delta values showing both absolute and percentage changes
- Color coding for positive/negative changes
- Quick presets for MoM, QoQ, YoY comparisons

---

## Acceptance Criteria

### AC1: Period Selectors

- [ ] Two independent date range pickers (Period 1, Period 2)
- [ ] Each picker allows selecting any date range within 365 days
- [ ] Default: Period 1 = last month, Period 2 = current month
- [ ] Clear labels: "Период 1 (базовый)" and "Период 2 (сравниваемый)"
- [ ] Validation: periods cannot overlap (warning only, not blocking)

### AC2: Preset Buttons

- [ ] Three preset buttons for quick comparison:
  - MoM (Месяц к месяцу): Current month vs previous month
  - QoQ (Квартал к кварталу): Current quarter vs previous quarter
  - YoY (Год к году): Current period vs same period last year
- [ ] Active preset visually highlighted
- [ ] Custom selection clears preset highlight
- [ ] YoY disabled if < 365 days of data available

### AC3: Comparison Table

- [ ] Side-by-side table with 3 data columns: Период 1, Период 2, Изменение
- [ ] Metrics displayed:
  - Заказы (orders count)
  - Выручка (revenue)
  - Средний чек (average order value)
  - Отмены (cancellation rate %)
  - Возвраты (return rate %)
- [ ] Russian labels for all metrics
- [ ] Formatted values (currency, percentages, numbers)

### AC4: Delta Values

- [ ] Absolute change displayed: "+300" or "-150"
- [ ] Percentage change displayed: "(+10.5%)" or "(-5.2%)"
- [ ] Combined format: "+300 (+10.5%)"
- [ ] Rates show only absolute change: "-0.3%"

### AC5: Color Coding

- [ ] Positive changes (improvement): Green (#22C55E)
- [ ] Negative changes (decline): Red (#EF4444)
- [ ] Neutral (no change): Gray
- [ ] **Inverse logic for negative metrics**:
  - Cancellation rate decrease = Green (good)
  - Cancellation rate increase = Red (bad)

### AC6: Loading & Error States

- [ ] Skeleton loader during data fetch
- [ ] Error alert with Russian message on failure
- [ ] Retry button in error state
- [ ] Empty state when no data for selected periods

### AC7: Responsive Design

- [ ] Table scrolls horizontally on mobile
- [ ] Period selectors stack vertically on mobile
- [ ] Preset buttons wrap on smaller screens

### AC8: Accessibility

- [ ] Table has proper ARIA labels
- [ ] Color is not the only indicator (icons for +/-)
- [ ] Screen reader announces changes clearly

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Сравнение периодов                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Быстрое сравнение:                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                         │
│ │    MoM       │ │    QoQ       │ │    YoY       │                         │
│ │ Месяц/месяц  │ │ Кварт/кварт  │ │  Год/год     │                         │
│ └──────────────┘ └──────────────┘ └──────────────┘                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│ │ Период 1 (базовый)          │  │ Период 2 (сравниваемый)     │           │
│ │ 📅 01.12.2025 — 31.12.2025  │  │ 📅 01.01.2026 — 28.01.2026  │           │
│ └─────────────────────────────┘  └─────────────────────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌───────────────┬───────────────┬───────────────┬─────────────────────────┐│
│ │ Метрика       │ Период 1      │ Период 2      │ Изменение               ││
│ ├───────────────┼───────────────┼───────────────┼─────────────────────────┤│
│ │ Заказы        │ 3 000         │ 3 300         │ ↑ +300 (+10.0%)    🟢   ││
│ │ Выручка       │ 4 500 000 ₽   │ 4 950 000 ₽   │ ↑ +450K (+10.0%)   🟢   ││
│ │ Средний чек   │ 1 500 ₽       │ 1 500 ₽       │ — 0 (0%)           ⚪   ││
│ │ Отмены        │ 5.2%          │ 4.9%          │ ↓ -0.3%            🟢   ││
│ │ Возвраты      │ 2.8%          │ 3.1%          │ ↑ +0.3%            🔴   ││
│ └───────────────┴───────────────┴───────────────┴─────────────────────────┘│
│                                                                             │
│ ℹ️ Период 1: 31 день | Период 2: 28 дней                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `PeriodComparisonPanel.tsx` | ~120 | Main container with state management |
| `PeriodSelector.tsx` | ~60 | Date range picker with label |
| `ComparisonPresets.tsx` | ~50 | MoM/QoQ/YoY preset buttons |
| `ComparisonTable.tsx` | ~100 | Side-by-side metrics table |
| `DeltaValue.tsx` | ~50 | Change indicator with color coding |

**Total**: ~380 lines across 5 files

---

## Technical Implementation

### PeriodComparisonPanel.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/PeriodComparisonPanel.tsx

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Info } from 'lucide-react'
import { useFbsCompare } from '@/hooks/useFbsAnalytics'
import { PeriodSelector } from './PeriodSelector'
import { ComparisonPresets, PresetType } from './ComparisonPresets'
import { ComparisonTable } from './ComparisonTable'
import { getPresetDates } from '@/lib/period-utils'
import { calculateDaysInRange, formatDateRu } from '@/lib/date-utils'

export interface DateRange {
  from: string  // YYYY-MM-DD
  to: string    // YYYY-MM-DD
}

export interface PeriodComparisonPanelProps {
  /** Additional className */
  className?: string
}

export function PeriodComparisonPanel({ className }: PeriodComparisonPanelProps) {
  // Initialize with MoM preset
  const defaultDates = getPresetDates('mom')

  const [period1, setPeriod1] = useState<DateRange>(defaultDates.period1)
  const [period2, setPeriod2] = useState<DateRange>(defaultDates.period2)
  const [activePreset, setActivePreset] = useState<PresetType | null>('mom')

  // Fetch comparison data
  const { data, isLoading, error, refetch } = useFbsCompare({
    period1_from: period1.from,
    period1_to: period1.to,
    period2_from: period2.from,
    period2_to: period2.to,
  })

  // Handle preset selection
  const handlePresetSelect = (preset: PresetType) => {
    const dates = getPresetDates(preset)
    setPeriod1(dates.period1)
    setPeriod2(dates.period2)
    setActivePreset(preset)
  }

  // Handle manual period change
  const handlePeriod1Change = (range: DateRange) => {
    setPeriod1(range)
    setActivePreset(null)
  }

  const handlePeriod2Change = (range: DateRange) => {
    setPeriod2(range)
    setActivePreset(null)
  }

  // Calculate days in each period
  const period1Days = calculateDaysInRange(new Date(period1.from), new Date(period1.to))
  const period2Days = calculateDaysInRange(new Date(period2.from), new Date(period2.to))

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Сравнение периодов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Сравнение периодов</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные сравнения.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Сравнение периодов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset buttons */}
        <ComparisonPresets
          activePreset={activePreset}
          onSelect={handlePresetSelect}
        />

        {/* Period selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PeriodSelector
            label="Период 1 (базовый)"
            value={period1}
            onChange={handlePeriod1Change}
          />
          <PeriodSelector
            label="Период 2 (сравниваемый)"
            value={period2}
            onChange={handlePeriod2Change}
          />
        </div>

        {/* Comparison table */}
        {data && <ComparisonTable data={data} />}

        {/* Period info */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            Период 1: {period1Days} {pluralizeDays(period1Days)} |
            Период 2: {period2Days} {pluralizeDays(period2Days)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
```

### ComparisonPresets.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/ComparisonPresets.tsx

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PresetType = 'mom' | 'qoq' | 'yoy'

interface ComparisonPresetsProps {
  activePreset: PresetType | null
  onSelect: (preset: PresetType) => void
  disabled?: boolean
}

const PRESETS: { type: PresetType; label: string; sublabel: string }[] = [
  { type: 'mom', label: 'MoM', sublabel: 'Месяц/месяц' },
  { type: 'qoq', label: 'QoQ', sublabel: 'Кварт/кварт' },
  { type: 'yoy', label: 'YoY', sublabel: 'Год/год' },
]

export function ComparisonPresets({
  activePreset,
  onSelect,
  disabled = false,
}: ComparisonPresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-muted-foreground self-center mr-2">
        Быстрое сравнение:
      </span>
      {PRESETS.map((preset) => (
        <Button
          key={preset.type}
          variant={activePreset === preset.type ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(preset.type)}
          disabled={disabled}
          className={cn(
            'flex flex-col h-auto py-2 px-4',
            activePreset === preset.type && 'bg-primary text-primary-foreground'
          )}
        >
          <span className="font-semibold">{preset.label}</span>
          <span className="text-xs opacity-80">{preset.sublabel}</span>
        </Button>
      ))}
    </div>
  )
}
```

### DeltaValue.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/DeltaValue.tsx

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface DeltaValueProps {
  /** Absolute change value */
  absoluteChange: number
  /** Percentage change (optional) */
  percentChange?: number
  /** Format type for absolute value */
  format: 'number' | 'currency' | 'percent'
  /** Invert color logic (decrease = good) */
  invertColor?: boolean
}

export function DeltaValue({
  absoluteChange,
  percentChange,
  format,
  invertColor = false,
}: DeltaValueProps) {
  const isPositive = absoluteChange > 0
  const isNegative = absoluteChange < 0
  const isNeutral = absoluteChange === 0

  // Determine color based on change direction and invert logic
  const isGood = invertColor ? isNegative : isPositive
  const isBad = invertColor ? isPositive : isNegative

  const colorClass = isNeutral
    ? 'text-gray-500'
    : isGood
    ? 'text-green-600'
    : 'text-red-600'

  // Format absolute value
  const formatAbsolute = (value: number): string => {
    const absValue = Math.abs(value)
    const sign = value > 0 ? '+' : value < 0 ? '-' : ''

    switch (format) {
      case 'currency':
        if (absValue >= 1000000) {
          return `${sign}${(absValue / 1000000).toFixed(1)}M ₽`
        }
        if (absValue >= 1000) {
          return `${sign}${(absValue / 1000).toFixed(0)}K ₽`
        }
        return `${sign}${absValue.toLocaleString('ru-RU')} ₽`
      case 'percent':
        return `${sign}${absValue.toFixed(1)}%`
      default:
        return `${sign}${absValue.toLocaleString('ru-RU')}`
    }
  }

  // Icon based on direction
  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus

  return (
    <div className={cn('flex items-center gap-1', colorClass)}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">{formatAbsolute(absoluteChange)}</span>
      {percentChange !== undefined && format !== 'percent' && (
        <span className="text-sm opacity-80">
          ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
        </span>
      )}
    </div>
  )
}
```

### ComparisonTable.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/ComparisonTable.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeltaValue } from './DeltaValue'
import { formatCurrency } from '@/lib/utils'
import type { CompareResponse } from '@/types/fbs-analytics'

interface ComparisonTableProps {
  data: CompareResponse
}

interface MetricRow {
  key: string
  label: string
  period1Value: string
  period2Value: string
  absoluteChange: number
  percentChange?: number
  format: 'number' | 'currency' | 'percent'
  invertColor?: boolean
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  const { period1, period2, comparison } = data

  const metrics: MetricRow[] = [
    {
      key: 'orders',
      label: 'Заказы',
      period1Value: period1.ordersCount.toLocaleString('ru-RU'),
      period2Value: period2.ordersCount.toLocaleString('ru-RU'),
      absoluteChange: comparison.ordersChange,
      percentChange: comparison.ordersChangePercent,
      format: 'number',
    },
    {
      key: 'revenue',
      label: 'Выручка',
      period1Value: formatCurrency(period1.revenue),
      period2Value: formatCurrency(period2.revenue),
      absoluteChange: comparison.revenueChange,
      percentChange: comparison.revenueChangePercent,
      format: 'currency',
    },
    {
      key: 'avgOrderValue',
      label: 'Средний чек',
      period1Value: formatCurrency(period1.avgOrderValue),
      period2Value: formatCurrency(period2.avgOrderValue),
      absoluteChange: comparison.avgOrderValueChange,
      percentChange: comparison.avgOrderValueChangePercent,
      format: 'currency',
    },
    {
      key: 'cancellationRate',
      label: 'Отмены',
      period1Value: `${period1.cancellationRate.toFixed(1)}%`,
      period2Value: `${period2.cancellationRate.toFixed(1)}%`,
      absoluteChange: comparison.cancellationRateChange,
      format: 'percent',
      invertColor: true, // Lower is better
    },
  ]

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Метрика</TableHead>
            <TableHead className="text-right">Период 1</TableHead>
            <TableHead className="text-right">Период 2</TableHead>
            <TableHead className="text-right">Изменение</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.key}>
              <TableCell className="font-medium">{metric.label}</TableCell>
              <TableCell className="text-right">{metric.period1Value}</TableCell>
              <TableCell className="text-right">{metric.period2Value}</TableCell>
              <TableCell className="text-right">
                <DeltaValue
                  absoluteChange={metric.absoluteChange}
                  percentChange={metric.percentChange}
                  format={metric.format}
                  invertColor={metric.invertColor}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## Utility Functions

### period-utils.ts

```typescript
// src/lib/period-utils.ts

import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  subYears,
  format,
} from 'date-fns'

export type PresetType = 'mom' | 'qoq' | 'yoy'

interface PresetDates {
  period1: { from: string; to: string }
  period2: { from: string; to: string }
}

/**
 * Get date ranges for comparison presets
 *
 * MoM: Last complete month vs previous month
 * QoQ: Last complete quarter vs previous quarter
 * YoY: Last 30 days vs same period last year
 */
export function getPresetDates(preset: PresetType): PresetDates {
  const today = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (preset) {
    case 'mom': {
      const lastMonth = subMonths(today, 1)
      const prevMonth = subMonths(today, 2)
      return {
        period1: {
          from: formatDate(startOfMonth(prevMonth)),
          to: formatDate(endOfMonth(prevMonth)),
        },
        period2: {
          from: formatDate(startOfMonth(lastMonth)),
          to: formatDate(endOfMonth(lastMonth)),
        },
      }
    }
    case 'qoq': {
      const lastQuarter = subQuarters(today, 1)
      const prevQuarter = subQuarters(today, 2)
      return {
        period1: {
          from: formatDate(startOfQuarter(prevQuarter)),
          to: formatDate(endOfQuarter(prevQuarter)),
        },
        period2: {
          from: formatDate(startOfQuarter(lastQuarter)),
          to: formatDate(endOfQuarter(lastQuarter)),
        },
      }
    }
    case 'yoy': {
      const thirtyDaysAgo = subMonths(today, 1)
      const lastYearEnd = subYears(today, 1)
      const lastYearStart = subYears(thirtyDaysAgo, 1)
      return {
        period1: {
          from: formatDate(lastYearStart),
          to: formatDate(lastYearEnd),
        },
        period2: {
          from: formatDate(thirtyDaysAgo),
          to: formatDate(today),
        },
      }
    }
  }
}
```

---

## Tasks / Subtasks

### Phase 1: Utility Functions (0.5 SP)

- [ ] Create `getPresetDates()` function
- [ ] Add unit tests for preset calculations
- [ ] Verify edge cases (month/quarter boundaries)

### Phase 2: Base Components (1 SP)

- [ ] Create `DeltaValue.tsx` with color coding
- [ ] Create `ComparisonPresets.tsx` with 3 presets
- [ ] Create `PeriodSelector.tsx` wrapper
- [ ] Add unit tests for each component

### Phase 3: Main Component (1 SP)

- [ ] Create `ComparisonTable.tsx` with all metrics
- [ ] Create `PeriodComparisonPanel.tsx` container
- [ ] Integrate `useFbsCompare` hook
- [ ] Add loading/error states

### Phase 4: Polish & Testing (0.5 SP)

- [ ] Responsive design adjustments
- [ ] Accessibility audit
- [ ] Integration tests
- [ ] Performance testing

---

## Testing

### Unit Test Cases

```typescript
// PeriodComparisonPanel.test.tsx

describe('PeriodComparisonPanel', () => {
  describe('Rendering', () => {
    it('renders loading skeleton initially')
    it('renders comparison data when loaded')
    it('renders error state on fetch failure')
  })

  describe('Presets', () => {
    it('applies MoM preset on click')
    it('applies QoQ preset on click')
    it('applies YoY preset on click')
    it('clears preset when manually changing dates')
  })

  describe('Period Selection', () => {
    it('updates period1 when changed')
    it('updates period2 when changed')
    it('refetches data on period change')
  })
})

describe('DeltaValue', () => {
  it('renders positive change in green')
  it('renders negative change in red')
  it('renders neutral change in gray')
  it('inverts color when invertColor=true')
  it('formats currency correctly')
  it('formats percentage correctly')
})

describe('ComparisonTable', () => {
  it('displays all 4 metrics')
  it('formats values correctly')
  it('passes invertColor for cancellation rate')
})

describe('getPresetDates', () => {
  it('returns correct MoM dates')
  it('returns correct QoQ dates')
  it('returns correct YoY dates')
  it('handles year boundaries correctly')
})
```

---

## Definition of Done

- [ ] All 5 components created and exported
- [ ] Two period selectors working independently
- [ ] Three preset buttons (MoM, QoQ, YoY) functional
- [ ] Comparison table displays all metrics
- [ ] Delta values show absolute and percentage changes
- [ ] Color coding correct (green=good, red=bad)
- [ ] Inverse color logic for cancellation rate
- [ ] Loading skeleton shown during fetch
- [ ] Error state with retry button
- [ ] Responsive on mobile (table scrolls)
- [ ] Period info displayed (days count)
- [ ] Unit tests passing (>80% coverage)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Each file under 200 lines
- [ ] WCAG 2.1 AA compliant

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.1-FE | Ready | Types for `CompareResponse`, `PeriodMetrics` |
| Story 51.2-FE | Ready | `useFbsCompare` hook |
| `date-fns` | Installed | Date manipulation |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.8-FE | Pending | FBS Analytics Page (consumes this) |

---

## Related Files

### Types Used

- `src/types/fbs-analytics.ts` - `CompareResponse`, `PeriodMetrics`, `ComparisonMetrics`

### Hooks Used

- `src/hooks/useFbsAnalytics.ts` - `useFbsCompare`

### Similar Components

- `src/components/custom/WeekComparisonSelector.tsx` - Reference for comparison patterns

---

## API Contract

**Endpoint**: `GET /v1/analytics/orders/compare`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period1_from` | string | Yes | Period 1 start (YYYY-MM-DD) |
| `period1_to` | string | Yes | Period 1 end (YYYY-MM-DD) |
| `period2_from` | string | Yes | Period 2 start (YYYY-MM-DD) |
| `period2_to` | string | Yes | Period 2 end (YYYY-MM-DD) |

**Response**: See `docs/request-backend/110-epic-51-fbs-historical-analytics-api.md`

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

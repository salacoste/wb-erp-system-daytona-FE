# Story 51.4-FE: FBS Trends Chart

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 4 (Mar 17-28)
- **Priority**: P1 (Core Feature)
- **Points**: 5 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.1-FE (Types), Story 51.2-FE (Hooks), Story 51.3-FE (DateRangePicker)

---

## User Story

**As a** WB seller analyzing my FBS order history,
**I want** to see historical trends of orders, revenue, and cancellations over time,
**So that** I can identify patterns and make informed business decisions.

---

## Background

This story implements the main trends visualization for FBS Historical Analytics. The chart displays time-series data from the `/v1/analytics/orders/trends` endpoint with:
- Multi-line chart showing 3 metrics
- Data source indicators showing where data comes from
- Aggregation controls for day/week/month granularity
- Integration with DateRangePickerExtended from Story 51.3

---

## Acceptance Criteria

### AC1: Multi-Line Chart Rendering

- [ ] Line chart displays with Recharts `LineChart` component
- [ ] Three metrics rendered as separate lines:
  - Orders count (blue #3B82F6)
  - Revenue (green #22C55E)
  - Cancellations (red #EF4444)
- [ ] X-axis shows dates with appropriate labels
- [ ] Y-axis auto-scales to data range
- [ ] Chart uses `ResponsiveContainer` for responsive sizing

### AC2: Metric Toggle Visibility

- [ ] Interactive legend allows toggling each metric on/off
- [ ] Toggle state persists during session
- [ ] At least one metric must remain visible
- [ ] Visual indicator shows which metrics are active
- [ ] Clicking legend item toggles visibility

### AC3: Date Range Integration

- [ ] Integrates with `DateRangePickerExtended` from Story 51.3
- [ ] Date range changes trigger data refetch
- [ ] Loading state shown during refetch
- [ ] Default range: last 30 days

### AC4: Data Source Indicator

- [ ] Badge displays data source for selected range:
  - "Реалтайм" (0-30 days) - Real-time API
  - "Ежедневно" (31-90 days) - Daily aggregates
  - "Еженедельно" (91-365 days) - Weekly aggregates
- [ ] Badge positioned near chart legend
- [ ] Badge color indicates source type

### AC5: Aggregation Toggle

- [ ] Toggle between Day/Week/Month aggregation
- [ ] Auto-select based on date range (from Story 51.3 logic)
- [ ] Manual override available
- [ ] Toggle shows current selection clearly

### AC6: Tooltips

- [ ] Tooltip appears on hover over data points
- [ ] Shows all visible metrics with values
- [ ] Date displayed in Russian format (DD.MM.YYYY)
- [ ] Values formatted appropriately (currency for revenue)

### AC7: Loading & Error States

- [ ] Skeleton loader during initial load
- [ ] Skeleton matches chart dimensions
- [ ] Error alert with retry button on failure
- [ ] Error message in Russian

### AC8: Responsive Design

- [ ] Chart fills container width
- [ ] Minimum height 300px, default 400px
- [ ] Legend stacks on mobile
- [ ] Touch-friendly tooltips on mobile

### AC9: Performance

- [ ] Chart renders smoothly with up to 365 data points
- [ ] No re-renders on tooltip hover
- [ ] Data points limited by aggregation (max ~130)

### AC10: Accessibility

- [ ] Chart has ARIA label describing content
- [ ] Legend items are keyboard accessible
- [ ] Color contrast meets WCAG 2.1 AA

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────┐  ┌─────────────────────────┐ │
│ │ 📅 01.01.2026 — 31.03.2026           [X] │  │ День │ Неделя │ Месяц  │ │
│ └───────────────────────────────────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                      ┌──────────────┐       │
│  Revenue ₽                                           │ Еженедельно  │ 📊    │
│  ┌──────────────────────────────────────────────────┐└──────────────┘       │
│  │ 500K ─┤                          ___/\                              │    │
│  │ 400K ─┤               ___/\_____/     \___                          │    │
│  │ 300K ─┤    ___/\_____/                    \___                      │    │
│  │ 200K ─┤___/                                   \___                  │    │
│  │ 100K ─┤                                           \___              │    │
│  │    0 ─┼──────┬──────┬──────┬──────┬──────┬──────┬─────              │    │
│  │       Jan   Feb    Mar    Apr    May    Jun                         │    │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ [■ Заказы]  [■ Выручка]  [□ Отмены]                                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐                 │
│  │ Всего       │ Средний     │ Отмены      │ Возвраты    │                 │
│  │ 12 450 шт.  │ 415/день    │ 3.2%        │ 1.8%        │                 │
│  └─────────────┴─────────────┴─────────────┴─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `FbsTrendsChart.tsx` | ~150 | Main chart component with Recharts |
| `DataSourceIndicator.tsx` | ~40 | Badge showing data source |
| `AggregationToggle.tsx` | ~60 | Day/Week/Month switcher |
| `TrendsLegend.tsx` | ~50 | Interactive legend with toggles |
| `TrendsTooltip.tsx` | ~40 | Custom tooltip component |

**Total**: ~340 lines across 5 files

---

## Technical Implementation

### FbsTrendsChart.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/FbsTrendsChart.tsx

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useFbsTrends } from '@/hooks/useFbsAnalytics'
import { DataSourceIndicator } from './DataSourceIndicator'
import { AggregationToggle } from './AggregationToggle'
import { TrendsLegend } from './TrendsLegend'
import { TrendsTooltip } from './TrendsTooltip'
import { formatDateRu } from '@/lib/date-utils'
import type { AggregationType, TrendDataPoint } from '@/types/fbs-analytics'

/** Chart line colors */
const LINE_COLORS = {
  orders: '#3B82F6',    // Blue
  revenue: '#22C55E',   // Green
  cancellations: '#EF4444', // Red
} as const

/** Metric visibility state */
interface MetricVisibility {
  orders: boolean
  revenue: boolean
  cancellations: boolean
}

export interface FbsTrendsChartProps {
  /** Start date (YYYY-MM-DD) */
  from: string
  /** End date (YYYY-MM-DD) */
  to: string
  /** Initial aggregation level */
  initialAggregation?: AggregationType
  /** Chart height in pixels */
  height?: number
  /** Additional className */
  className?: string
}

export function FbsTrendsChart({
  from,
  to,
  initialAggregation,
  height = 400,
  className,
}: FbsTrendsChartProps) {
  // Aggregation state
  const [aggregation, setAggregation] = useState<AggregationType>(
    initialAggregation ?? 'day'
  )

  // Metric visibility state
  const [visibility, setVisibility] = useState<MetricVisibility>({
    orders: true,
    revenue: true,
    cancellations: false,
  })

  // Fetch trends data
  const { data, isLoading, error, refetch } = useFbsTrends({
    from,
    to,
    aggregation,
  })

  // Toggle metric visibility
  const toggleMetric = (metric: keyof MetricVisibility) => {
    setVisibility((prev) => {
      const visibleCount = Object.values(prev).filter(Boolean).length
      // Don't allow hiding last visible metric
      if (visibleCount === 1 && prev[metric]) return prev
      return { ...prev, [metric]: !prev[metric] }
    })
  }

  // Format X-axis tick
  const formatXAxis = (dateStr: string) => {
    return formatDateRu(new Date(dateStr), 'dd.MM')
  }

  // Format Y-axis for revenue
  const formatYAxisRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Динамика заказов FBS</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Динамика заказов FBS</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные. Попробуйте еще раз.</span>
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

  // Empty state
  if (!data?.trends || data.trends.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Динамика заказов FBS</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Нет данных за выбранный период. Попробуйте выбрать другой диапазон дат.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Динамика заказов FBS</CardTitle>
        <div className="flex items-center gap-4">
          <DataSourceIndicator source={data.dataSource.primary} />
          <AggregationToggle value={aggregation} onChange={setAggregation} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data.trends}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => v.toLocaleString('ru-RU')}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatYAxisRevenue}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<TrendsTooltip />} />

            {visibility.orders && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ordersCount"
                stroke={LINE_COLORS.orders}
                strokeWidth={2}
                dot={false}
                name="Заказы"
              />
            )}
            {visibility.revenue && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke={LINE_COLORS.revenue}
                strokeWidth={2}
                dot={false}
                name="Выручка"
              />
            )}
            {visibility.cancellations && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cancellations"
                stroke={LINE_COLORS.cancellations}
                strokeWidth={2}
                dot={false}
                name="Отмены"
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        <TrendsLegend
          visibility={visibility}
          onToggle={toggleMetric}
          colors={LINE_COLORS}
        />
      </CardContent>
    </Card>
  )
}
```

### DataSourceIndicator.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/DataSourceIndicator.tsx

import { Badge } from '@/components/ui/badge'
import { Database, Clock, Calendar } from 'lucide-react'

type DataSource = 'orders_fbs' | 'reports' | 'analytics'

interface DataSourceIndicatorProps {
  source: DataSource
}

const SOURCE_CONFIG: Record<DataSource, {
  label: string
  color: string
  icon: React.ElementType
}> = {
  orders_fbs: {
    label: 'Реалтайм',
    color: 'bg-green-100 text-green-800',
    icon: Clock,
  },
  reports: {
    label: 'Ежедневно',
    color: 'bg-blue-100 text-blue-800',
    icon: Calendar,
  },
  analytics: {
    label: 'Еженедельно',
    color: 'bg-purple-100 text-purple-800',
    icon: Database,
  },
}

export function DataSourceIndicator({ source }: DataSourceIndicatorProps) {
  const config = SOURCE_CONFIG[source]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
```

### AggregationToggle.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/AggregationToggle.tsx

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { AggregationType } from '@/types/fbs-analytics'

interface AggregationToggleProps {
  value: AggregationType
  onChange: (value: AggregationType) => void
  disabled?: boolean
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

export function AggregationToggle({
  value,
  onChange,
  disabled = false,
}: AggregationToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as AggregationType)}
      disabled={disabled}
      className="border rounded-md"
    >
      {AGGREGATION_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="px-3 py-1 text-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
```

### TrendsLegend.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/TrendsLegend.tsx

import { cn } from '@/lib/utils'

interface MetricVisibility {
  orders: boolean
  revenue: boolean
  cancellations: boolean
}

interface TrendsLegendProps {
  visibility: MetricVisibility
  onToggle: (metric: keyof MetricVisibility) => void
  colors: Record<keyof MetricVisibility, string>
}

const METRIC_LABELS: Record<keyof MetricVisibility, string> = {
  orders: 'Заказы',
  revenue: 'Выручка',
  cancellations: 'Отмены',
}

export function TrendsLegend({
  visibility,
  onToggle,
  colors,
}: TrendsLegendProps) {
  return (
    <div className="flex flex-wrap gap-4 mt-4 justify-center">
      {(Object.keys(visibility) as Array<keyof MetricVisibility>).map(
        (metric) => (
          <button
            key={metric}
            onClick={() => onToggle(metric)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-opacity',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2',
              !visibility[metric] && 'opacity-50'
            )}
            aria-pressed={visibility[metric]}
            aria-label={`${visibility[metric] ? 'Скрыть' : 'Показать'} ${METRIC_LABELS[metric]}`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[metric] }}
            />
            <span className="text-sm">{METRIC_LABELS[metric]}</span>
          </button>
        )
      )}
    </div>
  )
}
```

### TrendsTooltip.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/TrendsTooltip.tsx

import { formatCurrency } from '@/lib/utils'
import { formatDateRu } from '@/lib/date-utils'
import type { TrendDataPoint } from '@/types/fbs-analytics'

interface TrendsTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color: string
    payload: TrendDataPoint
  }>
}

export function TrendsTooltip({ active, payload }: TrendsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const dataPoint = payload[0].payload

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="font-semibold text-gray-900 mb-2">
        {formatDateRu(new Date(dataPoint.date), 'dd.MM.yyyy')}
      </p>

      <div className="space-y-1 text-sm">
        <p>
          <span className="text-gray-600">Заказов:</span>{' '}
          <span className="font-medium">{dataPoint.ordersCount.toLocaleString('ru-RU')}</span>
        </p>
        <p>
          <span className="text-gray-600">Выручка:</span>{' '}
          <span className="font-medium">{formatCurrency(dataPoint.revenue)}</span>
        </p>
        <p>
          <span className="text-gray-600">Отмены:</span>{' '}
          <span className="font-medium">{dataPoint.cancellations}</span>
          <span className="text-gray-500 ml-1">
            ({dataPoint.cancellationRate.toFixed(1)}%)
          </span>
        </p>
        <p>
          <span className="text-gray-600">Ср. чек:</span>{' '}
          <span className="font-medium">{formatCurrency(dataPoint.avgOrderValue)}</span>
        </p>
      </div>
    </div>
  )
}
```

---

## Data Resolution Strategy

| Range | Default Aggregation | Max Points | Data Source |
|-------|-------------------|------------|-------------|
| 0-30 days | Daily | 30 | orders_fbs (Реалтайм) |
| 31-90 days | Daily | 90 | reports (Ежедневно) |
| 91-180 days | Weekly | 26 | analytics (Еженедельно) |
| 181-365 days | Weekly | 52 | analytics (Еженедельно) |

---

## Tasks / Subtasks

### Phase 1: Base Components (1.5 SP)

- [ ] Create `DataSourceIndicator.tsx` with 3 source types
- [ ] Create `AggregationToggle.tsx` with ToggleGroup
- [ ] Create `TrendsTooltip.tsx` with formatted values
- [ ] Create `TrendsLegend.tsx` with toggle functionality
- [ ] Add unit tests for each component

### Phase 2: Main Chart Component (2 SP)

- [ ] Create `FbsTrendsChart.tsx` with Recharts
- [ ] Implement multi-line chart with 3 metrics
- [ ] Add dual Y-axis (counts left, revenue right)
- [ ] Integrate `useFbsTrends` hook
- [ ] Implement metric visibility toggling
- [ ] Add loading skeleton state
- [ ] Add error state with retry

### Phase 3: Integration & Polish (1 SP)

- [ ] Integrate with `DateRangePickerExtended`
- [ ] Connect aggregation auto-suggestion
- [ ] Add responsive breakpoints
- [ ] Test with 365 data points
- [ ] Verify accessibility

### Phase 4: Testing (0.5 SP)

- [ ] Unit tests for FbsTrendsChart
- [ ] Integration test with mock data
- [ ] Accessibility audit
- [ ] Performance test with large datasets

---

## Testing

### Unit Test Cases

```typescript
// FbsTrendsChart.test.tsx

describe('FbsTrendsChart', () => {
  describe('Rendering', () => {
    it('renders loading skeleton initially')
    it('renders chart when data loaded')
    it('renders error alert on fetch failure')
    it('renders empty state when no data')
  })

  describe('Metric Visibility', () => {
    it('toggles orders line visibility')
    it('toggles revenue line visibility')
    it('prevents hiding last visible metric')
    it('persists visibility state')
  })

  describe('Aggregation', () => {
    it('switches between day/week/month')
    it('refetches data on aggregation change')
  })

  describe('Data Source', () => {
    it('displays correct badge for orders_fbs')
    it('displays correct badge for reports')
    it('displays correct badge for analytics')
  })
})

describe('TrendsTooltip', () => {
  it('shows all metrics on hover')
  it('formats revenue as currency')
  it('formats date in Russian')
})

describe('TrendsLegend', () => {
  it('renders all three metrics')
  it('calls onToggle when clicked')
  it('shows active/inactive state')
})
```

### E2E Test Cases

```typescript
// fbs-trends.spec.ts (Playwright)

test('FBS Trends Chart displays correctly', async ({ page }) => {
  await page.goto('/analytics/orders')

  // Wait for chart to load
  await expect(page.getByRole('heading', { name: 'Динамика заказов FBS' })).toBeVisible()

  // Verify legend items
  await expect(page.getByText('Заказы')).toBeVisible()
  await expect(page.getByText('Выручка')).toBeVisible()

  // Toggle metric
  await page.getByText('Отмены').click()

  // Change aggregation
  await page.getByRole('radio', { name: 'Неделя' }).click()
})
```

---

## Definition of Done

- [ ] All 5 components created and exported
- [ ] `FbsTrendsChart` renders multi-line chart
- [ ] Metric visibility toggle works
- [ ] Data source indicator shows correct badge
- [ ] Aggregation toggle switches day/week/month
- [ ] Tooltips display on hover
- [ ] Loading skeleton shown during fetch
- [ ] Error state with retry button
- [ ] Responsive on mobile
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
| Story 51.1-FE | Ready | Types for `TrendDataPoint`, `TrendsResponse` |
| Story 51.2-FE | Ready | `useFbsTrends` hook |
| Story 51.3-FE | Ready | `DateRangePickerExtended` component |
| `recharts` | Installed | Chart library |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.5-FE | Pending | Summary cards (separate component) |
| Story 51.8-FE | Pending | FBS Analytics Page (consumes this) |

---

## Related Files

### Existing Similar Components

- `src/components/custom/MarginTrendChart.tsx` - Reference for Recharts patterns
- `src/components/custom/ExpenseChart.tsx` - Reference for chart styling

### Types Used

- `src/types/fbs-analytics.ts` - `TrendDataPoint`, `TrendsResponse`, `AggregationType`

### Hooks Used

- `src/hooks/useFbsAnalytics.ts` - `useFbsTrends`

---

## Dev Notes

### Recharts Configuration

```tsx
// Key Recharts imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Dual Y-axis for different scales (counts vs currency)
<YAxis yAxisId="left" />   // Orders, Cancellations
<YAxis yAxisId="right" orientation="right" />  // Revenue
```

### Performance Considerations

- Use `dot={false}` on Line components for large datasets
- Limit data points via aggregation (max ~130)
- Memoize formatters with `useMemo`
- Use `ResponsiveContainer` for resize handling

### Mobile Breakpoints

- Desktop (md+): Side-by-side controls, full legend
- Mobile: Stacked controls, compact legend

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

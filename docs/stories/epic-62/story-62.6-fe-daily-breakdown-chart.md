# Story 62.6-FE: Daily Breakdown Chart Component

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: 📋 Ready for Dev
**Priority**: P1 (Important)
**Estimate**: 5 SP

---

## Title (RU)
Компонент графика разбивки по дням

---

## Description

Create a multi-series line chart component that displays all 8 dashboard metrics broken down by day for the selected period (week or month). This is the primary visualization for understanding daily financial trends.

The chart must:
- Display 8 metric series with distinct colors
- Support dual Y-axis (revenue metrics left, expense metrics right)
- Show daily data points with appropriate X-axis labels (Пн-Вс for week, 1-31 for month)
- Include interactive tooltips showing all values for a hovered day
- Be responsive across desktop, tablet, and mobile viewports

This component consumes data from the `useDailyMetrics` hook implemented in Epic 61-FE.

---

## Acceptance Criteria

- [ ] Component renders multi-series line chart using Recharts library
- [ ] X-axis displays day labels: "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" for week mode
- [ ] X-axis displays day numbers: "1", "2", ... "31" for month mode
- [ ] Left Y-axis shows revenue scale (Заказы, Выкупы, COGS, Теор. прибыль)
- [ ] Right Y-axis shows expense scale (Реклама, Логистика, Хранение)
- [ ] Each metric has distinct color per spec (see Design Specifications)
- [ ] Tooltip displays date header + all metric values for hovered day
- [ ] Tooltip includes formatted currency values (Russian locale)
- [ ] Chart is responsive: 320px height (desktop), 280px (tablet), 240px (mobile)
- [ ] Loading skeleton shown while data is fetching
- [ ] Empty state displayed when no data available
- [ ] Partial data state shows warning banner for missing days
- [ ] Respects `prefers-reduced-motion` for animations
- [ ] Chart data transformation is memoized for performance

---

## Design Specifications

### Chart Colors (from wireframe)

| Metric | Label (RU) | Color | Hex | Y-Axis |
|--------|------------|-------|-----|--------|
| orders | Заказы | Blue | `#3B82F6` | left |
| ordersCogs | COGS заказов | Orange | `#F97316` | left |
| sales | Выкупы | Green | `#22C55E` | left |
| salesCogs | COGS выкупов | Orange Light | `#FB923C` | left |
| advertising | Реклама | Purple | `#7C3AED` | right |
| logistics | Логистика | Cyan | `#06B6D4` | right |
| storage | Хранение | Pink | `#EC4899` | right |
| profit | Теор. прибыль | Primary Red | `#E53935` | left |

### Chart Dimensions

| Viewport | Width | Height | Margins (T/R/B/L) |
|----------|-------|--------|-------------------|
| Desktop (>= 1024px) | 100% | 320px | 20/30/60/60 |
| Tablet (768-1023px) | 100% | 280px | 16/20/50/50 |
| Mobile (< 768px) | 100% | 240px | 12/10/40/40 |

### Line Configuration

```typescript
{
  type: 'monotone',
  strokeWidth: 2,
  dot: { r: 4, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 6, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out'
}
```

### Tooltip Design

```
┌──────────────────────────────────┐
│ Среда, 29 января 2026            │  <- 14px, font-semibold
├──────────────────────────────────┤
│ ● Заказы          187 234 ₽     │  <- Colored dot + metric
│ ● Выкупы          156 789 ₽     │
│ ● COGS заказов     95 000 ₽     │
│ ...                              │
│ ◆ Теор. прибыль    34 567 ₽     │  <- Diamond for profit
└──────────────────────────────────┘

Background: white
Border: 1px solid #EEEEEE
Border-radius: 8px
Padding: 12px
Shadow: 0 4px 6px rgba(0,0,0,0.1)
Max-width: 280px
```

### Axis Configuration

**X-Axis:**
```typescript
{
  dataKey: 'date',
  tickFormatter: (date) => formatDayLabel(date, periodType),
  tick: { fontSize: 12, fill: '#757575' },
  axisLine: { stroke: '#EEEEEE' },
  tickLine: { stroke: '#EEEEEE' }
}
```

**Y-Axis (Left - Revenue):**
```typescript
{
  yAxisId: 'left',
  tickFormatter: (value) => formatCompactCurrency(value),
  tick: { fontSize: 12, fill: '#757575' },
  axisLine: { stroke: '#EEEEEE' },
  tickLine: false,
  width: 60
}
```

**Y-Axis (Right - Expenses):**
```typescript
{
  yAxisId: 'right',
  orientation: 'right',
  tickFormatter: (value) => formatCompactCurrency(value),
  tick: { fontSize: 12, fill: '#757575' },
  axisLine: { stroke: '#EEEEEE' },
  tickLine: false,
  width: 60
}
```

---

## Technical Implementation

### Component Structure

```typescript
// DailyBreakdownChart.tsx
interface DailyBreakdownChartProps {
  data: DailyMetrics[]
  periodType: 'week' | 'month'
  visibleSeries: string[]
  onSeriesToggle?: (key: string) => void
  isLoading: boolean
  error?: Error | null
}

// Internal types
interface ChartDataPoint {
  date: string
  dayLabel: string
  orders: number
  ordersCogs: number
  sales: number
  salesCogs: number
  advertising: number
  logistics: number
  storage: number
  profit: number
}

interface MetricSeries {
  key: string
  label: string
  color: string
  axis: 'left' | 'right'
}
```

### Dependencies

- `recharts` - Already in project (LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer)
- `useDailyMetrics` hook from Epic 61.9-FE
- `useDashboardPeriod` context from Epic 60-FE
- `formatCurrency`, `formatCompactCurrency` from `src/lib/formatters.ts`

### Data Flow

```
DashboardPeriodContext → useDailyMetrics hook → DailyBreakdownChart
                                                      ↓
                                              Memoized transformation
                                                      ↓
                                              Recharts LineChart
```

### Helper Functions

```typescript
// Format day label based on period type
function formatDayLabel(date: string, periodType: 'week' | 'month'): string {
  const d = new Date(date)
  if (periodType === 'week') {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return days[d.getDay()]
  }
  return d.getDate().toString()
}

// Transform API data to chart format
function transformToChartData(metrics: DailyMetrics[]): ChartDataPoint[]
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/DailyBreakdownChart.tsx` | CREATE | Main chart component |
| `src/components/custom/dashboard/DailyBreakdownTooltip.tsx` | CREATE | Custom tooltip component |
| `src/components/custom/dashboard/chart-config.ts` | CREATE | Chart configuration constants |
| `src/components/custom/dashboard/__tests__/DailyBreakdownChart.test.tsx` | CREATE | Unit tests |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add barrel export |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Hook | `useDailyMetrics` | From Story 61.9-FE |
| Context | `DashboardPeriodContext` | From Epic 60-FE |
| Library | `recharts` | Already installed |

**Blocking**: This story requires Story 61.9-FE (useDailyMetrics hook) to be completed first.

---

## Testing Requirements

### Unit Tests

```typescript
describe('DailyBreakdownChart', () => {
  it('renders loading skeleton when isLoading=true', () => {})
  it('renders empty state when data is empty array', () => {})
  it('renders 8 line series with correct colors', () => {})
  it('shows correct X-axis labels for week mode', () => {})
  it('shows correct X-axis labels for month mode', () => {})
  it('hides series when not in visibleSeries array', () => {})
  it('formats Y-axis values as compact currency', () => {})
  it('memoizes data transformation', () => {})
  it('respects prefers-reduced-motion', () => {})
})
```

### Visual Testing

- Verify chart renders correctly at all viewport sizes
- Verify tooltip appears on hover and shows all metrics
- Verify line colors match design spec
- Verify dual Y-axis scales correctly

---

## Accessibility Requirements

- Chart container has `role="img"` with descriptive `aria-label`
- Hidden description for screen readers listing data summary
- Focus indicators visible when chart receives keyboard focus
- Reduced motion: disable line drawing animation when user prefers

```html
<div
  role="img"
  aria-label="График детализации по дням за неделю 2026-W05"
  aria-describedby="chart-description"
>
<p id="chart-description" class="sr-only">
  Линейный график показывает 8 метрик за 7 дней...
</p>
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Component follows 200-line file limit (split if needed)
- [ ] TypeScript strict mode passes
- [ ] Russian locale for all user-facing text
- [ ] Responsive design verified (mobile/tablet/desktop)
- [ ] Unit tests written and passing
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] No ESLint errors
- [ ] Visual QA with Chrome verification
- [ ] Code review approved

---

## References

- **Epic**: `docs/epics/epic-62-fe-dashboard-presentation.md`
- **Wireframe**: `docs/wireframes/dashboard-daily-breakdown.md`
- **Design System**: `docs/front-end-spec.md`
- **Data Hook**: Story 61.9-FE (useDailyMetrics)
- **Recharts Docs**: https://recharts.org/en-US/api/LineChart

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

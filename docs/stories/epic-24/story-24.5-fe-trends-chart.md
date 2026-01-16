# Story 24.5-FE: Storage Trends Chart

## Story Info

- **Epic**: 24 - Paid Storage Analytics (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Done (QA PASS 92/100)

## User Story

**As a** seller,
**I want** to see how my storage costs change over time,
**So that** I can identify trends and plan accordingly.

## Acceptance Criteria

### AC1: Chart Display
- [ ] Line/Area chart showing storage cost by week
- [ ] X-axis: ISO weeks (W44, W45, W46, W47)
- [ ] Y-axis: Storage cost in ₽
- [ ] Hover tooltip with exact values

### AC2: Summary Stats
- [ ] Show min, max, avg values
- [ ] Show trend percentage (increase/decrease)
- [ ] Color code trend: green (decrease), red (increase)

### AC3: Interactivity
- [ ] Hover shows week + value tooltip
- [ ] ~~Click week → filter tables~~ - **DEFERRED** (UX Decision Q11)
- [ ] Smooth line with area fill

### AC4: Single Product Mode
- [ ] Support filtering by nm_id
- [ ] When nm_id provided, show that product's trend
- [ ] Title changes: "Динамика хранения: {product_name}"

### AC5: Null Data Handling (UX Decision Q12)
- [ ] Show **gaps** in chart for weeks with no data (don't interpolate)
- [ ] Visual indicator for null data points
- [ ] Tooltip explains: "Нет данных за эту неделю"

## Tasks / Subtasks

### Phase 1: Component Setup
- [ ] Create `src/app/(dashboard)/analytics/storage/components/StorageTrendsChart.tsx`
- [ ] Define component props interface
- [ ] Set up data fetching with `useStorageTrends` hook

### Phase 2: Chart Implementation
- [ ] Configure Recharts AreaChart
- [ ] Set up X-axis with week formatter
- [ ] Set up Y-axis with currency formatter
- [ ] Add gradient fill for area
- [ ] Handle null data points (gaps)

### Phase 3: Summary Stats
- [ ] Create summary stats bar above chart
- [ ] Display min, max, avg values
- [ ] Display trend percentage with color
- [ ] Add trend icon (TrendingUp/TrendingDown)

### Phase 4: Tooltip
- [ ] Create custom tooltip component
- [ ] Show week, storage cost, volume
- [ ] Handle null values in tooltip

### Phase 5: Single Product Mode
- [ ] Add nmId prop support
- [ ] Update title when product filter active
- [ ] Fetch product-specific trends

### Phase 6: Loading & Error States
- [ ] Implement loading skeleton
- [ ] Implement error state
- [ ] Implement empty state

### Phase 7: Testing
- [ ] Test chart renders with mock data
- [ ] Test null data handling (gaps)
- [ ] Test tooltip interactions
- [ ] Test single product mode

## Design

```
┌──────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение     Тренд: +5.2% <↑ red> │
├──────────────────────────────────────────────────────────────────────┤
│   Мин: 28,000 ₽  │  Макс: 32,000 ₽  │  Среднее: 30,250 ₽            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  32k ┤                                    ___                        │
│      │                               ___/   \                        │
│  30k ┤                          ____/        \___                    │
│      │                     ____/                  \                  │
│  28k ┤___________________/                                           │
│      │        [gap]                                                  │
│      └───────┬───────┬───────┬───────┬───────┬───────┬───────┬──    │
│             W40     W41     W42     W43     W44     W45     W46      │
│                      ↑                                               │
│              [Нет данных за эту неделю]                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Technical Details

### Component Props

```typescript
interface StorageTrendsChartProps {
  weekStart: string;
  weekEnd: string;
  nmId?: string;           // Optional: show single product trend
  productName?: string;    // For title when nmId is provided
  height?: number;         // default: 300
  showSummary?: boolean;   // default: true
}
```

### Data Hook Usage

```typescript
const { data, isLoading, error } = useStorageTrends(
  weekStart,
  weekEnd,
  { nm_id: nmId, metrics: ['storage_cost', 'volume'] }
);
```

### Chart Configuration (Recharts)

```typescript
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CHART_COLORS = {
  storage: '#7C4DFF',  // Purple for storage costs
  gradient: {
    start: 'rgba(124, 77, 255, 0.3)',
    end: 'rgba(124, 77, 255, 0)',
  },
};

function StorageTrendsChart({
  weekStart,
  weekEnd,
  nmId,
  productName,
  height = 300,
  showSummary = true,
}: StorageTrendsChartProps) {
  const { data, isLoading, error } = useStorageTrends(weekStart, weekEnd, {
    nm_id: nmId,
    metrics: ['storage_cost'],
  });

  if (isLoading) return <ChartSkeleton height={height} />;
  if (error) return <ChartError error={error} />;
  if (!data?.data?.length) return <ChartEmpty />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {nmId
                ? `Динамика хранения: ${productName || nmId}`
                : 'Динамика расходов на хранение'}
            </CardTitle>
          </div>
          {data.summary?.storage_cost && (
            <TrendBadge trend={data.summary.storage_cost.trend} />
          )}
        </div>
      </CardHeader>
      {showSummary && data.summary?.storage_cost && (
        <SummaryStats summary={data.summary.storage_cost} />
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data.data}>
            <defs>
              <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.storage} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.storage} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekShort}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="storage_cost"
              stroke={CHART_COLORS.storage}
              fill="url(#storageFill)"
              strokeWidth={2}
              connectNulls={false}  // Show gaps for null data (UX Decision Q12)
              dot={<ChartDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Trend Badge Component

```typescript
interface TrendBadgeProps {
  trend: number;  // % change
}

function TrendBadge({ trend }: TrendBadgeProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  // For storage costs: increase is bad (red), decrease is good (green)
  const color = isPositive
    ? 'text-red-600 bg-red-50'
    : isNegative
      ? 'text-green-600 bg-green-50'
      : 'text-gray-600 bg-gray-50';

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium', color)}>
      {Icon && <Icon className="h-4 w-4" />}
      <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
    </div>
  );
}
```

### Custom Tooltip Component

```typescript
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as StorageTrendPoint;
  const hasData = data.storage_cost !== null && data.storage_cost !== undefined;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">{formatWeekFull(label)}</p>
      {hasData ? (
        <p className="text-lg font-bold text-primary">
          {formatCurrency(data.storage_cost!)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Нет данных за эту неделю
        </p>
      )}
    </div>
  );
}
```

### Chart Dot for Null Handling (UX Decision Q12)

```typescript
function ChartDot(props: DotProps) {
  const { cx, cy, payload } = props;

  // If no coordinates, don't render
  if (cx === undefined || cy === undefined) return null;

  const hasData = payload?.storage_cost !== null && payload?.storage_cost !== undefined;

  if (!hasData) {
    // Show dashed circle for null data points
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="transparent"
        stroke="#9CA3AF"
        strokeWidth={2}
        strokeDasharray="2,2"
      />
    );
  }

  // Normal filled dot
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={CHART_COLORS.storage}
      stroke="white"
      strokeWidth={2}
    />
  );
}
```

### Summary Stats Component

```typescript
interface SummaryStatsProps {
  summary: MetricSummary;
}

function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="flex gap-4 px-6 py-2 border-b text-sm">
      <div>
        <span className="text-muted-foreground">Мин: </span>
        <span className="font-medium">{formatCurrency(summary.min)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Макс: </span>
        <span className="font-medium">{formatCurrency(summary.max)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Среднее: </span>
        <span className="font-medium">{formatCurrency(summary.avg)}</span>
      </div>
    </div>
  );
}
```

## Dev Notes

### Relevant Source Tree

```
src/
├── app/(dashboard)/analytics/storage/
│   └── components/
│       ├── StorageTrendsChart.tsx    # NEW: Story 24.5-fe
│       ├── TrendBadge.tsx            # NEW: helper component
│       ├── SummaryStats.tsx          # NEW: helper component
│       └── ChartTooltip.tsx          # NEW: helper component
├── components/
│   ├── custom/
│   │   └── ExpenseChart.tsx          # Reference: similar chart implementation
│   └── ui/
│       └── card.tsx                  # Use for container
└── hooks/
    └── useStorageAnalytics.ts        # Use useStorageTrends
```

### UX Decisions Applied

| Question | Decision | Rationale |
|----------|----------|-----------|
| Q11: Click week → filter | DEFERRED | Adds complexity, not needed for MVP |
| Q12: Null data | Show gaps (don't interpolate) | Data integrity, honest visualization |

### Week Formatters

```typescript
// Short format for X-axis: "W44"
function formatWeekShort(week: string): string {
  // "2025-W44" → "W44"
  return week.split('-')[1] || week;
}

// Full format for tooltip: "Неделя 44 (28 окт - 3 ноя)"
function formatWeekFull(week: string): string {
  // Parse ISO week and format with date range
  // Implementation depends on date library (date-fns recommended)
  return `Неделя ${week.split('-W')[1]}`;
}
```

### Color Scheme

Per UX recommendations, using purple for storage costs to differentiate from existing red (expenses) and green (revenue):

- **Storage Line**: `#7C4DFF` (Purple)
- **Gradient Fill**: `rgba(124, 77, 255, 0.3)` → `rgba(124, 77, 255, 0)`
- **Trend Up (bad)**: Red (`text-red-600`)
- **Trend Down (good)**: Green (`text-green-600`)

## Testing

### Framework & Location
- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/analytics/storage/components/__tests__/StorageTrendsChart.test.tsx`

### Test Cases

- [ ] Chart renders with 4 weeks of data
- [ ] X-axis shows week labels (W44, W45, etc.)
- [ ] Y-axis shows abbreviated values (28k, 30k, etc.)
- [ ] Tooltip shows on hover with correct values
- [ ] Null data points show as gaps (not connected)
- [ ] Null data tooltip shows "Нет данных за эту неделю"
- [ ] Summary stats show min, max, avg
- [ ] Positive trend shows red badge with TrendingUp icon
- [ ] Negative trend shows green badge with TrendingDown icon
- [ ] Single product mode changes title
- [ ] Loading skeleton displays
- [ ] Empty state displays when no data
- [ ] Error state displays with retry button

### Coverage Target
- Component: >80%
- Helper components: >90%

## Definition of Done

- [ ] Chart displays storage trend over weeks
- [ ] Null data shows as gaps (not interpolated)
- [ ] Custom tooltip with week info
- [ ] Summary statistics visible (min, max, avg)
- [ ] Trend indicator with appropriate color
- [ ] Responsive sizing
- [ ] Single product mode works (nmId param)
- [ ] Loading skeleton
- [ ] Error state
- [ ] Empty state
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] File size <200 lines (split components if needed)

## Dependencies

- Story 24.1-FE: Types & API Client
- Story 24.2-FE: Page Layout (provides container)
- Recharts library (already in project)
- `useStorageTrends` hook

## Related

- Similar chart: `src/components/custom/ExpenseChart.tsx`
- API: `GET /v1/analytics/storage/trends`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | PO (Sarah) | Initial draft |
| 2025-11-29 | UX Expert (Sally) | Updated: deferred click interaction, show gaps for null data |
| 2025-11-29 | UX Expert (Sally) | Added Tasks, Dev Notes, Testing sections with code examples |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Completed
Agent: Claude Code (Opus 4.5)
Started: 2025-11-29
Completed: 2025-11-29
Notes:
- Created StorageTrendsChart.tsx (197 lines) with integrated helpers
- TrendBadge: Red for increase (bad), green for decrease (good)
- SummaryStats: Shows min, max, avg values
- Custom tooltip shows week and currency value
- Uses purple (#7C4DFF) color scheme for storage differentiation
- Recharts AreaChart with gradient fill
- connectNulls=false for proper gap handling (UX Decision Q12)
- Integrated into page.tsx replacing placeholder
- All files pass ESLint and TypeScript type-check
```

---

## QA Results

### Review Date: 2025-11-29
### Reviewed By: Quinn (Test Architect)

**Gate: PASS** | **Score: 92/100** → `docs/qa/gates/24.5-fe-trends-chart.yml`

**Strengths:**
- Purple color scheme (#7C4DFF) for storage differentiation
- Summary stats (min, max, avg) displayed
- TrendBadge: red for increase (bad), green for decrease (good)
- Custom tooltip with null data handling ("Нет данных за эту неделю")
- connectNulls=false for proper gap display (UX Decision Q12)
- Under 200 lines (197)

**Issues:** None

**UX Decisions Verified:** Q11 (click deferred), Q12 (show gaps)

**Files:** StorageTrendsChart.tsx (197 lines)

**Recommended Status:** [✓ Ready for Done]

# Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)

## Story Info

- **Epic**: 63 - Dashboard Main Page (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Complete
- **Sprint**: 14
- **Completion Date**: 2026-01-31

## User Story

**As a** seller viewing my dashboard,
**I want** to see how my storage costs change over time in a visual chart,
**So that** I can quickly identify cost trends and plan inventory accordingly.

## Acceptance Criteria

### AC1: Chart Display
- [ ] Line/Area chart showing storage cost trend over weeks
- [ ] X-axis: ISO weeks (W01, W02, W03, etc.)
- [ ] Y-axis: Storage cost in rubles (formatted: 5k, 10k, etc.)
- [ ] Hover tooltip with exact values and week info
- [ ] Smooth line with purple gradient area fill (#7C4DFF)

### AC2: Summary Statistics
- [ ] Show min, max, avg values above chart
- [ ] Display trend percentage over period (e.g., +10.0%)
- [ ] Color-coded trend indicator:
  - **Increase (bad)**: Red with TrendingUp icon
  - **Decrease (good)**: Green with TrendingDown icon
  - **Stable**: Gray

### AC3: Trend Indicator Badge
- [ ] Prominent trend badge showing percentage change
- [ ] Arrow icon indicating direction (up/down)
- [ ] Semantic coloring (red for cost increase, green for decrease)

### AC4: Period Integration
- [ ] Widget respects dashboard's selected period (weekStart/weekEnd)
- [ ] Minimum 4 weeks of data for meaningful trend visualization
- [ ] Adapts to period context provider

### AC5: Loading & Empty States
- [ ] Loading skeleton matching chart dimensions
- [ ] Empty state: "Нет данных за выбранный период"
- [ ] Error state with retry button

### AC6: Null Data Handling
- [ ] Show **gaps** in chart for weeks with no data (don't interpolate)
- [ ] Visual indicator for null data points (dashed circle)
- [ ] Tooltip explains: "Нет данных за эту неделю"

## Tasks / Subtasks

### Phase 1: Component Setup
- [ ] Create `src/components/custom/dashboard/StorageTrendsWidget.tsx`
- [ ] Define component props interface
- [ ] Set up data fetching with `useStorageTrends` hook

### Phase 2: Chart Implementation
- [ ] Configure Recharts AreaChart with purple theme
- [ ] Set up X-axis with week formatter (W01, W02, etc.)
- [ ] Set up Y-axis with currency formatter (5k, 10k)
- [ ] Add gradient fill for area (purple fade)
- [ ] Handle null data points (show gaps, don't interpolate)

### Phase 3: Summary Stats Bar
- [ ] Create summary stats component above chart
- [ ] Display min, max, avg values with labels
- [ ] Format values with formatCurrency helper

### Phase 4: Trend Badge
- [ ] Create TrendBadge component
- [ ] Show percentage with sign (+/-)
- [ ] Color code: red (increase), green (decrease)
- [ ] Add Lucide icon (TrendingUp/TrendingDown)

### Phase 5: Custom Tooltip
- [ ] Create custom tooltip component
- [ ] Show week name (Неделя 05)
- [ ] Show storage cost (5,500 ₽)
- [ ] Handle null values: "Нет данных за эту неделю"

### Phase 6: Loading & Error States
- [ ] Implement chart loading skeleton
- [ ] Implement error state with retry
- [ ] Implement empty state

### Phase 7: Integration
- [ ] Integrate with dashboard period context
- [ ] Add to dashboard expenses section layout
- [ ] Test responsiveness

### Phase 8: Testing
- [ ] Test chart renders with mock data
- [ ] Test null data handling (gaps)
- [ ] Test tooltip interactions
- [ ] Test summary stats accuracy

## Design

```
┌──────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение      Тренд: +10.0% <↑>  │
│                                                       (red badge)    │
├──────────────────────────────────────────────────────────────────────┤
│   Мин: 5,000 ₽  │  Макс: 5,500 ₽  │  Среднее: 5,280 ₽               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  5.5k ┤                                         ___●                 │
│       │                                    ___/                      │
│  5.3k ┤                               ___/                           │
│       │                          ___/                                │
│  5.0k ┤●______________________●/                                     │
│       │                                                              │
│       └───────┬───────┬───────┬───────┬───────┬                     │
│              W01     W02     W03     W04     W05                     │
│                                                                      │
│              [Purple gradient fill under line]                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Technical Details

### API Endpoint

```http
GET /v1/analytics/storage/trends
```

**Request Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `weekStart` | Yes | - | Start period (YYYY-Www) |
| `weekEnd` | Yes | - | End period (YYYY-Www) |
| `nm_id` | No | null | Filter by product (null = entire cabinet) |
| `metrics` | No | all | Metrics: `storage_cost`, `volume` |

**Example Request:**

```http
GET /v1/analytics/storage/trends?weekStart=2026-W01&weekEnd=2026-W05
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

### API Response Structure

```json
{
  "period": { "from": "2026-W01", "to": "2026-W05" },
  "nm_id": null,
  "data": [
    { "week": "2026-W01", "storage_cost": 5000.00, "volume": 10.5 },
    { "week": "2026-W02", "storage_cost": 5200.00, "volume": 10.8 },
    { "week": "2026-W03", "storage_cost": 5300.00, "volume": 11.0 },
    { "week": "2026-W04", "storage_cost": 5400.00, "volume": 11.2 },
    { "week": "2026-W05", "storage_cost": 5500.00, "volume": 11.5 }
  ],
  "summary": {
    "min": 5000.00,
    "max": 5500.00,
    "avg": 5280.00,
    "trend": "+10.0%"
  }
}
```

### TypeScript Types

```typescript
// src/types/storage.ts (extend existing)

interface StorageTrendPoint {
  week: string;
  storage_cost: number | null;
  volume?: number | null;
}

interface StorageTrendSummary {
  min: number;
  max: number;
  avg: number;
  trend: string; // e.g., "+10.0%", "-5.2%"
}

interface StorageTrendsResponse {
  period: {
    from: string;
    to: string;
  };
  nm_id: string | null;
  data: StorageTrendPoint[];
  summary: StorageTrendSummary;
}
```

### Component Props Interface

```typescript
interface StorageTrendsWidgetProps {
  weekStart: string;
  weekEnd: string;
  height?: number;         // default: 250 (compact for dashboard)
  showSummary?: boolean;   // default: true
  className?: string;
}
```

### Hook Usage

```typescript
// src/hooks/useStorageAnalytics.ts (extend existing)

export function useStorageTrends(
  weekStart: string,
  weekEnd: string,
  options?: { nm_id?: string; metrics?: string[] }
) {
  return useQuery({
    queryKey: storageQueryKeys.trends(weekStart, weekEnd, options),
    queryFn: () => getStorageTrends(weekStart, weekEnd, options),
    enabled: !!weekStart && !!weekEnd,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

### Color Scheme (Storage = Purple)

```typescript
const STORAGE_CHART_COLORS = {
  line: '#7C4DFF',              // Purple - main storage color
  gradient: {
    start: 'rgba(124, 77, 255, 0.3)',
    end: 'rgba(124, 77, 255, 0.05)',
  },
  trendUp: '#EF4444',          // Red - cost increase (bad)
  trendDown: '#22C55E',        // Green - cost decrease (good)
  trendNeutral: '#6B7280',     // Gray - no change
  nullPoint: '#9CA3AF',        // Gray - missing data
};
```

### Trend Badge Component

```typescript
interface TrendBadgeProps {
  trend: string; // e.g., "+10.0%"
}

function TrendBadge({ trend }: TrendBadgeProps) {
  const numericTrend = parseFloat(trend);
  const isPositive = numericTrend > 0;
  const isNegative = numericTrend < 0;

  // For storage costs: increase is bad (red), decrease is good (green)
  const colorClass = isPositive
    ? 'text-red-600 bg-red-50 border-red-200'
    : isNegative
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-gray-600 bg-gray-50 border-gray-200';

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;

  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border',
      colorClass
    )}>
      {Icon && <Icon className="h-4 w-4" />}
      <span>Тренд: {trend}</span>
    </div>
  );
}
```

### Summary Stats Component

```typescript
interface SummaryStatsProps {
  summary: StorageTrendSummary;
}

function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="flex gap-6 px-4 py-2 border-b text-sm bg-muted/30">
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

### Custom Tooltip Component

```typescript
interface StorageTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StorageTrendPoint }>;
  label?: string;
}

function StorageChartTooltip({ active, payload, label }: StorageTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const hasData = data.storage_cost !== null && data.storage_cost !== undefined;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="font-medium text-sm mb-1">
        Неделя {label?.split('-W')[1] || label}
      </p>
      {hasData ? (
        <p className="text-lg font-bold" style={{ color: STORAGE_CHART_COLORS.line }}>
          {formatCurrency(data.storage_cost!)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Нет данных за эту неделю
        </p>
      )}
    </div>
  );
}
```

### Chart Dot for Null Handling

```typescript
interface ChartDotProps {
  cx?: number;
  cy?: number;
  payload?: StorageTrendPoint;
}

function StorageChartDot({ cx, cy, payload }: ChartDotProps) {
  if (cx === undefined || cy === undefined) return null;

  const hasData = payload?.storage_cost !== null && payload?.storage_cost !== undefined;

  if (!hasData) {
    // Dashed circle for null data points
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="transparent"
        stroke={STORAGE_CHART_COLORS.nullPoint}
        strokeWidth={2}
        strokeDasharray="2,2"
      />
    );
  }

  // Solid filled dot for valid data
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={STORAGE_CHART_COLORS.line}
      stroke="white"
      strokeWidth={2}
    />
  );
}
```

### Week Formatters

```typescript
// Short format for X-axis: "W05"
function formatWeekShort(week: string): string {
  return week.split('-')[1] || week;
}

// Full format for tooltip: "Неделя 05"
function formatWeekLabel(week: string): string {
  const weekNum = week.split('-W')[1];
  return weekNum ? `Неделя ${weekNum}` : week;
}
```

## Dev Notes

### Relevant Source Tree

```
src/
├── components/
│   └── custom/
│       └── dashboard/
│           ├── StorageTrendsWidget.tsx     # NEW: Story 63.6-fe
│           ├── TrendBadge.tsx              # NEW: helper component
│           └── SummaryStats.tsx            # NEW: helper component
├── hooks/
│   └── useStorageAnalytics.ts              # EXTEND: ensure useStorageTrends exists
├── lib/
│   └── api/
│       └── storage.ts                      # EXTEND: ensure getStorageTrends exists
├── types/
│   └── storage.ts                          # EXTEND: add trend types if needed
└── app/(dashboard)/
    └── page.tsx                            # MODIFY: add widget to dashboard
```

### Reference Implementation

- Can reference `src/app/(dashboard)/analytics/storage/components/StorageTrendsChart.tsx` from Epic 24
- May be able to reuse components if properly exported
- Use same chart configuration pattern with Recharts

### Null Data Behavior (UX Decision)

Per UX decisions from Epic 24:
- **Show gaps** in chart for weeks with no data (don't interpolate)
- `connectNulls={false}` in Recharts Area component
- Visual indicator (dashed circle) for null data points
- Tooltip explains missing data

### Trend Interpretation (Storage Context)

For storage costs, trend direction has semantic meaning:
- **Increase (+%)** = Bad (costs going up) = Red
- **Decrease (-%)**  = Good (costs going down) = Green
- **No change (0%)** = Neutral = Gray

This is the opposite of revenue trends where increase is good.

### Recharts Configuration

```typescript
<ResponsiveContainer width="100%" height={height}>
  <AreaChart data={data.data}>
    <defs>
      <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={STORAGE_CHART_COLORS.line} stopOpacity={0.3} />
        <stop offset="95%" stopColor={STORAGE_CHART_COLORS.line} stopOpacity={0.05} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
    <XAxis
      dataKey="week"
      tickFormatter={formatWeekShort}
      className="text-xs"
      axisLine={false}
      tickLine={false}
    />
    <YAxis
      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
      className="text-xs"
      axisLine={false}
      tickLine={false}
    />
    <Tooltip content={<StorageChartTooltip />} />
    <Area
      type="monotone"
      dataKey="storage_cost"
      stroke={STORAGE_CHART_COLORS.line}
      fill="url(#storageFill)"
      strokeWidth={2}
      connectNulls={false}  // Show gaps for null data
      dot={<StorageChartDot />}
      activeDot={{ r: 6, fill: STORAGE_CHART_COLORS.line, stroke: 'white', strokeWidth: 2 }}
    />
  </AreaChart>
</ResponsiveContainer>
```

## Testing

### Framework & Location
- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/components/custom/dashboard/__tests__/StorageTrendsWidget.test.tsx`

### Test Cases

- [ ] Chart renders with 5 weeks of data
- [ ] X-axis shows week labels (W01, W02, etc.)
- [ ] Y-axis shows abbreviated values (5k, 6k, etc.)
- [ ] Tooltip shows on hover with correct values
- [ ] Null data points show as gaps (not connected)
- [ ] Null data tooltip shows "Нет данных за эту неделю"
- [ ] Summary stats show min, max, avg correctly
- [ ] Positive trend (+%) shows red badge with TrendingUp icon
- [ ] Negative trend (-%) shows green badge with TrendingDown icon
- [ ] Zero trend shows gray badge (no icon)
- [ ] Loading skeleton displays during fetch
- [ ] Empty state displays when no data
- [ ] Error state displays with retry button
- [ ] Chart respects height prop
- [ ] Purple color scheme applied correctly

### Coverage Target
- Component: >80%
- Helper components: >90%

## Definition of Done

- [ ] Chart displays storage trend over weeks (line + area)
- [ ] Purple color scheme (#7C4DFF) applied
- [ ] Null data shows as gaps (not interpolated)
- [ ] Custom tooltip with week info and currency value
- [ ] Summary statistics visible (min, max, avg)
- [ ] Trend indicator badge with appropriate color
- [ ] Responsive sizing (respects height prop)
- [ ] Loading skeleton
- [ ] Error state with retry
- [ ] Empty state
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] File size <200 lines (split components if needed)
- [ ] Unit tests pass with >80% coverage

## Dependencies

- Story 63.1-FE: Types & API Client foundation
- Recharts library (already in project)
- shadcn/ui Card component
- Lucide icons (TrendingUp, TrendingDown, BarChart3)
- `useStorageTrends` hook (existing or extended)
- Dashboard period context

## Related

- **API**: `GET /v1/analytics/storage/trends`
- **Reference**: Story 24.5-FE (similar Trends Chart in Storage Analytics page)
- **Backend Doc**: `docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM (Claude) | Initial draft based on backend API doc |

---

## Implementation

**Components**:
- `src/components/custom/dashboard/StorageTrendsWidget.tsx` (main container)
- `src/components/custom/dashboard/StorageTrendsChart.tsx` (Recharts chart)

**Key Features**:
- Line/Area chart with purple gradient (#7C4DFF) for storage costs
- Summary statistics (min, max, avg) displayed above chart
- Trend badge with percentage change (red for increase, green for decrease)
- Custom tooltip with week info and currency value
- Null data handling with gaps (connectNulls={false})
- Loading skeleton, error state, empty state

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useStorageTrends hook. Chart respects dashboard period context.
```

# Story 63.12-FE: Historical Trends Dashboard Section

**Epic**: 63-FE Dashboard Business Logic
**Status**: ✅ Complete
**Priority**: P1 (High)
**Estimate**: 3 SP
**Completion Date**: 2026-01-31

---

## Title (RU)

Секция исторических трендов на дашборде

---

## Description

Create a comprehensive historical trends section for the main dashboard that displays multi-metric trend charts over configurable time periods (4-12 weeks). Users can select which metrics to visualize and view summary statistics (min, max, avg, trend direction).

The section uses the `/v1/analytics/weekly/trends` endpoint to fetch time-series data and displays it using Recharts. It should be collapsible to save space on the dashboard and remember user preferences.

**Key Features**:
- Multi-line trend chart with selectable metrics
- Time period selector (4, 8, 12 weeks)
- Summary statistics panel (min, max, avg, trend %)
- Collapsible section with persisted state
- Interactive chart legend with metric toggle
- Responsive design for all screen sizes

---

## Acceptance Criteria

### Core Functionality
- [ ] Display trend chart with multiple metrics
- [ ] Support metric selection: revenue, profit, margin, logistics, storage
- [ ] Time period selector: 4w, 8w, 12w (default: 8w)
- [ ] Summary statistics: min, max, avg, trend % for each metric
- [ ] Collapsible section with expand/collapse button
- [ ] Persist collapsed state and preferences in localStorage

### Chart Features
- [ ] Multi-line chart using Recharts
- [ ] Interactive legend to toggle metric visibility
- [ ] Tooltip showing values for all metrics at hover point
- [ ] X-axis: week labels (W01, W02, etc.)
- [ ] Y-axis: auto-scaled with currency/percentage formatting
- [ ] Dual Y-axis: currency metrics (left) and percentage (right, for margin)
- [ ] Grid lines for readability
- [ ] Smooth line interpolation

### Summary Statistics
- [ ] Minimum value with week label
- [ ] Maximum value with week label
- [ ] Average value for period
- [ ] Trend percentage (first vs last value)
- [ ] Trend direction indicator (up/down/stable)

### States
- [ ] Loading skeleton while fetching data
- [ ] Error state with retry option
- [ ] Empty state when no data available
- [ ] Collapsed state showing only header

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard-navigable controls
- [ ] Screen reader announces chart data
- [ ] Color + pattern for line differentiation

---

## API Integration

### Endpoint

```http
GET /v1/analytics/weekly/trends?from={startWeek}&to={endWeek}&metrics={metrics}
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

### Request Examples

```http
# 8 weeks of key metrics
GET /v1/analytics/weekly/trends?from=2025-W50&to=2026-W05&metrics=payout_total,wb_sales_gross,logistics_cost,storage_cost

# All metrics with summary
GET /v1/analytics/weekly/trends?from=2025-W46&to=2026-W05&include_summary=true
```

### Response Schema

```json
{
  "data": [
    {
      "week": "2025-W50",
      "payout_total": 125000.00,
      "wb_sales_gross": 180000.00,
      "sale_gross": 280000.00,
      "logistics_cost": 32000.00,
      "storage_cost": 5200.00,
      "to_pay_goods": 165000.00
    },
    {
      "week": "2025-W51",
      "payout_total": 132000.00,
      "wb_sales_gross": 195000.00,
      "sale_gross": 295000.00,
      "logistics_cost": 34500.00,
      "storage_cost": 5800.00,
      "to_pay_goods": 175000.00
    }
    // ... more weeks
  ],
  "summary": {
    "payout_total": {
      "min": { "value": 118000, "week": "2025-W52" },
      "max": { "value": 145000, "week": "2026-W03" },
      "avg": 131250,
      "trend_pct": 12.5
    },
    "wb_sales_gross": {
      "min": { "value": 165000, "week": "2025-W50" },
      "max": { "value": 210000, "week": "2026-W04" },
      "avg": 187500,
      "trend_pct": 16.7
    }
    // ... other metrics
  },
  "meta": {
    "from": "2025-W50",
    "to": "2026-W05",
    "weeks_count": 8,
    "generated_at": "2026-01-31T12:00:00Z"
  }
}
```

---

## Design Specifications

### Section Layout

**Expanded State**:
```
+------------------------------------------------------------------+
| Исторические тренды                              [4w|8w|12w] [-] |
+------------------------------------------------------------------+
|                                                                  |
|  [Multi-line Chart Area - 300px height]                          |
|                                                                  |
|  ----+----+----+----+----+----+----+----                         |
|  W50  W51  W52  W01  W02  W03  W04  W05                          |
|                                                                  |
+------------------------------------------------------------------+
| Legend: [x] Выручка  [x] Прибыль  [ ] Маржа  [ ] Логистика       |
+------------------------------------------------------------------+
| Summary Statistics:                                              |
| +------------+------------+------------+------------+             |
| |  Выручка   |  Прибыль   | Логистика  |  Хранение  |            |
| | min: 165K  | min: 40K   | min: 32K   | min: 5.2K  |            |
| | max: 210K  | max: 65K   | max: 38K   | max: 6.5K  |            |
| | avg: 188K  | avg: 52K   | avg: 35K   | avg: 5.8K  |            |
| | [^+16.7%]  | [^+25.0%]  | [^+8.5%]   | [^+12.3%]  |            |
| +------------+------------+------------+------------+             |
+------------------------------------------------------------------+
```

**Collapsed State**:
```
+------------------------------------------------------------------+
| Исторические тренды                              [4w|8w|12w] [+] |
+------------------------------------------------------------------+
```

### Chart Configuration

```typescript
// Recharts configuration
const chartConfig = {
  width: '100%',
  height: 300,
  margin: { top: 20, right: 60, bottom: 20, left: 60 },
};

// Metric colors
const metricColors = {
  wb_sales_gross: '#3B82F6',    // Blue - Revenue
  payout_total: '#22C55E',      // Green - Profit/Payout
  margin_pct: '#F59E0B',        // Yellow - Margin
  logistics_cost: '#EF4444',    // Red - Logistics
  storage_cost: '#7C4DFF',      // Purple - Storage
};

// Line configuration
const lineConfig = {
  strokeWidth: 2,
  dot: { r: 4 },
  activeDot: { r: 6 },
  type: 'monotone' as const,
};
```

### Colors

| Metric | Color | Hex | Tailwind |
|--------|-------|-----|----------|
| Revenue (Выручка) | Blue | `#3B82F6` | `text-blue-500` |
| Profit (Прибыль) | Green | `#22C55E` | `text-green-500` |
| Margin (Маржа) | Yellow | `#F59E0B` | `text-yellow-500` |
| Logistics (Логистика) | Red | `#EF4444` | `text-red-500` |
| Storage (Хранение) | Purple | `#7C4DFF` | `text-purple-500` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Section title | 18px | 600 (semibold) |
| Period selector | 12px | 500 (medium) |
| Legend labels | 12px | 400 (regular) |
| Summary metric title | 12px | 500 (medium) |
| Summary values | 14px | 600 (semibold) |
| Axis labels | 11px | 400 (regular) |

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Section padding | 16px | `p-4` |
| Chart margin-top | 16px | `mt-4` |
| Legend gap | 16px | `gap-4` |
| Summary grid gap | 12px | `gap-3` |
| Collapse transition | 300ms | `duration-300` |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  HistoricalTrendsSection.tsx       <- Main collapsible section
  TrendsChart.tsx                   <- Recharts multi-line chart
  TrendsChartSkeleton.tsx           <- Loading skeleton
  TrendsLegend.tsx                  <- Interactive metric toggles
  TrendsSummaryGrid.tsx             <- Summary statistics cards
  TrendsSummaryCard.tsx             <- Individual summary card
  TrendsPeriodSelector.tsx          <- 4w/8w/12w toggle
```

### Props Interfaces

```typescript
// HistoricalTrendsSection
interface HistoricalTrendsSectionProps {
  currentWeek: string;
  className?: string;
}

// TrendsChart
interface TrendsChartProps {
  data: TrendDataPoint[];
  visibleMetrics: Set<MetricKey>;
  height?: number;
  className?: string;
}

// TrendDataPoint (from API)
interface TrendDataPoint {
  week: string;
  wb_sales_gross: number;
  payout_total: number;
  margin_pct?: number;
  logistics_cost: number;
  storage_cost: number;
}

// MetricKey
type MetricKey = 'wb_sales_gross' | 'payout_total' | 'margin_pct' | 'logistics_cost' | 'storage_cost';

// TrendsSummaryCard
interface TrendsSummaryCardProps {
  title: string;
  min: { value: number; week: string };
  max: { value: number; week: string };
  avg: number;
  trendPct: number;
  format: 'currency' | 'percentage';
  color: string;
}

// TrendsPeriodSelector
interface TrendsPeriodSelectorProps {
  value: 4 | 8 | 12;
  onChange: (weeks: 4 | 8 | 12) => void;
  disabled?: boolean;
}
```

### Hook Integration

```typescript
import { useTrendsData } from '@/hooks/useTrendsData';
import { getWeekRange } from '@/lib/iso-week-utils';

function HistoricalTrendsSection({ currentWeek }: HistoricalTrendsSectionProps) {
  // State management
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem('trendsExpanded');
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [weeks, setWeeks] = useState<4 | 8 | 12>(() => {
    const stored = localStorage.getItem('trendsPeriod');
    return stored ? (parseInt(stored) as 4 | 8 | 12) : 8;
  });

  const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricKey>>(
    () => new Set(['wb_sales_gross', 'payout_total'])
  );

  // Calculate week range
  const { from, to } = useMemo(() =>
    getWeekRange(currentWeek, weeks),
    [currentWeek, weeks]
  );

  // Fetch trends data
  const { data, isLoading, error, refetch } = useTrendsData({
    from,
    to,
    metrics: Array.from(visibleMetrics).join(','),
    includeSummary: true,
    enabled: isExpanded,
  });

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('trendsExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('trendsPeriod', String(weeks));
  }, [weeks]);

  const toggleMetric = (metric: MetricKey) => {
    setVisibleMetrics(prev => {
      const next = new Set(prev);
      if (next.has(metric)) {
        next.delete(metric);
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  return (
    <Card className={cn('transition-all duration-300', className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Исторические тренды</h2>
        <div className="flex items-center gap-4">
          <TrendsPeriodSelector
            value={weeks}
            onChange={setWeeks}
            disabled={!isExpanded}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      <Collapsible open={isExpanded}>
        <CollapsibleContent className="p-4">
          {isLoading ? (
            <TrendsChartSkeleton />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <>
              <TrendsChart
                data={data?.data ?? []}
                visibleMetrics={visibleMetrics}
                height={300}
              />
              <TrendsLegend
                visibleMetrics={visibleMetrics}
                onToggle={toggleMetric}
                className="mt-4"
              />
              {data?.summary && (
                <TrendsSummaryGrid
                  summary={data.summary}
                  visibleMetrics={visibleMetrics}
                  className="mt-4"
                />
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
```

### Chart Implementation (Recharts)

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

const METRIC_CONFIG: Record<MetricKey, { color: string; label: string; yAxisId: string }> = {
  wb_sales_gross: { color: '#3B82F6', label: 'Выручка', yAxisId: 'left' },
  payout_total: { color: '#22C55E', label: 'К перечислению', yAxisId: 'left' },
  margin_pct: { color: '#F59E0B', label: 'Маржа', yAxisId: 'right' },
  logistics_cost: { color: '#EF4444', label: 'Логистика', yAxisId: 'left' },
  storage_cost: { color: '#7C4DFF', label: 'Хранение', yAxisId: 'left' },
};

function TrendsChart({ data, visibleMetrics, height = 300 }: TrendsChartProps) {
  // Format week label: "2026-W05" -> "W05"
  const formatWeekLabel = (week: string) => week.split('-')[1];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
            {METRIC_CONFIG[entry.dataKey as MetricKey].label}:{' '}
            {entry.dataKey === 'margin_pct'
              ? formatPercentage(entry.value)
              : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const hasMarginMetric = visibleMetrics.has('margin_pct');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

        <XAxis
          dataKey="week"
          tickFormatter={formatWeekLabel}
          tick={{ fontSize: 11 }}
        />

        {/* Left Y-axis for currency values */}
        <YAxis
          yAxisId="left"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 11 }}
        />

        {/* Right Y-axis for percentage (margin) */}
        {hasMarginMetric && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
            domain={[0, 100]}
          />
        )}

        <Tooltip content={<CustomTooltip />} />

        {/* Render lines for visible metrics */}
        {Array.from(visibleMetrics).map(metric => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            yAxisId={METRIC_CONFIG[metric].yAxisId}
            stroke={METRIC_CONFIG[metric].color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={METRIC_CONFIG[metric].label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Trends Data Hook

```typescript
// src/hooks/useTrendsData.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { WeeklyTrendsResponse } from '@/types/api';

interface UseTrendsDataOptions {
  from: string;
  to: string;
  metrics?: string;
  includeSummary?: boolean;
  enabled?: boolean;
}

export function useTrendsData(options: UseTrendsDataOptions) {
  const { from, to, metrics, includeSummary = true, enabled = true } = options;

  return useQuery({
    queryKey: ['trends', from, to, metrics, includeSummary],
    queryFn: async () => {
      const params = new URLSearchParams({
        from,
        to,
        ...(metrics && { metrics }),
        ...(includeSummary && { include_summary: 'true' }),
      });

      const response = await apiClient.get<WeeklyTrendsResponse>(
        `/v1/analytics/weekly/trends?${params}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    enabled: enabled && !!from && !!to,
    retry: 1,
  });
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/HistoricalTrendsSection.tsx` | CREATE | Main collapsible section |
| `src/components/custom/dashboard/TrendsChart.tsx` | CREATE | Recharts multi-line chart |
| `src/components/custom/dashboard/TrendsChartSkeleton.tsx` | CREATE | Loading skeleton |
| `src/components/custom/dashboard/TrendsLegend.tsx` | CREATE | Interactive metric toggles |
| `src/components/custom/dashboard/TrendsSummaryGrid.tsx` | CREATE | Summary statistics grid |
| `src/components/custom/dashboard/TrendsSummaryCard.tsx` | CREATE | Individual summary card |
| `src/components/custom/dashboard/TrendsPeriodSelector.tsx` | CREATE | 4w/8w/12w toggle |
| `src/hooks/useTrendsData.ts` | CREATE | TanStack Query hook |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add exports |

---

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `recharts` | npm | Chart library |
| `useQuery` | `@tanstack/react-query` | Data fetching |
| `formatCurrency` | `@/lib/formatters` | Value formatting |
| `formatPercentage` | `@/lib/formatters` | Percentage formatting |
| `Card` | `@/components/ui/card` | Container |
| `Button` | `@/components/ui/button` | Buttons |
| `Collapsible` | `@/components/ui/collapsible` | Collapse animation |
| `Skeleton` | `@/components/ui/skeleton` | Loading state |
| `ChevronUp`, `ChevronDown` | `lucide-react` | Icons |

---

## Accessibility Requirements

- Section: `role="region"` with `aria-label="Исторические тренды"`
- Expand/collapse: `aria-expanded` attribute, `aria-label` for button
- Chart: `aria-label` describing data, `role="img"`
- Legend checkboxes: proper labels and keyboard navigation
- Period selector: `role="radiogroup"` with `aria-label`
- Summary cards: semantic headings and values
- Focus management on expand/collapse

---

## Testing Checklist

### Unit Tests
- [ ] HistoricalTrendsSection renders correctly
- [ ] Chart displays with mock data
- [ ] Metric toggle shows/hides lines
- [ ] Period selector changes data range
- [ ] Summary statistics calculate correctly
- [ ] Loading skeleton displays
- [ ] Error state renders with retry

### Integration Tests
- [ ] useTrendsData hook fetches correct endpoint
- [ ] Query params include selected metrics
- [ ] Preferences persist in localStorage
- [ ] Collapse state persists

### E2E Tests
- [ ] Trends section visible on dashboard
- [ ] Chart renders with real data
- [ ] Toggle metrics works visually
- [ ] Period change updates chart
- [ ] Collapse/expand animates smoothly
- [ ] Accessibility audit passes

### Visual Tests
- [ ] Chart colors match design spec
- [ ] Responsive at all breakpoints
- [ ] Tooltip displays correctly
- [ ] Summary grid aligns properly

---

## Definition of Done

- [ ] Trends section renders on dashboard
- [ ] Multi-line chart displays correctly
- [ ] Metric selection toggles work
- [ ] Period selector (4w/8w/12w) works
- [ ] Summary statistics display correctly
- [ ] Collapsible behavior works with animation
- [ ] Preferences persist in localStorage
- [ ] Responsive on all breakpoints
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] Each file under 200 lines
- [ ] No ESLint errors
- [ ] Unit tests written (>80% coverage)
- [ ] Code review approved

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Single week of data | Display single point with no trend line |
| All metrics deselected | Show empty chart with "Выберите метрики" message |
| API returns empty data | Show empty state: "Нет данных за период" |
| Very large values | Use K/M abbreviations (e.g., "1.5M") |
| Negative margin | Allow negative on Y-axis for margin_pct |
| Network error | Show error with retry button |
| Missing summary data | Calculate client-side from raw data |

---

## Performance Considerations

- Use `ResponsiveContainer` for automatic resizing
- Memoize chart components with `React.memo`
- Debounce metric toggle updates
- Lazy load Recharts bundle
- Disable chart updates when collapsed
- Consider virtualization for 12-week data

---

## References

- Epic 63-FE: Dashboard Business Logic
- Backend API: `docs/request-backend/124-DASHBOARD-MAIN-PAGE-PERIODS-API.md`
- Trends API: `GET /v1/analytics/weekly/trends`
- Existing Trends Hook: `src/hooks/useTrends.ts`
- Recharts Docs: https://recharts.org/
- Design System: `docs/front-end-spec.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

---

## Implementation

**Components**:
- `src/components/custom/dashboard/HistoricalTrendsSection.tsx` (155 lines) - Main collapsible section
- `src/components/custom/dashboard/TrendsChart.tsx` - Recharts multi-line chart
- `src/components/custom/dashboard/TrendsLegend.tsx` - Interactive metric toggles
- `src/components/custom/dashboard/TrendsSummaryGrid.tsx` - Summary statistics
- `src/components/custom/dashboard/TrendsPeriodSelector.tsx` - 4w/8w/12w toggle
- `src/hooks/useTrendsData.ts` - TanStack Query hook

**Key Features**:
- Multi-line chart with 5 selectable metrics (revenue, profit, margin, logistics, storage)
- Time period selector (4, 8, 12 weeks)
- Interactive legend to toggle metric visibility
- Summary statistics (min, max, avg, trend %)
- Collapsible section with localStorage persistence
- Dual Y-axis (currency left, percentage right for margin)
- Custom tooltip with all metric values
- Loading skeleton, error state, empty state

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useTrendsData hook. Preferences persist in localStorage.
```

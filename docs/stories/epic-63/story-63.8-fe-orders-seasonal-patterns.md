# Story 63.8-FE: Orders Seasonal Patterns Analysis

## Story Info

- **Epic**: 63 - Dashboard Enhancements (Orders Analytics)
- **Sprint**: 14
- **Priority**: P3 (Enhancement)
- **Points**: 3 SP
- **Status**: ✅ Complete
- **Completion Date**: 2026-01-31
- **Backend Dependency**: `/v1/analytics/orders/seasonal` API (Complete)

---

## User Story

**As a** FBS seller,
**I want** to see seasonal patterns in my order volume (monthly and weekday trends),
**So that** I can plan inventory, staffing, and marketing campaigns around peak periods.

**Non-goals**:
- Year-over-year comparison (future epic)
- Predictive forecasting (requires ML backend)
- Export to calendar format (future enhancement)
- Custom date range for patterns (uses backend defaults)

---

## Acceptance Criteria

### AC1: Monthly Patterns Visualization

- [ ] Display monthly order volume patterns from `patterns.monthly[]`
- [ ] Show bar or line chart with 12 months
- [ ] X-axis: Month names in Russian (Январь, Февраль, etc.)
- [ ] Y-axis: Average orders count
- [ ] Highlight peak month (from `insights.peakMonth`)
- [ ] Highlight low month (from `insights.lowMonth`)

### AC2: Weekday Patterns Visualization

- [ ] Display weekday order volume patterns from `patterns.weekday[]`
- [ ] Show bar chart with 7 days (Monday-Sunday)
- [ ] X-axis: Day names in Russian (Понедельник, Вторник, etc.)
- [ ] Y-axis: Average orders count
- [ ] Highlight peak day (from `insights.peakDay`)
- [ ] Show peak hour for each day in tooltip

### AC3: Heatmap Alternative

- [ ] Optional heatmap visualization (weekday x time of day)
- [ ] Color intensity represents order volume
- [ ] Interactive cells with hover details
- [ ] Color scale: Light (low) to Dark (high)

### AC4: Insights Summary Card

- [ ] Display key insights at top of section:
  - Peak month: name + average orders
  - Low month: name + average orders
  - Peak day: name + peak hour
- [ ] Color coding: Peak = green highlight, Low = red highlight

### AC5: Data Display Requirements

- [ ] Show average orders per month/day
- [ ] Show average revenue (if available)
- [ ] Month names localized to Russian
- [ ] Weekday names localized to Russian
- [ ] Hour format: 24-hour (14:00, 15:00, etc.)

### AC6: Loading & Error States

- [ ] Loading skeleton while fetching data
- [ ] Empty state when insufficient data: "Недостаточно данных для анализа сезонности"
- [ ] Error state with retry button
- [ ] Minimum data requirement: 30 days of order history

### AC7: Responsive Design

- [ ] Desktop: Side-by-side monthly + weekday charts
- [ ] Tablet: Stacked vertical layout
- [ ] Mobile: Simplified bar charts with scrollable view

### AC8: Accessibility

- [ ] ARIA labels for all interactive elements
- [ ] Keyboard navigation for chart elements
- [ ] Color + pattern differentiation
- [ ] Data table alternative for screen readers

---

## API Integration

### Endpoint

```http
GET /v1/analytics/orders/seasonal
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Query:
  - months: number (default: 12, max: 24)
  - view: 'monthly' | 'weekday' (optional, returns both by default)
```

### Response Field Mapping

```typescript
interface SeasonalPatternsResponse {
  patterns: {
    monthly: MonthlyPattern[];
    weekday: WeekdayPattern[];
  };
  insights: {
    peakMonth: string;    // e.g., "December"
    lowMonth: string;     // e.g., "February"
    peakDay: string;      // e.g., "Saturday"
  };
}

interface MonthlyPattern {
  month: string;           // English month name
  avgOrders: number;       // Average orders for this month
  avgRevenue: number;      // Average revenue (RUB)
}

interface WeekdayPattern {
  dayOfWeek: string;       // English day name
  avgOrders: number;       // Average orders for this day
  peakHour: number;        // Peak hour (0-23)
}
```

### Example Response

```json
{
  "patterns": {
    "monthly": [
      { "month": "January", "avgOrders": 2500, "avgRevenue": 750000.00 },
      { "month": "February", "avgOrders": 2100, "avgRevenue": 630000.00 },
      { "month": "March", "avgOrders": 2800, "avgRevenue": 840000.00 },
      { "month": "December", "avgOrders": 4500, "avgRevenue": 1350000.00 }
    ],
    "weekday": [
      { "dayOfWeek": "Monday", "avgOrders": 150, "peakHour": 14 },
      { "dayOfWeek": "Tuesday", "avgOrders": 165, "peakHour": 15 },
      { "dayOfWeek": "Saturday", "avgOrders": 280, "peakHour": 11 },
      { "dayOfWeek": "Sunday", "avgOrders": 220, "peakHour": 12 }
    ]
  },
  "insights": {
    "peakMonth": "December",
    "lowMonth": "February",
    "peakDay": "Saturday"
  }
}
```

### Caching

- TTL: 1 hour (backend caching - data changes slowly)
- Frontend staleTime: 300000 (5 minutes)
- refetchOnWindowFocus: false

---

## UI Wireframe

### Desktop Layout

```
+------------------------------------------------------------------------+
|  Сезонные паттерны заказов                                    [?] Info |
+------------------------------------------------------------------------+
|                                                                        |
|  +------------------------------------------------------------------+ |
|  |  Ключевые выводы                                                  | |
|  |  +--------------+  +--------------+  +--------------+             | |
|  |  | Пик месяц    |  | Мин месяц    |  | Пик день     |             | |
|  |  | Декабрь      |  | Февраль      |  | Суббота      |             | |
|  |  | 4,500 заказов|  | 2,100 заказов|  | Пик: 11:00   |             | |
|  |  +--------------+  +--------------+  +--------------+             | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  +------------------------------+  +------------------------------+   |
|  | Распределение по месяцам    |  | Распределение по дням        |   |
|  |                              |  |                              |   |
|  | 5k┤     ████                 |  | 300┤      ████               |   |
|  | 4k┤     ████                 |  | 250┤      ████ ████          |   |
|  | 3k┤ ████████████ ████ ████  |  | 200┤ ████ ████ ████ ████     |   |
|  | 2k┤ ████████████████████████|  | 150┤ ████████████████████     |   |
|  | 1k┤ ████████████████████████|  | 100┤ ████████████████████     |   |
|  |   └─┬──┬──┬──┬──┬──┬──┬──┬─ |  |    └─┬──┬──┬──┬──┬──┬──      |   |
|  |    Янв Фев Мар ... Ноя Дек  |  |     Пн Вт Ср Чт Пт Сб Вс     |   |
|  |    ↑Peak           ↑Low     |  |           ↑Peak              |   |
|  +------------------------------+  +------------------------------+   |
|                                                                        |
+------------------------------------------------------------------------+
```

### Heatmap View (Optional)

```
+------------------------------------------------------------------------+
|  Тепловая карта заказов                                                |
+------------------------------------------------------------------------+
|                                                                        |
|  Часы  │ Пн   Вт   Ср   Чт   Пт   Сб   Вс                             |
|  ──────┼────────────────────────────────                               |
|  09:00 │  ░░   ░░   ░░   ░░   ░░   ▓▓   ▓▓                            |
|  10:00 │  ░░   ░░   ░░   ░░   ░░   ██   ██                            |
|  11:00 │  ▒▒   ▒▒   ▒▒   ▒▒   ▒▒   ██   ██  ← Peak                    |
|  12:00 │  ▒▒   ▒▒   ▒▒   ▒▒   ▒▒   ▓▓   ▓▓                            |
|  13:00 │  ▒▒   ▒▒   ▒▒   ▒▒   ▓▓   ▒▒   ▒▒                            |
|  14:00 │  ██   ██   ▓▓   ██   ██   ▒▒   ▒▒  ← Weekday Peak            |
|  15:00 │  ▓▓   ██   ▓▓   ▓▓   ▓▓   ▒▒   ░░                            |
|  16:00 │  ▒▒   ▓▓   ▒▒   ▒▒   ▒▒   ░░   ░░                            |
|  ──────┼────────────────────────────────                               |
|                                                                        |
|  Легенда: ░░ Низкий  ▒▒ Средний  ▓▓ Высокий  ██ Пик                   |
|                                                                        |
+------------------------------------------------------------------------+
```

### Mobile Layout

```
+---------------------------+
| Сезонность заказов        |
+---------------------------+
| Ключевые выводы           |
| ● Пик: Декабрь (4,500)    |
| ● Мин: Февраль (2,100)    |
| ● День: Суббота (11:00)   |
+---------------------------+
| По месяцам           [▼]  |
| ┌─────────────────────┐   |
| │ ████████████        │   |
| │ ████                │   |
| │ ████████████████    │   |
| │ ...                 │   |
| └─────────────────────┘   |
+---------------------------+
| По дням              [▼]  |
| ┌─────────────────────┐   |
| │ ████████████████    │   |
| │ ████████████████████│   |
| │ ...                 │   |
| └─────────────────────┘   |
+---------------------------+
```

---

## Components to Create

### Main Component

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `SeasonalPatternsSection.tsx` | `src/app/(dashboard)/components/` | ~150 | Main container with insights + charts |

### Chart Components

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `MonthlyPatternsChart.tsx` | `src/app/(dashboard)/components/` | ~120 | Bar chart for monthly patterns |
| `WeekdayPatternsChart.tsx` | `src/app/(dashboard)/components/` | ~100 | Bar chart for weekday patterns |
| `SeasonalHeatmap.tsx` | `src/app/(dashboard)/components/` | ~150 | Optional heatmap visualization |

### Supporting Components

| Component | Location | Lines | Description |
|-----------|----------|-------|-------------|
| `SeasonalInsightsCard.tsx` | `src/app/(dashboard)/components/` | ~80 | Key insights summary |
| `PatternTooltip.tsx` | `src/app/(dashboard)/components/` | ~40 | Custom tooltip for charts |

---

## Technical Implementation

### Localization Configuration

```typescript
// src/lib/seasonal-localization.ts

export const MONTH_NAMES_RU: Record<string, string> = {
  January: 'Январь',
  February: 'Февраль',
  March: 'Март',
  April: 'Апрель',
  May: 'Май',
  June: 'Июнь',
  July: 'Июль',
  August: 'Август',
  September: 'Сентябрь',
  October: 'Октябрь',
  November: 'Ноябрь',
  December: 'Декабрь',
};

export const WEEKDAY_NAMES_RU: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
};

export const WEEKDAY_SHORT_RU: Record<string, string> = {
  Monday: 'Пн',
  Tuesday: 'Вт',
  Wednesday: 'Ср',
  Thursday: 'Чт',
  Friday: 'Пт',
  Saturday: 'Сб',
  Sunday: 'Вс',
};

export const MONTH_SHORT_RU: Record<string, string> = {
  January: 'Янв',
  February: 'Фев',
  March: 'Мар',
  April: 'Апр',
  May: 'Май',
  June: 'Июн',
  July: 'Июл',
  August: 'Авг',
  September: 'Сен',
  October: 'Окт',
  November: 'Ноя',
  December: 'Дек',
};

export function localizeMonth(month: string): string {
  return MONTH_NAMES_RU[month] || month;
}

export function localizeWeekday(day: string): string {
  return WEEKDAY_NAMES_RU[day] || day;
}

export function formatPeakHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}
```

### Color Configuration

```typescript
// src/lib/seasonal-colors.ts

export const SEASONAL_COLORS = {
  // Bar colors
  bar: {
    default: '#3B82F6',      // Blue
    peak: '#22C55E',         // Green (highlight)
    low: '#EF4444',          // Red (highlight)
  },
  // Heatmap gradient
  heatmap: {
    low: '#E0F2FE',          // Light blue
    medium: '#38BDF8',       // Medium blue
    high: '#0284C7',         // Dark blue
    peak: '#075985',         // Darkest blue
  },
};

export function getBarColor(
  month: string,
  peakMonth: string,
  lowMonth: string
): string {
  if (month === peakMonth) return SEASONAL_COLORS.bar.peak;
  if (month === lowMonth) return SEASONAL_COLORS.bar.low;
  return SEASONAL_COLORS.bar.default;
}

export function getHeatmapColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.9) return SEASONAL_COLORS.heatmap.peak;
  if (ratio >= 0.6) return SEASONAL_COLORS.heatmap.high;
  if (ratio >= 0.3) return SEASONAL_COLORS.heatmap.medium;
  return SEASONAL_COLORS.heatmap.low;
}
```

### Monthly Chart Implementation (Recharts)

```typescript
// src/app/(dashboard)/components/MonthlyPatternsChart.tsx

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MONTH_SHORT_RU, localizeMonth } from '@/lib/seasonal-localization';
import { getBarColor } from '@/lib/seasonal-colors';

interface MonthlyPatternsChartProps {
  data: MonthlyPattern[];
  peakMonth: string;
  lowMonth: string;
  height?: number;
}

export function MonthlyPatternsChart({
  data,
  peakMonth,
  lowMonth,
  height = 250,
}: MonthlyPatternsChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthRu: MONTH_SHORT_RU[item.month] || item.month,
    fill: getBarColor(item.month, peakMonth, lowMonth),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="monthRu"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<PatternTooltip type="monthly" />} />
        <Bar dataKey="avgOrders" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Insights Card Implementation

```typescript
// src/app/(dashboard)/components/SeasonalInsightsCard.tsx

import { TrendingUp, TrendingDown, CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { localizeMonth, localizeWeekday, formatPeakHour } from '@/lib/seasonal-localization';

interface SeasonalInsightsCardProps {
  peakMonth: string;
  lowMonth: string;
  peakDay: string;
  monthlyData: MonthlyPattern[];
  weekdayData: WeekdayPattern[];
}

export function SeasonalInsightsCard({
  peakMonth,
  lowMonth,
  peakDay,
  monthlyData,
  weekdayData,
}: SeasonalInsightsCardProps) {
  const peakMonthData = monthlyData.find((m) => m.month === peakMonth);
  const lowMonthData = monthlyData.find((m) => m.month === lowMonth);
  const peakDayData = weekdayData.find((d) => d.dayOfWeek === peakDay);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Пик месяц</span>
          </div>
          <p className="text-xl font-bold text-green-900 mt-1">
            {localizeMonth(peakMonth)}
          </p>
          <p className="text-sm text-green-600">
            {peakMonthData?.avgOrders.toLocaleString('ru-RU')} заказов
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" />
            <span className="text-sm font-medium">Мин месяц</span>
          </div>
          <p className="text-xl font-bold text-red-900 mt-1">
            {localizeMonth(lowMonth)}
          </p>
          <p className="text-sm text-red-600">
            {lowMonthData?.avgOrders.toLocaleString('ru-RU')} заказов
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <CalendarDays className="h-5 w-5" />
            <span className="text-sm font-medium">Пик день</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">
            {localizeWeekday(peakDay)}
          </p>
          <p className="text-sm text-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Пик: {formatPeakHour(peakDayData?.peakHour || 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Hook Usage

```typescript
// src/hooks/useSeasonalPatterns.ts

export function useSeasonalPatterns(months: number = 12) {
  return useQuery({
    queryKey: ordersAnalyticsQueryKeys.seasonal(months),
    queryFn: () => getSeasonalPatterns(months),
    staleTime: 300_000,      // 5 minutes
    gcTime: 3600_000,        // 1 hour
    refetchOnWindowFocus: false,
    enabled: months > 0,
  });
}
```

---

## Test Scenarios

### Unit Tests

| Test | File | Description |
|------|------|-------------|
| Month localization | `seasonal-localization.test.ts` | Verify all months translate correctly |
| Weekday localization | `seasonal-localization.test.ts` | Verify all days translate correctly |
| Peak highlighting | `MonthlyPatternsChart.test.tsx` | Verify peak/low months highlighted |
| Insights display | `SeasonalInsightsCard.test.tsx` | Verify correct data shown |
| Empty state | `SeasonalPatternsSection.test.tsx` | Show message when no data |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Data fetch | Load seasonal patterns from API |
| Charts render | Both monthly and weekday charts display |
| Responsive layout | Verify mobile/tablet/desktop views |
| Heatmap interaction | Hover shows correct data |

---

## Dependencies

### Required

- Story 63.x-FE: Types & API Client (seasonal patterns types)
- Recharts library (already in project)
- `useSeasonalPatterns` hook

### Creates

- `MONTH_NAMES_RU` - Reusable month localization
- `WEEKDAY_NAMES_RU` - Reusable weekday localization
- `MonthlyPatternsChart` - Reusable monthly chart
- `WeekdayPatternsChart` - Reusable weekday chart

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] Monthly patterns chart displays with correct localization
- [ ] Weekday patterns chart displays with peak hours
- [ ] Insights card shows peak/low month and peak day
- [ ] Peak/low values highlighted with correct colors
- [ ] Loading skeleton during data fetch
- [ ] Empty state when insufficient data
- [ ] Error state with retry button
- [ ] Heatmap optional view working (if implemented)
- [ ] Mobile responsive layout
- [ ] Accessibility: ARIA labels, keyboard nav
- [ ] Unit tests pass (>80% coverage)
- [ ] TypeScript strict mode, no `any` types
- [ ] Code review approved
- [ ] File size <200 lines per component

---

## Deferral Notes

**This story is DEFERRED to Epic 63+ because:**

1. **Data Requirements**: Seasonal analysis requires at least 30 days of order history. New sellers won't have enough data immediately.

2. **Backend Dependency**: The `/v1/analytics/orders/seasonal` endpoint aggregates data over time. Accuracy improves with more historical data.

3. **Priority**: Status breakdown (Story 63.7) provides more immediate value for day-to-day operations.

4. **Implementation Complexity**: Heatmap visualization and time-based patterns require additional design work.

**Recommended Prerequisites**:
- Complete Story 63.7 (Status Breakdown)
- Complete basic dashboard metrics
- Accumulate 30+ days of production data
- User research on seasonal feature value

---

## Open Questions

1. **Data Threshold**: What's the minimum days required before showing seasonal patterns?
2. **Heatmap Priority**: Is heatmap visualization worth the complexity for MVP?
3. **Revenue Data**: Should we show average revenue alongside order counts?
4. **Custom Ranges**: Allow users to specify analysis period (6mo, 12mo, 24mo)?

---

## References

- Backend API: `docs/request-backend/121-DASHBOARD-MAIN-PAGE-ORDERS-API.md`
- Test API: `test-api/14-orders.http` (seasonal endpoint)
- Design system: `docs/front-end-spec.md` (color scheme)
- Similar patterns: Storage trends chart (Epic 24)

---

**Created**: 2026-01-31
**Author**: Product Manager
**Last Updated**: 2026-01-31

---

## Implementation

**Component**: `src/components/custom/dashboard/OrdersSeasonalPatterns.tsx`
**Config**: `src/lib/seasonal-localization.ts`
**Lines**: 175
**Key Features**:
- Monthly patterns bar chart with localized Russian month names
- Weekday patterns bar chart with peak hour indicators
- Insights summary cards (peak month, low month, peak day)
- Color-coded peak/low highlighting (green for peak, red for low)
- Custom tooltips with detailed pattern info
- Responsive layout (side-by-side on desktop, stacked on mobile)
- Loading skeleton, error state, empty state

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with Recharts. Uses useSeasonalPatterns hook. Full Russian localization for months and weekdays.
```

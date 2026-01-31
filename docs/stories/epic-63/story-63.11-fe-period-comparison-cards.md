# Story 63.11-FE: WoW/MoM Period Comparison Cards

**Epic**: 63-FE Dashboard Business Logic
**Status**: ✅ Complete
**Priority**: P1 (High)
**Estimate**: 3 SP
**Completion Date**: 2026-01-31

---

## Title (RU)

Карточки сравнения периодов (WoW/MoM)

---

## Description

Create a comprehensive period comparison component that displays key business metrics with delta indicators comparing current period to previous period. Users can toggle between Week-over-Week (WoW) and Month-over-Month (MoM) comparisons to understand business performance trends.

The component uses the existing `/v1/analytics/weekly/comparison` endpoint and `useAnalyticsComparison` hook to fetch comparison data. It displays:
- Revenue (Выручка)
- Profit (Прибыль)
- Margin % (Маржа)
- Orders (Заказы)
- Logistics (Логистика)
- Storage (Хранение)

Each metric shows the current value, previous value, and delta indicator with visual cues (green for growth, red for decline, neutral for no change).

---

## Acceptance Criteria

### Core Functionality
- [ ] Display 6 comparison metrics in a grid layout
- [ ] Support WoW (week-over-week) comparison mode
- [ ] Support MoM (month-over-month) comparison mode using week ranges
- [ ] Toggle button to switch between WoW and MoM modes
- [ ] Persist selected mode in localStorage

### Delta Indicators
- [ ] Positive change: Green color with upward arrow
- [ ] Negative change: Red color with downward arrow
- [ ] Neutral/no change: Gray color with horizontal arrow
- [ ] Display percentage change value next to arrow
- [ ] Expense metrics (logistics, storage) use inverted logic (decrease = good)

### Data Display
- [ ] Current period value (large, prominent)
- [ ] Previous period value (smaller, secondary)
- [ ] Absolute change value
- [ ] Percentage change with arrow indicator
- [ ] Period labels (e.g., "W05" vs "W04" or "Янв" vs "Дек")

### States
- [ ] Loading skeleton while fetching data
- [ ] Error state with retry option
- [ ] Empty state when no comparison data available
- [ ] Handle null/undefined values gracefully

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard-navigable toggle
- [ ] Screen reader announces changes correctly
- [ ] Color is not sole indicator (includes arrows and text)

---

## API Integration

### Endpoint

```http
GET /v1/analytics/weekly/comparison?period1={current}&period2={previous}
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

### WoW Request Example

```http
GET /v1/analytics/weekly/comparison?period1=2026-W05&period2=2026-W04
```

### MoM Request Example (using week ranges)

```http
GET /v1/analytics/weekly/comparison?period1=2026-W01:W05&period2=2025-W49:W52
```

### Response Schema

```json
{
  "period1": {
    "week": "2026-W05",
    "revenue": 100000.00,
    "profit": 40000.00,
    "margin_pct": 40.0,
    "orders": 80,
    "cogs": 60000.00,
    "logistics": 12000.00,
    "storage": 3500.00,
    "advertising": 8000.00
  },
  "period2": {
    "week": "2026-W04",
    "revenue": 85000.00,
    "profit": 30000.00,
    "margin_pct": 35.29,
    "orders": 65,
    "cogs": 55000.00,
    "logistics": 11000.00,
    "storage": 3200.00,
    "advertising": 7500.00
  },
  "delta": {
    "revenue": { "absolute": 15000.00, "percent": 17.65 },
    "profit": { "absolute": 10000.00, "percent": 33.33 },
    "margin_pct": { "absolute": 4.71, "percent": 13.35 },
    "orders": { "absolute": 15, "percent": 23.08 },
    "cogs": { "absolute": 5000.00, "percent": 9.09 },
    "logistics": { "absolute": 1000.00, "percent": 9.09 },
    "storage": { "absolute": 300.00, "percent": 9.38 },
    "advertising": { "absolute": 500.00, "percent": 6.67 }
  }
}
```

---

## Design Specifications

### Layout

**Desktop (4 columns, >=1280px)**:
```
+-------------+-------------+-------------+-------------+
|   Выручка   |   Прибыль   |    Маржа    |   Заказы    |
+-------------+-------------+-------------+-------------+
+-------------------------+-------------------------+
|       Логистика         |        Хранение         |
+-------------------------+-------------------------+
```

**Tablet (2 columns, 768px-1279px)**:
```
+--------------------+--------------------+
|      Выручка       |      Прибыль       |
+--------------------+--------------------+
|       Маржа        |      Заказы        |
+--------------------+--------------------+
|     Логистика      |      Хранение      |
+--------------------+--------------------+
```

**Mobile (1 column, <768px)**:
```
+--------------------+
|      Выручка       |
+--------------------+
|      Прибыль       |
+--------------------+
|       Маржа        |
+--------------------+
|      Заказы        |
+--------------------+
|     Логистика      |
+--------------------+
|      Хранение      |
+--------------------+
```

### Card Anatomy

```
+--------------------------------------------------+
| [Toggle: WoW | MoM]                               |  <- Header with mode toggle
+--------------------------------------------------+

+--------------------------------------------------+
| Выручка                                  W05     |  <- Title + Period label
|                                                  |
|   150 234,00 RUB                                   |  <- Current value (large)
|                                                  |
|   [^+17,6%]  127 564,00 RUB (W04)                 |  <- Delta + Previous
+--------------------------------------------------+
```

### Colors

| Element | Condition | Color | Tailwind |
|---------|-----------|-------|----------|
| Positive delta | Revenue/profit/margin/orders up | Green | `text-green-600 bg-green-100` |
| Negative delta | Revenue/profit/margin/orders down | Red | `text-red-600 bg-red-100` |
| Neutral delta | No change (<0.1%) | Gray | `text-gray-500 bg-gray-100` |
| Expense decrease | Logistics/storage down | Green | `text-green-600` (good) |
| Expense increase | Logistics/storage up | Red | `text-red-600` (bad) |
| Current value | All | Default | `text-foreground` |
| Previous value | All | Muted | `text-muted-foreground` |
| Period label | All | Muted | `text-muted-foreground` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Card title | 14px | 500 (medium) |
| Current value | 24px | 700 (bold) |
| Delta badge | 12px | 600 (semibold) |
| Previous value | 12px | 400 (regular) |
| Period label | 12px | 400 (regular) |

### Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Grid gap | 16px | `gap-4` |
| Card padding | 16px | `p-4` |
| Value margin-top | 8px | `mt-2` |
| Delta margin-top | 4px | `mt-1` |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  PeriodComparisonSection.tsx     <- Main section with toggle
  PeriodComparisonCard.tsx        <- Individual metric card
  PeriodComparisonSkeleton.tsx    <- Loading skeleton
  ComparisonModeToggle.tsx        <- WoW/MoM toggle button
```

### Props Interface

```typescript
// PeriodComparisonSection
interface PeriodComparisonSectionProps {
  currentWeek: string;  // ISO week: "2026-W05"
  className?: string;
}

// PeriodComparisonCard
interface PeriodComparisonCardProps {
  title: string;
  currentValue: number | null;
  previousValue: number | null;
  delta: {
    absolute: number;
    percent: number;
  } | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  format: 'currency' | 'percentage' | 'number';
  invertDirection?: boolean;  // For expense metrics
  isLoading?: boolean;
  className?: string;
}

// ComparisonModeToggle
interface ComparisonModeToggleProps {
  mode: 'wow' | 'mom';
  onChange: (mode: 'wow' | 'mom') => void;
  disabled?: boolean;
}
```

### Hook Integration

```typescript
import { useAnalyticsComparison, useDashboardComparison } from '@/hooks/comparison';
import { getComparisonPeriods } from '@/lib/comparison-helpers';

function PeriodComparisonSection({ currentWeek }: PeriodComparisonSectionProps) {
  const [mode, setMode] = useState<'wow' | 'mom'>(() => {
    return (localStorage.getItem('comparisonMode') as 'wow' | 'mom') || 'wow';
  });

  // Calculate periods based on mode
  const { period1, period2 } = useMemo(() => {
    return getComparisonPeriods(currentWeek, mode);
  }, [currentWeek, mode]);

  // Fetch comparison data
  const { data, isLoading, error } = useAnalyticsComparison({
    period1,
    period2,
    enabled: !!currentWeek,
  });

  // Persist mode preference
  useEffect(() => {
    localStorage.setItem('comparisonMode', mode);
  }, [mode]);

  if (isLoading) return <PeriodComparisonSkeleton />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <section aria-label="Сравнение периодов">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Сравнение периодов</h2>
        <ComparisonModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PeriodComparisonCard
          title="Выручка"
          currentValue={data?.period1.revenue}
          previousValue={data?.period2.revenue}
          delta={data?.delta.revenue}
          currentPeriodLabel={formatPeriodLabel(period1)}
          previousPeriodLabel={formatPeriodLabel(period2)}
          format="currency"
        />
        {/* ... other cards */}
      </div>
    </section>
  );
}
```

### Period Calculation Helper

```typescript
// src/lib/comparison-helpers.ts

import { getPreviousIsoWeek, getWeeksForMonth } from '@/lib/iso-week-utils';

interface ComparisonPeriods {
  period1: string;
  period2: string;
}

/**
 * Calculate comparison periods based on mode
 */
export function getComparisonPeriods(
  currentWeek: string,
  mode: 'wow' | 'mom'
): ComparisonPeriods {
  if (mode === 'wow') {
    return {
      period1: currentWeek,
      period2: getPreviousIsoWeek(currentWeek),
    };
  }

  // MoM: Current month weeks vs previous month weeks
  const { currentMonth, previousMonth } = getMonthWeekRanges(currentWeek);
  return {
    period1: currentMonth,  // e.g., "2026-W01:W05"
    period2: previousMonth, // e.g., "2025-W49:W52"
  };
}

/**
 * Format period label for display
 */
export function formatPeriodLabel(period: string, locale = 'ru'): string {
  if (period.includes(':')) {
    // Range format: "2026-W01:W05" -> "Янв 2026"
    const [startWeek] = period.split(':');
    return formatMonthFromWeek(startWeek, locale);
  }
  // Single week: "2026-W05" -> "W05"
  return period.split('-')[1]; // "W05"
}
```

### Delta Display Logic

```typescript
interface DeltaDisplayProps {
  delta: { absolute: number; percent: number } | null;
  invertDirection?: boolean;
}

function DeltaIndicator({ delta, invertDirection = false }: DeltaDisplayProps) {
  if (!delta) return null;

  const isPositive = invertDirection
    ? delta.percent < 0  // For expenses: decrease is positive
    : delta.percent > 0; // For revenue: increase is positive

  const isNeutral = Math.abs(delta.percent) < 0.1;

  const colorClass = isNeutral
    ? 'text-gray-500 bg-gray-100'
    : isPositive
      ? 'text-green-600 bg-green-100'
      : 'text-red-600 bg-red-100';

  const arrow = isNeutral ? '→' : isPositive ? '↑' : '↓';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', colorClass)}>
      {arrow} {Math.abs(delta.percent).toFixed(1)}%
    </span>
  );
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/PeriodComparisonSection.tsx` | CREATE | Main section component |
| `src/components/custom/dashboard/PeriodComparisonCard.tsx` | CREATE | Individual metric card |
| `src/components/custom/dashboard/PeriodComparisonSkeleton.tsx` | CREATE | Loading skeleton |
| `src/components/custom/dashboard/ComparisonModeToggle.tsx` | CREATE | WoW/MoM toggle |
| `src/lib/comparison-helpers.ts` | CREATE | Period calculation utilities |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add exports |

---

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `useAnalyticsComparison` | `@/hooks/comparison` | Fetch comparison data |
| `formatCurrency` | `@/lib/formatters` | Currency formatting |
| `formatPercentage` | `@/lib/formatters` | Percentage formatting |
| `getPreviousIsoWeek` | `@/lib/iso-week-utils` | Week calculation |
| `Button` | `@/components/ui/button` | Toggle component |
| `Card` | `@/components/ui/card` | Card container |
| `Skeleton` | `@/components/ui/skeleton` | Loading state |

---

## Accessibility Requirements

- Section: `role="region"` with `aria-label="Сравнение периодов"`
- Toggle: `role="tablist"` with `aria-label="Режим сравнения"`
- Each mode button: `role="tab"` with `aria-selected`
- Cards: `role="article"` with descriptive `aria-label`
- Color changes accompanied by text/icons
- Focus visible on all interactive elements

---

## Testing Checklist

### Unit Tests
- [ ] PeriodComparisonCard renders with all props
- [ ] Delta indicator shows correct direction and color
- [ ] Inverted direction works for expense metrics
- [ ] Currency/percentage/number formatting correct
- [ ] Loading skeleton displays correctly
- [ ] Error state renders with retry button

### Integration Tests
- [ ] useAnalyticsComparison hook called with correct params
- [ ] WoW mode uses single weeks
- [ ] MoM mode uses week ranges
- [ ] Mode persists in localStorage
- [ ] Toggle switches modes correctly

### E2E Tests
- [ ] Comparison cards visible on dashboard
- [ ] Toggle between WoW and MoM works
- [ ] Data updates when period changes
- [ ] Accessibility audit passes

---

## Definition of Done

- [ ] All 6 comparison cards render correctly
- [ ] WoW/MoM toggle works with persistence
- [ ] Delta indicators show correct colors/arrows
- [ ] Expense metrics use inverted logic
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
| No previous period data | Show current value only, hide comparison |
| Zero previous value | Show absolute change, skip percentage |
| Very large changes (>1000%) | Cap display at "999+%" |
| Null current value | Show "—" placeholder |
| First week of data | Disable comparison, show info message |

---

## References

- Epic 63-FE: Dashboard Business Logic
- Backend API: `docs/request-backend/124-DASHBOARD-MAIN-PAGE-PERIODS-API.md`
- Comparison API: `GET /v1/analytics/weekly/comparison`
- Existing Hook: `src/hooks/comparison/hooks.ts`
- Types: `src/types/analytics-comparison.ts`
- Design System: `docs/front-end-spec.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)

---

## Implementation

**Components**:
- `src/components/custom/dashboard/PeriodComparisonSection.tsx` (170 lines) - Main section with toggle
- `src/components/custom/dashboard/PeriodComparisonCard.tsx` - Individual metric card
- `src/components/custom/dashboard/ComparisonModeToggle.tsx` - WoW/MoM toggle
- `src/lib/period-comparison-helpers.ts` - Period calculation utilities

**Key Features**:
- 6 comparison cards (Revenue, Profit, Margin, Orders, Logistics, Storage)
- WoW/MoM toggle with localStorage persistence
- Delta indicators with color-coded arrows (green=growth, red=decline)
- Inverted logic for expense metrics (decrease=green)
- Current and previous period labels
- Responsive grid (4 cols xl, 2 cols md, 1 col sm)
- Loading skeleton, error state, empty state
- WCAG 2.1 AA accessibility

---

## Dev Agent Record

```
Status: Complete
Agent: Claude Code
Started: 2026-01-31
Completed: 2026-01-31
Notes: Implemented with all acceptance criteria met. Uses useAnalyticsComparison hook. Mode persists in localStorage.
```

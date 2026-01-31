# Dashboard Comparison Section Wireframe

**Date**: 2026-01-31
**Epic**: 63-FE Dashboard Business Logic
**Stories**: 63.11 (Period Comparison Cards), 63.12 (Historical Trends)
**Author**: UX Designer (Claude)

---

## 1. Overview

This wireframe specifies the Period Comparison Cards and Historical Trends sections for the main Dashboard. These components enable users to understand business performance trends through WoW/MoM comparisons and multi-week trend visualization.

### Business Context

**Target Audience**: Business owners and financial directors who need quick insight into performance changes and trend patterns.

**Primary Goals**:
- Quickly identify if metrics are improving or declining
- Compare current period against previous period (WoW/MoM)
- Visualize historical trends over 4-12 weeks
- Understand expense vs revenue dynamics

---

## 2. Section Layout (Full Dashboard Context)

```
+------------------------------------------------------------------+
| Dashboard                                     [Week Selector: W05] |
+------------------------------------------------------------------+
|                                                                    |
|  +--- KPI Cards (Existing - Story 63.3-63.5) -------------------+ |
|  | [Zakazы] [COGS] [Выкупы] [COGS выкупов]                       | |
|  | [Реклама] [Логистика] [Хранение] [Теор. прибыль]             | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--- Period Comparison (Story 63.11) --------------------------+ |
|  | Сравнение периодов                           [WoW | MoM]     | |
|  | +----------+ +----------+ +----------+ +----------+          | |
|  | | Выручка  | | Прибыль  | |  Маржа   | | Заказы   |          | |
|  | +----------+ +----------+ +----------+ +----------+          | |
|  | +---------------------+ +---------------------+              | |
|  | |     Логистика       | |      Хранение       |              | |
|  | +---------------------+ +---------------------+              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--- Historical Trends (Story 63.12) --------------------------+ |
|  | Исторические тренды                    [4w|8w|12w]  [-]      | |
|  | [Multi-line Chart Area]                                      | |
|  | Legend: [x] Выручка [x] Прибыль [ ] Маржа [ ] Логистика      | |
|  | Summary Grid: [min/max/avg/trend for each metric]            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 3. Period Comparison Cards (Story 63.11)

### 3.1 Section Header with Toggle

```
+------------------------------------------------------------------+
|  Сравнение периодов                                               |
|                                                                    |
|  Выберите режим сравнения:                                        |
|  +------------------+------------------+                          |
|  |      WoW         |       MoM        |  <- Toggle button group  |
|  | (неделя/неделя)  |  (месяц/месяц)   |                          |
|  +------------------+------------------+                          |
|         ↑ active           ↑ inactive                             |
+------------------------------------------------------------------+

Toggle States:
- Active: bg-primary (#E53935), text-white
- Inactive: bg-white, border-gray-200, text-gray-600
- Hover (inactive): bg-gray-50
```

### 3.2 Desktop Grid Layout (>=1280px) - 4+2 Columns

```
+------------------------------------------------------------------+
| Сравнение периодов                              [WoW | MoM]       |
+------------------------------------------------------------------+
|                                                                    |
| +-------------+ +-------------+ +-------------+ +-------------+   |
| |   Выручка   | |   Прибыль   | |    Маржа    | |   Заказы    |   |
| |             | |             | |             | |             |   |
| | 150 234 RUB | |  40 123 RUB | |    26,7%    | |     80      |   |
| |             | |             | |             | |             |   |
| | [^+17,6%]   | | [^+33,3%]   | | [^+4,7 п.п.]| | [^+23,1%]   |   |
| | vs 127 564  | | vs 30 092   | | vs 22,0%    | | vs 65       |   |
| |    (W04)    | |    (W04)    | |    (W04)    | |    (W04)    |   |
| +-------------+ +-------------+ +-------------+ +-------------+   |
|                                                                    |
| +---------------------------+ +---------------------------+       |
| |        Логистика          | |         Хранение          |       |
| |                           | |                           |       |
| |       12 000 RUB          | |        3 500 RUB          |       |
| |                           | |                           |       |
| |  [v+9,1%]  vs 11 000      | |  [v+9,4%]  vs 3 200       |       |
| |  (W04) - рост расходов    | |  (W04) - рост расходов    |       |
| +---------------------------+ +---------------------------+       |
|                                                                    |
+------------------------------------------------------------------+

Note: Logistics and Storage use INVERTED logic:
- Increase (^) = RED (bad - expenses grew)
- Decrease (v) = GREEN (good - expenses reduced)
```

### 3.3 Tablet Layout (768px-1279px) - 2 Columns

```
+------------------------------------------+
| Сравнение периодов          [WoW | MoM]  |
+------------------------------------------+
| +------------------+ +------------------+ |
| |    Выручка       | |    Прибыль       | |
| |   150 234 RUB    | |    40 123 RUB    | |
| |   [^+17,6%]      | |    [^+33,3%]     | |
| +------------------+ +------------------+ |
| +------------------+ +------------------+ |
| |     Маржа        | |     Заказы       | |
| |     26,7%        | |       80         | |
| |   [^+4,7 п.п.]   | |    [^+23,1%]     | |
| +------------------+ +------------------+ |
| +------------------+ +------------------+ |
| |   Логистика      | |    Хранение      | |
| |   12 000 RUB     | |    3 500 RUB     | |
| |   [v+9,1%]       | |    [v+9,4%]      | |
| +------------------+ +------------------+ |
+------------------------------------------+
```

### 3.4 Mobile Layout (<768px) - 1 Column

```
+--------------------------------+
| Сравнение периодов             |
| [WoW | MoM]                    |
+--------------------------------+
| +----------------------------+ |
| | Выручка              W05   | |
| | 150 234 RUB                | |
| | [^+17,6%] vs 127 564 (W04) | |
| +----------------------------+ |
| +----------------------------+ |
| | Прибыль              W05   | |
| | 40 123 RUB                 | |
| | [^+33,3%] vs 30 092 (W04)  | |
| +----------------------------+ |
| ... (repeat for all 6 cards)   |
+--------------------------------+
```

### 3.5 Individual Comparison Card Anatomy

```
+--------------------------------------------------+
|  Выручка                                    W05  |  <- Title + Period label
|                                                  |
|     150 234,00 RUB                               |  <- Current value (24px, bold)
|                                                  |
|  +----------+                                    |
|  | ^ +17,6% |  vs 127 564,00 RUB (W04)          |  <- Delta badge + Previous
|  +----------+                                    |
|   ↑ badge      ↑ previous value (muted)          |
+--------------------------------------------------+

Card Dimensions:
- Min width: 180px
- Max width: 280px (desktop card)
- Min height: 100px
- Padding: 16px (p-4)
```

### 3.6 Delta Badge Design

```
POSITIVE CHANGE (Revenue, Profit, Margin, Orders):
+------------+
| ^ +17,6%   |  bg-green-100 (#DCFCE7)
+------------+  text-green-700 (#166534)
                Arrow: ↑ (upward)

NEGATIVE CHANGE (Revenue, Profit, Margin, Orders):
+------------+
| v -8,3%    |  bg-red-100 (#FEE2E2)
+------------+  text-red-700 (#991B1B)
                Arrow: ↓ (downward)

NEUTRAL CHANGE (<0.1%):
+------------+
| → 0,0%     |  bg-gray-100 (#F3F4F6)
+------------+  text-gray-600 (#4B5563)
                Arrow: → (horizontal)

EXPENSE METRICS (Logistics, Storage) - INVERTED:
Increase = BAD (red badge):
+------------+
| ^ +9,1%    |  bg-red-100, text-red-700
+------------+  (expenses grew = negative)

Decrease = GOOD (green badge):
+------------+
| v -5,2%    |  bg-green-100, text-green-700
+------------+  (expenses reduced = positive)
```

### 3.7 Inverted Logic Visual Indicator

For expense metrics, add a subtle indicator that increase is bad:

```
+---------------------------+
|  Логистика           W05  |
|                           |
|     12 000 RUB            |
|                           |
|  [^ +9,1%]  (расходы)     |  <- "расходы" hint in muted text
|  vs 11 000 (W04)          |
+---------------------------+

Alternative: Icon indicator
+---------------------------+
|  Логистика  [!]      W05  |  <- Warning icon for expense
|                           |
|  ... (same content)       |
+---------------------------+
```

---

## 4. Historical Trends Section (Story 63.12)

### 4.1 Section Header with Controls

```
+------------------------------------------------------------------+
|  Исторические тренды                                              |
|                                                                    |
|  +---------+---------+---------+                          +-----+ |
|  |   4w    |   8w    |   12w   |  <- Period selector      |  -  | |
|  +---------+---------+---------+                          +-----+ |
|      ↑ inactive  ↑ active  ↑ inactive                   collapse  |
+------------------------------------------------------------------+

Period Selector States:
- Active: bg-primary (#E53935), text-white, rounded
- Inactive: bg-white, text-gray-600
- Hover: bg-gray-50
```

### 4.2 Expanded State (Default)

```
+------------------------------------------------------------------+
| Исторические тренды                          [4w|8w|12w]     [-] |
+------------------------------------------------------------------+
|                                                                    |
|  ₽ (тыс.)                                                    %   |
|  250 +                                           ════════   100  |
|      |                                      ═══/                 |
|  200 +                              ═══════                  80  |
|      |        ●───────●────●                                     |
|  150 +    ●──/                 ●───●──●                      60  |
|      |   /                                                       |
|  100 +  ●                                   ○───○───○───○    40  |
|      |                                                           |
|   50 +  ◊───◊───◊───◊───◊───◊───◊───◊                       20  |
|      |                                                           |
|    0 +--+---+---+---+---+---+---+---+                         0  |
|        W50 W51 W52 W01 W02 W03 W04 W05                           |
|                                                                    |
|  Legend:                                                          |
|  [x] ●─── Выручка (blue)      [x] ●─── К перечислению (green)    |
|  [ ] ═══ Маржа (yellow,%)     [ ] ○─── Логистика (red)           |
|  [ ] ◊─── Хранение (purple)                                      |
|                                                                    |
+------------------------------------------------------------------+
|  Summary Statistics:                                              |
|  +------------+ +------------+ +------------+ +------------+      |
|  |  Выручка   | |К перечисл. | | Логистика  | | Хранение   |      |
|  | min: 165K  | | min: 118K  | | min: 32K   | | min: 5.2K  |      |
|  |    (W52)   | |    (W52)   | |    (W50)   | |    (W50)   |      |
|  | max: 210K  | | max: 145K  | | max: 38K   | | max: 6.5K  |      |
|  |    (W04)   | |    (W03)   | |    (W05)   | |    (W04)   |      |
|  | avg: 188K  | | avg: 131K  | | avg: 35K   | | avg: 5.8K  |      |
|  | [^+16,7%]  | | [^+12,5%]  | | [^+8,5%]   | | [^+12,3%]  |      |
|  +------------+ +------------+ +------------+ +------------+      |
+------------------------------------------------------------------+
```

### 4.3 Collapsed State

```
+------------------------------------------------------------------+
| Исторические тренды                          [4w|8w|12w]     [+] |
+------------------------------------------------------------------+

Note: Period selector remains visible but disabled when collapsed.
Collapse state persists in localStorage.
```

### 4.4 Chart Configuration

```
Chart Area:
- Height: 300px (fixed)
- Width: 100% (responsive)
- Margins: top=20, right=60, bottom=20, left=60

Axes:
- Left Y-axis: Currency values (K format: "150K")
- Right Y-axis: Percentage (for margin_pct only)
- X-axis: Week labels (W50, W51, etc.)

Grid:
- Dashed lines (strokeDasharray="3 3")
- Opacity: 0.3
- Horizontal lines at Y intervals

Lines:
- strokeWidth: 2
- dot radius: 4 (normal), 6 (active/hover)
- type: monotone (smooth curves)
```

### 4.5 Metric Colors

| Metric | Color | Hex | Line Style |
|--------|-------|-----|------------|
| Выручка (Revenue) | Blue | #3B82F6 | Solid, dots |
| К перечислению (Payout) | Green | #22C55E | Solid, dots |
| Маржа (Margin %) | Yellow | #F59E0B | Double line |
| Логистика (Logistics) | Red | #EF4444 | Solid, circles |
| Хранение (Storage) | Purple | #7C4DFF | Solid, diamonds |

### 4.6 Interactive Legend

```
Legend Layout (horizontal, wraps on mobile):

+------------------------------------------------------------------+
|  [x] ●─── Выручка    [x] ●─── К перечислению    [ ] ═══ Маржа    |
|  [ ] ○─── Логистика  [ ] ◊─── Хранение                           |
+------------------------------------------------------------------+

Checkbox States:
- Checked: bg-[metric-color], white checkmark
- Unchecked: bg-white, border-gray-300
- Hover: border-[metric-color]

Clicking toggles line visibility on chart.
Default: Выручка and К перечислению selected.
```

### 4.7 Tooltip Design

```
Tooltip (appears on line/dot hover):

+---------------------------+
|  W04 (20-26 янв 2026)    |  <- Week label with date range
|                           |
|  ● Выручка: 195 000 ₽    |  <- Blue dot + value
|  ● К перечисл.: 132 000 ₽|  <- Green dot + value
|                           |
+---------------------------+

Tooltip Styles:
- Background: white
- Border: 1px solid #E5E7EB
- Shadow: shadow-lg
- Border-radius: 8px (rounded-lg)
- Padding: 12px
```

### 4.8 Summary Statistics Card

```
+------------------------------------+
|  Выручка                           |  <- Title (metric color)
|                                    |
|  min: 165 000 ₽                    |  <- Minimum value
|       (W52)                        |  <- Week of minimum
|                                    |
|  max: 210 000 ₽                    |  <- Maximum value
|       (W04)                        |  <- Week of maximum
|                                    |
|  avg: 187 500 ₽                    |  <- Average value
|                                    |
|  +------------+                    |
|  | ^ +16,7%   |                    |  <- Trend badge (first vs last)
|  +------------+                    |
+------------------------------------+

Card Styles:
- Border-left: 3px solid [metric-color]
- Background: white
- Padding: 12px
```

---

## 5. Responsive Breakpoints

### 5.1 Comparison Cards Grid

| Breakpoint | Columns | Card Width |
|------------|---------|------------|
| <768px | 1 | 100% |
| 768-1279px | 2 | ~50% |
| >=1280px | 4 (top) + 2 (bottom) | ~25% / ~50% |

### 5.2 Trends Section

| Breakpoint | Chart Height | Legend | Summary Grid |
|------------|--------------|--------|--------------|
| <768px | 250px | Vertical stack | 1 column |
| 768-1023px | 280px | 2 rows | 2 columns |
| >=1024px | 300px | 1 row | 4 columns |

### 5.3 Tailwind Grid Classes

```css
/* Comparison Cards */
.comparison-grid {
  @apply grid gap-4;
  @apply grid-cols-1;           /* Mobile */
  @apply md:grid-cols-2;        /* Tablet */
  @apply xl:grid-cols-4;        /* Desktop - top row */
}

.comparison-grid-expenses {
  @apply grid gap-4;
  @apply grid-cols-1;           /* Mobile */
  @apply md:grid-cols-2;        /* Tablet & Desktop */
}

/* Summary Statistics */
.summary-grid {
  @apply grid gap-3;
  @apply grid-cols-1;           /* Mobile */
  @apply md:grid-cols-2;        /* Tablet */
  @apply lg:grid-cols-4;        /* Desktop */
}
```

---

## 6. States

### 6.1 Loading State (Skeleton)

```
Comparison Cards Loading:
+--------------------------------------------------+
| Сравнение периодов                  [WoW | MoM]  |
+--------------------------------------------------+
| +-------------+ +-------------+ +-------------+   |
| | ░░░░░░░░░░░ | | ░░░░░░░░░░░ | | ░░░░░░░░░░░ |   |
| | ░░░░░░░░░░░ | | ░░░░░░░░░░░ | | ░░░░░░░░░░░ |   |
| | ░░░░░░░     | | ░░░░░░░     | | ░░░░░░░     |   |
| +-------------+ +-------------+ +-------------+   |
+--------------------------------------------------+

Trends Chart Loading:
+--------------------------------------------------+
|  Исторические тренды            [4w|8w|12w]  [-] |
+--------------------------------------------------+
|                                                   |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
|  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
|                                                   |
+--------------------------------------------------+
```

### 6.2 Error State

```
+--------------------------------------------------+
|  Сравнение периодов                 [WoW | MoM]  |
+--------------------------------------------------+
|                                                   |
|     [!] Ошибка загрузки данных                   |
|                                                   |
|     Не удалось получить данные сравнения.        |
|     Проверьте соединение и попробуйте снова.     |
|                                                   |
|              [ Повторить ]                        |
|                                                   |
+--------------------------------------------------+
```

### 6.3 Empty State

```
+--------------------------------------------------+
|  Сравнение периодов                 [WoW | MoM]  |
+--------------------------------------------------+
|                                                   |
|     [i] Недостаточно данных для сравнения        |
|                                                   |
|     Для сравнения периодов необходимы данные     |
|     минимум за 2 недели.                         |
|                                                   |
+--------------------------------------------------+
```

---

## 7. Accessibility (WCAG 2.1 AA)

### 7.1 Color Independence

Delta indicators use BOTH color AND symbols:
- Arrow direction (^/v/→) + percentage text
- Badge background provides additional visual cue
- Never rely on color alone

### 7.2 ARIA Attributes

```html
<!-- Comparison Section -->
<section role="region" aria-label="Сравнение периодов">

<!-- Mode Toggle -->
<div role="tablist" aria-label="Режим сравнения">
  <button role="tab" aria-selected="true">WoW</button>
  <button role="tab" aria-selected="false">MoM</button>
</div>

<!-- Comparison Card -->
<article
  role="article"
  aria-label="Выручка: 150 234 рубля, рост 17,6 процентов по сравнению с прошлой неделей"
>

<!-- Trends Section -->
<section role="region" aria-label="Исторические тренды">

<!-- Expand/Collapse -->
<button
  aria-expanded="true"
  aria-controls="trends-content"
  aria-label="Свернуть секцию исторических трендов"
>

<!-- Chart -->
<div
  role="img"
  aria-label="График трендов за 8 недель: выручка от 165 до 210 тысяч рублей"
>

<!-- Legend Checkbox -->
<input
  type="checkbox"
  id="metric-revenue"
  aria-describedby="legend-revenue"
/>
<label id="legend-revenue">Выручка</label>
```

### 7.3 Keyboard Navigation

| Element | Key | Action |
|---------|-----|--------|
| Mode Toggle | Tab | Focus toggle group |
| Mode Toggle | Arrow L/R | Switch between WoW/MoM |
| Period Selector | Tab | Focus period buttons |
| Period Selector | Arrow L/R | Change period (4w/8w/12w) |
| Collapse Button | Enter/Space | Toggle expand/collapse |
| Legend Checkbox | Enter/Space | Toggle metric visibility |

### 7.4 Focus Indicators

```css
/* Visible focus ring */
.focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}
```

---

## 8. UX Recommendations

### 8.1 Information Hierarchy

**Priority Order (top to bottom)**:
1. KPI Cards (existing) - Primary metrics
2. Period Comparison - Trend direction at a glance
3. Historical Trends - Deep dive into patterns

### 8.2 Scanability Improvements

- Use consistent delta badge positioning (bottom-left of value)
- Arrow direction immediately communicates trend
- Color reinforces meaning but is not sole indicator
- Week labels in cards reduce need to check header

### 8.3 Cognitive Load Reduction

- Default to 2 metrics visible in trends chart (not all 5)
- Collapsible trends section for users who want summary only
- Persist user preferences (mode, period, collapsed state)
- Summary statistics below chart for quick reference

### 8.4 Expense Metrics Clarity

For Logistics and Storage (inverted logic):
- Consider adding "(расходы)" label
- Use warning icon to indicate expense category
- Tooltip explains: "Для расходов: снижение = позитивно"

### 8.5 Mobile Considerations

- Stack all cards vertically on mobile
- Chart scrolls horizontally if needed (or reduce data points)
- Legend becomes vertical list
- Collapse section header sticky for context

---

## 9. Component Props Reference

### 9.1 PeriodComparisonCard

```typescript
interface PeriodComparisonCardProps {
  title: string;
  currentValue: number | null;
  previousValue: number | null;
  delta: { absolute: number; percent: number } | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  format: 'currency' | 'percentage' | 'number';
  invertDirection?: boolean;  // For expense metrics
  isLoading?: boolean;
  className?: string;
}
```

### 9.2 ComparisonModeToggle

```typescript
interface ComparisonModeToggleProps {
  mode: 'wow' | 'mom';
  onChange: (mode: 'wow' | 'mom') => void;
  disabled?: boolean;
}
```

### 9.3 HistoricalTrendsSection

```typescript
interface HistoricalTrendsSectionProps {
  currentWeek: string;
  className?: string;
}
```

### 9.4 TrendsPeriodSelector

```typescript
interface TrendsPeriodSelectorProps {
  value: 4 | 8 | 12;
  onChange: (weeks: 4 | 8 | 12) => void;
  disabled?: boolean;
}
```

---

## 10. Design Validation Summary

### Story 63.11 - Period Comparison Cards

| Requirement | Status | Notes |
|-------------|--------|-------|
| 6-card grid layout | VALID | 4+2 layout on desktop matches spec |
| WoW/MoM toggle | VALID | Toggle button group design specified |
| Delta arrows (^/v/→) | VALID | Arrow + color + percentage |
| Green/Red/Gray badges | VALID | Consistent with design system |
| Card anatomy | VALID | Title, value, delta, previous |
| Inverted expense logic | VALID | Added visual indicator recommendation |
| Responsive breakpoints | VALID | 4/2/1 column layouts |

### Story 63.12 - Historical Trends Section

| Requirement | Status | Notes |
|-------------|--------|-------|
| Multi-line chart | VALID | Recharts with 5 metrics |
| Metric selector | VALID | Interactive legend with checkboxes |
| Period presets (4w/8w/12w) | VALID | Toggle button group |
| Dual Y-axis | VALID | Currency left, % right for margin |
| Legend design | VALID | Horizontal with color-coded dots |
| Tooltip design | VALID | Week label + all visible metric values |
| Summary statistics | VALID | 4-card grid with min/max/avg/trend |
| Collapsible section | VALID | Persists state in localStorage |
| Empty/loading states | VALID | Skeleton and error states defined |

---

## 11. References

- [Story 63.11-FE](../stories/epic-63/story-63.11-fe-period-comparison-cards.md)
- [Story 63.12-FE](../stories/epic-63/story-63.12-fe-historical-trends-section.md)
- [Design System](../front-end-spec.md)
- [KPI Cards Wireframe](./dashboard-kpi-cards.md)
- [comparison-helpers.ts](../../src/lib/comparison-helpers.ts)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31

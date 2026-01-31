# Dashboard Daily Breakdown Charts - UX Specification

**Version:** 1.0
**Date:** 2026-01-31
**Designer:** UX Agent (Sally)
**Status:** Draft

---

## Overview

This document specifies the Daily Breakdown charts for the main Dashboard page. Users need to see financial metrics broken down **by day** within the selected period (week or month).

### Metrics to Display (8 total)

| # | Metric (RU) | Metric (EN) | Color | Hex |
|---|-------------|-------------|-------|-----|
| 1 | Заказы | Orders | Blue | `#3B82F6` |
| 2 | COGS по заказам | Orders COGS | Orange | `#F97316` |
| 3 | Выкупы | Buyouts | Green | `#22C55E` |
| 4 | COGS по выкупам | Buyouts COGS | Orange Light | `#FB923C` |
| 5 | Реклама | Advertising | Purple | `#7C3AED` |
| 6 | Логистика | Logistics | Cyan | `#06B6D4` |
| 7 | Хранение | Storage | Pink | `#EC4899` |
| 8 | Теор. прибыль | Theoretical Profit | Primary Red | `#E53935` |

### Formula

```
Теор. прибыль[день] = Заказы[день] - COGS[день] - Реклама[день] - Логистика[день] - Хранение[день]
```

---

## Variant Analysis

### Variant A: Single Multi-Line Chart

```
Pros:
+ See correlations between all metrics
+ Single component, simpler implementation
+ Easy comparison across days

Cons:
- Visual overload with 8 lines
- Different scales (orders vs expenses)
- Legend takes significant space
```

### Variant B: Two Charts (Revenue vs Costs)

```
Pros:
+ Logical grouping
+ Better scale management
+ Cleaner visual separation

Cons:
- Requires more vertical space
- Harder to see profit formula
```

### Variant C: Tabs for Metric Groups

```
Pros:
+ Clean, focused view
+ Best for mobile
+ Reduces cognitive load

Cons:
- Cannot compare across groups
- More clicks required
```

### Variant D: KPI Sparklines + Main Chart (RECOMMENDED)

```
Pros:
+ Quick overview via sparklines
+ Detailed view in main chart
+ Flexible metric selection
+ Best mobile experience
+ Follows dashboard patterns

Cons:
- More complex implementation
- Requires metric selector
```

---

## Recommended Solution: Variant D

### Rationale

1. **Progressive Disclosure**: Sparklines show trends at a glance
2. **User Control**: Main chart shows selected metrics
3. **Mobile-First**: Works well on all screen sizes
4. **Existing Patterns**: Matches TrendGraph and ExpenseChart components

---

## ASCII Wireframe

### Desktop Layout (>= 1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Детализация по дням                                         [Неделя ▼]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Заказы      │ │ Выкупы      │ │ Реклама     │ │ Теор.прибыль│           │
│  │ 1.2M ₽     │ │ 980K ₽     │ │ 45K ₽      │ │ 234K ₽     │           │
│  │ ~~~∿~~~    │ │ ~~~∿~~~    │ │ ~~~∿~~~    │ │ ~~~∿~~~    │           │
│  │ [■] active  │ │ [■] active  │ │ [ ] off     │ │ [■] active  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ COGS заказы │ │ COGS выкупы │ │ Логистика   │ │ Хранение    │           │
│  │ 720K ₽     │ │ 588K ₽     │ │ 89K ₽      │ │ 32K ₽      │           │
│  │ ~~~∿~~~    │ │ ~~~∿~~~    │ │ ~~~∿~~~    │ │ ~~~∿~~~    │           │
│  │ [ ] off     │ │ [ ] off     │ │ [ ] off     │ │ [ ] off     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│     ₽                                                                       │
│  300K ┼                                                                     │
│       │                    ●───●                                            │
│  250K ┼            ●───●──●     ╲                                           │
│       │      ●────●              ╲●                                         │
│  200K ┼   ●─●                                                               │
│       │ ●                                         ▲ Заказы                  │
│  150K ┼─────────────────────────────────────────  ● Выкупы                  │
│       │       ▲────▲──▲──▲──▲──▲──▲              ◆ Теор.прибыль            │
│  100K ┼                                                                     │
│       │ ◆──◆──◆──◆──◆──◆──◆                                                │
│   50K ┼                                                                     │
│       │                                                                     │
│     0 ┼───┬───┬───┬───┬───┬───┬───                                         │
│         Пн  Вт  Ср  Чт  Пт  Сб  Вс                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tablet Layout (768px - 1023px)

```
┌───────────────────────────────────────────────────────┐
│  Детализация по дням                    [Неделя ▼]    │
├───────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │ Заказы    │ │ Выкупы    │ │ Прибыль   │           │
│  │ 1.2M ₽   │ │ 980K ₽   │ │ 234K ₽   │           │
│  │ ~~~∿~~~  │ │ ~~~∿~~~  │ │ ~~~∿~~~  │           │
│  └───────────┘ └───────────┘ └───────────┘           │
│  [Показать все метрики ▼]                             │
├───────────────────────────────────────────────────────┤
│                                                       │
│  [Main Line Chart - same as desktop]                  │
│  Height: 280px                                        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌─────────────────────────────────┐
│  Детализация по дням            │
│  [Неделя ▼]                     │
├─────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐        │
│  │Заказы   │ │Выкупы   │        │
│  │1.2M ₽  │ │980K ₽  │        │
│  │~~~∿~~~ │ │~~~∿~~~ │        │
│  └─────────┘ └─────────┘        │
│  [+6 метрик ▼]                  │
├─────────────────────────────────┤
│                                 │
│  [Line Chart]                   │
│  Height: 240px                  │
│  Horizontal scroll for legend   │
│                                 │
└─────────────────────────────────┘
```

---

## Component Specifications

### 1. Metric Sparkline Card

```
┌─────────────────────────────┐
│ [Icon] Название метрики     │  <- 14px, font-medium, gray-700
│ 1 234 567 ₽                │  <- 20px, font-bold, gray-900
│ ~~~∿~~~∿~~~∿~~~            │  <- Sparkline, 40px height
│ [■] Показать на графике     │  <- Checkbox, 12px text
└─────────────────────────────┘

Width: 140px (desktop), 120px (tablet), 100% / 2 (mobile)
Height: auto (content-based)
Padding: 12px
Border: 1px solid #EEEEEE
Border-radius: 8px
Background: white
Hover: border-color #E53935, shadow-sm
```

### 2. Main Line Chart

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Width | 100% | 100% | 100% |
| Height | 320px | 280px | 240px |
| Margin Top | 20px | 16px | 12px |
| Margin Right | 30px | 20px | 10px |
| Margin Bottom | 60px | 50px | 40px |
| Margin Left | 60px | 50px | 40px |

### 3. X-Axis Configuration

```typescript
{
  dataKey: 'date',
  tickFormatter: (date) => formatDayLabel(date), // "Пн", "Вт" or "01", "02"
  angle: 0, // horizontal labels
  textAnchor: 'middle',
  tick: { fontSize: 12, fill: '#757575' },
  axisLine: { stroke: '#EEEEEE' },
  tickLine: { stroke: '#EEEEEE' }
}
```

### 4. Y-Axis Configuration

```typescript
{
  tickFormatter: (value) => formatCompactCurrency(value), // "10К", "1М"
  tick: { fontSize: 12, fill: '#757575' },
  axisLine: { stroke: '#EEEEEE' },
  tickLine: false,
  width: 60
}
```

### 5. Line Configuration

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

---

## Tooltip Design

### Desktop Tooltip

```
┌──────────────────────────────────┐
│ Среда, 29 января 2026            │  <- 14px, font-semibold
├──────────────────────────────────┤
│ ● Заказы          187 234 ₽     │  <- Colored dot + metric
│ ● Выкупы          156 789 ₽     │
│ ◆ Теор. прибыль    34 567 ₽     │  <- Diamond for profit
├──────────────────────────────────┤
│ Доля от недели: 15.2%            │  <- Optional context
└──────────────────────────────────┘

Background: white
Border: 1px solid #EEEEEE
Border-radius: 8px
Padding: 12px
Shadow: 0 4px 6px rgba(0,0,0,0.1)
Max-width: 280px
```

### Mobile Tooltip (Fixed Bottom)

```
┌─────────────────────────────────┐
│ Ср, 29.01  │ Заказы: 187К ₽    │
│            │ Выкупы: 157К ₽    │
└─────────────────────────────────┘

Position: fixed bottom
Height: 56px
Full width with padding
```

---

## Legend Design

### Desktop Legend (Below Chart)

```
┌─────────────────────────────────────────────────────────────────┐
│  ● Заказы   ● Выкупы   ● COGS   ◆ Теор. прибыль   [Сбросить]   │
└─────────────────────────────────────────────────────────────────┘

Layout: flex, justify-center, gap-16px
Item: flex, align-center, gap-6px, cursor-pointer
Dot: 12px circle, colored
Text: 14px, gray-700
Hover: underline
Click: toggle metric visibility
```

### Mobile Legend (Horizontal Scroll)

```
┌─────────────────────────────────┐
│ ← ● Заказы  ● Выкупы  ● COGS → │
└─────────────────────────────────┘

Container: overflow-x-auto, -webkit-overflow-scrolling: touch
Items: flex-shrink: 0, padding: 8px
Scroll indicators: gradient fade on edges
```

---

## Interaction States

### Metric Card States

| State | Visual |
|-------|--------|
| Default | Border #EEEEEE, bg white |
| Hover | Border #E53935, shadow-sm |
| Selected | Border #E53935, bg #FEF2F2 (red-50) |
| Disabled | Opacity 0.5, cursor not-allowed |

### Chart Line States

| State | Visual |
|-------|--------|
| Default | Full opacity, strokeWidth 2 |
| Hover (other lines) | Other lines opacity 0.3 |
| Hidden | Not rendered |

### Data Point States

| State | Visual |
|-------|--------|
| Default | dot r=4, white fill, colored stroke |
| Hover | dot r=6, colored fill, white stroke |
| Active | pulse animation |

---

## Empty & Loading States

### Loading State

```
┌─────────────────────────────────────────────────────────────────┐
│  Детализация по дням                                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ ████████ │ │ ████████ │ │ ████████ │ │ ████████ │           │
│  │ ████     │ │ ████     │ │ ████     │ │ ████     │           │
│  │ ~~~~~~~~ │ │ ~~~~~~~~ │ │ ~~~~~~~~ │ │ ~~~~~~~~ │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │      ████████████████████████████████████               │   │
│  │                                                         │   │
│  │  ████████████████████████████████████████████████████   │   │
│  │                                                         │   │
│  │      Shimmer animation →→→→→→→→                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Skeleton color: #F3F4F6 (gray-100)
Shimmer: linear-gradient animation
Animation: 1.5s ease-in-out infinite
```

### Empty State (No Data)

```
┌─────────────────────────────────────────────────────────────────┐
│  Детализация по дням                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         [Empty Icon]                            │
│                                                                 │
│                   Нет данных за период                          │
│                                                                 │
│       Данные по дням появятся после загрузки отчётов           │
│                                                                 │
│                    [Загрузить отчёт]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Icon: Calendar with X, 64px, gray-400
Title: 18px, font-semibold, gray-700
Description: 14px, gray-500
Button: Primary, links to import
```

### Partial Data State

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Данные неполные: отсутствуют данные за Сб, Вс              │
└─────────────────────────────────────────────────────────────────┘

Alert: Amber background (#FEF3C7)
Text: Amber-900 (#92400E)
Icon: AlertTriangle
Position: Above chart
Dismissible: Yes (session only)
```

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text >=4.5:1, large text >=3:1 |
| Keyboard navigation | Tab through cards, Enter to toggle |
| Focus indicators | 2px red outline on focus |
| Screen reader | aria-label on chart, live regions for updates |
| Reduced motion | Respect prefers-reduced-motion |

### ARIA Labels

```html
<!-- Chart container -->
<div
  role="img"
  aria-label="График детализации по дням за неделю 2026-W05"
  aria-describedby="chart-description"
>

<!-- Hidden description for screen readers -->
<p id="chart-description" class="sr-only">
  Линейный график показывает 3 выбранные метрики:
  Заказы от 150 000 до 250 000 рублей,
  Выкупы от 120 000 до 200 000 рублей,
  Теоретическая прибыль от 30 000 до 50 000 рублей.
  Данные за 7 дней с понедельника по воскресенье.
</p>

<!-- Metric card -->
<button
  role="checkbox"
  aria-checked="true"
  aria-label="Показать Заказы на графике. Текущее значение: 1 234 567 рублей"
>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between metric cards |
| Space/Enter | Toggle metric visibility |
| Arrow Left/Right | Navigate chart data points (when focused) |
| Escape | Close tooltip |

---

## Data Structure

### API Response Example

```typescript
interface DailyBreakdownResponse {
  period: {
    type: 'week' | 'month'
    start: string // ISO date
    end: string   // ISO date
    label: string // "2026-W05" or "Январь 2026"
  }
  days: DailyMetrics[]
  totals: MetricTotals
}

interface DailyMetrics {
  date: string           // "2026-01-27"
  dayOfWeek: string      // "Пн"
  orders: number         // Заказы ₽
  ordersCogs: number     // COGS по заказам ₽
  buyouts: number        // Выкупы ₽
  buyoutsCogs: number    // COGS по выкупам ₽
  advertising: number    // Реклама ₽
  logistics: number      // Логистика ₽
  storage: number        // Хранение ₽
  theoreticalProfit: number // Calculated
}
```

### Sample Data (7 days)

```typescript
const sampleData: DailyMetrics[] = [
  { date: '2026-01-27', dayOfWeek: 'Пн', orders: 175000, buyouts: 140000, advertising: 6500, logistics: 12800, storage: 4600, theoreticalProfit: 32100 },
  { date: '2026-01-28', dayOfWeek: 'Вт', orders: 192000, buyouts: 153600, advertising: 7200, logistics: 14100, storage: 4600, theoreticalProfit: 35100 },
  { date: '2026-01-29', dayOfWeek: 'Ср', orders: 187000, buyouts: 149600, advertising: 6800, logistics: 13700, storage: 4600, theoreticalProfit: 34200 },
  { date: '2026-01-30', dayOfWeek: 'Чт', orders: 201000, buyouts: 160800, advertising: 7500, logistics: 14700, storage: 4600, theoreticalProfit: 37600 },
  { date: '2026-01-31', dayOfWeek: 'Пт', orders: 245000, buyouts: 196000, advertising: 8900, logistics: 17900, storage: 4600, theoreticalProfit: 44600 },
  { date: '2026-02-01', dayOfWeek: 'Сб', orders: 156000, buyouts: 124800, advertising: 5800, logistics: 11400, storage: 4600, theoreticalProfit: 28600 },
  { date: '2026-02-02', dayOfWeek: 'Вс', orders: 134000, buyouts: 107200, advertising: 5000, logistics: 9800, storage: 4600, theoreticalProfit: 24600 }
]
```

---

## Animation Specifications

### Chart Line Animation

```css
/* Line drawing animation */
.recharts-line-curve {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1s ease-out forwards;
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .recharts-line-curve {
    animation: none;
    stroke-dasharray: none;
  }
}
```

### Tooltip Animation

```css
/* Fade in tooltip */
.chart-tooltip {
  animation: fadeIn 150ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Metric Card Toggle

```css
/* Card selection animation */
.metric-card {
  transition: border-color 150ms, background-color 150ms, box-shadow 150ms;
}

.metric-card:hover {
  border-color: #E53935;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.metric-card[aria-checked="true"] {
  border-color: #E53935;
  background-color: #FEF2F2;
}
```

---

## Implementation Notes

### Component Structure

```
src/components/custom/dashboard/
├── DailyBreakdownSection.tsx      # Main container
├── MetricSparklineCard.tsx        # Individual metric card
├── DailyBreakdownChart.tsx        # Main line chart
├── DailyBreakdownTooltip.tsx      # Custom tooltip
├── DailyBreakdownLegend.tsx       # Interactive legend
└── __tests__/
    └── DailyBreakdownSection.test.tsx
```

### Hook Structure

```
src/hooks/
└── useDailyBreakdown.ts           # TanStack Query hook
```

### Recharts Components Used

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
```

---

## Related Documentation

- [TrendGraph.tsx](/src/components/custom/TrendGraph.tsx) - Existing trend chart pattern
- [ExpenseChart.tsx](/src/components/custom/ExpenseChart.tsx) - Bar chart with tooltips
- [front-end-spec.md](/docs/front-end-spec.md) - Design system reference
- [CLAUDE.md](/CLAUDE.md) - Semantic colors reference

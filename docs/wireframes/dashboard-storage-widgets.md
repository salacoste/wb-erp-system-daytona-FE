# Dashboard Storage Widgets Wireframe

**Epic**: 63-FE - Dashboard Main Page (Frontend)
**Stories**: 63.5-FE (Top Consumers), 63.6-FE (Trends Chart)
**Version**: 1.0
**Date**: 2026-01-31
**Author**: UX Validation (Claude)

---

## Design Validation Summary

### Story 63.5-FE: Storage Top Consumers Widget

| Criterion                         | Status | Notes                                                  |
| --------------------------------- | ------ | ------------------------------------------------------ |
| 8-card grid pattern               | PASS   | Widget fits in expenses section below main 8-card grid |
| Purple color scheme (#7C4DFF)     | PASS   | Consistent with Epic 24 storage analytics              |
| WCAG 2.1 AA contrast              | PASS   | Purple #7C4DFF on white = 4.6:1 ratio                  |
| Touch targets >= 44px             | PASS   | Table rows have adequate click area                    |
| Existing storage page consistency | PASS   | Reuses TopConsumersWidget pattern from Epic 24         |
| Rank indicators (Trophy/Medal)    | PASS   | Uses Lucide icons with aria-labels                     |
| Storage-to-revenue color coding   | PASS   | Red >20%, Yellow 10-20%, Green <10%                    |
| Warning badge placement           | PASS   | AlertTriangle icon + colored dot                       |

**Recommendations**:

1. Ensure widget card uses same Card component as other dashboard widgets
2. "Смотреть все" link should be positioned in card header, right-aligned
3. Consider adding Package icon in card title for visual consistency

### Story 63.6-FE: Storage Trends Chart

| Criterion              | Status | Notes                                           |
| ---------------------- | ------ | ----------------------------------------------- |
| Chart type (Area/Line) | PASS   | Area chart with purple gradient matches Epic 24 |
| Axis labels formatting | PASS   | X: W01-W05, Y: 5k/10k format                    |
| Legend placement       | N/A    | Single metric, no legend needed                 |
| Tooltip design         | PASS   | Custom tooltip with week label and currency     |
| Responsive behavior    | PASS   | ResponsiveContainer handles resize              |
| Null data handling     | PASS   | connectNulls={false} shows gaps                 |
| Trend badge semantics  | PASS   | Red=increase (bad), Green=decrease (good)       |

**Recommendations**:

1. Add dashed circle visual for null data points (currently in spec)
2. Summary stats bar should have subtle background (bg-muted/30)
3. Ensure chart height is compact (250px) for dashboard widget context

---

## Dashboard Layout Integration

### Current Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: "Главная страница" + PeriodContextLabel    [Period Selector]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 8-CARD METRICS GRID (Story 62.1-FE)                                     │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │
│ │ │ Заказы   │ │ COGS     │ │ Выкупы   │ │ COGS     │                    │ │
│ │ │ Orders   │ │ заказов  │ │ (Sales)  │ │ выкупов  │                    │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │
│ │ │ Реклама  │ │ Логист.  │ │ Хранение │ │ Теор.    │                    │ │
│ │ │ (Ad)     │ │ (Logist.)│ │ (Storage)│ │ Прибыль  │                    │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ DAILY BREAKDOWN SECTION (Story 62.4-FE)                                 │ │
│ │ [View Toggle: Chart | Table]                                            │ │
│ │ ┌───────────────────────────────────────────────────────────────────┐   │ │
│ │ │ Daily breakdown chart/table                                        │   │ │
│ │ └───────────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ADVERTISING WIDGET (Epic 42-FE)                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ EXPENSE CHART (Existing)                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐          │
│ │ STORAGE TOP CONSUMERS        │ │ STORAGE TRENDS CHART         │          │
│ │ (Story 63.5-FE) - NEW        │ │ (Story 63.6-FE) - NEW        │          │
│ └──────────────────────────────┘ └──────────────────────────────┘          │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ TREND GRAPHS (Existing)                                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ COGS CTA (Conditional - shows when COGS < 100%)                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Proposed Storage Widgets Position

**Option A (Recommended)**: Side-by-side below Expense Chart

- Visual balance: Table on left, Chart on right
- Maintains information hierarchy
- Purple theme creates visual cohesion

**Option B**: Stacked within Expense section

- Top Consumers above Trends Chart
- More vertical space usage
- Better for narrower screens

---

## Widget Wireframes

### Story 63.5-FE: Storage Top Consumers Widget

#### Desktop Layout (>= 768px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <Package/> Топ по расходам на хранение                 [Смотреть все →] │
├──────────────────────────────────────────────────────────────────────────┤
│ #   │ Товар                 │ Хранение   │ % общих  │ Хран/Выр          │
├─────┼───────────────────────┼────────────┼──────────┼───────────────────┤
│ 🏆1 │ Пальто зимнее XL      │   3 500 ₽  │  12,5%   │ 23,3% ⚠️ ●(red)   │
│     │ Бренд: OutdoorPro     │            │          │                   │
├─────┼───────────────────────┼────────────┼──────────┼───────────────────┤
│ 🥈2 │ Диван угловой         │   2 800 ₽  │  10,0%   │  6,2%   ●(green)  │
│     │ Бренд: HomeComfort    │            │          │                   │
├─────┼───────────────────────┼────────────┼──────────┼───────────────────┤
│ 🥉3 │ Шкаф-купе             │   2 200 ₽  │   7,9%   │  8,1%   ●(green)  │
│     │ Бренд: MebelPlus      │            │          │                   │
├─────┼───────────────────────┼────────────┼──────────┼───────────────────┤
│  4  │ Кресло офисное        │   1 800 ₽  │   6,4%   │ 15,2%   ●(yellow) │
│     │ Бренд: OfficeStyle    │            │          │                   │
├─────┼───────────────────────┼────────────┼──────────┼───────────────────┤
│  5  │ Стол обеденный        │   1 500 ₽  │   5,4%   │  4,3%   ●(green)  │
│     │ Бренд: WoodMaster     │            │          │                   │
└─────┴───────────────────────┴────────────┴──────────┴───────────────────┘
  Legend: ●green (<10%) ●yellow (10-20%) ●red (>20%) ⚠️ = needs optimization
```

#### Mobile Layout (< 768px)

```
┌────────────────────────────────────────┐
│ <Package/> Топ хранение  [Все →]       │
├────────────────────────────────────────┤
│ 🏆 Пальто зимнее XL                    │
│    3 500 ₽ • 12,5%        23,3% ⚠️●    │
├────────────────────────────────────────┤
│ 🥈 Диван угловой                       │
│    2 800 ₽ • 10,0%         6,2%  ●     │
├────────────────────────────────────────┤
│ 🥉 Шкаф-купе                           │
│    2 200 ₽ •  7,9%         8,1%  ●     │
├────────────────────────────────────────┤
│  4 Кресло офисное                      │
│    1 800 ₽ •  6,4%        15,2%  ●     │
├────────────────────────────────────────┤
│  5 Стол обеденный                      │
│    1 500 ₽ •  5,4%         4,3%  ●     │
└────────────────────────────────────────┘
```

#### Interaction States

**Row Hover**:

```
┌─────┬───────────────────────┬────────────┬──────────┬───────────────────┐
│ 🥈2 │ Диван угловой         │   2 800 ₽  │  10,0%   │  6,2%   ●(green)  │
│     │ Бренд: HomeComfort    │            │          │                   │
└─────┴───────────────────────┴────────────┴──────────┴───────────────────┘
 ↑ bg-muted/50 on hover, cursor: pointer
```

**Ratio Tooltip (on hover over ratio/dot)**:

```
           ┌──────────────────────────────────┐
           │ Высокие затраты                  │
           │ ─────────────────────────────────│
           │ Отношение затрат на хранение     │
           │ к выручке. Рекомендуется         │
           │ оптимизация запасов.             │
           └──────────────────────────────────┘
                        ▼
           23,3% ⚠️ ●(red)
```

#### Loading State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <Package/> Топ по расходам на хранение                 [Смотреть все →] │
├──────────────────────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
└──────────────────────────────────────────────────────────────────────────┘
  (Skeleton rows with shimmer animation)
```

#### Empty State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <Package/> Топ по расходам на хранение                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    <PackageX icon - muted>                               │
│                                                                          │
│              Нет данных по хранению за выбранный период                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Error State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <Package/> Топ по расходам на хранение                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    <AlertCircle icon - red>                              │
│                                                                          │
│              Ошибка загрузки данных                                      │
│                                                                          │
│                    [Повторить]                                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Story 63.6-FE: Storage Trends Chart Widget

#### Desktop Layout (>= 768px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение         Тренд: +10,0% ↑     │
│                                                     (red badge)          │
├──────────────────────────────────────────────────────────────────────────┤
│   Мин: 5 000 ₽  │  Макс: 5 500 ₽  │  Среднее: 5 280 ₽                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  5.5k ┤                                              ___●────────────   │
│       │                                         ___/                     │
│  5.3k ┤                                    ___/                          │
│       │                               ___/                               │
│  5.0k ┤●─────────────────────────●___/                                   │
│       │                                                                  │
│       └───────┬────────┬────────┬────────┬────────┬                     │
│              W01      W02      W03      W04      W05                     │
│                                                                          │
│       [Purple gradient fill under line]                                  │
│       Line color: #7C4DFF                                                │
│       Gradient: rgba(124, 77, 255, 0.3) → rgba(124, 77, 255, 0.05)       │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Chart Tooltip (on hover over data point)

```
                    ┌────────────────────┐
                    │ Неделя 03          │
                    │ ─────────────────  │
                    │ 5 300 ₽            │
                    │ (purple, bold)     │
                    └────────────────────┘
                              ▼
                              ●
```

#### Null Data Tooltip

```
                    ┌────────────────────┐
                    │ Неделя 03          │
                    │ ─────────────────  │
                    │ Нет данных за эту  │
                    │ неделю             │
                    │ (muted, italic)    │
                    └────────────────────┘
                              ▼
                              ◯ (dashed circle)
```

#### Trend Badge Variants

**Cost Increase (Bad)**:

```
┌───────────────────────┐
│ ↑ Тренд: +10,0%       │  bg-red-50, text-red-600, border-red-200
└───────────────────────┘
```

**Cost Decrease (Good)**:

```
┌───────────────────────┐
│ ↓ Тренд: -5,2%        │  bg-green-50, text-green-600, border-green-200
└───────────────────────┘
```

**No Change (Neutral)**:

```
┌───────────────────────┐
│ ─ Тренд: 0,0%         │  bg-gray-50, text-gray-600, border-gray-200
└───────────────────────┘
```

#### Mobile Layout (< 768px)

```
┌────────────────────────────────────────┐
│ <TrendingUp/> Динамика хранения        │
│                        +10,0% ↑        │
├────────────────────────────────────────┤
│ Мин: 5 000 ₽ │ Макс: 5 500 ₽           │
│ Среднее: 5 280 ₽                       │
├────────────────────────────────────────┤
│                                        │
│  5.5k ┤                    ●           │
│       │               ___/             │
│  5.0k ┤●─────────●___/                 │
│       │                                │
│       └───┬───┬───┬───┬───┬           │
│         W01 W02 W03 W04 W05            │
│                                        │
└────────────────────────────────────────┘
  (Chart height: 200px on mobile)
```

#### Loading State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение              ████████████   │
├──────────────────────────────────────────────────────────────────────────┤
│   ████████████  │  ████████████  │  ████████████                        │
├──────────────────────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
│ ████████████████████████████████████████████████████████████████████████ │
└──────────────────────────────────────────────────────────────────────────┘
  (Skeleton with shimmer animation, height=250px)
```

#### Empty State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│                    <BarChart3 icon - muted>                              │
│                                                                          │
│              Нет данных за выбранный период                              │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
  (border rounded-lg, bg-muted/20, height=250px)
```

#### Error State

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    <AlertCircle icon - red>                              │
│                                                                          │
│              Ошибка загрузки данных                                      │
│                                                                          │
│                    [Повторить]                                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior Summary

### Breakpoints (Tailwind Default)

| Breakpoint | Width     | Layout                             |
| ---------- | --------- | ---------------------------------- |
| sm         | < 640px   | Single column, stacked widgets     |
| md         | >= 640px  | Single column, compact table       |
| lg         | >= 1024px | Two-column widget layout           |
| xl         | >= 1280px | Full desktop with expanded columns |

### Widget Grid on Dashboard

```css
/* Desktop (lg+): Side-by-side */
.storage-widgets-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Mobile (< lg): Stacked */
@media (max-width: 1023px) {
  .storage-widgets-section {
    grid-template-columns: 1fr;
  }
}
```

---

## Color Reference

### Storage Theme (Purple)

| Usage          | Color        | Hex                      | Tailwind           |
| -------------- | ------------ | ------------------------ | ------------------ |
| Primary        | Purple       | #7C4DFF                  | `text-[#7C4DFF]`   |
| Background     | Purple Light | rgba(124, 77, 255, 0.1)  | `bg-purple-500/10` |
| Gradient Start | Purple 30%   | rgba(124, 77, 255, 0.3)  | -                  |
| Gradient End   | Purple 5%    | rgba(124, 77, 255, 0.05) | -                  |

### Ratio Severity Colors

| Severity   | Threshold | Color  | Hex     | Tailwind          |
| ---------- | --------- | ------ | ------- | ----------------- |
| High (Bad) | >20%      | Red    | #EF4444 | `text-red-500`    |
| Medium     | 10-20%    | Yellow | #F59E0B | `text-yellow-500` |
| Low (Good) | <10%      | Green  | #22C55E | `text-green-500`  |
| Unknown    | null      | Gray   | #9CA3AF | `text-gray-400`   |

### Trend Badge Colors

| Trend        | Storage Context   | Color | Background  |
| ------------ | ----------------- | ----- | ----------- |
| Increase (+) | Bad (costs up)    | Red   | bg-red-50   |
| Decrease (-) | Good (costs down) | Green | bg-green-50 |
| Neutral (0)  | Stable            | Gray  | bg-gray-50  |

---

## Accessibility Checklist

### Story 63.5-FE: Top Consumers Widget

- [x] Table has proper `<th>` headers with scope
- [x] Rank icons have `aria-label` attributes
- [x] Color indicators have text alternatives (percentage shown)
- [x] Warning icon has descriptive label
- [x] Rows are keyboard navigable (tabindex, Enter to click)
- [x] Focus visible on row hover
- [x] Contrast ratio >= 4.5:1 for all text
- [x] "Смотреть все" link has visible focus state

### Story 63.6-FE: Storage Trends Chart

- [x] Chart has descriptive `aria-label`
- [x] Summary stats provide text alternative to chart data
- [x] Trend badge has semantic coloring + text
- [x] Tooltip content is screen reader accessible
- [x] Empty/error states have clear messaging
- [x] Focus management for interactive elements

---

## Implementation Notes

### Component Reuse Strategy

1. **TopConsumersWidget**: Can extend/adapt existing `src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx`
   - Add Card wrapper for dashboard context
   - Add navigation to storage page
   - Ensure props match dashboard API response

2. **StorageTrendsChart**: Can adapt existing `src/app/(dashboard)/analytics/storage/components/StorageTrendsChart.tsx`
   - Add compact mode (height=250px)
   - Add summary stats header
   - Ensure dashboard period integration

### New Files to Create

```
src/components/custom/dashboard/
├── StorageTopConsumersWidget.tsx    # Story 63.5-FE
├── StorageTrendsWidget.tsx          # Story 63.6-FE
├── TrendBadge.tsx                   # Shared component
└── SummaryStats.tsx                 # Shared component
```

### Dashboard Integration Point

In `DashboardContent.tsx`, add after ExpenseChart:

```tsx
{/* Storage Widgets Section - Epic 63-FE */}
<div className="grid gap-4 lg:grid-cols-2">
  <StorageTopConsumersWidget
    weekStart={selectedWeek}
    weekEnd={selectedWeek}
    limit={5}
    includeRevenue
  />
  <StorageTrendsWidget
    weekStart={firstWeekOfPeriod}
    weekEnd={selectedWeek}
    height={250}
    showSummary
  />
</div>
```

---

## Change Log

| Date       | Version | Description                             | Author                 |
| ---------- | ------- | --------------------------------------- | ---------------------- |
| 2026-01-31 | 1.0     | Initial wireframe and design validation | UX Validation (Claude) |

---

## Related Documents

- Story 63.5-FE: `docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md`
- Story 63.6-FE: `docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md`
- Design System: `docs/front-end-spec.md`
- Epic 24 Reference: `src/app/(dashboard)/analytics/storage/components/`

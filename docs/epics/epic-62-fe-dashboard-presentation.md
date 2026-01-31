# Epic 62-FE: Dashboard UI/UX Presentation Layer

**Status**: ✅ Complete
**Priority**: P1 (High Value)
**Backend Epic**: N/A (Uses data from Epic 61-FE)
**Story Points**: 29 SP
**Stories**: 10 (all complete)
**Completion Date**: 2026-01-31

---

## Overview

### Problem Statement

Epic 61-FE establishes the **Data Layer** with correct API integrations and calculations. However, the dashboard's **Presentation Layer** does not display the 8 business metrics required by stakeholders:

1. **Missing metrics** - Orders volume, COGS by orders, theoretical profit not displayed
2. **No daily breakdown** - Business requires day-by-day visualization for week/month
3. **Incomplete metric grid** - Current 6-card grid doesn't show all 8 required metrics
4. **No visual comparison** - Daily trends not visible at glance
5. **Poor data hierarchy** - Key business metrics buried in widgets

### Business Requirements (from stakeholder diagram)

**8 Required Metrics on Dashboard:**

| # | Metric (RU) | Metric (EN) | Source |
|---|-------------|-------------|--------|
| 1 | Заказы | Orders volume | `/analytics/orders/volume` |
| 2 | COGS по заказам | COGS for orders | Calculated from orders + COGS |
| 3 | Выкупы | Sales/Redemptions | `/analytics/weekly/finance-summary` |
| 4 | COGS по выкупам | COGS for sales | `/analytics/weekly/finance-summary` |
| 5 | Рекламные затраты | Advertising spend | `/analytics/advertising` |
| 6 | Логистика | Logistics costs | `/analytics/weekly/finance-summary` |
| 7 | Хранение | Storage costs | `/analytics/weekly/finance-summary` |
| 8 | Теор. прибыль | Theoretical profit | Calculated |

**Display Modes:**
- По дням за последнюю (актуальную) неделю - Daily breakdown for current week
- По дням за последний (завершённый) месяц - Daily breakdown for last month

### Solution

Redesign dashboard presentation layer to display all 8 business metrics with daily breakdown charts:

1. **Metric Cards Grid** - 8 enhanced cards with comparison indicators
2. **Daily Breakdown Chart** - Multi-series chart showing all metrics by day
3. **Period Toggle Integration** - Leverage Epic 60-FE period context
4. **Visual Hierarchy** - Key metrics prominent, supporting data accessible

**Note**: This epic focuses on PRESENTATION LAYER only. Data fetching is handled by Epic 61-FE hooks.

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Frontend | Epic 60-FE (Period Context) | ✅ Completed |
| Frontend | Epic 61-FE (Data Layer) | 📋 Ready |
| Hooks | `useOrdersVolume` | From 61.3-FE |
| Hooks | `useOrdersCogs` | From 61.4-FE |
| Hooks | `useDailyMetrics` | From 61.9-FE |
| Hooks | `calculateTheoreticalProfit()` | From 61.10-FE |

**Blocking Dependencies**: Stories 62.3-62.6 require Epic 61-FE hooks to be implemented first.

---

## Components

### New Components (7)

| Component | Location | Purpose | SP |
|-----------|----------|---------|---:|
| `DashboardMetricsGrid` | `src/components/custom/dashboard/` | 8-card responsive grid layout | 2 |
| `OrdersMetricCard` | `src/components/custom/dashboard/` | Orders volume card with comparison | 1 |
| `OrdersCogsMetricCard` | `src/components/custom/dashboard/` | COGS by orders card | 1 |
| `TheoreticalProfitCard` | `src/components/custom/dashboard/` | Theoretical profit with breakdown tooltip | 2 |
| `DailyBreakdownChart` | `src/components/custom/dashboard/` | Multi-series daily chart | 5 |
| `MetricLegend` | `src/components/custom/dashboard/` | Interactive legend for chart | 1 |
| `DailyMetricsTable` | `src/components/custom/dashboard/` | Tabular daily data view | 2 |

### Modified Components (4)

| Component | Change |
|-----------|--------|
| `DashboardContent.tsx` | Replace 6-card grid with 8-card DashboardMetricsGrid |
| `MetricCardEnhanced.tsx` | Add support for breakdown tooltip, negative value styling |
| `ExpenseChart.tsx` | Add daily breakdown mode, integrate with new hooks |
| `TrendGraph.tsx` | Support multi-metric overlay mode |

---

## Stories

### 🔴 Critical (P0) - Core Metric Display

---

### Story 62.1-FE: Redesign Dashboard Metrics Grid (8 Cards)
**Estimate**: 3 SP | **Priority**: P0

**Title**: Редизайн сетки метрик дашборда (8 карточек)

**Description**:
Redesign the dashboard layout from 6-card grid to 8-card grid displaying all required business metrics.

**Acceptance Criteria**:
- [ ] Create `DashboardMetricsGrid` component with 8-card layout
- [ ] Responsive grid: 4 cols on xl, 3 on lg, 2 on md, 1 on sm
- [ ] Card order matches business priority (see Design Specs below)
- [ ] Loading skeletons for all 8 cards
- [ ] Cards use consistent sizing (equal height in each row)
- [ ] Hover states for interactive cards

**Grid Layout**:
```
Desktop (xl: 4 columns):
┌────────────┬────────────┬────────────┬────────────┐
│  Заказы    │ COGS заказ │  Выкупы    │ COGS выкуп │
├────────────┼────────────┼────────────┼────────────┤
│  Реклама   │ Логистика  │  Хранение  │ Теор.приб. │
└────────────┴────────────┴────────────┴────────────┘

Tablet (lg: 3 columns):
┌────────────┬────────────┬────────────┐
│  Заказы    │ COGS заказ │  Выкупы    │
├────────────┼────────────┼────────────┤
│ COGS выкуп │  Реклама   │ Логистика  │
├────────────┼────────────┼────────────┤
│  Хранение  │ Теор.приб. │            │
└────────────┴────────────┴────────────┘
```

**Files**:
- `src/components/custom/dashboard/DashboardMetricsGrid.tsx` (NEW)
- `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` (MODIFY)

---

### Story 62.2-FE: Orders Volume Metric Card
**Estimate**: 2 SP | **Priority**: P0

**Title**: Карточка метрики объёма заказов

**Description**:
Create dedicated card for Orders volume (Заказы) - potential revenue from all orders.

**Acceptance Criteria**:
- [ ] Display `total_amount` from `useOrdersVolume` hook
- [ ] Show comparison with previous period (↑/↓ indicator)
- [ ] Format as currency (RUB)
- [ ] Tooltip explaining "Потенциальный доход от заказов"
- [ ] Handle loading/error states
- [ ] Show order count in subtitle: "X заказов"

**Design Specs**:
- Icon: ShoppingCart (lucide-react)
- Value color: Blue (#3B82F6) - represents potential/pending revenue
- Comparison badge: Green/Red based on direction

**Files**:
- `src/components/custom/dashboard/OrdersMetricCard.tsx` (NEW)

**Depends On**: Story 61.3-FE (useOrdersVolume hook)

---

### Story 62.3-FE: COGS by Orders Metric Card
**Estimate**: 2 SP | **Priority**: P0

**Title**: Карточка COGS по заказам

**Description**:
Create card showing COGS calculated for orders (not just sales).

**Acceptance Criteria**:
- [ ] Display COGS total from `useOrdersCogs` hook
- [ ] Show comparison with previous period
- [ ] Format as currency (RUB)
- [ ] Tooltip: "Себестоимость товаров в заказах"
- [ ] Warning badge if COGS coverage < 100%
- [ ] Handle missing COGS gracefully (show "—" with explanation)

**Design Specs**:
- Icon: Package (lucide-react)
- Value color: Gray (#6B7280) - represents cost/expense
- Warning indicator: Yellow (#F59E0B) when incomplete

**Files**:
- `src/components/custom/dashboard/OrdersCogsMetricCard.tsx` (NEW)

**Depends On**: Story 61.4-FE (useOrdersCogs hook)

---

### Story 62.4-FE: Theoretical Profit Card with Breakdown
**Estimate**: 3 SP | **Priority**: P0

**Title**: Карточка теоретической прибыли с разбивкой

**Description**:
Create card showing Theoretical Profit with expandable breakdown tooltip.

**Acceptance Criteria**:
- [ ] Display calculated theoretical profit value
- [ ] Use `calculateTheoreticalProfit()` from lib
- [ ] Show comparison with previous period
- [ ] Expandable breakdown showing all components:
  - Заказы: +X ₽
  - COGS: -X ₽
  - Реклама: -X ₽
  - Логистика: -X ₽
  - Хранение: -X ₽
  - = Теор. прибыль: X ₽
- [ ] Color coding: Green if positive, Red if negative
- [ ] "Incomplete" badge if any component missing

**Design Specs**:
- Icon: Calculator (lucide-react)
- Positive value: Green (#22C55E)
- Negative value: Red (#EF4444)
- Breakdown popover: 300px width, table format

**Files**:
- `src/components/custom/dashboard/TheoreticalProfitCard.tsx` (NEW)

**Depends On**: Story 61.10-FE (calculateTheoreticalProfit)

---

### Story 62.5-FE: Expense Metrics Cards (Advertising, Logistics, Storage)
**Estimate**: 2 SP | **Priority**: P0

**Title**: Карточки расходов (реклама, логистика, хранение)

**Description**:
Create/update cards for the three expense categories.

**Acceptance Criteria**:
- [ ] Advertising card shows `total_spend` (not just ROAS)
- [ ] Logistics card shows `logistics_cost`
- [ ] Storage card shows `storage_cost`
- [ ] All show comparison with previous period
- [ ] All formatted as currency with negative indicator (expenses)
- [ ] Consistent styling across expense cards

**Design Specs**:
- Advertising icon: Megaphone (lucide-react)
- Logistics icon: Truck (lucide-react)
- Storage icon: Warehouse (lucide-react)
- Value color: Red (#EF4444) - expenses shown as negative impact
- Subtitle shows % of revenue

**Files**:
- `src/components/custom/dashboard/AdvertisingMetricCard.tsx` (NEW or modify existing)
- `src/components/custom/dashboard/LogisticsMetricCard.tsx` (NEW)
- `src/components/custom/dashboard/StorageMetricCard.tsx` (NEW)

---

### 🟡 Important (P1) - Daily Breakdown

---

### Story 62.6-FE: Daily Breakdown Chart Component
**Estimate**: 5 SP | **Priority**: P1

**Title**: Компонент графика разбивки по дням

**Description**:
Create multi-series chart showing all 8 metrics by day for selected period.

**Acceptance Criteria**:
- [ ] Line/area chart with 8 metric series
- [ ] X-axis: Days (Mon-Sun for week, 1-31 for month)
- [ ] Y-axis: Dual axis (revenue scale left, expense scale right)
- [ ] Interactive legend to toggle series visibility
- [ ] Tooltip showing all values for hovered day
- [ ] Responsive sizing
- [ ] Week mode: 7 days
- [ ] Month mode: 28-31 days

**Chart Configuration**:
```typescript
series: [
  { key: 'orders', label: 'Заказы', color: '#3B82F6', axis: 'left' },
  { key: 'ordersCogs', label: 'COGS заказов', color: '#9CA3AF', axis: 'left' },
  { key: 'sales', label: 'Выкупы', color: '#22C55E', axis: 'left' },
  { key: 'salesCogs', label: 'COGS выкупов', color: '#6B7280', axis: 'left' },
  { key: 'advertising', label: 'Реклама', color: '#F59E0B', axis: 'right' },
  { key: 'logistics', label: 'Логистика', color: '#EF4444', axis: 'right' },
  { key: 'storage', label: 'Хранение', color: '#7C4DFF', axis: 'right' },
  { key: 'profit', label: 'Теор. прибыль', color: '#10B981', axis: 'left' },
]
```

**Technical Notes**:
- Use Recharts library (already in project)
- Consume data from `useDailyMetrics` hook (Epic 61-FE)
- Memoize chart data transformation

**Files**:
- `src/components/custom/dashboard/DailyBreakdownChart.tsx` (NEW)
- `src/components/custom/dashboard/MetricLegend.tsx` (NEW)

**Depends On**: Story 61.9-FE (useDailyMetrics hook)

---

### Story 62.7-FE: Interactive Chart Legend
**Estimate**: 2 SP | **Priority**: P1

**Title**: Интерактивная легенда графика

**Description**:
Create clickable legend component for toggling chart series visibility.

**Acceptance Criteria**:
- [ ] Display all 8 metrics with color indicators
- [ ] Click to toggle series visibility on/off
- [ ] Visual state: active (full opacity) vs hidden (grayed out)
- [ ] "Show All" / "Hide All" buttons
- [ ] Persist visibility preferences in localStorage
- [ ] Keyboard accessible (Enter/Space to toggle)

**Design Specs**:
```
┌─────────────────────────────────────────────────────────────┐
│ ● Заказы  ● COGS  ● Выкупы  ● Реклама  ...  [Все] [Сбросить]│
└─────────────────────────────────────────────────────────────┘
```
- Active: Full color dot + black text
- Hidden: Gray dot + gray text + strikethrough
- Hover: Underline

**Files**:
- `src/components/custom/dashboard/MetricLegend.tsx` (NEW)

---

### Story 62.8-FE: Daily Metrics Table View
**Estimate**: 3 SP | **Priority**: P1

**Title**: Табличное представление метрик по дням

**Description**:
Create tabular view of daily metrics as alternative to chart.

**Acceptance Criteria**:
- [ ] Table with columns: День, Заказы, COGS, Выкупы, ..., Теор.прибыль
- [ ] Row per day (7 for week, 28-31 for month)
- [ ] Totals row at bottom
- [ ] Sortable columns
- [ ] Color coding for values (green positive, red negative)
- [ ] Toggle between chart/table view
- [ ] Export to CSV button (future - disabled for MVP)

**Design Specs**:
- Use shadcn/ui Table component
- Sticky header on scroll
- Zebra striping for readability
- Day column: "Пн 27.01", "Вт 28.01", etc.

**Files**:
- `src/components/custom/dashboard/DailyMetricsTable.tsx` (NEW)

**Depends On**: Story 61.9-FE (useDailyMetrics hook)

---

### 🟢 Nice to Have (P2) - Polish

---

### Story 62.9-FE: Chart/Table View Toggle
**Estimate**: 2 SP | **Priority**: P2

**Title**: Переключатель график/таблица

**Description**:
Add toggle to switch between chart and table views of daily breakdown.

**Acceptance Criteria**:
- [ ] Toggle button group: [📊 График] [📋 Таблица]
- [ ] Persist preference in localStorage
- [ ] Smooth transition between views
- [ ] Both views use same data source
- [ ] Accessible keyboard navigation

**Design Specs**:
- Use shadcn/ui ToggleGroup component
- Active state: Red background (#E53935), white text
- Inactive state: White background, gray text
- Position: Above chart/table, right-aligned

**Files**:
- `src/components/custom/dashboard/ViewToggle.tsx` (NEW)
- `src/components/custom/dashboard/DailyBreakdownSection.tsx` (NEW - wrapper)

---

### Story 62.10-FE: E2E Tests for Dashboard Metrics
**Estimate**: 3 SP | **Priority**: P2

**Title**: E2E тесты метрик дашборда

**Description**:
Create Playwright E2E tests for new dashboard metrics display.

**Acceptance Criteria**:
- [ ] Test: All 8 metric cards render with data
- [ ] Test: Metric cards show comparison indicators
- [ ] Test: Daily breakdown chart renders
- [ ] Test: Legend toggles work correctly
- [ ] Test: Table view displays correct data
- [ ] Test: Period switching updates all components
- [ ] Test: Loading states appear correctly
- [ ] Test: Error states handled gracefully
- [ ] Accessibility: All cards keyboard navigable

**Files**:
- `e2e/dashboard-metrics.spec.ts` (NEW)

---

## Design Specifications

### Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Orders (potential) | Blue | `#3B82F6` | Orders volume, pending revenue |
| Sales (actual) | Green | `#22C55E` | Actual sales, positive profit |
| COGS | Gray | `#6B7280` | Cost indicators |
| Advertising | Yellow/Orange | `#F59E0B` | Ad spend |
| Logistics | Red | `#EF4444` | Logistics costs |
| Storage | Purple | `#7C4DFF` | Storage costs |
| Profit Positive | Green | `#22C55E` | Positive theoretical profit |
| Profit Negative | Red | `#EF4444` | Negative theoretical profit |
| Warning | Yellow | `#F59E0B` | Incomplete data warnings |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Card Title | 14px | 500 (medium) | `#6B7280` (gray-500) |
| Card Value | 28px | 700 (bold) | Semantic (see colors) |
| Card Subtitle | 12px | 400 (regular) | `#9CA3AF` (gray-400) |
| Comparison Badge | 12px | 500 (medium) | White on colored bg |
| Chart Axis | 12px | 400 | `#9CA3AF` |
| Table Header | 13px | 600 | `#374151` (gray-700) |
| Table Cell | 14px | 400 | `#1F2937` (gray-800) |

### Spacing

| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Card padding | 16px | `p-4` |
| Card gap (grid) | 16px | `gap-4` |
| Section gap | 24px | `space-y-6` |
| Chart height | 300px | `h-[300px]` |
| Table row height | 48px | `h-12` |

### Card Component Anatomy

```
┌──────────────────────────────────────────────┐
│ [Icon] Title                           [?]   │  <- Header (h-8)
│                                              │
│           1 234 567,89 ₽                     │  <- Value (text-2xl)
│                                              │
│     ↑ +5,2%  (123 456 ₽ vs прошл.)          │  <- Comparison (text-sm)
│                                              │
│ 1 234 заказов                               │  <- Subtitle (text-xs)
└──────────────────────────────────────────────┘
```

---

## User Flow

```
1. User opens /dashboard
2. System displays loading skeletons for 8 metric cards
3. Period selector shows current week (from Epic 60-FE)
4. All 8 metric cards load with current + previous period data
5. Daily breakdown chart renders with all metrics
6. User can click legend items to show/hide specific metrics
7. User switches to "Месяц" tab
8. All cards and chart update with monthly data
9. User clicks "Таблица" toggle
10. Chart view replaced with tabular daily data
11. User hovers over Theoretical Profit card
12. Breakdown popover shows component details
13. User clicks card with warning badge
14. System navigates to COGS assignment page
```

---

## Technical Notes

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Dashboard Page                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ DashboardPeriod │    │ Epic 61-FE      │                     │
│  │ Context (60-FE) │───▶│ Data Hooks      │                     │
│  └─────────────────┘    └────────┬────────┘                     │
│                                  │                               │
│         ┌────────────────────────┼────────────────────────┐     │
│         ▼                        ▼                        ▼     │
│  ┌─────────────┐         ┌─────────────┐         ┌────────────┐ │
│  │ useOrders   │         │ useFinancial│         │ useDailyM  │ │
│  │ Volume      │         │ Summary     │         │ etrics     │ │
│  └──────┬──────┘         └──────┬──────┘         └─────┬──────┘ │
│         │                       │                       │        │
│         ▼                       ▼                       ▼        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DashboardMetricsGrid (62.1)                  │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │   │
│  │  │ Orders │ │OrdersCOGS│ │ Sales │ │SalesCOGS│            │   │
│  │  │ Card   │ │ Card   │ │ Card   │ │ Card   │             │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘             │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │   │
│  │  │ Advert │ │Logistics│ │Storage │ │ Profit │            │   │
│  │  │ Card   │ │ Card   │ │ Card   │ │ Card   │             │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DailyBreakdownSection (62.6-62.9)            │   │
│  │  [📊 График] [📋 Таблица]                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │            DailyBreakdownChart                      │  │   │
│  │  │                    OR                               │  │   │
│  │  │            DailyMetricsTable                        │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ● Заказы  ● COGS  ● Выкупы  ● Реклама  ...              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Props Interface

```typescript
// DashboardMetricsGrid
interface DashboardMetricsGridProps {
  ordersData: OrdersVolumeData | undefined
  ordersCogs: number | undefined
  salesData: FinanceSummary | undefined
  advertisingSpend: number | undefined
  theoreticalProfit: TheoreticalProfitResult | undefined
  previousPeriodData: PreviousPeriodData | undefined
  isLoading: boolean
  error: Error | null
}

// DailyBreakdownChart
interface DailyBreakdownChartProps {
  data: DailyMetrics[]
  periodType: 'week' | 'month'
  visibleSeries: string[]
  onSeriesToggle: (key: string) => void
  isLoading: boolean
}

// TheoreticalProfitCard
interface TheoreticalProfitCardProps {
  value: number | null
  breakdown: TheoreticalProfitBreakdown
  previousValue: number | null
  isComplete: boolean
  isLoading: boolean
}
```

---

## File Structure

```
src/
├── components/custom/dashboard/
│   ├── DashboardMetricsGrid.tsx        # NEW (62.1)
│   ├── OrdersMetricCard.tsx            # NEW (62.2)
│   ├── OrdersCogsMetricCard.tsx        # NEW (62.3)
│   ├── TheoreticalProfitCard.tsx       # NEW (62.4)
│   ├── AdvertisingMetricCard.tsx       # NEW (62.5)
│   ├── LogisticsMetricCard.tsx         # NEW (62.5)
│   ├── StorageMetricCard.tsx           # NEW (62.5)
│   ├── DailyBreakdownChart.tsx         # NEW (62.6)
│   ├── MetricLegend.tsx                # NEW (62.7)
│   ├── DailyMetricsTable.tsx           # NEW (62.8)
│   ├── ViewToggle.tsx                  # NEW (62.9)
│   ├── DailyBreakdownSection.tsx       # NEW (62.9)
│   └── index.ts                        # Barrel export
├── app/(dashboard)/dashboard/
│   └── components/
│       └── DashboardContent.tsx        # MODIFY
└── e2e/
    └── dashboard-metrics.spec.ts       # NEW (62.10)
```

---

## Sprint Allocation

| Sprint | Stories | SP | Focus |
|--------|---------|---:|-------|
| Sprint 1 | 62.1, 62.2, 62.3 | 7 | Core grid + Orders cards |
| Sprint 2 | 62.4, 62.5, 62.6 | 10 | Profit card + Expenses + Chart |
| Sprint 3 | 62.7, 62.8, 62.9, 62.10 | 10 | Legend + Table + Tests |

**Note**: Sprint 1 can start immediately. Sprints 2-3 depend on Epic 61-FE completion.

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Business metrics displayed | 4/8 | 8/8 | Visual audit |
| Daily breakdown visibility | None | Full | Feature completion |
| User understanding of profit | Low (no breakdown) | High | User testing |
| Time to analyze week | ~5 min (multiple screens) | < 1 min (single view) | User timing |
| Dashboard load time | ~1.5s | < 2.5s (with new data) | Performance monitoring |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Epic 61-FE delays block Sprint 2 | Medium | High | Start 62.1, 62.9, 62.10 in parallel |
| Chart performance with 31 days × 8 series | Low | Medium | Memoization, virtualization if needed |
| Information overload for users | Medium | Medium | Default to simplified view, expand on demand |
| Mobile layout complexity with 8 cards | Medium | Low | Progressive disclosure, collapsible sections |

---

## Definition of Done

- [ ] All acceptance criteria met for each story
- [ ] Components follow 200-line file limit
- [ ] TypeScript strict mode passes
- [ ] Russian locale for all user-facing text
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] E2E tests pass
- [ ] No ESLint errors
- [ ] Code review approved
- [ ] Visual QA with Chrome verification

---

## References

- **Epic 60-FE**: Dashboard UX Improvements (period context) - Completed
- **Epic 61-FE**: Dashboard Data Integration (API layer) - Ready
- **Design System**: `docs/front-end-spec.md`
- **Business Requirements**: Stakeholder diagram (2026-01-31)
- **Backend Docs**: `docs/request-backend/121-125-*.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
**Reviewers**: Frontend Team

# Epic 60-FE: Dashboard & Analytics UX Improvements

**Status**: ✅ Completed
**Priority**: P1 (High Value)
**Backend Epic**: N/A (Frontend only)
**Completion Date**: 2026-01-29
**Story Points**: 21 SP
**Stories**: 9

---

## Overview

### Problem Statement

The current dashboard (`/dashboard`) has significant UX issues that reduce user effectiveness:

1. **No period context** - Users cannot tell what time period the displayed metrics represent
2. **No period switching** - Cannot view previous week/month data for comparison
3. **Data duplication** - Same metrics shown twice (MetricCards + InitialDataSummary)
4. **Inconsistent period selectors** - AdvertisingWidget has separate selector (7d/14d/30d)
5. **No comparison indicators** - Missing change vs previous period context
6. **Poor visual hierarchy** - All metrics same size/weight

These issues were documented in the comprehensive UX analysis: `docs/ux-analysis/dashboard-improvement-plan.md`

### Solution

Implement unified period selection system with comparison indicators:

1. **Global Period Context** - Zustand store + URL params for period state
2. **DashboardPeriodSelector** - Unified month/week toggle component
3. **Enhanced MetricCard** - Cards with trend arrows and comparison badges
4. **Data Cleanup** - Remove duplicate displays, conditional CTA
5. **Widget Sync** - All widgets use global period state

### User Requirements (from stakeholder)

- Show metrics for **current month** with ability to switch to **previous month**
- By default show **current week** metrics with ability to switch to **previous week**
- Period context should be visible at all times
- Comparison with previous period should be shown

---

## Dependencies

| Type     | Dependency                                   | Status                       |
| -------- | -------------------------------------------- | ---------------------------- |
| Frontend | Existing `useAvailableWeeks` hook            | ✅ Available                 |
| Frontend | Existing `useDashboardMetrics` hook          | ✅ Available                 |
| Frontend | shadcn/ui Tabs, Select components            | ✅ Available                 |
| Backend  | `/v1/analytics/weekly/finance-summary?week=` | ✅ Supports week param       |
| Backend  | `/v1/analytics/weekly/expenses`              | ⚠️ Verify week param support |

**Note**: Backend API already supports week parameter for finance-summary. Verify expenses endpoint supports optional week filter.

---

## API Endpoints

All existing endpoints - no new backend work required:

| Method | Endpoint                               | Change Required                          |
| ------ | -------------------------------------- | ---------------------------------------- |
| GET    | `/v1/analytics/weekly/finance-summary` | None - already supports `?week=YYYY-Www` |
| GET    | `/v1/analytics/weekly/expenses`        | Verify `?week=` param support            |
| GET    | `/v1/analytics/weekly/margin-trends`   | None - verify highlight support          |
| GET    | `/v1/analytics/advertising`            | None - accepts date range                |

---

## New Routes

No new routes required. All changes are to existing `/dashboard` page.

---

## Components

### New Components (6)

| Component                 | Location                 | Purpose                           |  SP |
| ------------------------- | ------------------------ | --------------------------------- | --: |
| `DashboardPeriodProvider` | `src/contexts/`          | React context for period state    |   3 |
| `DashboardPeriodSelector` | `src/components/custom/` | Unified week/month toggle         |   3 |
| `MetricCardEnhanced`      | `src/components/custom/` | Card with comparison indicators   |   3 |
| `PeriodContextLabel`      | `src/components/custom/` | "Обзор за: Неделя 5, 2026" header |   1 |
| `ComparisonBadge`         | `src/components/custom/` | +5.2% / -2.1% badge               |   - |
| `TrendIndicator`          | `src/components/custom/` | ↑/↓ arrow with color              |   - |

### Modified Components (4)

| Component                    | Change                                     |
| ---------------------------- | ------------------------------------------ |
| `page.tsx` (dashboard)       | Add PeriodProvider, use enhanced cards     |
| `AdvertisingDashboardWidget` | Remove local period selector, accept props |
| `InitialDataSummary`         | Remove duplicate metrics, conditional CTA  |
| `ExpenseChart`               | Accept week param from context             |

---

## Stories

### Story 60.1-FE: Dashboard Period State Management

**Estimate**: 3 SP

**Title**: Создать управление состоянием периода дашборда

**Description**:
Create React context and Zustand store for managing dashboard period selection state with URL synchronization.

**Acceptance Criteria**:

- [ ] Create `DashboardPeriodContext` with `periodType` (week/month), `selectedWeek`, `selectedMonth`
- [ ] Create `useDashboardPeriod` hook for consuming context
- [ ] Default to current completed week on load
- [ ] Sync to URL params (`?week=2026-W05&type=week`) for shareable links
- [ ] Persist `periodType` preference in localStorage
- [ ] Handle month-to-weeks conversion (month contains 4-5 weeks)
- [ ] Compute previous period automatically for comparison

**Technical Notes**:

- Use existing `useAvailableWeeks` hook for available weeks
- Use `nuqs` or manual URL sync with Next.js `useSearchParams`
- Store format: `{ periodType: 'week' | 'month', week: string, month: string }`

**File Structure**:

```
src/
├── contexts/
│   └── dashboard-period-context.tsx
├── hooks/
│   └── useDashboardPeriod.ts
└── stores/
    └── dashboardPeriodStore.ts (optional - Zustand)
```

---

### Story 60.2-FE: DashboardPeriodSelector Component

**Estimate**: 3 SP

**Title**: Создать компонент выбора периода

**Description**:
Build the unified `DashboardPeriodSelector` component with week/month toggle and refresh functionality.

**Acceptance Criteria**:

- [ ] Period type toggle (Неделя/Месяц) using shadcn/ui Tabs
- [ ] Week dropdown with available weeks (YYYY-Www format, Russian labels)
- [ ] Month dropdown derived from available weeks (Январь 2026, Декабрь 2025, etc.)
- [ ] Refresh button with last update time ("Обновлено: 5 мин назад")
- [ ] Loading state while fetching available weeks
- [ ] Responsive design: horizontal on desktop, stacked on mobile
- [ ] Disable future weeks/months

**Design Specs**:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Неделя][Месяц]  [Неделя 5, 2026 (27 янв — 02 фев) ▾]  [⟳] 5м  │
└─────────────────────────────────────────────────────────────────┘
```

- Tabs: shadcn/ui Tabs with red active indicator (#E53935)
- Dropdown: shadcn/ui Select with week/month options
- Refresh: IconButton with `RefreshCw` icon, gray (#757575)
- Last update: `text-muted-foreground` `text-sm`

**File**: `src/components/custom/DashboardPeriodSelector.tsx`

---

### Story 60.3-FE: Enhanced MetricCard with Comparison

**Estimate**: 3 SP

**Title**: Добавить индикаторы сравнения в MetricCard

**Description**:
Enhance `MetricCard` component to display comparison with previous period.

**Acceptance Criteria**:

- [ ] Accept `previousValue` prop for comparison
- [ ] Calculate percentage change: `((current - previous) / previous) * 100`
- [ ] Display trend arrow: ↑ (green #22C55E), ↓ (red #EF4444), — (gray #757575)
- [ ] Display percentage badge with background color
- [ ] Show absolute difference on hover tooltip ("vs 82 780 ₽")
- [ ] Support `format` prop: 'currency' | 'percentage' | 'number'
- [ ] Add optional `tooltip` prop explaining the metric
- [ ] Maintain existing loading/error states

**Design Specs**:

```
┌──────────────────────────────────────┐
│ 💰 К перечислению                    │
│                                      │
│      87 074,72 ₽                     │
│    ↑ +5,2%  (vs 82 780 ₽)            │
└──────────────────────────────────────┘
```

- Value: `text-2xl font-bold`
- Arrow: 16x16px, inline before percentage
- Badge: `text-xs px-1.5 py-0.5 rounded` with semantic bg color
- Previous value: `text-muted-foreground text-sm`

**Files**:

- `src/components/custom/MetricCardEnhanced.tsx` (new)
- `src/components/custom/TrendIndicator.tsx` (new helper)
- `src/components/custom/ComparisonBadge.tsx` (new helper)

---

### Story 60.4-FE: Connect Dashboard to Period State

**Estimate**: 2 SP

**Title**: Подключить дашборд к состоянию периода

**Description**:
Wire dashboard page and data-fetching hooks to use the global period selector.

**Acceptance Criteria**:

- [ ] Wrap dashboard page with `DashboardPeriodProvider`
- [ ] Modify `useDashboardMetrics` to accept optional `week` param
- [ ] Modify `useExpenses` hook (if separate) to accept `week` param
- [ ] Fetch both current and previous period data for comparison
- [ ] Pass period to `ExpenseChart` component
- [ ] Show loading skeletons during period switch
- [ ] Invalidate queries on period change

**Technical Notes**:

- Update query keys to include week: `['dashboard', 'metrics', week]`
- Use `useQueries` for parallel fetching of current + previous periods
- Caching: 60s staleTime (matches existing)

**Files**:

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/hooks/useDashboardMetrics.ts` (modify)

---

### Story 60.5-FE: Remove Data Duplication

**Estimate**: 2 SP

**Title**: Устранить дублирование данных

**Description**:
Refactor dashboard to eliminate duplicate metric displays and improve CTA logic.

**Acceptance Criteria**:

- [ ] Remove financial metrics from `InitialDataSummary` component
- [ ] Move product count to main metric card grid (6th card)
- [ ] Convert "Следующий шаг" CTA to conditional recommendation card
- [ ] Show CTA only when COGS coverage < 100%
- [ ] Keep success notification (toast instead of inline)
- [ ] Add COGS coverage metric card

**Before/After**:

```
BEFORE: Metrics shown twice (MetricCards + InitialDataSummary bottom)
AFTER: Single source of truth in main grid, conditional CTA
```

**New Metric Grid (6 cards)**:

1. К перечислению (with comparison)
2. Реализовано (with comparison)
3. Маржа % (with comparison)
4. Товаров (count)
5. COGS покрытие (X из Y)
6. Реклама ROAS (from AdvertisingWidget)

**Files**:

- `src/components/custom/InitialDataSummary.tsx` (refactor)
- `src/app/(dashboard)/dashboard/page.tsx`

---

### Story 60.6-FE: Sync Advertising Widget Period

**Estimate**: 2 SP

**Title**: Синхронизировать виджет рекламы с глобальным периодом

**Description**:
Remove local period selector from AdvertisingWidget, integrate with global period state.

**Acceptance Criteria**:

- [ ] Remove local period state (`selectedDays`) from widget
- [ ] Accept `dateRange` prop from dashboard context
- [ ] Map week to date range for API call (week start → week end)
- [ ] Update widget header to show inherited period context
- [ ] Fallback gracefully if no period provider (standalone usage)
- [ ] Keep widget usable on other pages without provider

**Technical Notes**:

- Week to date conversion: Use `date-fns` `startOfISOWeek` / `endOfISOWeek`
- Backward compatible: Check for context, fallback to local state

**Breaking Change Alert**:
Widget loses independent period selector on dashboard.
Consider if this is acceptable for product requirements.

**Files**:

- `src/components/custom/AdvertisingDashboardWidget.tsx`

---

### Story 60.7-FE: Period Context Label

**Estimate**: 1 SP

**Title**: Добавить метку контекста периода

**Description**:
Display current period and last refresh time in dashboard header.

**Acceptance Criteria**:

- [ ] Week format: "Обзор за: Неделя 5, 2026 (27 янв — 02 фев)"
- [ ] Month format: "Обзор за: Январь 2026"
- [ ] Last refresh: "Обновлено: 5 мин назад" (using `date-fns` `formatDistanceToNow`)
- [ ] Responsive: Inline on desktop, stacked on mobile
- [ ] Update refresh time every minute

**Design**:

```
Главная страница
Обзор за: Неделя 5, 2026 (27 янв — 02 фев) • Обновлено: 5 мин назад
```

**File**: `src/components/custom/PeriodContextLabel.tsx`

---

### Story 60.8-FE: Improve Empty & Loading States

**Estimate**: 2 SP

**Title**: Улучшить состояния загрузки и пустые состояния

**Description**:
Add skeleton loading for period switch and improve empty states.

**Acceptance Criteria**:

- [ ] Add skeleton loaders for metric cards during period switch
- [ ] Animate metric value transitions (fade or count-up)
- [ ] Improve TrendGraph empty state (illustration instead of alert)
- [ ] Add loading shimmer to ExpenseChart during refetch
- [ ] Show "Нет данных за этот период" for weeks with no data

**Files**:

- `src/components/custom/MetricCardEnhanced.tsx`
- `src/components/custom/TrendGraph.tsx`
- `src/components/custom/ExpenseChart.tsx`

---

### Story 60.9-FE: E2E Tests for Period Switching

**Estimate**: 3 SP

**Title**: E2E тесты переключения периода

**Description**:
Create Playwright E2E tests for new period functionality.

**Acceptance Criteria**:

- [ ] Test: Switch from week to month view
- [ ] Test: Select previous week, verify metrics update
- [ ] Test: URL updates with period params
- [ ] Test: Page reload preserves selected period
- [ ] Test: Comparison indicators show correct values
- [ ] Test: Refresh button triggers data refetch
- [ ] Test: Loading states appear during transition
- [ ] Accessibility: Keyboard navigation for selector

**File**: `e2e/dashboard-period.spec.ts`

---

## Technical Notes

### State Management Architecture

```typescript
// src/contexts/dashboard-period-context.tsx

export type PeriodType = 'week' | 'month'

export interface DashboardPeriodState {
  periodType: PeriodType
  selectedWeek: string         // "2026-W05"
  selectedMonth: string        // "2026-01"
  previousWeek: string         // "2026-W04" (computed)
  previousMonth: string        // "2025-12" (computed)
  lastRefresh: Date
}

export interface DashboardPeriodActions {
  setPeriodType: (type: PeriodType) => void
  setWeek: (week: string) => void
  setMonth: (month: string) => void
  refresh: () => void
}
```

### URL Synchronization

```typescript
// URL format: /dashboard?week=2026-W05&type=week
// Use nuqs or manual implementation

const [week, setWeek] = useQueryState('week', {
  defaultValue: getCurrentWeek(),
})
const [type, setType] = useQueryState('type', {
  defaultValue: 'week',
})
```

### Comparison Calculation

```typescript
function calculateComparison(current: number, previous: number) {
  if (previous === 0) return { change: 0, direction: 'neutral' }

  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'

  return { change, direction }
}
```

### Caching Strategy

```typescript
// Parallel fetching for current + previous periods
const currentQuery = useQuery({
  queryKey: ['dashboard', 'metrics', selectedWeek],
  queryFn: () => getDashboardMetrics(selectedWeek),
  staleTime: 60 * 1000, // 1 min
})

const previousQuery = useQuery({
  queryKey: ['dashboard', 'metrics', previousWeek],
  queryFn: () => getDashboardMetrics(previousWeek),
  staleTime: 5 * 60 * 1000, // 5 min (historical data changes less)
})
```

---

## User Flow

```
1. User opens /dashboard
2. System loads with current week selected (default)
3. Dashboard shows metrics with comparison vs W-1
4. User clicks [Месяц] tab
5. System switches to month view, aggregates week data
6. User selects "Декабрь 2025" from dropdown
7. System fetches December metrics + November for comparison
8. All widgets update: MetricCards, ExpenseChart, TrendGraph
9. User clicks refresh button
10. System refetches all data, updates "Обновлено" timestamp
11. User shares URL with colleague
12. Colleague opens URL, sees exact same period selected
```

---

## File Structure

```
src/
├── contexts/
│   └── dashboard-period-context.tsx     # NEW
├── hooks/
│   ├── useDashboardPeriod.ts            # NEW
│   └── useDashboardMetrics.ts           # MODIFY (add week param)
├── components/custom/
│   ├── DashboardPeriodSelector.tsx      # NEW
│   ├── MetricCardEnhanced.tsx           # NEW
│   ├── TrendIndicator.tsx               # NEW
│   ├── ComparisonBadge.tsx              # NEW
│   ├── PeriodContextLabel.tsx           # NEW
│   ├── AdvertisingDashboardWidget.tsx   # MODIFY
│   └── InitialDataSummary.tsx           # MODIFY
├── app/(dashboard)/dashboard/
│   └── page.tsx                         # MODIFY
└── e2e/
    └── dashboard-period.spec.ts         # NEW
```

---

## Success Metrics

| Metric                    | Current              | Target                 | Measurement            |
| ------------------------- | -------------------- | ---------------------- | ---------------------- |
| Time to understand period | Unknown (no context) | < 2 sec                | User testing           |
| Clicks to switch period   | N/A                  | 1 click                | Analytics              |
| Screen utilization        | ~60% duplicate       | 100% unique            | Code audit             |
| User confusion reports    | Baseline TBD         | -50%                   | Support tickets        |
| Page load time            | ~1.5s                | < 2s (with comparison) | Performance monitoring |

---

## Risks & Mitigations

| Risk                                                 | Probability | Impact | Mitigation                                     |
| ---------------------------------------------------- | ----------- | ------ | ---------------------------------------------- |
| Backend expenses API doesn't support week param      | Low         | Medium | Verify early, request backend change if needed |
| Performance regression (2x API calls for comparison) | Medium      | Medium | Aggressive caching, parallel fetching          |
| User confusion during transition                     | Medium      | Low    | "Что нового" tooltip on first visit            |
| Breaking advertising widget on other pages           | Low         | Medium | Backward-compatible context check              |

---

## Sprint Allocation (Suggested)

| Sprint   | Stories          |  SP | Focus                              |
| -------- | ---------------- | --: | ---------------------------------- |
| Sprint 1 | 60.1, 60.2, 60.3 |   9 | State management + core components |
| Sprint 2 | 60.4, 60.5, 60.6 |   6 | Integration + cleanup              |
| Sprint 3 | 60.7, 60.8, 60.9 |   6 | Polish + testing                   |

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

---

## References

- **UX Analysis**: `docs/ux-analysis/dashboard-improvement-plan.md`
- **Design System**: `docs/front-end-spec.md` (Section: Component Library)
- **Current Dashboard**: `src/app/(dashboard)/dashboard/page.tsx`
- **API Reference**: `/test-api/05-analytics-basic.http`

---

**Created**: 2026-01-29
**Last Updated**: 2026-01-29

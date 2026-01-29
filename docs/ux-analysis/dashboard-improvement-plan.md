# Dashboard UX Improvement Plan

**Document Version:** 1.0
**Date:** 2026-01-29
**Author:** UX Analysis
**Status:** Ready for Review

---

## Executive Summary

This document provides a comprehensive UX analysis of the current dashboard (`/dashboard`) and proposes improvements focused on adding unified period selection (month/week) and eliminating data duplication.

---

## 1. Current Issues List

### Critical Issues (P0)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No period context** - Users cannot tell what time period the metrics represent | MetricCard components | Users confused about data relevance |
| 2 | **Data duplication** - Same metrics shown twice (MetricCards + InitialDataSummary) | page.tsx lines 132-145 + InitialDataSummary | Wasted screen space, confusing |
| 3 | **No period switching** - Cannot view previous week/month data | Entire dashboard | Limited historical analysis |
| 4 | **Inconsistent period selectors** - AdvertisingWidget has its own selector (7d/14d/30d) | AdvertisingDashboardWidget | Fragmented UX, cognitive load |

### Important Issues (P1)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 5 | **No comparison indicators** - No change vs previous period | MetricCard | Missing context for performance |
| 6 | **Poor visual hierarchy** - All metrics same size/weight | MetricCards grid | Hard to identify key metrics |
| 7 | **No refresh indicator** - No way to know data freshness | Dashboard header | Uncertain data currency |
| 8 | **Empty trends state** - Shows alert when no trend data | TrendGraph | Cluttered empty state |

### Nice-to-Have Issues (P2)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 9 | **No tooltips** - Metric titles not explained | MetricCard | New users confused |
| 10 | **No data last updated time** - When was data refreshed? | Dashboard | Trust issues |
| 11 | **CTA always visible** - "Следующий шаг" shown even for mature users | InitialDataSummary | Noise for experienced users |

---

## 2. Improvements List (Prioritized)

### P0 - Critical (Must Have)

| ID | Improvement | Effort | Business Value |
|----|-------------|--------|----------------|
| IMP-1 | Add unified `DashboardPeriodSelector` component | 3 SP | Enables period switching |
| IMP-2 | Add period context label to dashboard header | 1 SP | User orientation |
| IMP-3 | Remove `InitialDataSummary` data duplication | 2 SP | Cleaner layout |
| IMP-4 | Pass selected period to all dashboard components | 3 SP | Consistent data |
| IMP-5 | Sync AdvertisingWidget with global period | 2 SP | Unified experience |

### P1 - Important

| ID | Improvement | Effort | Business Value |
|----|-------------|--------|----------------|
| IMP-6 | Add comparison indicators (vs previous period) | 3 SP | Performance context |
| IMP-7 | Redesign MetricCard with trend arrow | 2 SP | Better visual feedback |
| IMP-8 | Add last refresh timestamp + manual refresh button | 1 SP | Data trust |
| IMP-9 | Improve empty states with illustrations | 2 SP | Better onboarding |

### P2 - Nice to Have

| ID | Improvement | Effort | Business Value |
|----|-------------|--------|----------------|
| IMP-10 | Add metric tooltips with formula explanations | 1 SP | User education |
| IMP-11 | Conditional CTA based on COGS coverage | 1 SP | Reduced noise |
| IMP-12 | Add skeleton loading for period switch | 1 SP | Perceived performance |

---

## 3. Component Specifications

### 3.1 DashboardPeriodSelector Component

```typescript
// src/components/custom/DashboardPeriodSelector.tsx

export type PeriodType = 'week' | 'month'

export interface DashboardPeriodSelectorProps {
  /** Current period type */
  periodType: PeriodType
  /** Selected week (YYYY-Www format) */
  selectedWeek: string
  /** Selected month (YYYY-MM format) */
  selectedMonth: string
  /** Callback when period type changes */
  onPeriodTypeChange: (type: PeriodType) => void
  /** Callback when week changes */
  onWeekChange: (week: string) => void
  /** Callback when month changes */
  onMonthChange: (month: string) => void
  /** Show refresh button (default: true) */
  showRefresh?: boolean
  /** Callback when refresh is clicked */
  onRefresh?: () => void
  /** Is data loading */
  isLoading?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Unified period selector for dashboard
 * Features:
 * - Toggle between Week/Month view
 * - Week selector with available weeks
 * - Month selector (derived from weeks)
 * - Last refresh timestamp
 * - Manual refresh button
 */
```

### 3.2 Enhanced MetricCard Component

```typescript
// src/components/custom/MetricCardEnhanced.tsx

export interface MetricCardEnhancedProps {
  /** Card title */
  title: string
  /** Current period value */
  value: number | undefined
  /** Previous period value (for comparison) */
  previousValue?: number | undefined
  /** Format type */
  format?: 'currency' | 'percentage' | 'number'
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Tooltip text explaining the metric */
  tooltip?: string
  /** Icon to display */
  icon?: React.ReactNode
  /** Value color variant */
  variant?: 'default' | 'positive' | 'negative' | 'neutral'
  /** Additional class names */
  className?: string
}

/**
 * Enhanced metric card with comparison
 * Features:
 * - Trend indicator (arrow up/down)
 * - Percentage change badge
 * - Color coding for positive/negative
 * - Tooltip with metric explanation
 * - Icon support
 */
```

### 3.3 PeriodContextLabel Component

```typescript
// src/components/custom/PeriodContextLabel.tsx

export interface PeriodContextLabelProps {
  /** Period type */
  periodType: 'week' | 'month'
  /** Selected week (YYYY-Www) */
  week?: string
  /** Selected month (YYYY-MM) */
  month?: string
  /** Last data refresh time */
  lastRefresh?: Date
  /** Show refresh indicator */
  showRefreshTime?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Displays current period context
 * Example outputs:
 * - "Обзор за: Неделя 5, 2026 (27 янв — 02 фев)"
 * - "Обзор за: Январь 2026"
 * - "Данные обновлены: 5 мин назад"
 */
```

---

## 4. Layout Proposal

### 4.1 Current Layout (Problems Highlighted)

```
┌─────────────────────────────────────────────────────────────────┐
│ Главная страница                           [NO PERIOD SELECTOR] │
│ Обзор ваших данных и ключевых метрик       [NO PERIOD CONTEXT]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌────────────────────────┐ ┌────────────────────────┐          │
│ │ К перечислению за товар│ │ Вайлдберриз реализовал │          │
│ │      87 074,72 ₽       │ │     126 922,45 ₽       │          │
│ │    [NO COMPARISON]     │ │    [NO COMPARISON]     │ ←DUPLICATE│
│ └────────────────────────┘ └────────────────────────┘          │
│                                                                 │
│ ┌───────────────────────────────────────────────────┐          │
│ │ Реклама              [7 дней ▾] ← SEPARATE PERIOD │          │
│ │ Продажи: 93К  Органика: 53%  ROAS: 10.9x         │          │
│ └───────────────────────────────────────────────────┘          │
│                                                                 │
│ ┌───────────────────────────────────────────────────┐          │
│ │ Разбивка расходов (Bar Chart)                    │          │
│ └───────────────────────────────────────────────────┘          │
│                                                                 │
│ ┌───────────────────────────────────────────────────┐          │
│ │ Тренды ключевых метрик                           │          │
│ │ [Нет данных - показывает Alert]                  │          │
│ └───────────────────────────────────────────────────┘          │
│                                                                 │
│ ┌────────────────────────┐ ┌────────────────────────┐          │
│ │ Товары: 57            │ │ Финансовые показатели  │ ←DUPLICATE│
│ │                       │ │ К перечислению: 87К    │          │
│ │                       │ │ Реализовал: 126К       │          │
│ └────────────────────────┘ └────────────────────────┘          │
│                                                                 │
│ ┌───────────────────────────────────────────────────┐          │
│ │ Следующий шаг: Назначить COGS                    │ ← ALWAYS  │
│ └───────────────────────────────────────────────────┘   SHOWN  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Proposed New Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Главная страница                                                │
│ Обзор за: Январь 2026, Неделя 5    [Месяц ▾][Неделя ▾] [⟳ 5м]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 💰 К перечислению│ │ 📈 Реализовано   │ │ 📊 Маржа         │ │
│ │    87 074,72 ₽   │ │   126 922,45 ₽   │ │     31,4%        │ │
│ │   ↑ +5,2% W-1    │ │   ↓ -2,1% W-1    │ │   ↑ +0,3% W-1    │ │
│ │   (vs 82 780 ₽)  │ │  (vs 129 645 ₽)  │ │   (vs 31,1%)     │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 📦 Товаров       │ │ 🎯 COGS покрытие │ │ 📢 Реклама       │ │
│ │       57         │ │      68%         │ │   ROAS: 10,9x    │ │
│ │   +3 новых       │ │  39 из 57        │ │   Органика: 53%  │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Разбивка расходов за выбранный период                     │  │
│ │ [Bar Chart - same as current]                             │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Тренды ключевых метрик (8 недель)        [Подробнее →]    │  │
│ │ [Line Chart with current week highlighted]                │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 💡 Рекомендация: Назначьте COGS для 18 товаров           │  │
│ │    для полного анализа маржинальности    [Назначить →]    │  │
│ └───────────────────────────────────────────────────────────┘  │
│ ↑ Only shown when COGS coverage < 100%                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Stories

### Story 1: Dashboard Period State Management (3 SP)

**Title:** Implement dashboard period state management

**Description:**
Create React context and hooks for managing dashboard period selection state.

**Acceptance Criteria:**
- [ ] Create `DashboardPeriodContext` with week/month state
- [ ] Default to current week on load
- [ ] Persist selected period in URL params (`?week=2026-W05`)
- [ ] Create `useDashboardPeriod` hook for components
- [ ] Handle month-to-weeks conversion

**Technical Notes:**
- Use existing `useAvailableWeeks` hook
- Store period type preference in localStorage
- URL sync for shareable links

---

### Story 2: DashboardPeriodSelector Component (3 SP)

**Title:** Create unified period selector component

**Description:**
Build the `DashboardPeriodSelector` component with week/month toggle.

**Acceptance Criteria:**
- [ ] Period type toggle (Неделя/Месяц tabs)
- [ ] Week dropdown using available weeks
- [ ] Month dropdown (derived from weeks)
- [ ] Refresh button with last update time
- [ ] Loading state while fetching weeks
- [ ] Responsive design (stacked on mobile)

**Design Reference:**
- Use existing `WeekSelector` pattern
- shadcn/ui Tabs for period type toggle
- Gray refresh icon, timestamp in muted text

---

### Story 3: Enhanced MetricCard with Comparison (3 SP)

**Title:** Add comparison indicators to MetricCard

**Description:**
Enhance `MetricCard` to show change vs previous period.

**Acceptance Criteria:**
- [ ] Accept `previousValue` prop
- [ ] Calculate and display percentage change
- [ ] Green arrow up for positive change
- [ ] Red arrow down for negative change
- [ ] Gray dash for no change
- [ ] Show absolute difference on hover
- [ ] Add tooltip explaining metric

**Design Specs:**
- Arrow: 16x16px, positioned after value
- Change badge: `text-xs`, green/red background
- Tooltip: shadcn/ui Tooltip component

---

### Story 4: Connect Dashboard to Period State (2 SP)

**Title:** Wire dashboard components to period selector

**Description:**
Pass selected period to all dashboard data-fetching components.

**Acceptance Criteria:**
- [ ] `useDashboardMetrics` accepts week parameter
- [ ] `ExpenseChart` uses selected week
- [ ] `TrendGraph` highlights selected week
- [ ] Components refetch on period change
- [ ] Loading states during period switch

**Technical Notes:**
- Modify existing hooks to accept optional week param
- Use query key with week for proper caching

---

### Story 5: Remove Data Duplication (2 SP)

**Title:** Clean up InitialDataSummary duplication

**Description:**
Refactor dashboard to eliminate duplicate metric display.

**Acceptance Criteria:**
- [ ] Remove financial metrics from `InitialDataSummary`
- [ ] Keep product count in summary (move to main grid)
- [ ] Convert CTA to conditional recommendation card
- [ ] Show CTA only when COGS coverage < 100%
- [ ] Keep success notification (dismissible)

**Before/After:**
- Before: Metrics shown twice
- After: Metrics in main grid only, CTA conditional

---

### Story 6: Sync Advertising Widget Period (2 SP)

**Title:** Integrate advertising widget with global period

**Description:**
Remove local period selector from AdvertisingWidget, use global.

**Acceptance Criteria:**
- [ ] Remove local period state from widget
- [ ] Accept period from dashboard context
- [ ] Map week to date range for API call
- [ ] Update widget header to show period context
- [ ] Fallback gracefully if no period provided

**Breaking Change:**
- Widget loses independent period selector
- Must be wrapped in DashboardPeriodProvider

---

### Story 7: Period Context Label (1 SP)

**Title:** Add period context to dashboard header

**Description:**
Show current period and last refresh time in header.

**Acceptance Criteria:**
- [ ] Display format: "Обзор за: Неделя 5, 2026 (27 янв — 02 фев)"
- [ ] Month format: "Обзор за: Январь 2026"
- [ ] Last refresh: "Обновлено: 5 мин назад"
- [ ] Responsive: Stack on mobile

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DashboardPeriodProvider                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ State: { periodType, selectedWeek, selectedMonth }      │   │
│  │ URL Sync: ?week=2026-W05&type=week                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                    useDashboardPeriod()                         │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ MetricCards │    │ExpenseChart │    │  TrendGraph │        │
│  │ week param  │    │ week param  │    │ week param  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │useDashboard │    │ useExpenses │    │  useTrends  │        │
│  │Metrics(week)│    │   (week)    │    │   (weeks)   │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                    │                    │            │
│         └────────────────────┼────────────────────┘            │
│                              ▼                                  │
│                    Backend API (week param)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. API Changes Required

### Backend Endpoints to Verify

| Endpoint | Current | Required Change |
|----------|---------|-----------------|
| `/v1/analytics/weekly/finance-summary` | `?week=YYYY-Www` | No change needed |
| `/v1/analytics/weekly/expenses` | Uses latest week | Add optional `?week=` param |
| `/v1/analytics/weekly/margin-trends` | `?weeks=N` | Verify selected week highlighting |

### New Frontend API Functions

```typescript
// src/lib/api/dashboard.ts

/** Fetch metrics for specific week */
export async function getDashboardMetrics(week?: string): Promise<DashboardMetrics>

/** Fetch expenses for specific week */
export async function getExpenses(week?: string): Promise<ExpenseData>

/** Get available months (derived from weeks) */
export async function getAvailableMonths(): Promise<MonthOption[]>
```

---

## 8. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to understand period | Unknown | < 2 sec | User testing |
| Clicks to switch period | N/A | 1 click | Analytics |
| Screen utilization | ~60% duplicate | 100% unique | Code review |
| User confusion reports | TBD | -50% | Support tickets |

---

## 9. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Backend API doesn't support week param | Low | High | Verify endpoints early |
| Performance regression with more API calls | Medium | Medium | Add loading skeletons, cache aggressively |
| User confusion during transition | Medium | Low | Add "What's new" tooltip on first visit |

---

## 10. Next Steps

1. **Review** - Get stakeholder approval on proposed layout
2. **Backend verification** - Confirm API parameters work as expected
3. **Sprint planning** - Add stories to backlog (estimated 19 SP total)
4. **Design review** - Create Figma mockups for new components
5. **Implementation** - Start with Story 1 (state management)

---

**Document History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-29 | Initial analysis | UX Analysis |

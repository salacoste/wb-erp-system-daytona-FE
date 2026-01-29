# Epic 51-FE: FBS Historical Analytics UI (365 Days)

**Status**: 📋 Ready for Dev
**Priority**: P2 (Enhancement)
**Backend Epic**: Epic 51
**Story Points**: 39 SP
**Stories**: 12

---

## Overview

Implement FBS Historical Analytics with 365-day range support. This epic introduces tiered resolution analytics from multiple data sources with seasonal pattern analysis.

### Problem Statement

- OrdersFBS API stores only 30 days of data
- Users need year-long analytics for business planning
- No seasonal pattern analysis exists
- No period comparison functionality

### Solution

- New `/analytics/orders` page with 365-day range
- Tiered resolution: daily (0-90d) → weekly (91-365d)
- Seasonal patterns visualization (monthly/weekly/quarterly)
- Period comparison (MoM, QoQ, YoY)
- Admin backfill management (Owner only)

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Backend | Epic 51 complete | ✅ Complete |
| Backend | `/v1/analytics/orders/trends` | ✅ Complete |
| Backend | `/v1/analytics/orders/seasonal` | ✅ Complete |
| Backend | `/v1/analytics/orders/compare` | ✅ Complete |
| Backend | `/v1/admin/backfill/*` | ✅ Complete |
| Frontend | None (independent) | - |

---

## API Endpoints

### Analytics Endpoints (Public)

| Method | Endpoint | Purpose | Cache TTL |
|--------|----------|---------|-----------|
| GET | `/v1/analytics/orders/trends` | Historical trends | 5 min |
| GET | `/v1/analytics/orders/seasonal` | Seasonal patterns | 5 min |
| GET | `/v1/analytics/orders/compare` | Period comparison | 5 min |

### Admin Endpoints (Owner Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/admin/backfill/start` | Start historical import |
| GET | `/v1/admin/backfill/status` | Get progress |
| POST | `/v1/admin/backfill/pause` | Pause backfill |
| POST | `/v1/admin/backfill/resume` | Resume backfill |

### Tiered Resolution Strategy

| Period | Source | Resolution | Badge |
|--------|--------|------------|-------|
| 0-30 days | OrdersFBS API | Real-time/Daily | "Реалтайм" |
| 31-90 days | Reports API | Daily | "Ежедневно" |
| 91-365 days | Analytics API | Weekly | "Еженедельно" |

---

## New Routes

| Route | Page | Access |
|-------|------|--------|
| `/analytics/orders` | FBS Orders Analytics | All roles |
| `/settings/backfill` | Backfill Admin | Owner only |

---

## Components

### Analytics Components (8)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `FbsTrendsChart` | Line chart (orders/revenue/cancellations) | High |
| `SeasonalPatternsChart` | Bar charts (monthly/weekly/quarterly) | Medium |
| `PeriodComparisonTable` | Side-by-side with deltas | Medium |
| `DataSourceIndicator` | Source badges | Low |
| `AggregationToggle` | Day/Week/Month switcher | Low |
| `DateRangePickerExtended` | 365-day picker with presets | Medium |
| `SeasonalInsightsCard` | Peak/low insights | Low |
| `TrendsSummaryCards` | Total, avg, rates | Medium |

### Admin Components (4)

| Component | Purpose |
|-----------|---------|
| `BackfillProgressBar` | Progress with ETA |
| `BackfillControlButtons` | Start/Pause/Resume |
| `BackfillStatusTable` | Cabinet list |
| `BackfillErrorLog` | Error display |

---

## Stories

### Story 51.1-FE: Types & API Module
**Estimate**: 2 SP

**Scope**:
- Create `src/types/fbs-analytics.ts`
- Create `src/lib/api/fbs-analytics.ts`

**Acceptance Criteria**:
- [ ] All TypeScript interfaces
- [ ] API functions for 4+ endpoints
- [ ] Query params types

---

### Story 51.2-FE: FBS Analytics Hooks
**Estimate**: 3 SP

**Scope**:
- `useFbsTrends` hook
- `useFbsSeasonal` hook
- `useFbsCompare` hook

**Acceptance Criteria**:
- [ ] Hooks with proper caching (5 min staleTime)
- [ ] Date range params handling
- [ ] Error states

---

### Story 51.3-FE: Extended Date Range Picker
**Estimate**: 3 SP

**Scope**:
- `DateRangePickerExtended` component
- 365-day support
- Presets: 30d, 90d, 180d, 365d

**Acceptance Criteria**:
- [ ] Max range validation (365 days)
- [ ] Preset buttons
- [ ] Auto-suggest aggregation
- [ ] Russian locale

---

### Story 51.4-FE: FBS Trends Chart
**Estimate**: 5 SP

**Scope**:
- `FbsTrendsChart` with multi-line
- Orders, revenue, cancellations
- `DataSourceIndicator`

**Acceptance Criteria**:
- [ ] Line chart with 3 metrics
- [ ] Toggle metrics visibility
- [ ] Data source badge
- [ ] Responsive
- [ ] Tooltip on hover

---

### Story 51.5-FE: Trends Summary Cards
**Estimate**: 2 SP

**Scope**:
- `TrendsSummaryCards` component
- Total orders, revenue, avg daily, rates

**Acceptance Criteria**:
- [ ] 4-6 metric cards
- [ ] Trend indicators (↑↓)
- [ ] Formatted numbers (Russian)

---

### Story 51.6-FE: Seasonal Patterns Components
**Estimate**: 5 SP

**Scope**:
- `SeasonalPatternsChart` with tabs
- `SeasonalInsightsCard`
- Monthly/weekly/quarterly views

**Acceptance Criteria**:
- [ ] Bar charts per pattern type
- [ ] Tab navigation
- [ ] Peak/low highlighting
- [ ] Seasonality index display

---

### Story 51.7-FE: Period Comparison UI
**Estimate**: 3 SP

**Scope**:
- `PeriodComparisonTable`
- Period selectors
- Delta values and %

**Acceptance Criteria**:
- [ ] Two period pickers
- [ ] Comparison table
- [ ] Green/red delta colors
- [ ] Percentage change

---

### Story 51.8-FE: FBS Orders Analytics Page
**Estimate**: 5 SP

**Scope**:
- `/analytics/orders` page
- Tab navigation (Trends/Seasonal/Compare)
- Integration of all components

**Acceptance Criteria**:
- [ ] Page with 3 tabs
- [ ] Date range picker
- [ ] Loading skeletons
- [ ] Error states

---

### Story 51.9-FE: Analytics Hub Integration
**Estimate**: 1 SP

**Scope**:
- Add "Заказы FBS" card to Analytics Hub

**Acceptance Criteria**:
- [ ] Navigation card
- [ ] Icon and description
- [ ] Link to /analytics/orders

---

### Story 51.10-FE: Backfill Admin Types & Hooks
**Estimate**: 2 SP

**Scope**:
- Backfill types
- `useBackfillStatus`, `useBackfillMutations`

**Acceptance Criteria**:
- [ ] Types for backfill API
- [ ] Polling hook (10s interval)
- [ ] Mutations for start/pause/resume

---

### Story 51.11-FE: Backfill Admin Page
**Estimate**: 5 SP

**Scope**:
- `/settings/backfill` page (Owner only)
- Progress tracking
- Control buttons

**Acceptance Criteria**:
- [ ] Owner role check
- [ ] Cabinet list with statuses
- [ ] Progress bars
- [ ] Start/Pause/Resume buttons
- [ ] Error log display

---

### Story 51.12-FE: E2E Tests
**Estimate**: 3 SP

**Scope**:
- Playwright tests for analytics
- Playwright tests for backfill

**Acceptance Criteria**:
- [ ] Trends page test
- [ ] Seasonal patterns test
- [ ] Backfill flow test (Owner)
- [ ] Permission denied test (non-Owner)

---

## Technical Notes

### Smart Aggregation Logic

```typescript
function getSmartAggregation(daysDiff: number): 'day' | 'week' | 'month' {
  if (daysDiff <= 90) return 'day'
  if (daysDiff <= 180) return 'week'
  return 'month'
}
```

### Caching Strategy

```typescript
const FBS_ANALYTICS_CACHE = {
  staleTime: 5 * 60 * 1000,   // 5 min (matches backend)
  gcTime: 30 * 60 * 1000,     // 30 min
}
```

### Role-Based Access

| Feature | Analyst | Manager | Owner |
|---------|---------|---------|-------|
| View trends | ✅ | ✅ | ✅ |
| View seasonal | ✅ | ✅ | ✅ |
| Backfill admin | ❌ | ❌ | ✅ |

---

## File Structure

```
src/
├── types/
│   └── fbs-analytics.ts
├── lib/api/
│   └── fbs-analytics.ts
├── hooks/
│   ├── useFbsTrends.ts
│   ├── useFbsSeasonal.ts
│   ├── useFbsCompare.ts
│   ├── useBackfillStatus.ts
│   └── useBackfillMutations.ts
├── app/(dashboard)/analytics/orders/
│   ├── page.tsx
│   ├── loading.tsx
│   └── components/
│       ├── FbsTrendsChart.tsx
│       ├── SeasonalPatternsChart.tsx
│       └── ...
└── app/(dashboard)/settings/backfill/
    ├── page.tsx
    └── components/
        ├── BackfillProgressBar.tsx
        └── ...
```

---

## Sprint Allocation

| Sprint | Stories | SP |
|--------|---------|---:|
| Sprint 1 | 51.1, 51.2, 51.3, 51.4, 51.5 | 15 |
| Sprint 2 | 51.6, 51.7, 51.8, 51.9 | 14 |
| Sprint 3 | 51.10, 51.11, 51.12 | 10 |

---

**Created**: 2026-01-29
**Last Updated**: 2026-01-29

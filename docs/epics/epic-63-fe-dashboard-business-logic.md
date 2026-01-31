# Epic 63-FE: Dashboard Business Logic Completion

**Status**: ✅ Complete
**Priority**: P1 (High)
**Sprint**: 14
**Total Points**: 36 SP
**Stories**: 12 (all complete)
**Completion Date**: 2026-01-31

---

## Overview

Epic 63-FE completes the remaining business logic for the main dashboard page. While Epic 61-FE established the data integration layer and Epic 62-FE created the 8-card metrics grid with chart/table views, Epic 63-FE fills the remaining gaps identified in backend API documentation:

- Sales (Выкупы) metric cards using `wb_sales_gross`
- Enhanced advertising widgets with sync status and efficiency filters
- Storage analytics widgets with top consumers and trends
- Orders status breakdown and seasonal patterns
- Expense structure visualization
- Period comparison cards (WoW/MoM)
- Historical trends section

---

## Stories Summary

| Story | Title | Points | Priority | Status | Component |
|-------|-------|--------|----------|--------|-----------|
| 63.1-FE | Sales Metric Card (Выкупы) | 3 | P1 | ✅ Complete | SalesMetricCard.tsx (157 lines) |
| 63.2-FE | Sales COGS Metric Card | 3 | P1 | ✅ Complete | SalesCogsMetricCard.tsx (167 lines) |
| 63.3-FE | Advertising Sync Status Indicator | 3 | P2 | ✅ Complete | AdvertisingSyncStatusBadge.tsx (200 lines) |
| 63.4-FE | Advertising Efficiency Filter | 3 | P2 | ✅ Complete | EfficiencyFilterChips.tsx (157 lines) |
| 63.5-FE | Storage Top Consumers Widget | 3 | P2 | ✅ Complete | StorageTopConsumersWidget.tsx (194 lines) |
| 63.6-FE | Storage Trends Chart | 3 | P2 | ✅ Complete | StorageTrendsWidget.tsx + StorageTrendsChart.tsx |
| 63.7-FE | Orders Status Breakdown | 3 | P2 | ✅ Complete | OrdersStatusBreakdown.tsx (200 lines) |
| 63.8-FE | Orders Seasonal Patterns | 3 | P3 | ✅ Complete | OrdersSeasonalPatterns.tsx (175 lines) |
| 63.9-FE | Expense Structure Chart | 3 | P2 | ✅ Complete | ExpenseStructurePieChart.tsx (115 lines) |
| 63.10-FE | Unit Economics Enhancement | 3 | P2 | ✅ Complete | UnitEconomicsTable.tsx + helpers |
| 63.11-FE | Period Comparison Cards (WoW/MoM) | 3 | P1 | ✅ Complete | PeriodComparisonSection.tsx (170 lines) |
| 63.12-FE | Historical Trends Section | 3 | P3 | ✅ Complete | HistoricalTrendsSection.tsx (155 lines) |

**Total**: 36 Story Points (all complete)

---

## Story Details

### 63.1-FE: Sales Metric Card (Выкупы)
**File**: `docs/stories/epic-63/story-63.1-fe-sales-metric-card.md`

Implement the Sales Metric Card displaying `wb_sales_gross` (seller's actual revenue after WB commission). Critical distinction from `sales_gross` (retail price).

**Key API**: `GET /v1/analytics/weekly/finance-summary`

---

### 63.2-FE: Sales COGS Metric Card
**File**: `docs/stories/epic-63/story-63.2-fe-sales-cogs-metric-card.md`

COGS calculation for actual sales (vykypy), not orders. Uses `cogs_sales` from analytics API.

**Key API**: `GET /v1/analytics/weekly/finance-summary`

---

### 63.3-FE: Advertising Sync Status Indicator
**File**: `docs/stories/epic-63/story-63.3-fe-advertising-sync-status.md`

Visual indicator showing advertising data freshness:
- Fresh (<1h): Green
- Stale (1-24h): Yellow
- Outdated (>24h): Red

**Key API**: `GET /v1/advertising/sync/status`

---

### 63.4-FE: Advertising Efficiency Filter
**File**: `docs/stories/epic-63/story-63.4-fe-advertising-efficiency-filter.md`

Filter dashboard advertising data by efficiency tiers:
- ROAS ≥3.0: Green (Profitable)
- ROAS 1.5-3.0: Yellow (Moderate)
- ROAS <1.5: Red (Unprofitable)

**Key API**: `GET /v1/advertising/efficiency-filter`

---

### 63.5-FE: Storage Top Consumers Widget
**File**: `docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md`

Compact widget showing top 5-10 products by storage cost with storage-to-revenue ratio indicators.

**Key API**: `GET /v1/analytics/storage/top-consumers`

---

### 63.6-FE: Storage Trends Chart
**File**: `docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md`

Line/area chart visualizing storage cost trends over time with volume correlation.

**Key API**: `GET /v1/analytics/storage/trends`

---

### 63.7-FE: Orders Status Breakdown
**File**: `docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md`

Breakdown of FBS orders by status:
- `wb_pending`: Awaiting acceptance
- `wb_in_transit`: In delivery
- `wb_delivered`: Completed
- `wb_cancelled`: Cancelled

**Key API**: `GET /v1/orders/fbs/status-breakdown`

---

### 63.8-FE: Orders Seasonal Patterns
**File**: `docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md`

Visualization of order volume patterns by day-of-week and time-of-day for planning.

**Key API**: `GET /v1/orders/fbs/seasonal-patterns`

---

### 63.9-FE: Expense Structure Chart
**File**: `docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md`

Pie/donut chart showing expense distribution:
- COGS (blue)
- Advertising (orange)
- Logistics (green)
- Storage (purple)
- WB Commission (gray)

**Key API**: `GET /v1/analytics/weekly/finance-summary`

---

### 63.10-FE: Unit Economics Enhancement
**File**: `docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md`

Enhanced unit economics display with per-order and per-item breakdown of all cost components.

**Key API**: Aggregated from existing endpoints

---

### 63.11-FE: Period Comparison Cards (WoW/MoM)
**File**: `docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md`

Comparison widget with WoW/MoM toggle showing delta indicators for key metrics (Revenue, Profit, Margin, Orders, Logistics, Storage).

**Key API**: `GET /v1/analytics/weekly/comparison?period1={current}&period2={previous}`

---

### 63.12-FE: Historical Trends Section
**File**: `docs/stories/epic-63/story-63.12-fe-historical-trends-section.md`

Multi-metric line chart for historical trend visualization with customizable date ranges (4W, 8W, 12W, YTD).

**Key API**: `GET /v1/analytics/weekly/trends`

---

## Dependencies

### From Epic 61-FE (Complete)
- `useDashboardPeriod` hook
- `useFinancialSummary` hook
- `useAdvertisingAnalytics` hook
- `calculateTheoreticalProfit` utility
- ISO week utilities

### From Epic 62-FE (Complete)
- DashboardMetricsGrid component
- DailyBreakdownSection component
- Chart configuration and colors
- MetricCardStates (skeleton, error)

### Backend APIs Required
All APIs documented in `docs/request-backend/121-125`:
- `/v1/analytics/weekly/finance-summary`
- `/v1/analytics/weekly/comparison`
- `/v1/analytics/weekly/trends`
- `/v1/advertising/sync/status`
- `/v1/advertising/efficiency-filter`
- `/v1/analytics/storage/top-consumers`
- `/v1/analytics/storage/trends`
- `/v1/orders/fbs/status-breakdown`
- `/v1/orders/fbs/seasonal-patterns`

---

## Implementation Order

### Phase 1: Core Metrics (P1)
1. **63.1-FE**: Sales Metric Card (replaces Placeholder)
2. **63.2-FE**: Sales COGS Metric Card (replaces Placeholder)
3. **63.11-FE**: Period Comparison Cards

### Phase 2: Enhanced Widgets (P2)
4. **63.3-FE**: Advertising Sync Status
5. **63.4-FE**: Advertising Efficiency Filter
6. **63.5-FE**: Storage Top Consumers
7. **63.6-FE**: Storage Trends Chart
8. **63.7-FE**: Orders Status Breakdown
9. **63.9-FE**: Expense Structure Chart
10. **63.10-FE**: Unit Economics Enhancement

### Phase 3: Advanced Analytics (P3)
11. **63.8-FE**: Orders Seasonal Patterns
12. **63.12-FE**: Historical Trends Section

---

## Success Metrics

| Metric | Target |
|--------|--------|
| All 12 stories completed | 100% |
| TypeScript strict mode | 0 errors |
| ESLint | 0 warnings |
| Unit test coverage | >80% |
| E2E tests passing | 100% |
| Accessibility (WCAG 2.1 AA) | Compliant |
| Performance (LCP) | <2.5s |
| File size limit | <200 lines each |

---

## Related Documentation

- **Backend Specs**: `docs/request-backend/121-125-DASHBOARD-*.md`
- **Epic 61-FE**: Data Integration (Complete)
- **Epic 62-FE**: Dashboard UI/UX (Complete)
- **Design System**: `docs/front-end-spec.md`
- **API Guide**: `docs/api-integration-guide.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-31 | PM Team (Claude) | Epic created with 12 stories |
| 2026-01-31 | Dev Team | All 12 stories completed |

---

## Notes

This epic completed the dashboard business logic by implementing all remaining features identified in backend API documentation. All 12 stories have been implemented with:

- **Sales Cards**: SalesMetricCard and SalesCogsMetricCard using `wb_sales_gross` for actual seller revenue
- **Advertising Widgets**: Sync status badge with freshness indicators, efficiency filter chips with ROAS tiers
- **Storage Analytics**: Top consumers widget, trends chart with volume correlation
- **Orders Analytics**: Status breakdown (pending/transit/delivered/cancelled), seasonal patterns heatmap
- **Financial Analysis**: Expense structure pie chart, enhanced unit economics table
- **Comparison & Trends**: Period comparison cards (WoW/MoM), historical trends section (4W/8W/12W/YTD)

All components follow the 200-line file limit, use TypeScript strict mode, and integrate with Epic 61-FE data hooks and Epic 62-FE UI patterns.

# Dashboard Page Documentation

Dashboard page provides comprehensive financial analytics with period selection, key metrics, and trend visualization.

## Page Overview

**Route:** `/dashboard`

**Primary Features:**
- Period selector (day/week/month/custom date ranges)
- Real-time financial metrics display
- Trend graphs with historical data
- COGS and advertising coverage tracking
- Interactive data visualizations

## Key Components

### Period Selector
- **Component:** `DashboardPeriodSelector`
- **Location:** `src/components/custom/DashboardPeriodSelector.tsx`
- **Features:**
  - Day/Week/Month presets
  - Custom date range picker
  - Period context labels
  - Comparison views (previous period)

### Metric Cards
- **MetricCardEnhanced** - Enhanced metric display with trends
- **CogsCoverageMetricCard** - COGS coverage percentage
- **ProductCountMetricCard** - Total product count
- **ComparisonBadge** - Period-over-period comparison

### Visualizations
- **TrendGraph** - Historical trend charts
- **ExpenseChart** - Expense breakdown charts
- **AdvertisingDashboardWidget** - Advertising metrics widget

## Documentation Files

### Epic 60 Implementation
- [README](../../stories/epic-60/README.md) - Epic overview and goals
- [Implementation Plan](../../stories/epic-60/IMPLEMENTATION-PLAN-COGS-ADVERTISING-UX.md) - Detailed implementation strategy
- [Completion Summary](../../stories/epic-60/COMPLETION-SUMMARY.md) - Final status and achievements

### Stories
- [Story 60.1 - Period State Management](../../stories/epic-60/story-60.1-fe-period-state-management.md) - Zustand store for period state
- [Story 60.2 - Period Selector Component](../../stories/epic-60/story-60.2-fe-period-selector-component.md) - UI component for period selection
- [Story 60.3 - Enhanced Metric Card](../../stories/epic-60/story-60.3-fe-enhanced-metric-card.md) - Improved metric display
- [Story 60.4 - Connect Dashboard Period](../../stories/epic-60/story-60.4-fe-connect-dashboard-period.md) - Period integration
- [Story 60.5 - Remove Data Duplication](../../stories/epic-60/story-60.5-fe-remove-data-duplication.md) - Code optimization
- [Story 60.6 - Sync Advertising Widget](../../stories/epic-60/story-60.6-fe-sync-advertising-widget.md) - Advertising integration
- [Story 60.7 - Period Context Label](../../stories/epic-60/story-60.7-fe-period-context-label.md) - Context display
- [Story 60.8 - Improve Loading States](../../stories/epic-60/story-60.8-fe-improve-loading-states.md) - UX improvements
- [Story 60.9 - E2E Tests](../../stories/epic-60/story-60.9-fe-e2e-tests.md) - Testing coverage

### Validation & Testing
- [Integration Validation Report](../../stories/epic-60/INTEGRATION-VALIDATION-REPORT.md) - Validation results
- [Integration Acceptance Checklist](../../stories/epic-60/INTEGRATION-ACCEPTANCE-CHECKLIST.md) - Acceptance criteria
- [TDD Validation Integration](../../stories/epic-60/TDD-VALIDATION-INTEGRATION.md) - Test-driven development
- [Wave 4 Integration Summary](../../stories/epic-60/WAVE-4-INTEGRATION-SUMMARY.md) - Wave orchestration results

## Related Files

### Components
- `src/components/custom/DashboardPeriodSelector.tsx` - Period selector UI
- `src/components/custom/MetricCardEnhanced.tsx` - Enhanced metric cards
- `src/components/custom/TrendGraph.tsx` - Trend visualization
- `src/components/custom/ExpenseChart.tsx` - Expense breakdown
- `src/components/custom/CogsCoverageMetricCard.tsx` - COGS coverage
- `src/components/custom/ProductCountMetricCard.tsx` - Product count
- `src/components/custom/ComparisonBadge.tsx` - Comparison display
- `src/components/custom/PeriodContextLabel.tsx` - Period context

### Hooks
- `src/hooks/useDashboardPeriod.ts` - Period state management
- `src/hooks/useDashboardMetricsWithPeriod.ts` - Metrics with period support
- `src/hooks/useDashboard.ts` - Dashboard data fetching

### Context
- `src/contexts/PeriodContext.tsx` - Period context provider

### Utilities
- `src/lib/period-helpers.ts` - Period calculation helpers
- `src/lib/date-utils.ts` - Date formatting utilities
- `src/lib/comparison-helpers.ts` - Comparison calculations

### Pages
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard page
- `src/app/(dashboard)/dashboard/components/` - Dashboard sub-components

### Tests
- `e2e/dashboard-period.spec.ts` - E2E tests for period selector
- `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` - Unit tests
- `src/hooks/__tests__/useDashboardMetricsWithPeriod.test.ts` - Hook tests

## API Endpoints

- `GET /v1/analytics/weekly/summary` - Weekly financial summary
- `GET /v1/analytics/weekly/by-sku` - Per-SKU analytics
- `GET /v1/analytics/weekly/by-brand` - Per-brand analytics
- `GET /v1/analytics/weekly/by-category` - Per-category analytics
- `GET /v1/products?include_cogs=true` - Products with margin data

## Business Logic

### Period Calculation
- Week format: ISO week `YYYY-Www` (e.g., "2025-W49")
- Timezone: `Europe/Moscow`
- Week starts: Monday
- Last completed week logic (see `src/lib/margin-helpers.ts`)

### Key Metrics
- **Revenue**: Total sales revenue
- **Margin**: `(revenue - cogs) / revenue * 100`
- **ROAS**: `revenue / spend` (where spend > 0)
- **Orders**: Total order count
- **COGS Coverage**: Percentage of products with assigned COGS

## Design System

### Color Palette
- Primary Red: `#E53935` (main brand)
- Green: `#22C55E` (positive values, profitable margins)
- Red: `#EF4444` (negative values, losses)
- Blue: `#3B82F6` (primary metrics)

### Typography
- H1: 32px, bold (page titles)
- H2: 24px, semi-bold (section headers)
- Metric Values: 32-48px, bold

## Testing Strategy

### E2E Tests (Playwright)
- Period selector functionality
- Metric display accuracy
- Trend graph rendering
- Data refresh on period change

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Utility function correctness
- Period calculation logic

## Performance Requirements

- Dashboard data load: <2s
- Period switch response: <500ms
- Metric card render: <100ms
- Trend graph render: <300ms

---

**Related Documentation:**
- [Frontend Spec](../../front-end-spec.md) - Design system and UI/UX guidelines
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog

**Last Updated:** 2026-01-30

# Analytics Page Documentation

Analytics pages provide comprehensive financial insights, advertising performance tracking, and multi-dimensional analysis (by SKU, brand, category).

## Page Overview

**Routes:**
- `/analytics` - Main analytics page
- `/analytics/weekly` - Weekly financial analytics
- `/analytics/advertising` - Advertising campaign analysis

**Primary Features:**
- Weekly financial summaries
- Per-SKU, per-brand, per-category breakdowns
- Advertising campaign analytics
- ROI and ROAS tracking
- Time-series data visualization
- Date range filtering

## Key Components

### Financial Summary
- **Component:** `FinancialSummaryTable`
- **Location:** `src/components/custom/analytics/FinancialSummaryTable.tsx`
- **Features:**
  - Revenue, margin, expenses breakdown
  - Period-over-period comparison
  - Export functionality

### Advertising Analytics
- **Component:** `AdvertisingDashboardWidget`
- **Location:** `src/components/custom/AdvertisingDashboardWidget.tsx`
- **Features:**
  - Campaign performance metrics
  - ROAS tracking
  - Spend vs. revenue analysis
  - Date range filtering

### Data Visualization
- **Component:** `TrendGraph`
- **Location:** `src/components/custom/TrendGraph.tsx`
- **Features:**
  - Historical trends
  - Interactive tooltips
  - Multiple metric views

## Documentation Files

### Integration Analysis
- [Advertising Integration Analysis](../../ADVERTISING-INTEGRATION-ANALYSIS.md) - Complete advertising integration
- [Advertising Analytics Epic](../../request-backend/71-advertising-analytics-epic-33.md) - Epic 33 overview
- [Advertising Sync Status 404 Error](../../request-backend/72-advertising-sync-status-404-error.md) - Error handling

### API Documentation
- [Advertising API Format Mismatch](../../request-backend/74-advertising-api-format-mismatch.md) - API format issues
- [Advertising Revenue Zero](../../request-backend/75-advertising-revenue-zero.md) - Edge case handling
- [Efficiency Filter Not Implemented](../../request-backend/76-efficiency-filter-not-implemented.md) - Filter implementation
- [Placement Field Campaign Data](../../request-backend/79-placement-field-campaign-data.md) - Data structure

### Date Range Filtering
- [Advertising Date Range Frontend Guide](../../request-backend/116-advertising-date-range-frontend-guide.md) - Date range implementation
- [Advertising Date Filter Empty State Behavior](../../request-backend/115-advertising-date-filter-empty-state-behavior.md) - Empty states

### ROI & ROAS
- [ROI Calculation Validation](../../request-backend/77-roi-calculation-validation.md) - ROI validation
- [Total Sales Organic/Ad Split](../../request-backend/77-total-sales-organic-ad-split.md) - Sales breakdown

### Related Analytics
- [Unit Economics API Endpoint](../../request-backend/53-unit-economics-api-endpoint.md) - Unit economics
- [Dedicated Trends API Endpoint](../../request-backend/28-dedicated-trends-api-endpoint.md) - Trends API
- [SKU Analytics Data Architecture](../../request-backend/30-sku-analytics-data-architecture.md) - Data structure

## Related Files

### Components
- `src/components/custom/analytics/FinancialSummaryTable.tsx` - Financial summary
- `src/components/custom/analytics/ExpenseChart.tsx` - Expense breakdown
- `src/components/custom/AdvertisingDashboardWidget.tsx` - Advertising widget
- `src/components/custom/analytics/TrendGraph.tsx` - Trend visualization
- `src/components/custom/analytics/CategoryBrandSelector.tsx` - Category/brand filter

### Hooks
- `src/hooks/useWeeklyAnalytics.ts` - Weekly analytics
- `src/hooks/useAdvertisingAnalytics.ts` - Advertising data
- `src/hooks/useUnitEconomics.ts` - Unit economics
- `src/hooks/useTrends.ts` - Trend data

### Pages
- `src/app/(dashboard)/analytics/page.tsx` - Main analytics page
- `src/app/(dashboard)/analytics/weekly/page.tsx` - Weekly analytics
- `src/app/(dashboard)/analytics/advertising/page.tsx` - Advertising analytics

### Utilities
- `src/lib/campaign-utils.ts` - Campaign utilities
- `src/lib/efficiency-utils.ts` - ROAS/ROI calculations

### Tests
- `src/components/custom/analytics/__tests__/` - Component tests
- `src/hooks/__tests__/useAnalytics.test.ts` - Hook tests

## API Endpoints

### Weekly Analytics
- `GET /v1/analytics/weekly/summary` - Weekly financial summary
- `GET /v1/analytics/weekly/by-sku` - Per-SKU breakdown
- `GET /v1/analytics/weekly/by-brand` - Per-brand breakdown
- `GET /v1/analytics/weekly/by-category` - Per-category breakdown

### Advertising Analytics
- `GET /v1/analytics/advertising` - Advertising campaign data
- `GET /v1/analytics/advertising/campaigns` - Campaign list
- `GET /v1/analytics/advertising/roi` - ROI calculations

### Unit Economics
- `GET /v1/analytics/unit-economics` - Unit economics data

### Trends
- `GET /v1/analytics/trends` - Historical trends

## Business Logic

### ROAS Calculation
```
roas = revenue / spend (where spend > 0)
```

### ROI Calculation
```
roi = ((revenue - cost) / cost) * 100
```

### Efficiency Categories
- **High ROAS:** ROAS > 4.0
- **Medium ROAS:** ROAS 2.0 - 4.0
- **Low ROAS:** ROAS < 2.0

### Date Range Filtering
- Default: Last 7 days
- Options: 7d, 14d, 30d, 90d, custom
- Timezone: `Europe/Moscow`

## Data Visualization

### Chart Types
- **Line Charts:** Trends over time
- **Bar Charts:** Categorical comparisons
- **Pie Charts:** Distribution breakdowns

### Color Palette
- Primary: `#3B82F6` (blue)
- Positive: `#22C55E` (green)
- Negative: `#EF4444` (red)
- Neutral: `#757575` (gray)

## Testing Strategy

### E2E Tests (Playwright)
- Analytics page loading
- Date range filtering
- Metric calculation accuracy
- Chart rendering
- Export functionality

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Calculation logic
- Data transformation

## Performance Requirements

- Analytics page load: <2s
- Date range change: <500ms
- Chart render: <300ms
- Data export: <3s

---

**Related Documentation:**
- [Frontend Spec](../../front-end-spec.md) - Design system and UI/UX guidelines
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog
- [Campaign Utils](../../src/lib/campaign-utils.ts) - Campaign utilities

**Last Updated:** 2026-01-30

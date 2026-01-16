# Changelog: Epic 6-FE - Advanced Analytics UI

**Version:** 1.2
**Date:** 2025-12-05
**Author:** Claude (Opus 4.5)

---

## Overview

Epic 6-FE implements Advanced Analytics UI features for the WB Repricer System frontend, including date range selection, period comparison, and cabinet summary dashboard.

---

## Completed Stories

### Story 6.1-FE: Date Range Support (5 pts) ✅

**Purpose:** Enable multi-week analytics with ISO week range selection.

**Components Created:**
- `DateRangePicker.tsx` - Week range selector with quick presets
- `useAvailableWeeks.ts` - Hook for fetching available weeks

**Features:**
- Week range selection (weekStart/weekEnd)
- Quick presets: "Последние 4 недели", "Последние 12 недель"
- Validation: max 52 weeks, no future weeks
- ISO week format (YYYY-Www)

**Files Modified:**
- `src/hooks/useMarginAnalytics.ts` - Added `weekStart`, `weekEnd` params
- `src/app/(dashboard)/analytics/sku/page.tsx` - DateRangePicker integration
- `src/app/(dashboard)/analytics/brand/page.tsx` - DateRangePicker integration
- `src/app/(dashboard)/analytics/category/page.tsx` - DateRangePicker integration

---

### Story 6.2-FE: Period Comparison Enhancement (3 pts) ✅

**Purpose:** Enable period-over-period comparison with delta indicators.

**Components Created:**
- `DeltaIndicator.tsx` - Visual delta display (↑ green, ↓ red, — gray)
- `DeltaBadge.tsx` - Compact delta badge for tables
- `ComparisonPeriodSelector.tsx` - Period comparison toggle with presets

**Features:**
- Comparison presets: "Предыдущий период", "Тот же период прошлого года", "Custom"
- Delta formatting: percentage and absolute (currency)
- Inverse mode for costs (negative = good)
- Size variants: sm, md, lg

**Props for DeltaIndicator:**
```typescript
interface DeltaIndicatorProps {
  value: number | null | undefined
  type?: 'percentage' | 'absolute'
  inverse?: boolean  // For costs where negative is good
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  tooltipText?: string
}
```

**Files Modified:**
- `src/hooks/useMarginAnalytics.ts` - Added `compareTo`, `compareToStart`, `compareToEnd`
- `src/types/analytics.ts` - Added `ComparisonAnalyticsItem`, `PeriodDelta` types
- All analytics pages - Integrated ComparisonPeriodSelector

**Tests:**
- `DeltaIndicator.test.tsx` - 21 tests
- `ComparisonPeriodSelector.test.tsx` - 12 tests

---

### Story 6.4-FE: Cabinet Summary Dashboard (5 pts) ✅

**Purpose:** KPI dashboard with top performers and trend indicators.

**Components Created:**
- `KPICard.tsx` - KPI card with trend indicator (up/down/stable)
- `TopProductsTable.tsx` - Top 10 products by revenue
- `TopBrandsTable.tsx` - Top 5 brands by revenue
- `useCabinetSummary.ts` - Hook for cabinet summary API

**Features:**
- KPIs: Revenue, Profit, Margin, ROI
- Trend indicators with week-over-week growth
- Top 10 products with contribution %
- Top 5 brands with margin data
- Product coverage stats

**Pages Created:**
- `/analytics/dashboard/page.tsx` - Cabinet Summary page
- `/analytics/dashboard/loading.tsx` - Loading skeleton

**Types Added:**
```typescript
interface CabinetSummaryResponse {
  summary: {
    totals: CabinetSummaryTotals
    products: CabinetProductStats
    trends: CabinetTrends
  }
  top_products: TopProductItem[]
  top_brands: TopBrandItem[]
  meta: {...}
}
```

**Tests:**
- `KPICard.test.tsx` - 8 tests
- `TopProductsTable.test.tsx` - 5 tests
- `TopBrandsTable.test.tsx` - 4 tests

---

### Story 6.3-FE: ROI & Profit Metrics Display (3 pts) ✅

**Purpose:** Add ROI and Profit per Unit columns to analytics tables with optional visibility toggles.

**Components Created:**
- `ColumnVisibilityToggle.tsx` - Dropdown menu for toggling optional columns

**Hooks Created:**
- `useColumnVisibility.ts` - Column visibility with localStorage persistence

**Utilities Created:**
- `analytics-utils.ts` - ROI/Profit formatting and color coding functions

**Features:**
- ROI calculation: `(profit / cogs) × 100%`
- Profit per Unit calculation: `profit / qty`
- Color-coded ROI values based on thresholds:
  - ≥100% → Green (Excellent)
  - 50-99% → Green-500 (Good)
  - 20-49% → Yellow (Average)
  - 0-19% → Orange (Low)
  - <0% → Red (Negative)
- Column visibility toggle persisted to localStorage
- Sortable ROI and Profit per Unit columns
- Tooltips explaining calculation formulas

**Files Modified:**
- `src/types/cogs.ts` - Added `profit_per_unit`, `roi` fields to `MarginAnalyticsSku` and `MarginAnalyticsAggregated`
- `src/components/custom/MarginBySkuTable.tsx` - Added ROI & Profit/Unit columns
- `src/components/custom/MarginByBrandTable.tsx` - Added ROI & Profit/Unit columns
- `src/components/custom/MarginByCategoryTable.tsx` - Added ROI & Profit/Unit columns

**New Props for Table Components:**
```typescript
interface MarginTableProps {
  columnVisibility?: {
    roi: boolean           // Show ROI column (default: true)
    profit_per_unit: boolean  // Show Profit/Unit (default: true)
    markup_percent: boolean   // Show Markup % (default: false)
  }
}
```

**Analytics Utils Functions:**
```typescript
getROIColor(roi: number | null): string       // Returns Tailwind color class
formatROI(value: number | null): string        // Format as "50.5%"
formatProfitPerUnit(value: number | null): string  // Format as "125,50 ₽/ед."
calculateROI(profit, cogs): number | null
calculateProfitPerUnit(profit, qty): number | null
```

---

## API Changes

### New Parameters (by-sku, by-brand, by-category)

```typescript
// Date range (Story 6.1-FE)
weekStart?: string    // ISO week: YYYY-Www
weekEnd?: string      // ISO week: YYYY-Www

// Comparison (Story 6.2-FE)
compareTo?: string       // Single week comparison
compareToStart?: string  // Range comparison start
compareToEnd?: string    // Range comparison end
```

### New Endpoint

```
GET /v1/analytics/cabinet-summary
```

**Parameters:**
- `weeks?: number` - Number of weeks (default: 4, max: 52)
- `weekStart?: string` - Explicit range start
- `weekEnd?: string` - Explicit range end

---

## File Tree

```
src/
├── components/custom/
│   ├── DateRangePicker.tsx          # Story 6.1-FE
│   ├── DeltaIndicator.tsx           # Story 6.2-FE
│   ├── ComparisonPeriodSelector.tsx # Story 6.2-FE
│   ├── KPICard.tsx                  # Story 6.4-FE
│   ├── TopProductsTable.tsx         # Story 6.4-FE
│   ├── TopBrandsTable.tsx           # Story 6.4-FE
│   ├── ColumnVisibilityToggle.tsx   # Story 6.3-FE
│   ├── ExportDialog.tsx             # Story 6.5-FE: Export configuration dialog
│   ├── ExportStatusDisplay.tsx      # Story 6.5-FE: Export status display
│   ├── MarginBySkuTable.tsx         # Updated for 6.3-FE (ROI/ProfitPerUnit columns)
│   ├── MarginByBrandTable.tsx       # Updated for 6.3-FE (ROI/ProfitPerUnit columns)
│   ├── MarginByCategoryTable.tsx    # Updated for 6.3-FE (ROI/ProfitPerUnit columns)
│   └── __tests__/
│       ├── DeltaIndicator.test.tsx  # 21 tests
│       └── ComparisonPeriodSelector.test.tsx  # 12 tests
├── hooks/
│   ├── useAvailableWeeks.ts         # Week list fetching
│   ├── useMarginAnalytics.ts        # Updated with comparison params
│   ├── useCabinetSummary.ts         # Cabinet summary API
│   ├── useColumnVisibility.ts       # Story 6.3-FE: Column toggle with localStorage
│   └── useExportAnalytics.ts        # Story 6.5-FE: Export mutation + polling
├── types/
│   ├── analytics.ts                 # Updated: export types (6.5-FE)
│   └── cogs.ts                      # Updated: roi, profit_per_unit fields
├── lib/
│   ├── routes.ts                    # Added DASHBOARD route
│   └── analytics-utils.ts           # Story 6.3-FE: ROI/Profit formatters
└── app/(dashboard)/analytics/
    ├── sku/page.tsx                 # Updated: Export button (6.5-FE)
    ├── brand/page.tsx               # Updated: Export button (6.5-FE)
    ├── category/page.tsx            # Updated: Export button (6.5-FE)
    └── dashboard/
        ├── page.tsx                 # New - Cabinet Summary
        └── loading.tsx              # Loading skeleton
```

---

### Story 6.5-FE: Export Analytics UI (5 pts) ✅

**Purpose:** Enable exporting analytics data to CSV or Excel format.

**Components Created:**
- `ExportDialog.tsx` - Export configuration dialog with type, date range, format selection
- `ExportStatusDisplay.tsx` - Status display with progress, download button, retry

**Hooks Created:**
- `useExportAnalytics.ts` - Export mutation + status polling with timeout handling

**Features:**
- Export types: by-sku, by-brand, by-category, cabinet-summary
- Format selection: CSV or Excel (.xlsx)
- Date range selection using DateRangePicker
- Include COGS data option
- Polling interval: 2 seconds
- Auto-download when completed
- Timeout handling (max 2 minutes)
- Retry on failure

**Types Added:**
```typescript
type ExportType = 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'
type ExportFormat = 'csv' | 'xlsx'
type ExportStatusType = 'pending' | 'processing' | 'completed' | 'failed'

interface ExportRequest {
  type: ExportType
  weekStart?: string
  weekEnd?: string
  format: ExportFormat
  includeCogs?: boolean
  filters?: { brand?: string; category?: string }
}

interface ExportStatus {
  export_id: string
  status: ExportStatusType
  download_url?: string
  file_size_bytes?: number
  rows_count?: number
  expires_at?: string
  error_message?: string
}
```

**Files Modified:**
- `src/app/(dashboard)/analytics/sku/page.tsx` - Added Export button
- `src/app/(dashboard)/analytics/brand/page.tsx` - Added Export button
- `src/app/(dashboard)/analytics/category/page.tsx` - Added Export button
- `src/types/analytics.ts` - Added export types

---

## Epic Complete

**Total Epic Progress:** 21/21 points (100%) ✅

---

## Related Documentation

- **Architecture:** `docs/front-end-architecture.md` (Updated with Epic 6-FE section)
- **API Guide:** `docs/api-integration-guide.md` (Updated with new params)
- **Story Docs:** `docs/stories/epic-6/`

---

## Testing

```bash
# Run Epic 6-FE tests
npm test -- --run src/components/custom/__tests__/DeltaIndicator.test.tsx
npm test -- --run src/components/custom/__tests__/ComparisonPeriodSelector.test.tsx

# Total: 33 new tests passing
```

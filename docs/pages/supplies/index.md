# Supplies Page Documentation

Supplies page provides inventory management, supply planning tools, stockout risk analysis, and storage analytics.

## Page Overview

**Route:** `/supplies`

**Primary Features:**
- Supply planning and stockout risk analysis
- Reorder quantity calculations
- Storage analytics and paid storage tracking
- Liquidity and turnover metrics
- Multi-brand warehouse analysis

## Key Components

### Supply Planning
- **Component:** `SupplyPlanningTable`
- **Location:** `src/components/custom/supply/SupplyPlanningTable.tsx`
- **Features:**
  - Stockout risk indicators
  - Reorder quantity suggestions
  - Days of stock remaining
  - Bulk reorder actions

### Storage Analytics
- **Component:** `StorageAnalyticsWidget`
- **Location:** `src/components/custom/storage/StorageAnalyticsWidget.tsx`
- **Features:**
  - Paid storage breakdown
  - Warehouse utilization
  - Storage cost optimization
  - Multi-brand analysis

### Liquidity Analysis
- **Component:** `LiquidityDashboard`
- **Location:** `src/components/custom/supply/LiquidityDashboard.tsx`
- **Features:**
  - Turnover categories
  - Liquidation scenarios
  - Inventory aging

## Documentation Files

### Integration Analysis
- [Orders Supply Storage Integration Analysis](../../ORDERS-SUPPLY-STORAGE-INTEGRATION-ANALYSIS.md) - Supplies integration overview

### Supply Planning API
- [Supply Planning API Endpoint](../../request-backend/54-supply-planning-api-endpoint.md) - Supply planning endpoint
- [Supply Planning Frontend Clarification](../../request-backend/54-supply-planning-api-endpoint-frontend-clarification.md) - Implementation notes

### Liquidity API
- [Liquidity API Endpoint](../../request-backend/55-liquidity-api-endpoint.md) - Liquidity endpoint

### Storage Analytics
- [Epic 24 Paid Storage Analytics API](../../request-backend/36-epic-24-paid-storage-analytics-api.md) - Storage analytics
- [Storage Endpoints Not Implemented](../../request-backend/37-epic-24-storage-endpoints-not-implemented.md) - Implementation status
- [Storage Analytics Improve Empty Data Handling](../../request-backend/38-storage-analytics-improve-empty-data-handling.md) - Empty states
- [Storage Import JSON Fix](../../request-backend/39-epic-24-storage-import-json-fix.md) - Import handling
- [Storage Data Sources Discrepancy](../../request-backend/39-storage-data-sources-discrepancy.md) - Data source issues
- [Storage SKU Breakdown](../../request-backend/52-storage-sku-breakdown-for-weekly-reports.md) - SKU analysis
- [Storage Data Sources Comparison](../../request-backend/62-storage-data-sources-comparison.md) - Data comparison
- [Storage Source Unification](../../request-backend/66-storage-source-unification.md) - Source consolidation
- [Storage Comparison UI](../../request-backend/67-storage-comparison-ui.md) - UI design
- [Paid Storage Import Methods](../../request-backend/51-paid-storage-import-methods.md) - Import methods

### Supply Management
- [Epic 53 Supply Management API](../../request-backend/111-epic-53-supply-management-api.md) - Supply management
- [Epic 53 Backend Response](../../request-backend/111-epic-53-supply-management-api.md) - API response

## Related Files

### Components
- `src/components/custom/supply/SupplyPlanningTable.tsx` - Supply planning
- `src/components/custom/storage/StorageAnalyticsWidget.tsx` - Storage analytics
- `src/components/custom/supply/LiquidityDashboard.tsx` - Liquidity dashboard
- `src/components/custom/supply/StockoutRiskIndicator.tsx` - Risk indicator

### Hooks
- `src/hooks/useSupplyPlanning.ts` - Supply planning data
- `src/hooks/useStorageAnalytics.ts` - Storage analytics
- `src/hooks/useLiquidity.ts` - Liquidity data

### Pages
- `src/app/(dashboard)/supplies/page.tsx` - Supplies page

### Utilities
- `src/lib/supply-planning-utils.ts` - Supply calculations
- `src/lib/liquidity-utils.ts` - Liquidity metrics
- `src/lib/storage-utils.ts` - Storage helpers

### Tests
- `src/components/custom/supply/__tests__/` - Component tests
- `src/hooks/__tests__/useSupplyPlanning.test.ts` - Hook tests

## API Endpoints

### Supply Planning
- `GET /v1/analytics/supply-planning` - Supply planning data
- `POST /v1/supplies/reorder` - Create reorder request
- `GET /v1/supplies/stockout-risk` - Stockout risk analysis

### Storage Analytics
- `GET /v1/analytics/storage` - Storage analytics
- `GET /v1/analytics/storage/by-sku` - Per-SKU storage
- `GET /v1/analytics/storage/by-warehouse` - Per-warehouse breakdown
- `POST /v1/analytics/storage/import` - Import storage data

### Liquidity
- `GET /v1/analytics/liquidity` - Liquidity metrics
- `GET /v1/analytics/liquidity/scenarios` - Liquidation scenarios

## Business Logic

### Stockout Risk Calculation
```
risk_level = f(current_stock, daily_sales, lead_time)
```

**Categories:**
- **Critical:** <7 days of stock
- **Warning:** 7-14 days of stock
- **Healthy:** >14 days of stock

### Reorder Quantity
```
reorder_qty = (daily_sales * lead_time) + safety_stock - current_stock
```

### Turnover Categories
- **Fast:** <30 days turnover
- **Medium:** 30-90 days turnover
- **Slow:** >90 days turnover

### Liquidity Score
```
liquidity_score = (revenue / inventory_value) * 100
```

## Design System

### Risk Colors
- Critical: `#EF4444` (red)
- Warning: `#F59E0B` (yellow)
- Healthy: `#22C55E` (green)

### Storage Colors
- High Cost: `#7C4DFF` (purple)
- Medium Cost: `#3B82F6` (blue)
- Low Cost: `#22C55E` (green)

### Typography
- Risk Level: 16px, bold, uppercase
- Days Remaining: 24px, bold
- Currency Values: 18px, semi-bold

## Testing Strategy

### E2E Tests (Playwright)
- Supply planning table rendering
- Stockout risk calculation
- Reorder action flow
- Storage analytics display

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Risk calculation logic
- Reorder quantity formulas
- Liquidity score calculation

## Performance Requirements

- Supply planning load: <2s
- Stockout risk calculation: <500ms
- Storage analytics load: <2s
- Reorder action: <1s

---

**Related Documentation:**
- [Frontend Spec](../../front-end-spec.md) - Design system and UI/UX guidelines
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog
- [Supply Planning Utils](../../src/lib/supply-planning-utils.ts) - Supply calculations

**Last Updated:** 2026-01-30

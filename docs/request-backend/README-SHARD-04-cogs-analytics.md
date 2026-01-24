# COGS Management & Advanced Analytics (Epic 5/6)

[< Back to Index](./README.md) | [< Previous: Financial](./README-SHARD-03-resolved-financial.md) | [Next: Margin & Products >](./README-SHARD-05-margin-products.md)

---

This shard contains requests for COGS management, Epic 5/6 Advanced Analytics, and related features.

---

## Request #44: Add COGS Section to Finance Summary Endpoint

**Date**: 2025-12-06
**Priority**: Medium - UX Enhancement
**Status**: COMPLETED - Backend & Frontend Implementation Done
**Component**: Backend API - Analytics Module
**Related**: Epic 25 Story 25.2, Story 6.4 (Cabinet Summary)
**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

**Solution**: Backend extended `finance-summary` endpoint with COGS data from `weekly_margin_fact`. Frontend added COGS section to `FinancialSummaryTable.tsx`.

**New Fields** in `summary_total`, `summary_rus`, `summary_eaeu`:
```typescript
{
  cogs_total: number | null;           // SUM(cogs_rub) from weekly_margin_fact
  cogs_coverage_pct: number | null;    // % of products with COGS assigned
  products_with_cogs: number | null;   // Count of products with COGS
  products_total: number | null;       // Total unique products in week
  gross_profit: number | null;         // payout_total - cogs_total (only when coverage = 100%)
}
```

**Documentation**:
- **[44-cogs-section-in-finance-summary.md](./44-cogs-section-in-finance-summary.md)** - FULL DETAILS
- Epic 25 Story 25.2: `frontend/docs/stories/epic-25-dashboard-data-accuracy.md`

---

## Request #40: Epic 6-FE Deferred Items - Backend Clarification

**Date**: 2025-12-05
**Priority**: Low - Documentation/Clarification
**Status**: RESOLVED - All features already supported by backend
**Component**: Backend API - Analytics Module
**Related**: Epic 6-FE QA Review (Stories 6.1-FE through 6.5-FE)

**Summary**: During QA Review of Epic 6-FE, deferred items were identified. **All are already supported by backend!**

| Deferred Item | Backend Status | Action | Status |
|---------------|----------------|--------|--------|
| DEFER-001: `weeks_with_sales` display | Already supported | Frontend: use existing fields | RESOLVED |
| DEFER-002: Summary row in comparison | Frontend-only | Table refactoring | RESOLVED |
| DEFER-003: TopTables unit tests | Frontend-only | Add tests | RESOLVED |

**Key Fields Available** (in date range mode `weekStart`/`weekEnd`):
```typescript
interface SkuAnalyticsItem {
  // ... existing fields
  weeks_with_sales?: number   // Count of weeks with qty > 0
  weeks_with_cogs?: number    // Count of weeks with COGS assigned
}
```

**Documentation**:
- **[40-epic-6-fe-deferred-items-backend-response.md](./40-epic-6-fe-deferred-items-backend-response.md)** - FRONTEND INTEGRATION GUIDE

**Frontend Completed** (2025-12-05):
1. Updated TypeScript types for `weeks_with_sales` / `weeks_with_cogs` - `src/types/cogs.ts`
2. Added display in MarginBySkuTable - tooltip on product name
3. Task 6.2 and Task 6.3 in Story 6.1-FE completed

---

## Request #36: Epic 24 - Paid Storage Analytics API

**Date**: 2025-11-29
**Priority**: NEW FEATURE
**Status**: COMPLETE - All 5 stories implemented (43+ unit tests)
**Component**: Backend API - Analytics Module + Imports Module + Tasks Module + Products Module

**New Feature**: Storage expense analytics by articles - new functionality for detailed analysis of paid storage costs per SKU.

**Key Capabilities**:
- `GET /v1/analytics/storage/by-sku` - storage costs by SKU with pagination
- `GET /v1/analytics/storage/top-consumers` - top-N products by storage cost
- `GET /v1/analytics/storage/trends` - expense trends by weeks
- Automatic import every Tuesday 08:00 MSK
- `POST /v1/imports/paid-storage` - manual import (max 8 days)
- **`GET /v1/products?include_storage=true`** - storage costs in product list (Story 24.5)

**Story 24.5: Storage Cost in Products API** (NEW):
```http
# With storage data (+50ms)
GET /v1/products?include_storage=true&limit=25

# Margin AND storage (~350ms)
GET /v1/products?include_cogs=true&include_storage=true&limit=25
```

**New Fields** (when `include_storage=true`):
- `storage_cost_daily_avg` (number | null) - daily average cost (RUB/day)
- `storage_cost_weekly` (number | null) - total weekly cost (RUB)
- `storage_period` (string | null) - ISO week of data (e.g. "2025-W47")

**Documentation**:
- **[36-epic-24-paid-storage-analytics-api.md](./36-epic-24-paid-storage-analytics-api.md)** - FRONTEND INTEGRATION GUIDE
- **[docs/STORAGE-API-GUIDE.md](../../../docs/STORAGE-API-GUIDE.md)** - SDK WORKFLOW, DATA COMPARISON, TROUBLESHOOTING (2025-12-15)
- [51-paid-storage-import-methods.md](./51-paid-storage-import-methods.md) - SMART/MANUAL IMPORT
- [39-storage-data-sources-discrepancy.md](./39-storage-data-sources-discrepancy.md) - DISCREPANCY ANALYSIS (W46: 0.67%)
- [Epic 24 Overview](../../../docs/epics/epic-24-paid-storage-by-article.md)
- [Story 24.5](../../../docs/stories/epic-24/story-24.5-storage-in-products-api.md)

**Frontend Next Steps**:
1. Create "Storage Analytics" page
2. Add expense trend component (chart)
3. Add top-N expensive SKU table
4. **Add "Storage" column to products table** (using `include_storage=true`)
5. Integrate storage data into product card

---

## Request #31: Add `applicable_cogs` Field to Products API

**Date**: 2025-11-28
**Priority**: Medium - UX Improvement
**Status**: IMPLEMENTED (2025-11-28)
**Component**: Backend API - Products Module + COGS Module

**Problem Solved**: When latest COGS has future valid_from date, users now see which COGS is actually used for margin calculation.

**API Response** (now includes `applicable_cogs`):
```json
{
  "nm_id": "173589742",
  "cogs": { "unit_cost_rub": 11, "valid_from": "2025-11-23" },
  "applicable_cogs": {
    "unit_cost_rub": 121,
    "valid_from": "2025-11-07",
    "applies_to_week": "2025-W46",
    "is_same_as_current": false
  }
}
```

**Use Cases**:
1. Latest = Applicable -> `is_same_as_current: true`
2. Latest != Applicable (future date) -> `is_same_as_current: false`
3. No Applicable (first COGS in future) -> `applicable_cogs: null`
4. No COGS -> `cogs: null, applicable_cogs: null`

**Endpoints Updated**:
- `GET /v1/products/:nmId` - Always includes `applicable_cogs`
- `GET /v1/products?include_cogs=true` - Includes `applicable_cogs` for each product

**API Tests**: See `test-api/08-products.http` (COGS Assignment examples)

**Frontend Changes** (2025-11-28):
- `src/types/cogs.ts` - Added `ApplicableCogs` interface
- `src/components/custom/ProductMarginCell.tsx` - Display applicable COGS info

**Documentation**:
- [Backend Implementation](./31-cogs-display-improvement-show-applicable-cogs-backend.md)
- [Guide #29: COGS Temporal Versioning](./29-cogs-temporal-versioning-and-margin-calculation.md)

---

## Request #33: createCogs() Does Not Close Previous COGS Versions

**Date**: 2025-11-28
**Priority**: High - Data Integrity Issue
**Status**: IMPLEMENTED - 2025-11-28
**Component**: Backend API - COGS Module

**Problem Solved**: `createCogs()` now properly closes previous COGS versions when creating new ones with different `valid_from` dates. Previously all versions had `valid_to = NULL`.

**Fix Logic**:
- Same `valid_from` -> UPDATE existing (unchanged)
- `new_valid_from > current.valid_from` -> Transaction: close old + create new
- `new_valid_from < current.valid_from` -> Create historical with `valid_to`

**Migration Script**: `scripts/fix-cogs-valid-to.ts`
```bash
npx ts-node scripts/fix-cogs-valid-to.ts --dry-run  # Preview changes
npx ts-node scripts/fix-cogs-valid-to.ts            # Fix all affected products
```

**Documentation**:
- **[33-cogs-createCogs-not-closing-previous-versions.md](./33-cogs-createCogs-not-closing-previous-versions.md)** - DETAILS

---

## Request #32: Historical Margin Context Not Showing for Products Without COGS

**Date**: 2025-11-28
**Priority**: Medium - UX Bug
**Status**: IMPLEMENTED - 2025-11-28
**Component**: Backend API - Products Module

**Problem**: Product "Tarot Cards" (nm_id: 201916739) didn't show "No sales in last 12 weeks" info, unlike similar product "Hula Hoop" (nm_id: 395996251).

**Root Cause**: Bug in `src/products/products.service.ts:653`:
```typescript
// Current code (BUG):
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'NO_SALES_DATA'

// Should be:
missing_reason: hasCogs ? 'NO_SALES_DATA' : 'COGS_NOT_ASSIGNED'
```

Also issue in logic lines 588-589: products with `service` records (storage) but no sales get `NO_SALES_IN_PERIOD` instead of `NO_SALES_DATA`.

**Documentation**:
- **[32-historical-margin-context-not-showing-for-products-without-cogs.md](./32-historical-margin-context-not-showing-for-products-without-cogs.md)** - DETAILS

---

## Request #27: COGS History Management & Advanced Analytics Roadmap

**Date**: 2025-11-26 -> **Updated: 2025-11-27**
**Priority**: High - Core Business Features
**Status**: EPIC 6 COMPLETE - All 5 Advanced Analytics stories deployed! Epic 5 partial.
**Component**: Backend API - COGS Module + Analytics Module

**Summary**: Two major feature sets for the platform:

**Epic 5: COGS History & Management** (Complete, Avg 90/100)
| Story | Feature | Document | QA Score | Status |
|-------|---------|----------|----------|--------|
| 5.1 | View COGS history per product | [Story 5.1](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) | 90/100 | DONE |
| 5.2 | Edit past COGS + auto-recalculate margin | [Story 5.2](../../../docs/stories/epic-5/story-5.2-edit-cogs.md) | 90/100 | DONE |
| 5.3 | Delete/deactivate COGS + auto-recalculate | [Story 5.3](../../../docs/stories/epic-5/story-5.3-delete-cogs.md) | 90/100 | DONE |

**Epic 6: Advanced Analytics & Reporting** (Complete, Avg 91.5/100)
| Story | Feature | Document | QA Score | Status |
|-------|---------|----------|----------|--------|
| 6.1 | Date range selector (week-from to week-to) | [Story 6.1](../../../docs/stories/epic-6/story-6.1-date-range-analytics.md) | 90/100 | DONE |
| 6.2 | Period comparison (W46 vs W45) | [Story 6.2](../../../docs/stories/epic-6/story-6.2-period-comparison.md) | 91/100 | DONE |
| 6.3 | New metrics: ROI, profit per unit | [Story 6.3](../../../docs/stories/epic-6/story-6.3-roi-profit-metrics.md) | 95/100 | DONE |
| 6.4 | Cabinet-level KPI dashboard | [Story 6.4](../../../docs/stories/epic-6/story-6.4-cabinet-summary.md) | 92/100 | DONE |
| 6.5 | Export to CSV/Excel | [Story 6.5](../../../docs/stories/epic-6/story-6.5-export-analytics.md) | 90/100 | DONE |
| 6.6 | Dedicated trends endpoint | [Story 6.6](../../../docs/stories/epic-6/story-6.6-dedicated-trends-endpoint.md) | 92/100 | DONE |

**New API Endpoints Available (Epic 6 Complete)**:
```http
# Story 6.1: Date Range Analytics
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true

# Story 6.2: Period Comparison
GET /v1/analytics/weekly/by-sku?week=2025-W46&compare_to=2025-W45

# Story 6.3: ROI & Profit Metrics (in all analytics responses when includeCogs=true)
# New fields: roi, profit_per_unit

# Story 6.4: Cabinet Summary Dashboard
GET /v1/analytics/cabinet-summary?weeks=12

# Story 6.5: Export Analytics
POST /v1/exports/analytics
  { "type": "by-sku", "weekStart": "2025-W40", "weekEnd": "2025-W47", "format": "xlsx" }

# Story 6.6: Dedicated Trends Endpoint (NEW - replaces N separate requests)
GET /v1/analytics/weekly/trends?from=2025-W44&to=2025-W47&metrics=payout_total,sale_gross
```

**Key Technical Decisions**:
- `cogs_id` (UUID) available
- `valid_to` automatic versioning implemented
- `created_by` audit trail exists
- Soft delete with `is_active` flag implemented
- ROI when cogs=0 -> return `null` implemented
- Async export via BullMQ implemented (15 unit tests)

**New API Endpoints (Epic 5 - COGS Management)**:
```http
# Story 5.1: View COGS History
GET /v1/cogs/history?nm_id=12345678&limit=50
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>

# Story 5.2: Edit COGS Record
PATCH /v1/cogs/:cogsId
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json

{
  "unit_cost_rub": 950.00,
  "notes": "Corrected amount"
}

# Story 5.3: Delete COGS Record (Soft Delete)
DELETE /v1/cogs/:cogsId
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>

# Response (200 OK):
# {
#   "deleted": true,
#   "cogs_id": "uuid",
#   "deletion_type": "soft",
#   "previous_version_reopened": true,
#   "margin_recalculation": { triggered, task_uuid, affected_weeks }
# }
```

**Documentation**:
- [Frontend Request](./27-cogs-history-and-advanced-analytics-roadmap.md)
- [Backend Response](./27-cogs-history-and-advanced-analytics-roadmap-backend.md) - ALL ANSWERS HERE
- [Epic 5 Overview](../../../docs/epics/epic-5-cogs-history-management.md) - COGS HISTORY
- [Epic 6 Overview](../../../docs/epics/epic-6-advanced-analytics.md) - ADVANCED ANALYTICS COMPLETE
- [API Reference](../../../docs/API-PATHS-REFERENCE.md) - All new endpoints documented

---

## Request #28: Dedicated Trends API Endpoint

**Date**: 2025-11-27
**Priority**: RESOLVED (Was: Low - Optional Enhancement)
**Status**: IMPLEMENTED - Story 6.6 deployed
**Source**: QA Review Recommendation (Story 3.4)
**Component**: Backend API - Analytics Module (Epic 6)

**Problem**: TrendGraph component (Story 3.4) makes N separate API requests for N weeks of trend data. This is inefficient.

**Solution**: Created dedicated endpoint `GET /v1/analytics/weekly/trends?from=YYYY-Www&to=YYYY-Www` that returns trend data for date range in a single request.

**Key Benefits**:
- Single request instead of N requests
- ~50-70% faster response time (1 request vs N parallel)
- Optimized single SQL query
- Optional summary statistics (min, max, avg, trend %)
- Dynamic metric selection

**New Endpoint**:
```http
GET /v1/analytics/weekly/trends?from=2025-W44&to=2025-W47&metrics=payout_total,sale_gross
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Documentation**:
- [Original Request](./28-dedicated-trends-api-endpoint.md)
- [Backend Response & Integration Guide](./28-dedicated-trends-api-endpoint-backend.md) - START HERE
- [Story 6.6](../../../docs/stories/epic-6/story-6.6-dedicated-trends-endpoint.md)

**QA Status**: PASS (92/100)

---

[< Back to Index](./README.md) | [< Previous: Financial](./README-SHARD-03-resolved-financial.md) | [Next: Margin & Products >](./README-SHARD-05-margin-products.md)

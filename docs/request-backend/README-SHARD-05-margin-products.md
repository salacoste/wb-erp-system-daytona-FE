# Margin Calculation & Products API

[< Back to Index](./README.md) | [< Previous: COGS & Analytics](./README-SHARD-04-cogs-analytics.md) | [Next: Workflow & Guides >](./README-SHARD-06-workflow-guides.md)

---

This shard contains resolved requests for margin calculation, products API, historical margin discovery, and older requests (#01-#21).

---

## Request #26: Frontend Text Clarification - Margin Calculation Week Lookback

**Date**: 2025-11-26
**Priority**: RESOLVED (Was: Low - UI Text Correction)
**Status**: COMPLETED - Frontend text updated
**Component**: Frontend UI - COGS Assignment Form Text

**Issue**: Frontend displayed "If no sales, last 4 weeks will be analyzed" which was misleading about actual backend behavior.

**Solution**: Updated text in two files:
- `frontend/src/app/(dashboard)/cogs/page.tsx` - Alert banner
- `frontend/src/components/custom/SingleCogsForm.tsx` - Tip text

**New Text**:
> "After assigning cost, margin will be calculated automatically based on sales data from the last completed week. For products without sales in this period, historical context for the last 12 weeks will be shown."

**Documentation**:
- [Clarification Details](./26-margin-calculation-text-clarification.md)

---

## Request #25: Historical Margin Discovery Endpoint

**Date**: 2025-11-26 -> 2025-01-27
**Priority**: RESOLVED (Was: Medium - UX Enhancement)
**Status**: IMPLEMENTED - Stories 23.8 & 23.9 deployed
**Component**: Backend API - Products Module + Analytics Module (Epic 23)
**Related**: Story 4.9, Request #15 (include_cogs), Guide #24

**Problem**: When `missing_data_reason: "NO_SALES_DATA"` for last completed week (W47), users see "no sales" but product may have sales with margin in previous weeks (e.g., W44 with 92% margin). No way to discover historical margin without manual navigation.

**Solution**: Backend implemented both UX recommendations from Frontend:

| Story | Endpoint | Frontend Use |
|-------|----------|--------------|
| **23.9** | `GET /v1/products?include_cogs=true` + 4 new fields | Inline context in ProductList |
| **23.8** | `GET /v1/analytics/weekly/product-weeks?nm_id=...` | "Sales History" detail page |

**New Fields (Story 23.9)**:
- `last_sales_week` (string | null) - ISO week of last sale (e.g., "2025-W44")
- `last_sales_margin_pct` (number | null) - Margin % from that week
- `last_sales_qty` (number | null) - Units sold
- `weeks_since_last_sale` (number | null) - Gap in weeks

**UX Result**: Users see "Last: W44 (92.32%, 5 units, 3 weeks ago)" directly in product list!

**Documentation**:
- [Request Details](./25-historical-margin-discovery-endpoint.md)
- [Backend Response & Code Examples](./25-historical-margin-discovery-endpoint-backend.md) - START HERE
- [Story 4.9](../stories/4.9.historical-margin-discovery.md)

---

## Request #21: Margin Calculation Status Endpoint - Backend Response

**Date**: 2025-01-27
**Priority**: RESOLVED (Was: Medium - Implementation Question)
**Status**: COMPLETED - Endpoint Implemented & QA Verified
**Component**: Backend API - Products Module (Epic 22 Story 22.1)
**Related**: Request #20 (Frontend Polling Implementation Issues)

**Solution**: Backend implemented lightweight status endpoint `GET /v1/products/:nmId/margin-status` to solve frontend polling inefficiency. Endpoint provides real-time margin calculation task status without requiring full product data fetch.

**Features**:
- Checks BullMQ queue for pending/active/failed jobs
- Verifies margin data existence in database
- Returns status: `pending`, `in_progress`, `completed`, `not_found`, `failed`
- Provides estimated completion time
- Includes error information for failed tasks
- Performance: < 100ms p95 (QA verified)

**QA Status**: PASS - All tests passing, production-ready

**Documentation**:
- [Backend Response & API Guide](./21-margin-calculation-status-endpoint-backend.md) - START HERE
- [Original Request](./20-frontend-polling-implementation-issues.md)
- [Epic 22: Status Endpoint Solution](../../../docs/epics/epic-22-margin-calculation-status-endpoint.md)
- [Story 22.1: Implementation Details](../../../docs/stories/epic-22/story-22.1-margin-calculation-status-endpoint.md)

---

## Request #20: Frontend Polling Implementation Issues - Backend Guidance Needed

**Date**: 2025-01-27
**Priority**: RESOLVED (Was: Medium - Implementation Question)
**Status**: COMPLETED - Solution Implemented
**Component**: Frontend - Polling Implementation for Margin Calculation
**Related**: Request #14 (Epic 20), Request #18 (Missing Margin Scenarios), Request #21 (Solution)

**Problem**: Frontend team was implementing polling mechanism for margin calculation status updates but encountering issues:
1. Polling hook not restarting after COGS assignment
2. Infinite re-render loop in pending products detection
3. No efficient way to check if margin calculation task is queued/processing

**Solution**: Backend created Epic 22 and implemented `GET /v1/products/:nmId/margin-status` endpoint (see Request #21).

**Documentation**:
- [Request Details](./20-frontend-polling-implementation-issues.md)
- [Backend Response & Solution](./21-margin-calculation-status-endpoint-backend.md) - SOLUTION
- [Epic 22: Status Endpoint Solution](../../../docs/epics/epic-22-margin-calculation-status-endpoint.md)

---

## Request #19: Margin Returned Without COGS - Data Inconsistency

**Date**: 2025-01-27
**Priority**: RESOLVED (Was: High - Data Integrity Issue)
**Status**: COMPLETED - Bug Fixed
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)

**Problem**: Backend returned `current_margin_pct: 100.0` for products where `has_cogs: false` and `cogs: null`. This was a bug - margin calculation service stores records in `weekly_margin_fact` even when COGS is missing (margin = 100% when cogs = 0), and ProductsService did not validate COGS existence before returning margin data.

**Solution**: Added COGS validation in `ProductsService.getMarginDataForProducts()`. If `margin_pct` exists but COGS is missing, backend now sets `margin_pct = null` and `missing_reason = 'COGS_NOT_ASSIGNED'`.

**Documentation**:
- [Request Details](./19-margin-returned-without-cogs.md)
- [Backend Response & Fix](./19-margin-returned-without-cogs-backend.md) - START HERE

---

## Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios

**Date**: 2025-01-27
**Priority**: RESOLVED (Was: Medium - Clarification Request)
**Status**: COMPLETED - Backend Response Provided
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)

**Question**: Why do some products return `current_margin_pct: null` and `missing_data_reason: null` simultaneously when COGS exists and sales data is present? Is this expected? How should frontend handle this?

**Answer**: Yes, this is expected behavior. `missing_data_reason: null` when `current_margin_pct: null` and COGS exists means "margin calculation in progress" (Epic 20 design). Frontend should show "(calculating margin...)" in this case.

**Documentation**:
- [Request Details](./18-missing-margin-and-missing-data-reason-scenarios.md)
- [Backend Response & Guidance](./18-missing-margin-and-missing-data-reason-scenarios-backend.md) - START HERE

---

## Request #17: COGS Assigned After Completed Week - Manual Recalculation Required

**Date**: 2025-01-27
**Priority**: RESOLVED (Was: Medium - Documentation Request)
**Status**: COMPLETED - Backend Behavior Documented
**Component**: Backend API - COGS Module + Margin Calculation (Epic 20)

**Problem**: When COGS is assigned with date after last completed week, automatic margin recalculation is skipped (empty affected weeks array).

**Solution**: Documented behavior and manual recalculation workaround via `POST /v1/tasks/enqueue`.

**Documentation**:
- [Backend Response & Guide](./17-cogs-assigned-after-completed-week-recalculation.md)

---

## Request #16: COGS History and Margin Data Structure Guide

**Date**: 2025-01-26
**Priority**: RESOLVED (Was: Medium - Documentation Request)
**Status**: COMPLETED - Backend Documentation Provided
**Component**: Backend API - COGS Module + Analytics Module

**Problem**: Frontend team needs guidance on checking historical COGS assignments, understanding margin calculation mechanics, and data structure (week uniqueness).

**Solution**: Comprehensive API guide with endpoints, examples, and data structure explanations for COGS history queries and margin analytics.

**Documentation**:
- [Backend Response & Guide](./16-cogs-history-and-margin-data-structure.md) - START HERE (Contains up-to-date `missing_data_reason` values and margin data structure)

---

## Request #15: Add includeCogs Parameter to Product List Endpoint

**Date**: 2025-11-23
**Priority**: RESOLVED (Was: P2 - Enhancement)
**Status**: COMPLETED
**Component**: Backend API - Products Module + Epic 17 Analytics

**Problem**: Product list endpoint didn't return margin data despite COGS being assigned.

**Solution**: Added `include_cogs=true` parameter with batch analytics query optimization.

**Documentation**:
- [Original Request](./15-add-includecogs-to-product-list-endpoint.md)
- [Implementation Plan](./15-add-includecogs-to-product-list-endpoint-implementation-plan.md)
- [Completion Summary](./15-add-includecogs-to-product-list-endpoint-completion-summary.md)

---

## Request #14: Automatic Margin Recalculation on COGS Update

**Date**: 2025-11-24
**Priority**: RESOLVED (Was: High - Blocks good UX)
**Status**: COMPLETED - Epic 20 Implementation Complete
**Component**: Backend API - Analytics Module + COGS Module + Task Queue

**Problem**: After assigning COGS through UI, margin was not displayed in product list.

**Solution**: Implemented automatic background margin recalculation triggered after COGS assignment/update using BullMQ queue processing.

**Documentation**:
- [Original Request](./14-automatic-margin-recalculation-on-cogs-update.md)
- [Backend Response & Integration Guide](./14-automatic-margin-recalculation-on-cogs-update-backend.md) - START HERE
- [Backend Implementation Checklist](./14-automatic-margin-recalculation-on-cogs-update-checklist.md)

---

## Request #14a: Search by Partial Article Number Not Working

**Date**: 2025-11-23
**Priority**: RESOLVED (Was: High)
**Status**: FIXED
**Component**: Backend API - Products Module + WB SDK Integration

**Problem**: Searching for products by partial article number (e.g., "3216") returned no results.

**Solution**: Implemented client-side filtering for partial article matching when WB API textSearch doesn't support it.

**Documentation**:
- [Backend Response](./14-search-by-partial-article-not-working.md)

---

## Request #13: Fix Products List Pagination - WB SDK Returns Duplicates

**Date**: 2025-11-23
**Priority**: RESOLVED (Was: High User-Facing Bug)
**Status**: COMPLETED - Client-Side Pagination Workaround Implemented
**Component**: Backend API - Products Module + WB SDK Integration

**Problem**: Product list page 2 showed duplicate products from page 1 instead of next products.

**Solution**: Client-side pagination workaround (getAllProductsList + findIndex + slice, Redis cache).

**Documentation**:
- [Original Request](./13-products-pagination-wb-sdk-issue.md)
- [Backend Response](./13-products-pagination-wb-sdk-issue-backend.md)
- [Final Completion Summary](./13-products-pagination-wb-sdk-issue-final-completion.md)

---

## Request #12: COGS Update Returns 409 Conflict Instead of Updating

**Date**: 2025-11-23
**Priority**: RESOLVED (Was: High)
**Status**: FIXED - Idempotent UPDATE Logic Implemented
**Component**: Backend API - COGS Module

**Problem**: Backend returned 409 Conflict when trying to update COGS with same `valid_from` date.

**Solution**: Modified `createCogs()` to UPDATE existing records instead of throwing ConflictException.

**Documentation**:
- [Original Request](./12-cogs-update-conflict-409-error.md)
- [Backend Response](./12-cogs-update-conflict-409-error-backend.md)
- [Validation Summary](./12-cogs-update-conflict-409-error-validation-summary.md)

---

## Request #11: Undefined Fields in COGS Assignment Response

**Date**: 2025-11-23
**Priority**: RESOLVED (Was: High)
**Status**: FIXED - Return Type Changed to ProductResponseDto
**Component**: Backend API - Products Module

**Problem**: `POST /v1/products/:nmId/cogs` returned `undefined` for critical fields (`has_cogs`, `cogs.id`, `current_margin_pct`).

**Solution**: Changed return type from `AssignCogsResponseDto` to `ProductResponseDto` (calls `getProduct()` after COGS creation).

**Documentation**:
- [Original Request](./11-undefined-fields-in-cogs-assignment-response.md)
- [Backend Response](./11-undefined-fields-in-cogs-assignment-response-backend.md)

---

## Request #10: Margin Analysis Time Series Endpoint (BUGFIXES APPLIED)

**Date**: 2025-11-23 -> **Bugfixes: 2025-12-04**
**Status**: IMPLEMENTED & WORKING - 3 Critical Bugfixes Applied
**Component**: Backend API - Analytics Module

**Endpoint**: `GET /v1/analytics/weekly/margin-trends?weeks=12`

**Bugfixes Applied (2025-12-04)**:
| # | Error | Fix |
|---|-------|-----|
| 1 | `column "qty" does not exist` | `SUM(qty)` -> `SUM(quantity_sold)` |
| 2 | `uuid = text` type mismatch | Added `::uuid` PostgreSQL cast |
| 3 | `Cannot mix BigInt and other types` | Added `Number()` conversion |

**Files Changed**:
- `src/analytics/weekly-analytics.service.ts` - 3 fixes in `getMarginTrends()` method
- `test-api/06-analytics-advanced.http` - Margin Trends examples

**Verification**: 200 OK with 12 weeks of margin trend data (2025-W37 to 2025-W48)

**Story 4.7 Unblocked**: Frontend can now integrate with `useMarginTrends` hook

**Documentation**: [10-margin-analysis-time-series-endpoint.md](./10-margin-analysis-time-series-endpoint.md)

---

## Request #09: Epic 18 COGS Management API

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Products Module + COGS Module

**Documentation**:
- [Original Request](./09-epic-18-cogs-management-api.md)
- [Backend Response](./09-epic-18-backend-response.md)

---

## Request #08: Epic 17 Documentation Navigation

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Documentation

**Documentation**: [08-epic-17-documentation-navigation.md](./08-epic-17-documentation-navigation.md)

---

## Request #07: COGS Margin Analytics includeCogs Parameter

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Analytics Module

**Documentation**: [07-cogs-margin-analytics-includecogs-parameter.md](./07-cogs-margin-analytics-includecogs-parameter.md)

---

## Request #06: Missing Expense Fields in Finance Summary

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Analytics Module

**Documentation**: [06-missing-expense-fields-in-finance-summary.md](./06-missing-expense-fields-in-finance-summary.md)

---

## Request #05: Workaround Available Weeks from Weekly Payout Total

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Analytics Module

**Documentation**: [05-workaround-available-weeks-from-weekly-payout-total.md](./05-workaround-available-weeks-from-weekly-payout-total.md)

---

## Request #04: Analytics API Response Format Clarification

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Analytics Module

**Documentation**: [04-analytics-api-response-format-clarification.md](./04-analytics-api-response-format-clarification.md)

---

## Request #03: Fix CORS for Frontend Port 3100

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - CORS Configuration

**Documentation**: [03-fix-cors-for-frontend-port-3100.md](./03-fix-cors-for-frontend-port-3100.md)

---

## Request #02: Update WB API Token in Cabinet

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Cabinets Module

**Documentation**: [02-update-wb-api-token-in-cabinet.md](./02-update-wb-api-token-in-cabinet.md)

---

## Request #01: JWT Token Refresh on Cabinet Creation

**Date**: 2025-11-23
**Status**: RESOLVED
**Component**: Backend API - Auth Module

**Documentation**: [01-jwt-token-refresh-on-cabinet-creation.md](./01-jwt-token-refresh-on-cabinet-creation.md)

---

[< Back to Index](./README.md) | [< Previous: COGS & Analytics](./README-SHARD-04-cogs-analytics.md) | [Next: Workflow & Guides >](./README-SHARD-06-workflow-guides.md)

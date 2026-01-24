# Epic Status & JWT Authentication

[< Back to Index](./README.md) | [< Previous: Workflow & Guides](./README-SHARD-06-workflow-guides.md)

---

This shard contains epic completion status, frontend integration status, and JWT authentication documentation.

---

## Request Statistics

**Last Updated**: 2026-01-21

- **Active Requests**: 1 (Request #61 - WB Column Rename)
- **Backlog Requests**: 1 (Request #58 - retail_price_total)
- **Resolved Requests**: 69 (Request #01 through #64, #99) + Guide #24, #29, #30 + Epic 33 Fix + Epic 34 Complete + Epic 45 Documentation

**Latest Updates**:
- Request #99 (2026-01-21) - Products Dimensions & Category API - Documentation updated with "How to Get Product by nm_id" guide
- Request #90 (2025-12-30) - Telegram Notifications System Architecture - Complete frontend integration guide
- Request #89 (2025-12-30) - Telegram Notifications Integration - TypeScript types, React hooks, and UI components guide
- Request #73 (2025-12-24) - Epic 34 Telegram Notifications - Complete API guide with bot integration
- Request #71 UPDATED (2025-12-24) - Epic 33 SDK v2.3.1 upgrade and critical stats sync fix

---

## Epic Completion Status

### Epic 31 Complete (2025-12-18)
- Story 31.1: SKU Financials Service - Complete financial aggregation with storage from Epic 24
- Story 31.2: SKU Financials Controller - `GET /v1/analytics/sku-financials` endpoint
- Story 31.3: Profitability Classification - Status calculation (excellent/good/warning/critical/loss/unknown)
- Story 31.4: Redis Caching - 30min TTL with event-based invalidation
- **26 Unit Tests** - Full test coverage for service, controller, and edge cases

### Epic 26 Complete (2025-12-06)
- Story 26.1: Schema Migration - Expense columns added to weekly_margin_fact
- Story 26.2: Expense Aggregation - aggregateExpensesBySku() in MarginCalculationService
- Story 26.3: Analytics Endpoints - By SKU/Brand/Category include expense fields
- Story 26.4: Cabinet Summary - Full expenses + operating profit
- Story 26.5: Historical Recalculation - 16 weeks populated with expense data

### Epic 6-FE Complete (2025-12-05, Avg QA Score 94/100)
- Story 6.1-FE: Date Range Support - DateRangePicker component (92/100)
- Story 6.2-FE: Period Comparison - DeltaIndicator, ComparisonPeriodSelector (94/100)
- Story 6.3-FE: ROI & Profit Metrics - Display in analytics tables (96/100)
- Story 6.4-FE: Cabinet Summary Dashboard - KPICard, TopProductsTable, TopBrandsTable (93/100)
- Story 6.5-FE: Export Analytics UI - ExportDialog, ExportStatusDisplay (95/100)

### Epic 6 Backend (2025-11-27, Avg QA Score 91.5/100)
- Story 6.1: Date Range Analytics - `weekStart`/`weekEnd` filters (90/100)
- Story 6.2: Period Comparison - `compare_to` param with deltas (91/100)
- Story 6.3: ROI & Profit Metrics - `roi`, `profit_per_unit` fields (95/100)
- Story 6.4: Cabinet Summary Dashboard - `GET /v1/analytics/cabinet-summary` (92/100)
- Story 6.5: Export Analytics - `POST /v1/exports/analytics` CSV/XLSX (90/100)
- Story 6.6: Dedicated Trends Endpoint - `GET /v1/analytics/weekly/trends` (92/100)

### Epic 5 Complete (2025-11-27, Avg QA Score 90/100)
- Story 5.1: View COGS History - `GET /v1/cogs/history` endpoint (90/100)
- Story 5.2: Edit COGS - `PATCH /v1/cogs/:cogsId` endpoint (90/100)
- Story 5.3: Delete COGS - `DELETE /v1/cogs/:cogsId` endpoint (90/100)

---

## Frontend Integration Status

- Request #14: Frontend polling implemented (Story 4.8 - Done)
- Request #15: Margin display in product list implemented
- Request #16: COGS history guide documented
- Request #17: Manual recalculation warning and button implemented
- Request #20-21: Margin status endpoint (Epic 22) implemented
- Request #22: W47 margin calculation triggered
- Epic 23: Automatic weekly import scheduling (complete)
- **Story 23.10**: **JWT Auth on Tasks & Schedules APIs** - Frontend role check implemented (2025-11-26)
- **Story 5.1**: **COGS History endpoint** - `GET /v1/cogs/history` deployed (2025-11-26)

---

## Backend Update: Story 23.10 - JWT Authentication on Task & Schedule APIs

**Date**: 2025-11-26
**Status**: DEPLOYED
**Impact**: All `/v1/tasks/*` and `/v1/schedules/*` endpoints now require JWT authentication

### Breaking Change for Frontend

**Before Story 23.10**: Tasks and Schedules APIs were accessible without authentication (security gap).

**After Story 23.10**: All requests to Tasks and Schedules APIs require:

```http
Authorization: Bearer <jwt_token>
X-Cabinet-Id: <cabinet_uuid>
```

### Role Requirements

| Endpoint | Admin | Owner | Manager | Analyst | Service |
|----------|-------|-------|---------|---------|---------|
| `GET /v1/schedules` | Yes | Yes | Yes | Yes | No |
| `GET /v1/schedules/:id` | Yes | Yes | Yes | Yes | No |
| `PUT /v1/schedules/:id` | Yes | Yes | Yes | No | No |
| `POST /v1/schedules/:id/trigger` | Yes | Yes | Yes | No | Yes |
| `POST /v1/tasks/enqueue` | Yes | Yes | Yes | No | Yes |
| `GET /v1/tasks/:uuid` | Yes | Yes | Yes | Yes | Yes |
| `GET /v1/tasks` | Yes | Yes | Yes | Yes | Yes |
| `GET /v1/tasks/workers/health` | Yes | Yes | Yes | Yes | Yes |
| `GET /v1/tasks/queues/stats` | Yes | Yes | Yes | Yes | Yes |

### Error Responses

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing/invalid/expired JWT token |
| 403 | `FORBIDDEN` | Insufficient role or wrong cabinet |

### Frontend Action Required

**If using manual margin recalculation** (Request #17):
- Ensure `Authorization: Bearer <token>` header is present
- Ensure user has `Manager` role or higher for `POST /v1/tasks/enqueue`
- Analyst users **cannot** trigger manual recalculation (403 error)

### Frontend Implementation (2025-11-26)

Role-based access control implemented in:
- `src/components/custom/ProductMarginCell.tsx` - Button hidden for Analyst
- `src/components/custom/SingleCogsForm.tsx` - Button hidden for Analyst

**Helper function** (`canEnqueueTasks`):
```typescript
function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}
```

**Stories updated**:
- [Story 4.8: Margin Recalculation Polling](../stories/4.8.margin-recalculation-polling.md) - AC13 added
- [Story 4.1: Single Product COGS Assignment](../stories/4.1.single-product-cogs-assignment.md) - Updated with auth info

**Example - Manual Margin Recalculation**:
```http
POST /v1/tasks/enqueue
Authorization: Bearer <jwt_token>  # Required (Story 23.10)
X-Cabinet-Id: <cabinet_uuid>       # Required
Content-Type: application/json

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "cabinet_id": "<cabinet_id>",
    "weeks": ["2025-W46"],
    "nm_ids": ["321678606"]
  }
}
```

### Documentation References

- **Story**: [`docs/stories/epic-23/story-23.10-enable-jwt-auth-on-task-apis.md`](../../../docs/stories/epic-23/story-23.10-enable-jwt-auth-on-task-apis.md)
- **QA Gate**: [`docs/qa/gates/23.10-enable-jwt-auth-on-task-apis.yml`](../../../docs/qa/gates/23.10-enable-jwt-auth-on-task-apis.yml)
- **CLAUDE.md Section**: Search for "Story 23.10: Task & Schedule API Authentication"

---

[< Back to Index](./README.md) | [< Previous: Workflow & Guides](./README-SHARD-06-workflow-guides.md)

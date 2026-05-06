# Request #169: Backend Update Report — Epics 101-106

**Date**: 2026-05-03
**Status**: Informational / Ready for Integration
**Epics Covered**: 101 (Acquiring), 102 (Unit Economics), 103 (Data Integrity), 104 (Frontend Requests), 105 (FBS REST API), 106 (Return Classification)

---

## Summary

6 epics completed (101-106). **18 new/changed endpoints**, **8 new response fields**, **3 bug fixes**. This report covers everything the frontend team needs to integrate.

---

## 1. NEW ENDPOINTS — Ready for Integration

### 1.1 Acquiring Analytics (Epic 101)

3 endpoints for WB acquiring cost reports.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/acquiring/reports?from=&to=` | List acquiring reports for date range |
| GET | `/v1/analytics/acquiring/reports/:id/detail` | Per-transaction detail for a report |
| GET | `/v1/analytics/acquiring/detail?from=&to=` | Cross-report detail for date range |

**Auth**: JWT + CabinetGuard. **Cache**: 30 min. **Rate limit resilience**: Returns `503` + `Retry-After` header when WB rate-limits.

### 1.2 FBS Analytics REST API (Epic 105)

7 endpoints — services had 60+ tests but zero REST exposure. Now fully wired.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/fbs/stock/groups?from=&to=` | Stock breakdown by product groups |
| GET | `/v1/analytics/fbs/stock/sizes?from=&to=&nm_id=` | Stock breakdown by sizes |
| GET | `/v1/analytics/fbs/stock/regions` | Regional stock breakdown by WB offices |
| POST | `/v1/analytics/fbs/stock/export` | Create async CSV export (rate-limited 1/min) |
| GET | `/v1/analytics/fbs/stock/export/:exportId` | Poll export status |
| GET | `/v1/analytics/fbs/stock/export/:exportId/download` | Download CSV when ready |
| GET | `/v1/analytics/fbs/enhanced?from=&to=` | Aggregated FBS analytics (orders + stock + regional + calculated metrics) |

**Auth**: JWT + CabinetGuard. **Cache**: 1h for stock endpoints, 15min for enhanced.

The `enhanced` endpoint returns:
```json
{
  "orderStats": { ... },
  "stockAnalytics": { ... },
  "regionalData": [ ... ],
  "calculatedMetrics": {
    "turnoverRate": 0.0,
    "stockCoverageDays": 0,
    "ordersPerProduct": 0.0
  },
  "funnelData": { ... }
}
```

### 1.3 Buyout Reconciliation (Epic 106)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/buyout/reconciliation?from=&to=&nmId=` | Per-SKU reconciliation with anomaly flags |

Returns anomaly types: `return_without_buyout`, `orphan_buyout`, `return_quantity_mismatch`. Data refreshed daily at 07:00 MSK.

### 1.4 Test-Only Seeding (Epic 103)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/test/seed/dbw-order` | Seed DBW orders with mock client info |
| DELETE | `/v1/test/seed/dbw-order/:orderId` | Clean up seeded orders |

**Only available when** `NODE_ENV=development`. Supports `count` param (max 20). Use for E2E tests.

---

## 2. NEW RESPONSE FIELDS — Existing Endpoints

### 2.1 Finance Summary — `acquiring_total` (Epic 101)

**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

```json
{
  "summary_rus": {
    "acquiring_total": 12345.67  // NEW — or null when no acquiring data
  },
  "summary_eaeu": {
    "acquiring_total": null
  },
  "summary_total": {
    "acquiring_total": 12345.67  // NEW — consolidated RUS + EAEU
  }
}
```

4th expense slice alongside commission/logistics/storage. Graceful degradation: `null` when data unavailable.

### 2.2 Finance Summary — `retail_price_total` (Epic 104)

**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

```json
{
  "summary_rus": {
    "retail_price_total": 1500000.00  // NEW — sum of YOUR prices BEFORE WB discounts
  },
  "summary_total": {
    "retail_price_total_combined": 1500000.00  // NEW — RUS + EAEU
  }
}
```

Enables full sales funnel visualization:
`retail_price_total -> sales_gross -> wb_sales_gross -> net_payout`

### 2.3 Cabinet Summary — `commission_other` (Epic 104)

> **CORRECTION (2026-05-03)**: The original description below was inaccurate. At the time of this report, `commission_other` was a misleading alias of `commission_rub` from `weekly_margin_fact` — it did **NOT** contain the WB.Promotion + Dzham costs claimed below. Story 107.1 has since fixed the field to properly extract these costs from `corrections` using `bonus_type_name` pattern matching. The description and code comment now correctly reflect the post-107.1 semantics. See [Response #170 Q4](./170-RESPONSE-EPICS-101-106-CLARIFICATIONS.md) for details. (Story 107.1 implementation: `src/analytics/services/trends-analytics.service.ts` — `commission_other` extraction from `corrections` via `bonus_type_name` matching.)

**Endpoint**: `GET /v1/analytics/weekly/cabinet-summary`

```json
{
  "commission_other": 872000.00  // WB.Promotion + Dzham costs extracted from corrections via bonus_type_name matching
}
```

Extracted from `corrections` in `wb_finance_raw` using `bonus_type_name` pattern matching (WB.Promotion and Dzham). Historical periods (W01+) automatically covered — no migration needed. Frontend can now restore "Dop. servisy WB" row in `PnLWaterfall.tsx`.

**IMPORTANT**: `total_commission_rub` already includes this. `commission_other` is supplemental — do NOT double-count.

### 2.4 Unit Economics — `delivery_to_warehouse` + FCU (Epic 102)

**Endpoint**: `GET /v1/analytics/unit-economics`

New fields in response:

| Field | Type | Description |
|-------|------|-------------|
| `delivery_to_warehouse` | `number \| null` | 10th cost category — actual delivery-to-warehouse cost |
| `latest_fcu` | `number \| null` | Final Cost per Unit from latest confirmed shipment |
| `latest_dcu` | `number \| null` | Delivery Cost per Unit from latest confirmed shipment |

**Updated waterfall ordering** (`cost_category_order`):
```
cogs -> delivery_to_warehouse -> commission -> logistics_delivery -> logistics_return
-> storage -> paid_acceptance -> penalties -> other_deductions -> advertising
```

`delivery_to_warehouse` is now at position 2 (after COGS). Unblocks Stories 77.4 and 77.5.

---

## 3. BUG FIXES

### 3.1 Pipeline Health `errorRate` Clamped (Epic 105, Request #167)

**Endpoint**: `GET /v1/monitoring/pipeline-health-grid`

`errorRate` is now guaranteed `[0, 1]`. Previously could exceed 1.0, triggering false `AlertTriangle` in `MonitorPipelineHealth.tsx`. Frontend defensive guard can remain but will no longer fire for this reason.

### 3.2 Buyout Controller `sortOrder` Mapping (Epic 104)

**Endpoint**: `GET /v1/analytics/buyout/by-sku`

`sortOrder` query param now correctly maps to internal `sortDir`. Sorting was silently broken before.

### 3.3 Return Classification — FBO Returns Now Classified (Epic 106, Request #153)

**Endpoints affected**:
- `GET /v1/analytics/returns/reasons`
- `GET /v1/analytics/returns/reasons/by-sku`

FBO returns were previously `classified=0` (63% of all returns unclassified). Now classified daily via SDK v3.9.3. Return analytics should show near-complete coverage.

### 3.4 Buyout Analytics — SDK Reconciliation Overlay (Epic 106, Request #154)

**Endpoints affected**:
- `GET /v1/analytics/buyout/by-sku`
- `GET /v1/analytics/buyout/summary`

`source` field can now be `'sdk_reconciliation'` (in addition to `'weekly'`, `'realtime'`, `'blended'`). SDK reconciliation data overrides the previous MAX heuristic for return counts. `buyoutRatePct` and `returnRatePct` now more accurate.

---

## 4. MONITORING — New Pipelines

2 new pipeline rows in `GET /v1/monitoring/pipeline-health-grid`:

| Pipeline | Schedule | Description |
|----------|----------|-------------|
| `fbo_return_classification_sync` | 06:30 MSK daily | Classifies FBO returns with reason codes |
| `buyout_reconciliation_sync` | 07:00 MSK daily | SDK reconciliation of buyouts vs returns |

Total pipeline count: **17** (was 16, then 18, consolidated to 17 in Story 108.3).

---

## 5. Request Resolution Status

Resolution status of frontend requests mentioned in this report:

| Request # | Title | Priority | Status |
|-----------|-------|----------|--------|
| #148 | Fulfillment returns count always 0 | MEDIUM | FIXED — Epic 106 unified return pipeline + verified by Story 107.8 |
| #157 | Daily finance breakdown endpoint | HIGH | IMPLEMENTED — Epic 88, Stories 88.1 + 88.2 |
| #159 | Preliminary tax for incomplete weeks | LOW | PENDING — real-time tax for current week |
| #165 | Orders price/salePrice inversion | MEDIUM | CLOSED 2026-04-30 — Story 103.1 sanity check deployed, frontend guard retained |
| #150 | Monitoring false alarms | LOW | RESOLVED — Story 107.9, all 18 registries in sync |

---

## 6. DATA INTEGRITY NOTE — Backfill Completed

All periodic WB API data tables have been backfilled to 100% coverage (Apr 1 - May 2, 2026):

| Table | Coverage | Rows |
|-------|----------|------|
| daily_sales_raw | 32/32 days | 12,402 |
| adv_daily_stats | 32/32 days | 1,034 |
| inventory_snapshots | 32/32 days | 1,133 |
| paid_storage_daily | 32/32 days | 4,789 |
| product_funnel_daily | 32/32 days | 1,183 |
| fbo_fbs_analytics_daily | 32/32 days | 32 |
| reports_orders | 32/32 days | 2,387 |
| wb_finance_raw | Apr 1-26 (W18 pending WB publication) | 9,831 |

Data should now be consistent across all dashboards. No more "empty" or "zero" gaps for the April-May period.

---

## 7. Quick Reference — Changed Files (for Swagger/Type Generation)

| Area | File | Changes |
|------|------|---------|
| Acquiring API | `src/analytics/controllers/acquiring-analytics.controller.ts` | 3 endpoints |
| FBS Analytics API | `src/analytics/controllers/fbs-analytics.controller.ts` | 7 endpoints |
| Buyout Reconciliation | `src/analytics/controllers/buyout-analytics.controller.ts` | 1 endpoint + overlay on 2 existing |
| Finance Summary DTOs | `src/analytics/dto/weekly-payout-summary.dto.ts` | `acquiring_total`, `retail_price_total` |
| Finance Total DTOs | `src/analytics/dto/weekly-payout-total.dto.ts` | `acquiring_total`, `retail_price_total_combined` |
| Cabinet Summary DTOs | `src/analytics/dto/response/cabinet-summary-response.dto.ts` | `commission_other` |
| Unit Economics DTOs | `src/analytics/dto/response/unit-economics-response.dto.ts` | `delivery_to_warehouse`, `latest_fcu`, `latest_dcu` |
| Pipeline Registry | `src/monitoring/pipeline-registry.ts` | 2 new pipelines |
| Test Seeding | `src/test-utils/test.controller.ts` | 2 endpoints (dev-only) |

Run `npm run docs:generate` or check Swagger UI at `http://localhost:3000/api` for the latest OpenAPI schema.

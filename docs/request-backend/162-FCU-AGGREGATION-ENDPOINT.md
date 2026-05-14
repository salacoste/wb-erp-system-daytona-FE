# Request #162: FCU Aggregation Endpoint — Per-SKU Final Cost from Latest Confirmed Shipment

**Date**: 2026-03-12
**Status**: Requested
**Priority**: P1 (blocks Stories 77.4, 77.5 — Unit Economics dashboard integration)
**Related**: Epic 77-FE (Story 77.3), Backend Epic 79 (Shipment Cost Allocation)
**Requested By**: Frontend Team

---

## Problem Statement

The Unit Economics dashboard (`/v1/analytics/unit-economics`) currently tracks 9 cost categories (`CostsPct` / `CostsRub` in `src/types/unit-economics.ts`):
cogs, commission, logistics_delivery, logistics_return, storage, paid_acceptance, penalties, other_deductions, advertising.

**Missing**: delivery-to-warehouse costs (the DCU calculated by the Shipment Cost system from Epic 79). Without this, the dashboard underreports true product cost, leading to inflated margin estimates.

**Goal**: Add a 10th cost category `delivery_to_warehouse` to unit economics by fetching the **latest confirmed FCU per SKU** from the Shipment Cost subsystem.

The frontend needs a lightweight aggregation endpoint that returns, for each nmId in the cabinet, the FCU breakdown (PCU + DCU) from the most recently confirmed shipment containing that SKU. This enables:

1. **Waterfall chart** — `delivery_to_warehouse` cost bar between COGS and WB fees
2. **Per-SKU table** — `latestFcu`, `latestDcu` columns in unit economics breakdown
3. **Dashboard summary** — aggregate delivery-to-warehouse as % of revenue

---

## Proposed Endpoint

---

## Backend Team Response

**Status**: RESOLVED — Endpoint `GET /v1/shipment-cost/by-sku` implemented in Epic 79. Frontend hook `useFcuAggregation` and API client `fcu-aggregation-api.ts` wired up. Returns per-SKU FCU (PCU+DCU) from latest confirmed shipment.
**Resolution date**: Not yet implemented
**Summary**: Request filed for a lightweight aggregation endpoint returning the latest confirmed FCU (Final Cost Unit = PCU + DCU) per SKU. Would enable a 10th cost category `delivery_to_warehouse` in the Unit Economics dashboard. Blocking Stories 77.4 and 77.5.
**Remaining frontend action**: Awaiting backend implementation. Unit Economics dashboard currently shows 9 categories without delivery-to-warehouse.

## Proposed Endpoint

```
GET /v1/shipment-cost/by-sku
```

### Why `/v1/shipment-cost/by-sku` (not `/v1/shipments/by-sku`)

The existing CRUD endpoints live at `/v1/shipments` (see Request #161 §6). The aggregation endpoint is a **read-only analytical view** over calculated shipment data, so it belongs under the `/v1/shipment-cost/` namespace alongside any future cost analytics.

### Authentication

Standard cabinet-scoped auth (same as all `/v1/*` endpoints):

```
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}      ← extracted from JWT claims
```

---

## Request / Response Spec

### Request

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `week` | `string` | No | (latest) | ISO week filter (e.g., `2026-W10`). If provided, only returns FCU from shipments confirmed within that ISO week. If omitted, returns FCU from the most recent confirmed shipment per SKU regardless of date. |

`cabinetId` is extracted from JWT — not a query param.

**Example requests**:
```
GET /v1/shipment-cost/by-sku
GET /v1/shipment-cost/by-sku?week=2026-W10
```

### Response

**Envelope**: `{ data: FcuBySkuItem[] }` — standard list envelope pattern.

**Note on `skipDataUnwrap`**: The frontend API client auto-unwraps `{ data: ... }` responses by default. For this endpoint, the standard unwrap behavior applies (unlike `getShipments()` which uses `skipDataUnwrap: true`).

```typescript
interface FcuBySkuResponse {
  data: FcuBySkuItem[]
}

interface FcuBySkuItem {
  /** Wildberries article ID */
  nmId: number
  /** Product name / vendor code for display */
  productName: string
  /** PCU — Production Cost per Unit (unitCostRub from ShipmentBoxLine) */
  latestPcu: number
  /** DCU — Delivery Cost per Unit (deliveryCostPerUnit from ShipmentBoxLine) */
  latestDcu: number
  /** FCU — Final Cost per Unit = PCU + DCU (finalCostPerUnit from ShipmentBoxLine) */
  latestFcu: number
  /** UUID of the shipment this data came from */
  shipmentId: string
  /** Human-readable shipment name (nullable in DB — COALESCE to empty string) */
  shipmentName: string
  /** ISO timestamp of when the shipment was confirmed */
  confirmedAt: string
}
```

**Field-level detail**:

| Field | Source | Type | Notes |
|-------|--------|------|-------|
| `nmId` | `shipment_box_lines.nm_id` | `integer` | Unique per row in response |
| `productName` | `products.vendor_code` | `string` | LEFT JOIN — may be `null` if product not synced |
| `latestPcu` | `shipment_box_lines.production_cost_per_unit` | `float` | Decimal → float cast. From COGS table at calculation time |
| `latestDcu` | `shipment_box_lines.delivery_cost_per_unit` | `float` | Decimal → float cast. Calculated by shipment cost allocation |
| `latestFcu` | `shipment_box_lines.final_cost_per_unit` | `float` | Decimal → float cast. = PCU + DCU |
| `shipmentId` | `shipments.id` | `uuid` | For drill-down navigation |
| `shipmentName` | `shipments.name` | `string` | Nullable in DB — use `COALESCE(s.name, '')` |
| `confirmedAt` | `shipments.confirmed_at` | `ISO 8601` | When the shipment was confirmed |

**Compatibility note**: The response fields are compatible with the existing `CalculationResultItem` type (see `src/types/shipment-cost.ts:192-200`), with renamed fields using the `latest*` prefix to distinguish aggregated values from per-shipment calculation results:

| CalculationResultItem | FcuBySkuItem | Same data? |
|----------------------|--------------|------------|
| `unitCostRub` (FE name) | `latestPcu` | Yes — DB column: `production_cost_per_unit` |
| `deliveryCostPerUnit` | `latestDcu` | Yes — from latest confirmed shipment |
| `finalCostPerUnit` | `latestFcu` | Yes — from latest confirmed shipment |
| `totalUnits` | (not included) | Not needed for unit economics |
| `finalCostLine` | (not included) | Not needed for unit economics |

**Empty response**: If the cabinet has no confirmed shipments (or no SKUs with calculated FCU), return `{ data: [] }`.

---

## SQL Sketch

### Primary query — per-SKU FCU from latest confirmed shipment

```sql
-- Per-SKU FCU from the most recently confirmed shipment
SELECT DISTINCT ON (bl.nm_id)
  bl.nm_id                          AS "nmId",
  COALESCE(p.vendor_code, 'N/A')   AS "productName",
  bl.production_cost_per_unit::float           AS "latestPcu",
  bl.delivery_cost_per_unit::float  AS "latestDcu",
  bl.final_cost_per_unit::float     AS "latestFcu",
  s.id                              AS "shipmentId",
  COALESCE(s.name, '')              AS "shipmentName",
  s.confirmed_at                    AS "confirmedAt"
FROM shipment_box_lines bl
  JOIN shipment_pallets sp ON sp.id = bl.pallet_id
  JOIN shipments s ON s.id = sp.shipment_id
  LEFT JOIN products p ON p.nm_id = bl.nm_id AND p.cabinet_id = s.cabinet_id
WHERE s.status = 'CONFIRMED'
  AND s.cabinet_id = :cabinetId
  AND bl.final_cost_per_unit IS NOT NULL
ORDER BY bl.nm_id, s.confirmed_at DESC;
```

### With optional week filter

When the `week` query param is provided, replace the WHERE clause in the primary query above with:

```sql
-- Replace WHERE clause when ?week=2026-W10 is provided
WHERE s.status = 'CONFIRMED'
  AND s.cabinet_id = :cabinetId
  AND bl.final_cost_per_unit IS NOT NULL
  AND s.confirmed_at >= :weekStart   -- Monday 00:00 UTC of ISO week
  AND s.confirmed_at < :weekEnd      -- Monday 00:00 UTC of next ISO week
ORDER BY bl.nm_id, s.confirmed_at DESC;
```

### Join path explanation

```
shipment_box_lines (bl)
    ↑ bl.pallet_id = sp.id
shipment_pallets (sp)
    ↑ sp.shipment_id = s.id
shipments (s)
    WHERE s.status = 'CONFIRMED'
    AND s.cabinet_id = :cabinetId

LEFT JOIN products (p)
    ON p.nm_id = bl.nm_id AND p.cabinet_id = s.cabinet_id
```

**Why `DISTINCT ON`**: A single nmId may appear in multiple confirmed shipments. `DISTINCT ON (bl.nm_id) ... ORDER BY bl.nm_id, s.confirmed_at DESC` selects only the row from the most recently confirmed shipment per SKU.

**Why `LEFT JOIN products`**: Not all SKUs in box lines may have been synced to the products table. Using LEFT JOIN ensures we still return FCU data even if product metadata is missing.

### Prisma raw query equivalent

```typescript
const results = await this.prisma.$queryRaw<FcuBySkuItem[]>`
  SELECT DISTINCT ON (bl."nm_id")
    bl."nm_id"                          AS "nmId",
    COALESCE(p."vendor_code", 'N/A')    AS "productName",
    bl."production_cost_per_unit"::float           AS "latestPcu",
    bl."delivery_cost_per_unit"::float  AS "latestDcu",
    bl."final_cost_per_unit"::float     AS "latestFcu",
    s."id"                              AS "shipmentId",
    COALESCE(s."name", '')              AS "shipmentName",
    s."confirmed_at"                    AS "confirmedAt"
  FROM "shipment_box_lines" bl
    JOIN "shipment_pallets" sp ON sp."id" = bl."pallet_id"
    JOIN "shipments" s ON s."id" = sp."shipment_id"
    LEFT JOIN "products" p ON p."nm_id" = bl."nm_id" AND p."cabinet_id" = s."cabinet_id"
  WHERE s."status" = 'CONFIRMED'
    AND s."cabinet_id" = ${cabinetId}
    AND bl."final_cost_per_unit" IS NOT NULL
  ORDER BY bl."nm_id", s."confirmed_at" DESC
`;
```

---

## Performance Requirements

| Metric | Target | Rationale |
|--------|--------|-----------|
| p95 latency | < 500ms | Cabinets with up to 5000 SKUs |
| p99 latency | < 1000ms | Extreme outlier cabinets |
| Max response size | ~5000 items | One row per unique nmId |

### Recommended indexes

```sql
-- Primary: filter confirmed shipments by cabinet, ordered by confirmation date
CREATE INDEX IF NOT EXISTS idx_shipments_cabinet_status_confirmed
  ON shipments (cabinet_id, status, confirmed_at DESC);

-- Secondary: join path from box_lines → pallets
-- (likely already exists from Epic 79 implementation)
CREATE INDEX IF NOT EXISTS idx_shipment_box_lines_pallet_id
  ON shipment_box_lines (pallet_id);

-- Secondary: filter box_lines with calculated FCU
CREATE INDEX IF NOT EXISTS idx_shipment_box_lines_fcu_not_null
  ON shipment_box_lines (pallet_id)
  WHERE final_cost_per_unit IS NOT NULL;
```

### Optional optimization — materialized view

If query performance exceeds 500ms on large cabinets, consider a materialized view refreshed on shipment confirmation:

```sql
CREATE MATERIALIZED VIEW mv_latest_fcu_by_sku AS
  SELECT DISTINCT ON (bl.nm_id, s.cabinet_id)
    s.cabinet_id,
    bl.nm_id,
    bl.production_cost_per_unit,
    bl.delivery_cost_per_unit,
    bl.final_cost_per_unit,
    s.id AS shipment_id,
    s.name AS shipment_name,
    s.confirmed_at
  FROM shipment_box_lines bl
    JOIN shipment_pallets sp ON sp.id = bl.pallet_id
    JOIN shipments s ON s.id = sp.shipment_id
  WHERE s.status = 'CONFIRMED'
    AND bl.final_cost_per_unit IS NOT NULL
  ORDER BY bl.nm_id, s.cabinet_id, s.confirmed_at DESC;

-- Refresh trigger: call REFRESH MATERIALIZED VIEW CONCURRENTLY after each shipment confirmation
```

This is **optional** — start with the raw query and measure before adding this complexity.

---

## Integration Notes

### Frontend consumer (Story 77.4)

Story 77.4 will create:
- `src/lib/api/shipment-cost/fcu-aggregation-api.ts` — `getFcuBySku(week?: string): Promise<FcuBySkuItem[]>`
- `src/hooks/use-fcu-aggregation.ts` — TanStack Query hook `useFcuBySku(week?: string)`

These will feed into the Unit Economics dashboard (Story 77.5) to add the `delivery_to_warehouse` cost category.

### Compatibility with existing types

The `CalculationResultItem` type (from `/calculate` endpoint) returns per-shipment results. The new `FcuBySkuItem` returns per-SKU aggregated data across shipments. They share the same underlying data (PCU, DCU, FCU from `shipment_box_lines`) but serve different use cases:

| Endpoint | Use case | Scope |
|----------|----------|-------|
| `POST /v1/shipments/:id/calculate` | Per-shipment cost calculation | Single shipment |
| `GET /v1/shipment-cost/by-sku` | Per-SKU latest FCU | All confirmed shipments |

### Alternative approach: extend `/v1/products`

An alternative is to add FCU fields to the existing `GET /v1/products` endpoint with an `include_fcu=true` query param. This would:

**Pros**:
- Single API call for products + FCU data
- No new endpoint to maintain
- Frontend already consumes `/v1/products`

**Cons**:
- Larger response payload (products + FCU fields for all SKUs)
- Mixes product catalog concerns with shipment cost analytics
- `include_fcu=true` requires a complex JOIN that slows down the products endpoint for non-FCU use cases
- Harder to cache — FCU changes only on shipment confirmation, but products change frequently

**Recommendation**: Use the dedicated `/v1/shipment-cost/by-sku` endpoint. It keeps concerns separated, is independently cacheable, and doesn't affect existing product endpoint performance.

### Error responses

Follow standard API error format:

| Status | Condition | Body |
|--------|-----------|------|
| 200 | Success (even if empty) | `{ data: [] }` or `{ data: [...] }` |
| 400 | Invalid `week` format | `{ message: "Invalid week format. Expected YYYY-Www", statusCode: 400 }` |
| 401 | Missing/invalid JWT | `{ message: "Unauthorized", statusCode: 401 }` |
| 500 | Internal error | `{ message: "Internal server error", statusCode: 500 }` |

---

## References

- **Request #161**: [161-SHIPMENT-COST-ALLOCATION.md](./161-SHIPMENT-COST-ALLOCATION.md) — Full shipment cost backend spec (23 endpoints, FCU formula, data model)
- **Epic 77-FE**: [epic-77-fe-shipment-dashboard-integration-tech-debt.md](../epics/epic-77-fe-shipment-dashboard-integration-tech-debt.md) — Dashboard integration epic
- **Story 77.3**: [77.3-fe-backend-request-fcu-aggregation-endpoint.md](../../_bmad-output/implementation-artifacts/77.3-fe-backend-request-fcu-aggregation-endpoint.md) — This request's story file
- **CalculationResultItem**: `src/types/shipment-cost.ts:192-200` — Existing per-shipment calculation result type
- **CostsPct / CostsRub**: `src/types/unit-economics.ts:60-103` — Current 9 cost categories (delivery_to_warehouse will be 10th)
- **Swagger UI**: `http://localhost:3000/api` → section `shipment-cost`
- **HTTP test examples**: `test-api/35-shipment-cost.http`

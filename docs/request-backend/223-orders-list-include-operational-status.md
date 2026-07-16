# 223 — GET /v1/orders (+ /:id) must return `operationalStatus`

**Status:** ✅ Backend LIVE — `operationalStatus` + `operationalStatusUpdatedAt` are returned by both `GET /v1/orders` (list) and `GET /v1/orders/:orderId` (details). Verified in `src/orders/services/orders-query.service.ts` (select projection at lines 103–104 and 174–175) + `src/orders/services/orders-query.mapper.ts`; FE integrated via `src/lib/api/orders-normalizer.ts` and `OrdersTableRow.tsx`. Retained as a historical record; the problem description below predates the fix.

> **(Historical — was blocking.)** Originally blocked FE Order Management (epic O1–O3). Filed from FE story O1 verify-first.

## Problem

`PATCH /v1/orders/:orderId/operational-status` (story S11 OA0) works — it sets `operationalStatus` + `operationalStatusUpdatedAt` and returns `{id, operationalStatus, operationalStatusUpdatedAt}`. **But the read endpoints don't surface it:**

- `GET /v1/orders?limit=N` (list) → item keys: `{orderId, orderUid, nmId, vendorCode, productName, price, salePrice, supplierStatus, wbStatus, warehouseId, deliveryType, isB2B, cargoType, createdAt, statusUpdatedAt}` — **no `operationalStatus`**.
- `GET /v1/orders/:orderId` (details) → adds `{chrtId, processingTimeSeconds, statusHistory, syncedAt}` — **still no `operationalStatus`** (verified `operationalStatus: null`).

So the FE cannot display an order's current operational status, nor drive the **transition-aware** status-change UI (the state machine in `order-status-machine.service.ts` needs the `from` status — `NEW→[ASSEMBLED,CANCELLED]`, `ASSEMBLED→[PACKED,CANCELLED]`, `PACKED→[SHIPPED]`, `SHIPPED→[DELIVERED,RETURNED]`, `DELIVERED`/`CANCELLED` terminal). The FE only learns the status from the PATCH response itself.

## Impact

- **O1 (operational-status UI)** ⛔ — can't show current status or valid next transitions.
- **O2/O3 (confirm/cancel)** degraded — the FE can't tell which orders are confirmable/cancellable without the current status.

## Ask

Add `operationalStatus` (`OrderOperationalStatus` enum: `NEW|ASSEMBLED|PACKED|SHIPPED|DELIVERED|CANCELLED|RETURNED`, null/`NEW` default) + `operationalStatusUpdatedAt` to **both**:
1. `GET /v1/orders` list item shape, and
2. `GET /v1/orders/:orderId` details.

`operationalStatus` already exists on the order row (the PATCH writes it); this is a `select`/mapping addition in `listOrders` + `getOrderDetails` (the query service). `null` → render as `NEW` (the default per `orders.controller.ts:588`).

## FE readiness

Once `operationalStatus` is in the list, FE story O1 ships immediately: a per-order status badge + a transition-aware «Сменить статус» control (dropdown of `ALLOWED_TRANSITIONS[currentStatus]`) → PATCH → optimistic update. State machine is already known (read from `order-status-machine.service.ts`).

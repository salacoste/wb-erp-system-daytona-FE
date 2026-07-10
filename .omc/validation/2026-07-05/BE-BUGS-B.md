# BE-BUGS-B.md — Cluster B validation (Orders/Supplies/Shipments), 2026-07-05

Append-only handoff log of backend-owned defects surfaced during full-page FE validation against live BE (`:3000`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`, JWT in `/tmp/feval-token`). Each entry is self-contained for the BE team.

---

## BE-BUG-1 — `PATCH /v1/orders/{uuid}/meta` always returns 500 (Blocks Story O4 «Код маркировки»)

- **Endpoint:** `PATCH /v1/orders/:orderUuid/meta`
- **Source of truth:** `frontend/src/lib/api/orders-actions.ts:53` (FE contract doc); `frontend/src/hooks/useOrdersMutations.ts:220-235` (`useUpdateOrderMeta`).
- **Severity:** HIGH — fully blocks the O4 marking-code (Честный ЗНАК) feature. Every «Код маркировки» → save throws.
- **Repro (two orders, two metaTypes — both 500):**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  # Order 1 (operationalStatus=ASSEMBLED), IMEI:
  curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    -H "Content-Type: application/json" \
    -d '{"metaType":"IMEI","value":"0104630098765432191234"}' \
    http://localhost:3000/v1/orders/d3e96ae8-d3c6-42f2-9efb-7cc67a277272/meta
  # Order 2 (operationalStatus=NEW), GTIN:
  curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    -H "Content-Type: application/json" \
    -d '{"metaType":"GTIN","value":"0123456789012"}' \
    http://localhost:3000/v1/orders/e99af245-92a7-417d-b7ef-ec0f7febf99e/meta
  ```
- **Response (both):**
  ```
  HTTP/1.1 500 Internal Server Error
  {"error":{"code":"INTERNAL_SERVER_ERROR","message":"Internal server error","details":[],
            "trace_id":"6846b6fc-8658-4e05-880f-6e03b22a2836",
            "timestamp":"2026-07-06T00:52:26.114Z",
            "path":"/v1/orders/d3e96ae8-d3c6-42f2-9efb-7cc67a277272/meta"}}
  ```
  Second trace_id: `ada3b4be-66d1-45ee-9752-2a00ee4b50e9`.
- **Expected:** `200 {updated:true}` (per FE contract doc) and the marking code persisted on the order; a subsequent `GET /v1/orders/:uuid` (or list) should expose the saved `metaType` + value.
- **Actual:** 500 INTERNAL_SERVER_ERROR; no field persisted (verified: `GET /v1/orders?limit=200` → order object has no `metaType`/marking key).
- **Note:** the body shape (`{metaType:"IMEI"|"GTIN"|"SGTIN"|"UIN", value:string 1-200}`) is what the FE sends per the DTO; whether the backend expects a different field name (e.g. `markingCode`, `meta`) or a different path param (UUID vs orderId — see BE-BUG-2) is the most likely root cause. FE logs `Update order meta: {orderUuid, metaType}` then `ApiError: Internal server error`.

---

## BE-BUG-2 — `GET /v1/orders/{uuid}` 404s; detail endpoint only resolves by WB `orderId` (asymmetric vs. mutation endpoints)

- **Endpoint:** `GET /v1/orders/:id`
- **Source of truth:** `frontend/src/lib/api/orders.ts:96` `getOrderById(orderId)` (FE passes WB orderId, works); `frontend/src/hooks/useOrders.ts:84-99` `useOrderDetails`.
- **Severity:** MEDIUM (no current user breakage because the FE happens to pass `orderId`, but a footgun + the contract is inconsistent with the mutation endpoints which REQUIRE the UUID).
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  # By UUID (the same id used by /confirm, /cancel, /meta) -> 404:
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    http://localhost:3000/v1/orders/d3e96ae8-d3c6-42f2-9efb-7cc67a277272
  # By WB orderId -> 200:
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    http://localhost:3000/v1/orders/5286146256
  ```
- **Response (UUID):**
  ```json
  {"error":{"code":"ORDER_NOT_FOUND","message":"Order d3e96ae8-d3c6-42f2-9efb-7cc67a277272 not found",
            "trace_id":"dd36eff7-03c7-40c0-b6f1-175572f07075",
            "timestamp":"2026-07-06T00:54:16.182Z","path":"/v1/orders/d3e96ae8-…"}}
  ```
- **Response (orderId 5286146256):** 200 with full detail body.
- **Expected vs Actual:** the list returns both `id` (UUID) and `orderId` (WB numeric). The mutation endpoints (`/confirm`, `/cancel`, `/meta`, `/operational-status`) all key on the **UUID**. The detail endpoint should also accept the UUID (or at minimum document that it requires `orderId`). Today the asymmetry is a silent trap — any consumer reasonably assumes `/orders/{id}` takes the same `id` field the list returns first.
- **Impact:** no FE bug today (FE passes orderId for detail, UUID for mutations — `useOrdersPageState.ts:111` `setSelectedOrderId(order.orderId)`), but the API surface is inconsistent.

---

## BE-BUG-3 — No `DELETE /v1/supplies/:id` endpoint (cannot remove a supply)

- **Endpoint:** `DELETE /v1/supplies/:id`
- **Severity:** LOW (test-data hygiene + lifecycle gap; not blocking any FE feature — supplies likely have a close/cancel workflow instead).
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  curl -s -X DELETE -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    http://localhost:3000/v1/supplies/93aeb2f6-59c6-4d50-9982-462008b7ee2a
  ```
- **Response:**
  ```json
  {"error":{"code":"NOT_FOUND","message":"Cannot DELETE /v1/supplies/93aeb2f6-…",
            "trace_id":"76078910-a8bb-48d4-9b79-7f3a2719736b",
            "timestamp":"2026-07-06T01:07:27.590Z","path":"/v1/supplies/93aeb2f6-…"}}
  ```
- **Expected:** either a 204/200 delete (DRAFT/OPEN supplies) or a documented 405 with a pointer to the canonical lifecycle transition (e.g. POST `/close`, POST `/cancel`).
- **Actual:** raw Express 404 (route not registered). The FE supplies client (`supplies.ts`) does not invoke DELETE, so no FE breakage — but the cabinet is now littered with an un-removable test supply.
- **Impact:** test-data pollution; if a user creates a supply in error there is no API remedy.

---

## BE-BUG-4 — `GET /v1/box-types` and `GET /v1/sku-packaging` reject any unknown query param with 400

- **Endpoints:** `GET /v1/box-types`, `GET /v1/sku-packaging`
- **Severity:** LOW (FE calls both with no query string today, so no user impact; will trip up future callers / tests that add pagination or filters).
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" "http://localhost:3000/v1/box-types?limit=3"
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" "http://localhost:3000/v1/sku-packaging?limit=3"
  ```
- **Response:**
  ```json
  {"error":{"code":"BAD_REQUEST","message":"Validation failed",
            "details":[{"field":"property","issue":"limit should not exist",
                        "message":"property limit should not exist"}],
            "trace_id":"08f98efc-…","timestamp":"2026-07-06T00:39:20.254Z",
            "path":"/v1/box-types?limit=3"}}
  ```
- **Expected:** either accept standard pagination (`limit`/`offset`/`page`) like the other list endpoints, or strip-and-ignore unknown query params rather than 400.
- **Actual:** NestJS `ValidationPipe` with `whitelist:true` + `forbidNonWhitelisted:true` bounces any param not on the DTO. These two endpoints have a bare/no DTO so every param is rejected.
- **Impact:** none for current FE; future pagination/filter support on these pages will require a DTO change.

---

## Aggregate summary
- 4 BE bugs filed: BE-BUG-1 (HIGH, blocks O4), BE-BUG-2 (MEDIUM, contract asymmetry), BE-BUG-3 (LOW, lifecycle gap), BE-BUG-4 (LOW, strict validation).
- 1 cluster theme: the **Orders mutation/detail contract is inconsistent on the identity field** (UUID for mutations, orderId for detail) — worth a unified fix.
- No BE data-correctness defects: every number rendered in Cluster B matches its API source exactly (orders prices/formatting, FBO aggregate count=690/totalPrice=1 214 376 ₽/cancelRate=0 %, integrity check counters, box-type dimensions/volume).

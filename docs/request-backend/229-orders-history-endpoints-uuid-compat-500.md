# Request #229 — Orders history endpoints: UUID compatibility + 500-on-UUID robustness

**Status:** ✅ RESOLVED and runtime-validated on the current local backend (2026-07-15). UUID and legacy numeric identifiers return 200; malformed/unknown identifiers return 404 `ORDER_NOT_FOUND`, never 500. FE UUID standardization is unblocked for this backend revision.
**Severity:** 🟠 contract inconsistency + minor robustness (500 where 404 is expected); non-blocking for current FE (FE uses `orderId` today).
**Parent validation record:** [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.2 (BE-BUG-2) + "FE-actionable items" #1.
**Endpoints:** `GET /v1/orders/:id/history`, `GET /v1/orders/:id/wb-history`, `GET /v1/orders/:id/full-history`.

---

## 1. Problem

After BE-BUG-2 was fixed, the **base** order-detail endpoint accepts both the internal UUID and the numeric WB `orderId`:

```
GET /v1/orders/<uuid>    → 200   ✅
GET /v1/orders/<orderId> → 200   ✅
```

The three **history sub-routes do NOT** — they accept only the WB `orderId` and return **HTTP 500** on the UUID (live evidence, 2026-07-13):

```
GET /v1/orders/<uuid>/history        → 500   ❌     GET /v1/orders/<orderId>/history        → 200 ✅
GET /v1/orders/<uuid>/wb-history     → 500   ❌     GET /v1/orders/<orderId>/wb-history     → 200 ✅
GET /v1/orders/<uuid>/full-history   → 500   ❌     GET /v1/orders/<orderId>/full-history   → 200 ✅
```

Two distinct issues:
1. **Identity inconsistency:** `:id` resolves UUID↔orderId for the base route but the three history sub-routes only resolve `orderId`. Consumers using the list's `id` (UUID) field for a sub-route get a 500.
2. **Robustness:** an unrecognized/UUID path param yields **500**, not **404** — a bad-input request looks like a server fault.

## 2. Root cause (likely)

The history controllers appear to key on a numeric `orderId` lookup; a UUID string fails that lookup and the error surfaces as an unhandled 500 instead of a clean `ORDER_NOT_FOUND` 404. (Confirmed empirically; BE source check will pinpoint the handler.)

## 3. Impact

- **Blocks FE cleanup:** #226 optional item #1 ("standardize orders detail navigation on UUID — drop the `orderId`-for-detail workaround") is **not safe** as-is. The Orders detail modal shares its identifier with `OrderHistoryTabs`, which calls all three history sub-routes. Switching the modal to the UUID would load the detail (200) but **500 every history tab**. FE correctly keeps `orderId` for the whole modal chain until this is resolved.
- **Consumer trap:** any consumer assuming `/orders/{id}/{sub}` takes the list's first `id` field (UUID) — the documented primary key for mutations — gets a 500 on history.
- **Observability noise:** 500s on bad input pollute error metrics / alerts.

## 4. What we need from BE (one of)

1. **Preferred — accept UUID on the history sub-routes**, unifying `:id` resolution with the base detail endpoint (so `/orders/{uuid}/{history,wb-history,full-history}` → 200). This unblocks the FE identity-field cleanup.
2. **Alternative — document `orderId`-only** for the history sub-routes, and **return 404** (not 500) when the path param is not a recognized `orderId`. The FE then keeps `orderId` for history and the 500→404 robustness issue is fixed regardless.

Either way, the 500-on-UUID should become a 404 (or a 200) — never a 500.

## 5. Reproduction (live, verified 2026-07-13)

```bash
BASE=http://localhost:3000
TOKEN=$(curl -s -X POST "$BASE/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"<E2E_TEST_PASSWORD>"}' | jq -r .access_token)
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
H="-H Authorization:Bearer $TOKEN -H X-Cabinet-Id:$CAB"
UUID=86d7384b-72b7-4f3f-bf26-44834fc6f04f        # order.id from GET /v1/orders
WBID=5315578900                                   # order.orderId (WB) from the same list row

curl -s -o /dev/null -w "history   UUID=%{http_code}\n" "$BASE/v1/orders/$UUID/history" $H      # 500 ❌
curl -s -o /dev/null -w "history   WBID=%{http_code}\n" "$BASE/v1/orders/$WBID/history" $H     # 200 ✅
# same pattern for /wb-history and /full-history
```

## 6. Acceptance

- `GET /v1/orders/<uuid>/{history,wb-history,full-history}` → 200 (option 1), **or** → 404 with `ORDER_NOT_FOUND` (option 2). Never 500.
- A consumer using the list's `id` (UUID) field on a history sub-route no longer triggers a 500.

## 7. References

- Parent: [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.2 (BE-BUG-2) + "FE-actionable items" #1.
- FE consumers: `OrderDetailsModal` → `OrderHistoryTabs` → `getOrderHistory` / `getWbHistory` / `getFullHistory` (src/lib/api/orders-history-api.ts); modal identifier sourced from `useOrdersPageState.handleRowClick` (`order.orderId`).

---

## Current implementation addendum — 2026-07-13

**Current status:** ✅ **Code-complete locally; deployment/live reprobe external.** The existing UUID/numeric compatibility work was preserved and freshly verified across detail, history, WB-history, and full-history. Owning-cabinet UUID and numeric identifiers succeed; malformed, unknown, signed/decimal, PostgreSQL-bigint-overflow, and foreign-cabinet identifiers all resolve to the same non-leaking `ORDER_NOT_FOUND` 404 rather than 500. The focused compatibility regression passed 5 suites / 167 tests, and the broader orders/encryption regression passed all 23 executed suites / 424 tests.

Governing evidence: [G003 — #227 encrypted persistence and #229 preservation](../../../.omx/ultragoal/evidence/G003-227-229-implementation.md) and the [canonical corpus ledger](./AUDIT-2026-07-13.md).

The live 500 reproduction above remains valid evidence for the older deployed build; it is not evidence against the current code.

### Post-merge runtime re-probe — 2026-07-15

Using a real stored order from the configured cabinet against the running local API:

- `GET /v1/orders/<uuid>` → 200;
- `<uuid>/history`, `<uuid>/wb-history`, and `<uuid>/full-history` → 200;
- the legacy numeric `orderId` detail/history paths → 200;
- unknown UUID and malformed identifiers on all three history paths → 404 `ORDER_NOT_FOUND`;
- no tested identifier path returned 500.

This closes the backend blocker for the FE `orderId`→UUID cleanup on the current revision.

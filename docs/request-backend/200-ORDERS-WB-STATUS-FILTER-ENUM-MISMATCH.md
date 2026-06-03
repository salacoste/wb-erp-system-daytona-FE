# #200 — Orders: wb_status filter enum (4 accepted) ≠ response enum (7 emitted)

**Status**: OPEN
**Reported**: 2026-06-03 (iter-81 validation loop)
**Page**: `/orders` (Epic 40-FE WB Native Orders History)
**Severity**: CRITICAL (filtering by the 2nd-most-common status blanks the entire table)
**Frontend status**: FE interim guard queued (restrict the filter options OR catch 400 gracefully) — but the correct fix is backend enum alignment.

---

## Problem

`GET /v1/orders` **emits** 7 distinct `wbStatus` values in its response data, but the `wb_status` **query-filter validator accepts only 4**:

- Accepted (HTTP 200): `waiting`, `sorted`, `sold`, `canceled`
- **Rejected (HTTP 400)**: `ready_for_pickup`, `canceled_by_client`, `declined_by_client`, `defect`

```
GET /v1/orders?wb_status=canceled_by_client
→ 400 {"code":"BAD_REQUEST","message":"wb_status must be one of: waiting, sorted, sold, canceled"}
```

`canceled_by_client` is the **2nd-most-common live status (≈89/832 ≈ 11%)** and `ready_for_pickup` ≈ 28. The FE filter dropdown offers all values present in the response data; selecting any of the 4 rejected values → backend 400 → `useOrders` error → **the entire orders table is replaced by a red error banner**. A user filtering the most common cancellation reason gets an error page.

## Root cause

The response serializer and the query-param validator are out of sync: the data layer produces 7 statuses, the filter DTO whitelists 4. Either the validator was written against an older/narrower status set, or the extra statuses were added to the response without updating the filter enum.

## Ask

Widen the `wb_status` query-filter enum to accept **every value the response can emit** — at minimum add `ready_for_pickup`, `canceled_by_client`, `declined_by_client`, `defect` (confirm the full canonical set against the order-status mapping). The filter contract must be a superset-or-equal of the response contract.

## Reproduction

```bash
TOKEN=...  # from e2e/.auth/user.json
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
H=(-H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB")
for s in waiting sorted sold canceled ready_for_pickup canceled_by_client declined_by_client defect; do
  printf "%s: " "$s"
  curl -s -o /dev/null -w "%{http_code}\n" "${H[@]}" "http://localhost:3000/v1/orders?wb_status=$s"
done
# waiting/sorted/sold/canceled → 200; the other 4 → 400
```

## Frontend disposition

FE interim (queued, separate from this ticket): until the backend widens the enum, either restrict `WB_STATUS_OPTIONS` (`OrdersFilters.tsx`) to the 4 server-accepted values, OR catch a 400 on the status filter and show a "фильтр недоступен" message instead of blanking the table. Related structural gap: `getOrders`/`getOrderById` lack a Boundary Normalizer (the typed `apiClient.get<OrdersListResponse>` is what let this request-side enum drift go uncaught) — tracked as an FE follow-up.

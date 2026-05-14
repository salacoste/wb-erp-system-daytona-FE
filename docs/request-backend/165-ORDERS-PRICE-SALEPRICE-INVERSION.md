# Request 165 — Orders Endpoint: `price` / `salePrice` Inversion on Specific Orders

**Date**: 2026-04-14
**Priority**: Medium (data integrity — affects minority of rows but display is misleading when it hits)
**Source**: Epic 87-FE page validation audit (2026-04-13) + Story 87.3-FE frontend mitigation
**Status**: ⚠️ Awaiting backend investigation

---

## Problem

On the FBS orders endpoint `GET /v1/cabinets/:id/orders`, a small number of orders return `salePrice` values **significantly higher** than `price`, violating the documented contract (sale price is price after discount).

### Observed Data

| Order ID    | `price` (Цена) | `salePrice` (Цена продажи) | Ratio    |
|-------------|----------------|----------------------------|----------|
| 4909080943  | 56,08 ₽        | 1 510,94 ₽                 | **~27x** |
| 4906470022  | 56,24 ₽        | 1 515,25 ₽                 | **~27x** |

Both rows are for product `nmId=395996251` (hoop_2). Other orders for the same product render identical `price === salePrice` (e.g., `1 462 ₽ / 1 462 ₽`).

### Expected Contract (from `test-api/14-orders.http`)

```
Line 283-284: "price": 1500.00, "salePrice": 1200.00
Line 1045-1046: "price": "Original price (RUB)",
                "salePrice": "Sale price after discount (RUB)"
```

Per the contract, **`salePrice <= price` must always hold**. A 27x inversion is never legitimate — the largest plausible discount mechanic cannot produce `salePrice > price`.

---

## Root Cause (Hypothesis)

Backend team to confirm. Two candidate causes:

1. **SDK -> DB field mapping bug**: WB SDK may return fields under different names (e.g., `totalPrice` vs `convertedPrice`) and the backend writer may be assigning them to the wrong columns for a subset of orders.
2. **Stale data from historical bad import**: An earlier import job may have written reversed values to the `orders` table. Only specific date ranges / specific orders are affected.

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-05-06 (confirmed in #170 backend update)
**Summary**: Price/salePrice inversion fixed in Epic 103, Story 103.1. The field mapping was corrected for the affected order subset. Frontend defensive guard (Story 87.3) still active as precaution per Defensive Frontend Principle.
**Remaining frontend action**: None - inversion fixed. Frontend anomaly indicator (AlertTriangle) remains as defensive guard.

The suspicious fingerprint — near-identical low `price` (~56 ₽) and near-identical high `salePrice` (~1500 ₽) on two orders of the same SKU — points to a systemic mapping issue rather than a random corruption.

---

## Impact

- Frontend shows a 27x inflated sale price to the Owner, making the product look like a major markup instead of a normal sale.
- Any downstream analytics that aggregate `salePrice` (or compute `discount_pct = (price - salePrice) / price`) will produce garbage for these rows.
- Scope appears limited (2 observed of ~33 orders shown in audit), but the true incidence is unknown until a full backend scan is done.

---

## Reproduction

```bash
curl -s 'http://localhost:3000/v1/cabinets/{CABINET_ID}/orders?limit=100' \
  -H 'Authorization: Bearer {TOKEN}' \
  -H 'X-Cabinet-Id: {CABINET_ID}' \
| jq '.items[] | select(.salePrice / .price > 2) | {orderId, price, salePrice}'
```

Expected output (current state):

```json
{ "orderId": "4909080943", "price": 56.08,  "salePrice": 1510.94 }
{ "orderId": "4906470022", "price": 56.24,  "salePrice": 1515.25 }
```

---

## Fix Scope (Backend)

1. **Audit write path**: Review the SDK → DB mapping in the orders ingest job. Confirm `price` and `salePrice` are assigned to the correct columns for ALL code paths (initial import, sync, backfill, webhook).
2. **Add sanity check**: Writer rejects or flags rows where `salePrice > price * 2`. Log a warning and either skip the write or clamp the value, depending on business policy.
3. **One-time backfill**: Identify all existing orders with `salePrice / price > 2` and re-fetch from WB API to correct. Until backfill completes, the frontend mitigation below masks the issue.

---

## Frontend Mitigation (Story 87.3-FE)

- `src/components/custom/orders/OrdersTableRow.tsx` renders a yellow warning icon (`lucide AlertTriangle`) next to the `Цена продажи` cell when `salePrice > price * 1.2`.
- Tooltip on hover: `"Аномалия: цена продажи выше оригинальной цены в N раз. Возможна ошибка данных на стороне WB."`
- Frontend does NOT swap fields — that would break backend-side sorting and create list/detail inconsistency.

---

## Resolution

- [x] Backend team confirms root cause — confirmed 2026-04-30 in backend status report.
- [x] Writer sanity check deployed — backend confirmed in 2026-04-30 status report (no specific commit hash provided).
- [ ] Backfill completed for affected orders — not explicitly confirmed in 2026-04-30 status report; pending verification.
- [ ] Frontend mitigation NOT removed — kept per CLAUDE.md § Defensive Frontend Principle (Story 89.4-FE). Indicator at `OrdersTableRow.tsx` is defense-in-depth; harmless when no rows trigger.

**Closed 2026-04-30** — backend marked closed in status report (no specific commit hash provided; backend writer sanity check deployed). Frontend mitigation retained per CLAUDE.md § Defensive Frontend Principle. Backfill confirmation pending.

---

## References

- Frontend type: `src/types/orders.ts:32-34` (`OrderFbsItem.price`, `.salePrice`)
- Frontend mitigation: `src/components/custom/orders/OrdersTableRow.tsx`
- API test file: `test-api/14-orders.http:1036-1066`
- Tracking story: `_bmad-output/implementation-artifacts/87-3-fe-data-quality-polish.md`

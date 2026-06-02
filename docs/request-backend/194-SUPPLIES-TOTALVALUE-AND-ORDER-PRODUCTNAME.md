# 194 — Supplies: `totalValue` not computed + order `productName` not provided

**Status**: OPEN
**Severity**: MEDIUM (FE shows "—" placeholders; no wrong data after iter-68 FE fixes)
**Filed**: 2026-06-02 (frontend validation iter-68)
**Endpoints**: `GET /v1/supplies` (list), `GET /v1/supplies/:id` (detail)
**Frontend**: /supplies (list "Сумма" column), /supplies/[id] (orders table "Товар" column)

---

## Context

iter-68 fixed the FE-side contract drift for /supplies (detail nesting flatten + orders/documents
field mapping `article→vendorCode`, `docType→type`, `fileSize→sizeBytes`). Two gaps remain that are
genuinely backend-side (the backend does not provide the data the FE column wants):

## 1. `totalValue` is never computed (list + detail)

`supply.service.ts` list `select` returns `totalItems` (count) but NOT a `totalValue` (sum of order
sale prices). The FE `SupplyListItem` had a `totalValue: number` field (now made optional) and a
"Сумма" (Sum) column. With no backend value the FE now renders **"—"** for every row (was "NaN ₽"
before the iter-68 guard).

**Decision needed:** either (a) backend computes `totalValue` (sum of `orders[].salePrice`) on the
list + detail responses, or (b) confirm it's out of scope and the FE should drop the "Сумма" column.

## 2. Order `productName` not provided on the detail endpoint

`getSupplyById` orders map emits `{orderId, nmId, article, salePrice, supplierStatus, addedAt,
metaStatus}` — no product name. The FE orders table shows the `article` (SKU) as the primary line and
**"—"** for the product name (the FE mapped `vendorCode ← article`, `productName ← null` in iter-68).

**Decision needed:** either backend enriches orders with `productName` (from the product catalog), or
confirm SKU-only display is acceptable (then the FE can drop the productName sub-line).

---

## Note
These are display-completeness gaps, NOT data-correctness bugs — after iter-68 the FE renders honest
"—" placeholders (Defensive Frontend) rather than NaN/blank. The detail header + orders/documents now
render correctly against the real (nested) backend shape. Authoritative contract: `#111` (RESOLVED)
+ `src/supplies/services/supply.service.ts`.

# Request #220: Add FR-2…FR-5 Fields to /v1/analytics/sku-financials

**Date**: 2026-06-29
**Priority**: High
**Status**: 🔵 OPEN — needed for FR columns on the main `/analytics/sku` page
**Component**: Backend — Analytics (`sku-financials`)
**Requester**: Frontend Team
**Related**:
- Backend contract #219 (FR-2…FR-5 LIVE on `/weekly/by-sku|by-brand|by-category`)
- This request: expose the SAME fields on `/v1/analytics/sku-financials`

---

## Problem

FR-2…FR-5 fields ship on `GET /v1/analytics/weekly/{by-sku|by-brand|by-category}` (contract #219, verified). But the **main `/analytics/sku` page** (`SkuFinancialsTable`) is backed by a **different endpoint** — `GET /v1/analytics/sku-financials` — which does NOT return them:

```
Verified (W25, 36 SKU, cabinet f75836f7):
  /sku-financials item → advertising_cost: MISSING, drr_pct: MISSING,
    tax_allocated: MISSING, net_profit_after_tax: MISSING,
    spp_rub: MISSING, stock_value_rub: MISSING
```

So the parity columns can't be shown on the primary per-SKU surface. (`/weekly/by-sku`'s renderer `MarginBySkuTable` is unused and lacks `SkuFinancialItem`'s rich fields — visibility/profitability/storage — so switching the page endpoint is a feature regression, not an option.)

## Ask

Add the FR-2…FR-5 fields (same names/shapes/nullability as #219) to the `/v1/analytics/sku-financials` response, gated by the same opt-in flags:

```
GET /v1/analytics/sku-financials?week=YYYY-Www&include_cogs=true&include_ads=true&include_stock=true
```

| Flag | Fields (identical to #219) |
|---|---|
| `include_cogs` | `tax_allocated`, `net_profit_after_tax`, `net_margin_after_tax_pct`, `spp_rub`, `spp_pct`, `cancellations_qty` |
| `include_ads` | `advertising_cost`, `drr_pct`, `ad_cost_per_unit` |
| `include_stock` | `stock_fbs`, `stock_fbo`, `stock_total`, `stock_value_rub`, `stock_value_share_pct` |

All `?: number | null` (null, never 0, when N/A — FE renders `—`). Same v1 boundaries as #219 (single-week; `stock_fbo` null until FBO sync; auto-campaign ДРР approximate).

## Acceptance (FE)

Once `/sku-financials` returns the fields, the FE adds the 7 parity columns to `SkuFinancialsTable` (ДРР %, Реклама ₽, Чистая прибыль, СПП, Отмены, Остаток ₽, Доля остатка) — the same columns being added to the brand/category tables now (those endpoints already have the data).

## Note

Brand/category (`/weekly/by-brand|by-category`) already serve these fields — FE integration there is unblocked and in progress. This request is only for the **SKU** surface (`/sku-financials`).

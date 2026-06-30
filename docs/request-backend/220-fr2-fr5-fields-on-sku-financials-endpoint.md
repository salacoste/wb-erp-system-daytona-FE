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

## Backend implementation guide (exact files)

The FR fields are already computed in the **`/weekly/by-sku`** path. To add them to `/sku-financials`, modify these files (all paths from repo root):

| File | What to do |
|---|---|
| `src/analytics/dto/query/sku-financials-query.dto.ts` | Add `include_ads?: boolean` + `include_stock?: boolean` query params (mirror the existing `include_visibility` pattern). |
| `src/analytics/dto/response/sku-financials-response.dto.ts` | Add the 13 FR fields (`advertising_cost`, `drr_pct`, `ad_cost_per_unit`, `tax_allocated`, `net_profit_after_tax`, `net_margin_after_tax_pct`, `spp_rub`, `spp_pct`, `cancellations_qty`, `stock_fbs`, `stock_fbo`, `stock_total`, `stock_value_rub`, `stock_value_share_pct`) — all `number | null`. |
| `src/analytics/controllers/sku-financials.controller.ts` | Pass `include_ads`/`include_stock` from the query DTO to the service. |
| `src/analytics/services/sku-financials.service.ts` + `sku-financials-data.service.ts` | When the flags are set, compute/attach the FR fields per SKU. |

**FR logic source to reuse** (the `/weekly/by-sku` implementation):
- `src/analytics/services/sku-analytics.service.ts` — the FR field computation (gated by `includeCogs`/`includeAds`/`includeStock`).
- `src/analytics/services/sku-analytics.mapper.ts` — the mapper that sets `advertising_cost`, `drr_pct`, `tax_allocated`, `net_profit_after_tax`, `spp_rub`, `stock_value_rub`, etc.

The simplest path: extract the FR-computation helpers from `sku-analytics.service.ts` into a shared utility, then call them from BOTH `sku-analytics.service.ts` (by-sku) and `sku-financials.service.ts` (sku-financials). Both serve per-SKU data from the same underlying tables (`weekly_margin_fact`, `adv_daily_stats`, `inventory_snapshots`, `wb_finance_raw`).

**FE is prepped** — `SkuFinancialItem` type + `useSkuFinancials` flags are ready; when the backend lands these fields, the FE columns are a mechanical add.

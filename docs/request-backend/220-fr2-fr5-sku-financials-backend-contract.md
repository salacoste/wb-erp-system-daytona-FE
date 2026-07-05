# Backend Contract — FR-2 / FR-3 / FR-4 / FR-5 on /v1/analytics/sku-financials

**Status:** ✅ Backend LIVE on single-week `GET /v1/analytics/sku-financials` (Request #220 closed).
**Date:** 2026-06-30
**Implements:** #220 → unblocks the FR parity columns on the main `/analytics/sku` page (`SkuFinancialsTable`).
**For:** Frontend — start integration now (read "v1 boundaries" first).

> The fields are **identical** in name / shape / nullability to contract **#219** (already live on `/weekly/by-sku|by-brand|by-category`). They are now also returned by `/sku-financials`. No new field names were invented — anything FE built against #219 drops straight onto this endpoint.
>
> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified. Roles Manager/Owner/Analyst.

---

## Endpoint + flags

```
GET /v1/analytics/sku-financials?week=YYYY-Www&include_cogs=true&include_ads=true&include_stock=true
```

| Flag | Gates | Default | Notes |
|---|---|---|---|
| `include_cogs` | FR-3 tax, FR-5 spp/cancellations | false | pre-existing flag (was already on the DTO) |
| `include_ads` | FR-2 `advertising_cost` / `drr_pct` / `ad_cost_per_unit` | false | new — wired in #220 |
| `include_stock` | FR-4 `stock_fbs` / `stock_fbo` / `stock_total` / `stock_value_rub` / `stock_value_share_pct` | false | new — wired in #220 |

`include_visibility` (commission/acquiring breakdown) is unchanged.

When a flag is false/absent, its fields are `null`/`undefined` (not 0). **Money/ratio fields are `null` (never `0`) when N/A** — render `—`, never `0,0 %` (anti-pattern #8).

---

## Fields (all `?: number | null` — on each `data[]` item)

### FR-3 — per-SKU net profit after tax (gated by `include_cogs`)
| Field | Meaning | Notes |
|---|---|---|
| `tax_allocated` | Cabinet income tax apportioned to this SKU, ₽ | Regime-based (USN6=6%×revenue, USN15=15%×(rev−exp)). Null when cabinet has no tax system / no margin fact row. |
| `net_profit_after_tax` | operating profit − tax_allocated, ₽ | Invariant: ≤ `operating_profit`. |
| `net_margin_after_tax_pct` | `net_profit_after_tax / revenue_net × 100` | Null when revenue=0 / no tax. |

### FR-5 — СПП + cancellations (gated by `include_cogs`)
| Field | Meaning | Notes |
|---|---|---|
| `spp_rub` | СПП discount for the week, ₽ (positive = buyer saving) | `Σ retail_price_with_discount × spp% × qty` on sale rows. |
| `spp_pct` | Revenue-weighted avg СПП % | `spp_rub / Σ(rpwd×qty) × 100`. Null when `spp_base ≤ 0`. |
| `cancellations_qty` | Orders cancelled in-week, шт | `wb_status ∈ {canceled, canceled_by_client, declined_by_client, defect}`, by `status_updated_at` in week. |

### FR-2 — per-SKU advertising + ДРР (gated by `include_ads`)
| Field | Meaning | Notes |
|---|---|---|
| `advertising_cost` | Attributed ad spend, ₽ | **Manual campaigns** = exact per-nmId. **Auto campaigns (type 9)** = WB gives no per-nm signal → split by **cabinet revenue share**. Null when no spend. |
| `drr_pct` | ДРР % = `advertising_cost / revenue_net × 100` | Null when revenue=0 / no ad. `revenue_net` here = `sales.revenue_net − returns.revenue_net` (net of returns, same basis as `/weekly/by-sku`). |
| `ad_cost_per_unit` | `advertising_cost / total_units` | Null when units=0. `total_units = sales.quantity − returns.quantity`. |

### FR-4 — stock at purchase price (gated by `include_stock`)
| Field | Meaning | Notes |
|---|---|---|
| `stock_fbs` | FBS units on hand (latest `inventory_snapshot` ≤ week end) | per-day FULL snapshot — latest only, **never range-SUM**. |
| `stock_fbo` | FBO units on hand (latest `warehouse_remains` ≤ week end) | **Null until an FBO sync runs** (see "v1 boundaries"). |
| `stock_total` | `stock_fbs + stock_fbo` | |
| `stock_value_rub` | Frozen capital = `stock_total × Cogs.unit_cost_rub` (current COGS) | Null when COGS unassigned. |
| `stock_value_share_pct` | `stock_value_rub / Σ cabinet stock_value × 100` | Σ ≈ 100 per cabinet. Computed over the FULL cabinet (denominator is not paginated). |

---

## Where the fields live on the response

Unlike `/weekly/by-sku` (flat `revenue_net` / `total_units`), `/sku-financials` keeps revenue and units **nested**:

```
data[i].sales.revenue_net        // number
data[i].sales.quantity           // number
data[i].returns.revenue_net      // number
data[i].returns.quantity         // number
data[i].operating_profit         // number | null  (NOT adjusted for advertising)
```

The 14 new FR fields are **flat** on the same `data[i]` object (siblings of `operating_profit`, `profitability_status`). They are `undefined` when their flag is off and `null` when their flag is on but the value is N/A.

---

## v1 boundaries (read before integrating)

1. **Single-week only.** The new fields populate for `?week=YYYY-Www`. `/sku-financials` has no range mode (`weekStart`+`weekEnd`), so there is no range gap to worry about here — unlike `/weekly/by-sku`. Range parity is a non-issue for this endpoint.
2. **FBO data requires a sync.** `stock_fbo` is null until `warehouse_remains` is populated. An auto daily sync (`warehouse_remains_sync`, 07:15 MSK) is implemented; until it runs, `stock_fbo`/`stock_total` reflect FBS only.
3. **Auto-campaign ДРР is approximate** until adv stats are re-synced (historical type-9 spend was dropped before a parser fix; new syncs capture it under `nmId=0` and split it by revenue share). Today `advertising_cost` reflects manual campaigns + any newly-synced auto spend.
4. **`net_profit_after_tax` excludes advertising** (tax is on the regime base, not ad-adjusted) — don't subtract `advertising_cost` from it client-side. If you want a marketing-adjusted margin, compute it as a separate FE column.
5. **Cache key includes the flags.** Different flag combos are cached separately, so toggling a flag is always fresh (no stale-cache bleed-through).

---

## FE integration

With these fields live, the 7 parity columns can now be added to **`SkuFinancialsTable`** — the same columns being added to the brand/category tables under #219:

| Column | Field | Flag |
|---|---|---|
| ДРР % | `drr_pct` | `include_ads` |
| Реклама ₽ | `advertising_cost` | `include_ads` |
| Чистая прибыль | `net_profit_after_tax` | `include_cogs` |
| СПП | `spp_rub` (₽) / `spp_pct` (%) | `include_cogs` |
| Отмены | `cancellations_qty` | `include_cogs` |
| Остаток ₽ | `stock_value_rub` | `include_stock` |
| Доля остатка | `stock_value_share_pct` | `include_stock` |

`SkuFinancialItem` type + `useSkuFinancials` flags are FE-prepped (per the #220 request) — the columns are a mechanical add. Render `—` (never `0`) for null money/ratio fields.

---

## Verification

- Backend: `npm run rebuild` GREEN; `src/analytics` jest suite GREEN (129 suites / 2784 tests). New unit tests in `src/analytics/services/__tests__/sku-financials.service.spec.ts` cover: flags-off → all FR null/undefined; each flag on → fields populated + helpers invoked with correct cabinet/week bounds; null-never-0 on empty FR data; `spp_pct` rounding + null-on-zero-base; adapter write-through for FR-2/FR-4; FR fields attach to the FULL item set before pagination.
- The FR math is NOT duplicated: `/sku-financials` and `/weekly/by-sku` both call the shared `FrAttributionService` (`applyAdAttribution` / `applyStockValuation` / `fetchTaxByNm` / `fetchSppByNm` / `fetchCancellationsByNm`).

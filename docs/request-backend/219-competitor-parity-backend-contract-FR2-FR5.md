# Backend Contract — Competitor Parity (FR-2 / FR-3 / FR-4 / FR-5)

**Status:** ✅ Backend LIVE on single-week by-sku / by-brand / by-category (cabinet `f75836f7`, verified W24).
**Date:** 2026-06-29
**Implements:** #218 (handoff) + #214 (FR-2) + #215 (FR-3) + #216 (FR-4) + #217 (FR-5)
**For:** Frontend — start integration now (see "v1 boundaries" before you begin).

> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified. Roles Manager/Owner/Analyst.

---

## Endpoints + flags

All three accept the same opt-in flags (mirror the existing `include_cogs`):

```
GET /v1/analytics/weekly/by-sku?      week=YYYY-Www&include_cogs=true&include_ads=true&include_stock=true
GET /v1/analytics/weekly/by-brand?    week=YYYY-Www&include_cogs=true&include_ads=true&include_stock=true
GET /v1/analytics/weekly/by-category? week=YYYY-Www&include_cogs=true&include_ads=true&include_stock=true
```

| Flag | Gates | Default | Notes |
|---|---|---|---|
| `include_cogs` | FR-3 tax, FR-5 spp/cancellations, Epic-26 expenses | false | pre-existing flag |
| `include_ads` | FR-2 advertising_cost / drr_pct / ad_cost_per_unit | false | new |
| `include_stock` | FR-4 stock_fbs / stock_fbo / stock_total / stock_value_rub / stock_value_share_pct | false | new |

When a flag is false/absent, its fields are `null`/`undefined` (not 0). **Money/ratio fields are `null` (never `0`) when N/A** — render `—`, never `0,0 %` (anti-pattern #8).

---

## New fields (all `?: number | null` unless noted)

### FR-3 — per-SKU net profit after tax (gated by `include_cogs`)
| Field | Meaning | Notes |
|---|---|---|
| `tax_allocated` | Cabinet income tax apportioned to this row, ₽ | **Regime-based** (USN6=6%×revenue, USN15=15%×(rev−exp)); Σ per row = cabinet tax. Null when no tax system. |
| `net_profit_after_tax` | operating profit − tax_allocated, ₽ | Invariant: ≤ operating_profit. |
| `net_margin_after_tax_pct` | net_profit_after_tax / revenue_net × 100 | Null when revenue=0 / no tax. |

### FR-5 — СПП + cancellations (gated by `include_cogs`)
| Field | Meaning | Notes |
|---|---|---|
| `spp_rub` | СПП discount for the period, ₽ (positive = buyer saving) | `Σ retail_price_with_discount × spp% × qty` on sale rows. |
| `spp_pct` | Revenue-weighted avg СПП % | `spp_rub / Σ(rpwd×qty) × 100`. **Brand/category is aggregate-weighted, NOT the mean of per-SKU spp_pct.** |
| `cancellations_qty` | Orders cancelled in-period, шт | wb_status ∈ {canceled, canceled_by_client, declined_by_client, defect}, by status_updated_at in week. |
| _(extra costs: penalties/loyalty/other_adjustments — already shipped via Epic 26)_ | | |

### FR-2 — per-SKU advertising + ДРР (gated by `include_ads`)
| Field | Meaning | Notes |
|---|---|---|
| `advertising_cost` | Attributed ad spend, ₽ | **Manual campaigns** = exact per-nmId. **Auto campaigns (type 9)** = WB gives no per-nm signal → split by **cabinet revenue share** (⚠️ adapted from #214's "attributed-revenue share" — see "Decisions" below). |
| `drr_pct` | ДРР % = advertising_cost / revenue_net × 100 | Null when revenue=0 / no ad. |
| `ad_cost_per_unit` | advertising_cost / total_units | Null when units=0. |

`net_profit` is NOT adjusted for advertising (marketing-adjusted margin is a separate FE toggle per #214; advertising_cost/ДРР are display metrics alongside it).

### FR-4 — stock at purchase price (gated by `include_stock`)
| Field | Meaning | Notes |
|---|---|---|
| `stock_fbs` | FBS units on hand (latest inventory_snapshot ≤ week end) | per-day FULL snapshot — latest only, never range-SUM. |
| `stock_fbo` | FBO units on hand (latest warehouse_remains ≤ week end) | **Null until an FBO sync runs** (see "Data freshness"). |
| `stock_total` | stock_fbs + stock_fbo | |
| `stock_value_rub` | Frozen capital = stock_total × Cogs.unit_cost_rub (current COGS) | Null when COGS unassigned. |
| `stock_value_share_pct` | stock_value_rub / Σ cabinet stock_value × 100 | Σ ≈ 100 per cabinet. |

---

## v1 boundaries (read before integrating)

1. **Single-week only.** New fields populate for `?week=`. Range mode (`weekStart`+`weekEnd`) returns them as `null`/`undefined` (same as the pre-existing `include_cogs` range gap). Range-mode support is a documented follow-up — tell backend if the parity table needs range queries.
2. **FBO data requires a sync.** `stock_fbo` is null until `warehouse_remains` is populated. An auto daily sync (`warehouse_remains_sync`, 07:15 MSK) is implemented; until it runs, `stock_fbo`/`stock_total`=FBS only. Backend will confirm once first sync completes.
3. **Auto-campaign ДРР is approximate** until adv stats are re-synced (historical type-9 spend was dropped before a parser fix; new syncs capture it under `nmId=0` and split it by revenue share). Today `advertising_cost` reflects manual campaigns + any newly-synced auto spend.
4. **`net_profit` excludes advertising** (see above) — don't subtract `advertising_cost` from it client-side.

## Decisions made (deviations from #214–217, PM-approved)
- **FR-2 attribution basis:** "attributed-revenue share" was infeasible (WB returns no per-nm data for auto campaigns) → **cabinet revenue share**. Manual campaigns unaffected (exact per-nmId).
- **FR-3 tax allocation:** kept the existing **regime-based** per-SKU compute (Σ reconciles to cabinet tax) instead of #215's "proportional-to-operating-profit" (loss SKUs still bear regime tax on revenue).
- **FR-5 СПП sign:** positive discount ₽; cancellations scope = cancelled-in-period.

## Verified live (W24, cabinet f75836f7)
by-sku(37): tax_allocated=64.31, spp_rub=394.02, advertising_cost=107.72 (drr 10.05%), stock_value_rub=55182.
by-brand(6): tax_allocated=1377.74, cancellations_qty=1, drr 8.03%, Σ stock_value consistent across brand/category partitions.
by-category(14): fields present; null where revenue/stock=0.

## Field shape — by-sku vs by-brand/category
- by-sku: fields as above, per nm_id.
- by-brand: `revenue_net` (number); tax/spp/ads/stock **aggregated** (Σ/weighted across the brand's SKUs).
- by-category: same, keyed by `subject_name`, revenue as `revenue_net_rub` (string).

# Request #214: Per-SKU Advertising Attribution + ДРР % (FR-2)

**Date**: 2026-06-28
**Priority**: High
**Status**: 🔵 OPEN — awaiting backend scoping
**Component**: Backend API — Analytics (by-SKU) + Promotion (ad attribution)
**Requester**: Frontend Team (competitor-parity program)
**Related**:
- Competitor parity spec: `docs/competitor-analysis/competitor-financial-report-parity.md` (FR-2, §3-D/E fields AF/AG/AH)
- FE type: `src/types/cogs/products.ts` (`MarginAnalyticsSku`)
- FE by-SKU endpoint: `GET /v1/analytics/weekly/by-sku`
- Open product question: §8 Q2 (attribution method)

---

## Executive Summary

The competitor's financial report attributes advertising spend to individual SKUs and exposes **ДРР %** (доля рекламных расходов = ad spend / revenue) per row — the single most valuable field we lack. Today the backend has ad spend only at **cabinet level** (`wb_promotion` in the weekly finance report; `ad_spend`/`ad_attributed_revenue` in PromotionAPI aggregates). There is **no per-nmId ad attribution**, so the FE cannot show true unit profitability after marketing. This is the #1 "слепая зона" of our P&L.

**Ask**: attribute cabinet/campaign ad spend to individual `nmId`s and expose `ad_spend` (+ optionally `ad_attributed_revenue`, `drr_pct`) on the by-SKU analytics response.

---

## Why it matters

- Without per-SKU ad cost, **margin % per SKU is overstated** for advertised products — the headline profitability metric lies.
- ДРР % is the competitor's centerpiece efficiency column; its absence is the most visible parity gap on `/analytics/sku`.
- Marketing decisions (which SKUs to keep promoting) currently rely on cabinet-blended ROAS, hiding both winners and losers.

---

## Current state (what we have)

| Source | Granularity | Fields | File |
|---|---|---|---|
| Weekly finance report (`wb_finance_raw`) | **Cabinet** | `wb_promotion` (deduction) | `src/analytics/...` |
| PromotionAPI (`adv_daily_stats`) | **Campaign** (some auto-campaigns → no nmId) | `ad_spend`, `ad_attributed_revenue`, views/clicks | `src/promotion/...` |
| by-SKU analytics (`MarginAnalyticsSku`) | **SKU** | revenue, cogs, profit, logistics, … — **no ad fields** | `src/types/cogs/products.ts` |

Per project memory: `ad_spend` (PromotionAPI) ≠ `wb_promotion` (weekly report) — different tables, ~73 RUB diff is normal; revenue source isolation is guaranteed (Request #75). Either could be the basis; **PromotionAPI** is the richer source (has attributed revenue → real ROAS/ДРР).

---

## Proposed contract (for backend scoping)

Extend `GET /v1/analytics/weekly/by-sku` (and the by-brand/by-category aggregates) with optional ad fields, gated by a flag so non-ad cabinets aren't penalized:

```ts
// Added to MarginAnalyticsSku (all optional — null when ad attribution N/A)
interface MarginAnalyticsSkuAdFields {
  ad_spend?: number | null              // AF: attributed ad spend, ₽
  ad_attributed_revenue?: number | null // revenue credited to ads (for ROAS)
  drr_pct?: number | null               // AG: ad_spend / revenue_net × 100 (precomputed)
  ad_cost_per_unit?: number | null      // AH: ad_spend / qty sold
}
```

- **Auth/isolation**: unchanged (JWT + `X-Cabinet-Id`).
- **Flag**: `?include_ads=true` (mirrors the existing `include_cogs` pattern, request #07) — omit when the cabinet has no WB ad integration.
- **Nullability**: `null` (not `0`) when a SKU had no ad activity — the FE renders `—`, never a misleading `0,0 %` (anti-pattern #8).

---

## Open questions for backend / PM (blockers)

1. **Attribution method** (§8 Q2) — WB exposes ad stats at campaign level; auto-campaigns (search/catalog) are NOT nmId-targeted. Options:
   - (a) **Manual campaigns only** — exact nmId match (precise but ignores auto-campaign spend, understates ДРР).
   - (b) **Proportional split** — distribute auto-campaign spend across the campaign's nms by attributed-revenue share (PromotionAPI already returns `ad_attributed_revenue` per campaign → usable as the split key).
   - (c) **WB's own attribution** — if WB returns per-nmId attributed revenue anywhere (arts slot?), prefer that.
   - **FE has no preference** beyond consistency — backend to propose; PM to confirm.
2. **Source** — PromotionAPI (`ad_spend`, real ROAS) vs weekly-report `wb_promotion` (deduction, simpler). Recommend **PromotionAPI** for ДРР (matches the competitor's semantics); keep `wb_promotion` for the finance-history "Доля продвижения WB" column (already shipped, FR-1).
3. **Cadence** — weekly aggregation aligned to the existing ISO-week analytics (Mon–Sun, Europe/Moscow).

---

## Acceptance (FE side)

When the backend ships per-SKU `ad_spend` + `drr_pct`:
- FE adds an "Реклама (₽)" + "ДРР %" column to `SkuFinancialsTable` (and by-brand/category) using `sharePercentage`-style rendering via `formatPercentage`.
- "Доля продвижения WB" (FR-1, already shipped) stays sourced from `wb_promotion` — the new "ДРР %" is the ad-attributed metric; both can coexist with distinct tooltips.
- Recompute displayed margin to optionally subtract ad (a "marketing-adjusted margin" toggle) — separate FE story once data lands.

---

## Reproduction / verification

- Pick a cabinet with active WB ads for a known week.
- `GET /v1/analytics/weekly/by-sku?week=<W>&include_ads=true` should return `ad_spend`/`drr_pct` per nmId.
- Cross-check: Σ `ad_spend` across SKUs ≈ cabinet `ad_spend` for the week (PromotionAPI aggregate) within rounding; ДРР % for a heavily-advertised SKU should be visibly higher than the cabinet average.

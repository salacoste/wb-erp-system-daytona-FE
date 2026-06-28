# Request #216: Stock at Purchase Price + Stock-Share (FR-4)

**Date**: 2026-06-28
**Priority**: Medium
**Status**: 🔵 OPEN — awaiting backend (FBO stock source) + product decision
**Component**: Backend API — Analytics (by-SKU) + Stock/Inventory
**Requester**: Frontend Team (competitor-parity program)
**Related**:
- Competitor parity spec: `docs/competitor-analysis/competitor-financial-report-parity.md` (FR-4, §3-H/L fields AU/BF/AR–AT)
- FE stock surface: `/analytics/fbs-stock` (FBS only today)
- FE by-SKU type: `src/types/cogs/products.ts` (`MarginAnalyticsSku`)
- FE liquidity/turnover: `src/lib/liquidity-utils.ts`

---

## Executive Summary

"Замороженный капитал" (capital frozen in unsold stock) is a top-tier metric for turnover decisions — the competitor shows **stock valued at purchase price per SKU** (Остаток в закупочных ценах) and each SKU's **share of total stock value**. We expose FBS stock quantities (`/analytics/fbs-stock`) but have **no stock-value-in-₽ field and no FBO stock source**, so neither AU (stock × COGS) nor BF (stock-share) is computable today.

**Ask**: provide per-SKU stock quantities (FBS + FBO) and a precomputed `stock_value_rub` (stock × COGS per unit) on the by-SKU analytics response.

---

## Why it matters

- Frozen-capital per SKU drives restocking/liquidation decisions; today it's invisible at row level.
- Stock-share (BF) ranks SKUs by capital tied up — complements revenue-share (BD, shipped in FR-1) for a full "where is my money" picture.
- Closes fields AU, BF (and wires AR–AT) of the parity matrix.

---

## Current state (what we have)

| Concept | Granularity today | Source |
|---|---|---|
| FBS stock qty | **SKU** ⚠️ (FBS only) | `/analytics/fbs-stock` |
| FBO stock qty | **Gap** ❌ | no source (warehouse API not wired) |
| Total stock qty (FBS+FBO) | partial ⚠️ | derived from above |
| Stock value at purchase price | **Gap** ❌ | no `stock × cogs_per_unit` field anywhere |
| COGS per unit | **SKU** ✅ | COGS assignment |

So AU/BF are blocked on (a) a stock-×-COGS computation and (b) an FBO stock source.

---

## Proposed contract (for backend scoping)

Extend `GET /v1/analytics/weekly/by-sku` (+ by-brand/category) with stock fields, gated by `?include_stock=true` (mirrors `include_cogs`):

```ts
interface MarginAnalyticsSkuStockFields {
  stock_fbs?: number | null       // AR: FBS units on hand
  stock_fbo?: number | null       // AS: FBO units on hand (needs warehouse source)
  stock_total?: number | null     // AT: AR + AS
  stock_value_rub?: number | null // AU: stock_total × cogs_per_unit (frozen capital)
  stock_value_share_pct?: number | null // BF: stock_value_rub / Σ stock_value_rub × 100
}
```

- **Nullability**: `null` when stock unknown or COGS unassigned (FE renders `—`).
- **Invariant**: `stock_value_rub ≤ stock_total × cogs_per_unit`; Σ `stock_value_share_pct` ≈ 100 across rows.

---

## Open questions for backend / PM

1. **FBO stock source** (§3-H) — which WB API/warehouse feed provides FBO on-hand units? (FBS already wired.) This is the hard dependency.
2. **COGS basis for valuation** — use the SKU's current COGS per unit (simple) vs period-average COGS (accurate for old stock). FE recommends current COGS per unit (matches the COGS assignment model).
3. **Cadence/consistency** — stock is a point-in-time snapshot, not a weekly aggregate; confirm the analytics week anchors it to week-end (Sunday Europe/Moscow) to match the revenue/profit columns.

---

## Acceptance (FE side)

When per-SKU `stock_value_rub` + `stock_total` land:
- FE adds "Остаток (₽)" + "Доля остатка %" columns to `SkuFinancialsTable` (+ by-brand/category), reusing the FR-1 `sharePercentage` helper for BF.
- The liquidity page (`/analytics/liquidity`) can consume `stock_value_rub` for frozen-capital turnover (currently uses qty only).

---

## Reproduction / verification

- Pick a cabinet with FBS+FBO stock and COGS assigned for a known week.
- `GET /v1/analytics/weekly/by-sku?week=<W>&include_stock=true` returns `stock_total` + `stock_value_rub` per nmId.
- Cross-check: Σ `stock_value_rub` ≈ inventory valuation; `stock_value_share_pct` sums to ~100.

# Request #217: СПП (WB discount) + Cancellations + Extra Costs per SKU (FR-5)

**Date**: 2026-06-28
**Priority**: Medium
**Status**: 🔵 OPEN — awaiting backend wiring (data exists in adjacent tables)
**Component**: Backend API — Analytics (by-SKU)
**Requester**: Frontend Team (competitor-parity program)
**Related**:
- Competitor parity spec: `docs/competitor-analysis/competitor-financial-report-parity.md` (FR-5, §3-B/D fields O/Z/AO)
- FE price calculator (has СПП): `src/app/(dashboard)/.../price-calculator`
- FE orders (has cancellations): `src/lib/api/orders`

---

## Executive Summary

Three operational/financial fields the competitor shows per SKU that we have **only in adjacent tables**, not in the finance model: **СПP** (WB's sale-price-parameter discount, ₽), **Отмены** (cancellations, шт), and **Доп. расходы на проданный** (extra selling costs). Each exists somewhere in the backend (orders, price-calc) but none is exposed on the by-SKU analytics response. FR-5 wires them into the finance model.

**Ask**: surface СПП, cancellations, and extra costs per SKU on the by-SKU analytics response.

---

## Why it matters

- **СПП (Z)**: WB's visible discount directly affects actual realized revenue; without it, "средняя цена продажи" overstates what the seller earns. (Project memory: СПП already partial in orders/price-calc — needs to reach the finance model.)
- **Отмены (O)**: a funnel/ops metric (orders initiated but cancelled) — valuable alongside returns for demand-quality insight.
- **Доп. расходы (AO)**: per-SKU ancillary selling costs beyond logistics/storage/commission — completes the cost picture.

Closes fields Z, O, AO of the parity matrix.

---

## Current state (what we have)

| Field | Where it exists today | In by-SKU analytics? |
|---|---|---|
| СПП (₽) | orders / price-calculator | ❌ not in `MarginAnalyticsSku` |
| Отмены (шт) | orders data | ❌ not in finance model |
| Доп. расходы (₽) | partially in WB deductions | ⚠️ `other_adjustments` (cabinet), not per-SKU sold |

The data exists in adjacent tables — this is a wiring/aggregation task, not new data collection.

---

## Proposed contract (for backend scoping)

Extend `GET /v1/analytics/weekly/by-sku` (+ by-brand/category):

```ts
interface MarginAnalyticsSkuOpsFields {
  spp_rub?: number | null       // Z: СПП (sale-price-parameter discount) for the period, ₽
  cancellations_qty?: number | null // O: orders cancelled in the period, шт
  extra_costs_rub?: number | null   // AO: additional selling costs per SKU, ₽
}
```

- **Nullability**: `null` (not `0`) when N/A — FE renders `—`.
- **Cadence**: weekly, aligned to the existing ISO-week analytics.

---

## Open questions for backend / PM

1. **СПП sign convention** — expose as a positive discount amount (₽ the buyer saved) or as a negative revenue adjustment? FE prefers positive-discount (matches price-calculator display); confirm.
2. **Cancellations scope** — count orders cancelled in-period (regardless of when placed) vs placed-in-period-then-cancelled? Recommend cancelled-in-period (ops signal).
3. **"Доп. расходы" definition** — which WB line items map to AO (vs the existing `other_adjustments`/`loyalty_compensation`)? Avoid double-counting with already-shown deductions.

---

## Acceptance (FE side)

When per-SKU СПП / cancellations / extra-costs land:
- FE adds "СПП", "Отмены", "Доп. расходы" columns to `SkuFinancialsTable` (+ aggregates), currency-formatted, consistent with sibling cost columns.
- Optional: "средняя цена продажи" (AX) recalculated net of СПП (currently `gross/qty`).

---

## Reproduction / verification

- Pick a cabinet with promotions (СПП active) + cancellations for a known week.
- `GET /v1/analytics/weekly/by-sku?week=<W>` returns `spp_rub` + `cancellations_qty` per nmId.
- Cross-check: Σ `cancellations_qty` ≈ orders cancellation count for the cabinet/week; СПП aligns with the price-calculator's value for a sampled SKU.

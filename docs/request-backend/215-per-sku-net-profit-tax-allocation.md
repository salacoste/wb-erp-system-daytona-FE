# Request #215: Per-SKU Net Profit After Tax + Tax/VAT Allocation (FR-3)

**Date**: 2026-06-28
**Priority**: High
**Status**: 🔵 OPEN — awaiting backend + product decision on allocation method
**Component**: Backend API — Analytics (by-SKU) + Tax
**Requester**: Frontend Team (competitor-parity program)
**Related**:
- Competitor parity spec: `docs/competitor-analysis/competitor-financial-report-parity.md` (FR-3, §3-F/K fields BA/AJ/AK/AL)
- FE tax cascade: `src/lib/tax-display-helpers.ts` (`getNetProfit`)
- FE by-SKU type: `src/types/cogs/products.ts` (`MarginAnalyticsSku`)
- FE by-SKU endpoint: `GET /v1/analytics/weekly/by-sku`
- Open product question: §8 Q1 (allocation method)
- Related backend request: `docs/request-backend/213-FINANCE-SUMMARY-NET-PROFIT-INVARIANT-VIOLATION.md`

---

## Executive Summary

"Чистая прибыль" is the #1 headline metric on the competitor's financial-report screenshot, shown **per SKU**. We currently compute net profit only at **cabinet level** (via the tax cascade in `getNetProfit` over `FinanceSummary.tax`); the by-SKU analytics exposes gross/operating profit but **no tax/VAT allocation and no net-profit-after-tax per row**. To reach competitor parity on the most-watched P&L number, the backend must allocate the cabinet's tax (and VAT, for VAT payers) down to each SKU.

**Ask**: distribute cabinet-level tax/VAT to `nmId`s and expose `tax_allocated`, `vat_allocated`, and `net_profit_after_tax` on the by-SKU analytics response.

---

## Why it matters

- "Чистая прибыль per SKU" is the metric owners/CFOs look at first; today it's blank/dash at row level.
- Per-SKU net profit is the denominator for SKU-level investment decisions (discontinue/expand) — without it, the discontinued-product feature (just shipped, `/products`) ranks on operating profit only.
- Closes fields BA, AJ, AK, AL of the competitor parity matrix (≈ +6% coverage).

---

## Current state (what we have)

| Concept | Granularity today | Source |
|---|---|---|
| Operating profit | **SKU** ✅ | `MarginAnalyticsSku.operating_profit` / `SkuFinancialItem.profit.operating` |
| Tax (income) | **Cabinet only** | `FinanceSummary.tax.net_profit_after_tax` / `tax_amount` |
| VAT | **Cabinet only** | `FinanceSummary.tax.vat_payable` / `vat_output` |
| Net profit after tax | **Cabinet only** | `getNetProfit(tax, payoutTotal, operating)` — `src/lib/tax-display-helpers.ts` |

The FE's net-profit cascade (`getNetProfit`) already handles the cabinet-level priority: `net_profit_after_all_tax` → `net_profit_after_tax` → operating → payout. FR-3 needs the **same fields per SKU**, which requires the backend to split the cabinet tax base across SKUs.

---

## Proposed contract (for backend scoping)

Extend `GET /v1/analytics/weekly/by-sku` (+ by-brand/category aggregates) with allocated tax fields:

```ts
// Added to MarginAnalyticsSku (all optional — null when tax not applicable/allocatable)
interface MarginAnalyticsSkuTaxFields {
  tax_allocated?: number | null       // AJ: cabinet tax apportioned to this SKU, ₽
  vat_allocated?: number | null       // AK: cabinet VAT apportioned to this SKU, ₽ (VAT payers)
  net_profit_after_tax?: number | null // BA: operating_profit − tax_allocated − vat_allocated
}
```

- **Auth/isolation**: unchanged (JWT + `X-Cabinet-Id`).
- **Invariant** (must hold, links to Request #213): for each SKU, `net_profit_after_tax ≤ operating_profit` (net = operating − tax − VAT). The FE's `isNetProfitConsistent()` already enforces this at cabinet level; the backend must not violate it per-row.
- **Nullability**: `null` (not `0`) when a SKU has no operating profit to tax, or the cabinet has no tax configured — FE renders `—`.

---

## Open question — allocation method (§8 Q1, the blocker)

The cabinet tax is one number; it must be split across SKUs. Candidate bases (backend + PM to choose):

| Method | Pro | Con |
|---|---|---|
| **Proportional to operating profit** | Tax tracks profit; loss SKUs get 0 tax (sensible) | Distorts if one SKU's profit dominates |
| **Proportional to net revenue** | Stable, revenue is always ≥ 0 | Loss-making but high-revenue SKUs absorb tax they don't cause |
| **Proportional to COGS / cost base** | Matches some real tax regimes | Weak link to actual profit |

**FE recommendation**: **proportional to operating profit** (only profitable SKUs share the tax; `tax_allocated = cabinet_tax × (sku_operating_profit / Σ profitable_operating_profit)`, loss SKUs → 0). This keeps `net_profit_after_tax ≤ operating_profit` trivially and is the least misleading. **Product to confirm.** Whichever is chosen, the backend should expose the chosen `tax_allocated` (not ask the FE to recompute) so the allocation lives in one place.

---

## Acceptance (FE side)

When the backend ships per-SKU `net_profit_after_tax` (and `tax_allocated`):
- FE adds a "Чистая прибыль" column to `SkuFinancialsTable` (and by-brand/category), reusing the existing `getNetProfit` rendering/coloring convention.
- The finance-history page (`/analytics/finance-history`) net-profit row (already shipped, FR-1-adjacent) stays cabinet-level; once per-SKU lands, a follow-up can add a per-SKU net-profit drill-down.
- Per-row net profit uses `getValueColorClass` (sign indicator, WCAG 1.4.1) — consistent with the operating-profit cell.

---

## Reproduction / verification

- Pick a tax-configured cabinet (USN or VAT payer) for a known week.
- `GET /v1/analytics/weekly/by-sku?week=<W>` returns `tax_allocated` + `net_profit_after_tax` per nmId.
- Cross-check: Σ `tax_allocated` ≈ cabinet `tax.tax_amount` (USN) or Σ `vat_allocated` ≈ `tax.vat_payable` (VAT payer) within rounding; every SKU's `net_profit_after_tax ≤ operating_profit`.

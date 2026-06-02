# #196 — Liquidation scenarios: provide profit/price/profitability fields (or confirm recovery-only)

**Status**: OPEN
**Reported**: 2026-06-02 (iter-72 validation loop)
**Page**: `/analytics/liquidity` → Liquidation Planner modal ("Планировщик ликвидации")
**Related**: Epic 7 (Liquidity Analysis); FE fix `109ec26` made the modal honest (renders "—" for omitted fields)
**Severity**: MEDIUM (page feature degraded, not broken)

---

## Problem

The backend `GET /v1/analytics/liquidity` returns per-item `liquidation_scenarios` as:

```json
"liquidation_scenarios": {
  "full_price":     { "discountPct": 0,   "recovery": 312000, "daysToClear": 999 },
  "discount_20pct": { "discountPct": 0.2, "recovery": 249600, "daysToClear": 999 },
  "discount_50pct": { "discountPct": 0.5, "recovery": 156000, "daysToClear": 999 }
}
```

(Confirmed source: `src/analytics/helpers/liquidation-calculator.ts` + `liquidity-response.dto.ts`.)

The frontend Liquidation Planner was designed to show, per scenario: **Новая цена**, **Выручка**, **Прибыль**, a **Прибыльно/Убыток** badge, **требуемая скорость**, and a **"Применить -X%"** recommendation CTA. The backend provides only `discountPct`, `recovery`, `daysToClear` — so:

- **Новая цена / Прибыль / требуемая скорость** → FE now renders **"—"** (was fabricating "0 ₽").
- **Прибыльно/Убыток badge** → FE now **omits** it (was fabricating a false "Убыток" on every scenario).
- **"Применить -X%" recommendation CTA + "Рекомендуем" badge** → never appear, because `getRecommendedScenario` requires `is_profitable` and the backend never sends it. (This is pre-existing — the old FE defaulted `is_profitable:false`, so the CTA was already absent; the modal has had no working recommendation on live data.)

`recovery` is also a **cost-basis** figure (`stock × unit_cost × (1 − discount)` per the calculator), but the FE label reads **"Выручка"** (revenue) — a mild overstatement.

## Ask (pick the product direction)

1. **Enrich the scenario contract** to enable the full planner: add `newPrice`, `expectedProfit` (recovery − COGS), `isProfitable`, and optionally `requiredVelocity` per scenario. This unlocks the profit badge + the "Применить" recommendation CTA the UI was built for.
2. **OR confirm recovery-only is canonical** — then the FE keeps rendering "—"/no-CTA (honest), and we should relabel "Выручка" → "Возврат средств" (recovery) and drop the unused planner fields from the FE type.

Also: `daysToClear: 999` is the "never clears at current velocity" sentinel (all items in the test cabinet have 0 velocity). Confirm 999 is the intended sentinel (FE renders "∞ дней").

## Frontend disposition

FE fix `109ec26` already maps the 3 real fields and renders "—"/no-badge for the rest (Defensive Frontend Principle — no fabricated 0 ₽ / false Убыток). No further FE change needed until the product direction above is chosen. If direction (1), FE will surface the new fields; if (2), FE relabels "Выручка".

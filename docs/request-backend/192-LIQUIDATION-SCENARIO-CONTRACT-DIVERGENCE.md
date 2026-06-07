# 192 — Liquidation-scenario contract divergence (planner shows all-zero)

**Status**: RESOLVED (2026-06-06) — Backend `liquidation-calculator.ts` now produces all enriched fields (`newPrice`, `expectedProfit`, `isProfitable`, `requiredVelocity`, etc.)
**Severity**: HIGH (liquidation planner renders all-0 / misleading; real recovery numbers dropped)
**Filed**: 2026-06-02 (frontend validation iter-60)
**Endpoint**: `GET /v1/analytics/liquidity` → `data[].liquidation_scenarios`
**Frontend**: `/analytics/liquidity` → `LiquidationPlannerModal` (Epic 7); mapper `src/lib/api/liquidity-item-mapper.ts:51-84` (`mapLiquidationScenarios`)

---

## Problem

The frontend liquidation planner was built against a RICHER scenario contract than the backend
provides. The mapper reads field names the backend doesn't send, so every scenario renders as
0 ₽ / 0 шт. — and real backend recovery figures are silently dropped.

## Evidence (live, cabinet `f75836f7-…`)

Backend ships per item:
```json
"liquidation_scenarios": {
  "full_price":    { "discountPct": 0,   "recovery": 312000, "daysToClear": 999 },
  "discount_20pct":{ "discountPct": 0.2, "recovery": 249600, "daysToClear": 999 },
  "discount_50pct":{ "discountPct": 0.5, "recovery": 156000, "daysToClear": 999 }
}
```

The FE `LiquidationScenario` type / mapper expects: `target_days`, `required_velocity`,
`velocity_multiplier`, `suggested_discount_pct`, `new_price`, `expected_revenue`,
`expected_profit`, `is_profitable`.

Field reconciliation:
| FE field | backend field | status |
|---|---|---|
| `expected_revenue` | `recovery` | **rename — directly mappable** (currently dropped → 0) |
| `target_days` | `daysToClear` | **rename — directly mappable** (currently defaults 30) |
| `suggested_discount_pct` | `discountPct` (fraction) / key | derivable (FE infers from key) |
| `new_price` | — | **not provided** by backend |
| `expected_profit` | — | **not provided** (could be `recovery − frozen_capital`?) |
| `required_velocity` / `velocity_multiplier` | — | **not provided** (could be `stock / daysToClear`?) |
| `is_profitable` | — | **not provided** |

## Impact

`LiquidationPlannerModal` renders `new_price`, `expected_revenue`, `expected_profit`,
`required_velocity` and an `is_profitable` "Убыток/Прибыль" badge. Today they are all 0/false →
the modal is non-functional and (worse) would show a fabricated "loss" verdict.

## Why the frontend did NOT partial-fix

`recovery`→`expected_revenue` and `daysToClear`→`target_days` are trivially mappable, but the
modal renders them ALONGSIDE `new_price`/`expected_profit`/`is_profitable`, which have no backend
source. A partial remap would surface a real "Выручка" next to a fabricated `0 ₽` "Новая цена" /
`0 ₽` "Прибыль" + a false "Убыток" badge — an affirmatively misleading profitability verdict,
worse than the current honest empty state (Defensive Frontend Principle). So the FE leaves the
planner showing "Нет доступных сценариев" until the contract is reconciled.

## Requested fix (decide the contract — pick one)

1. **Backend enriches** each scenario with the fields the planner needs: `new_price`,
   `expected_profit`, `required_velocity`, `is_profitable` (plus rename `recovery`→`expected_revenue`,
   `daysToClear`→`target_days`, or document the mapping). Then the FE mapper aligns 1:1.
2. **OR** agree the canonical scenario shape is the simpler `{discountPct, recovery, daysToClear}`,
   and the FE planner is redesigned to that model (drop new_price/profit/velocity columns or compute
   the derivable ones — `expected_profit = recovery − frozen_capital`, `required_velocity =
   stock / daysToClear` — with product sign-off on the formulas).

Either way the FE needs an agreed contract before re-wiring the planner. Related contract-divergence
precedents: #181, #182 (FBS analytics).

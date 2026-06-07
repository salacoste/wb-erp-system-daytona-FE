# 203 — Supply-planning: no selling-price field blocks honest revenue / profit / ₽-loss

**Status**: RESOLVED (2026-06-06) — backend added selling_price + potential_revenue + potential_profit to SupplyPlanningItemDTO (avg sale price from last 8 weeks)
**Severity**: MEDIUM (drove fabricated-financials removal on the FE — see below)
**Found**: iter-140 audit of `/analytics/supply-planning`
**Endpoint**: the supply-planning list endpoint feeding `SupplyPlanningItem`

## Problem

`SupplyPlanningItem` carries `cogs_per_unit` (nullable) and `reorder_value` (= reorder_quantity × cogs) but **no selling price / retail price / revenue** field. With no price, the frontend cannot compute any honest ₽ figure for revenue, profit, or stockout loss.

Until iter-140 the FE filled this gap by **fabricating** a price and presenting the results as authoritative — a Defensive Frontend Principle violation. Three sites were fabricating:

1. **Detail panel "Потенциальные потери (7 дней)"** — `calculateForecast` used `cogs_per_unit × 2.5` (or a hardcoded `1000 ₽` when COGS was absent) as "retail price", × lost units → a ₽ loss.
2. **Risk cards "Потери: X ₽"** — `total_reorder_value × 0.3 / 0.25 / 0.2` (arbitrary %), mislabelling a fraction of reorder COST as a loss.
3. **Detail "Анализ затрат"** — "Ожид. выручка" = `reorder_value × 2.5`, "Ожид. прибыль" = `reorder_value × 1.5 (60%)`.

## FE resolution (iter-140, already shipped)

- (1) now shows the **honest lost-sales UNITS** ("≈ N шт упущенных продаж") — derivable from real `current_stock` + `avg_daily_sales`, no price needed.
- (2) and (3) **removed** — no honest replacement exists without a price.
- The real COGS row in "Анализ затрат" (`cogs_per_unit × reorder_quantity = reorder_value`) was kept (all backend-provided).

## Request (to restore the ₽ views honestly)

Add a real per-SKU **selling/retail price** (and/or **expected revenue**) to the supply-planning item — ideally the actual average sale price from the weekly report (`sale_gross / qty`), not a markup assumption. With it, the FE can honestly show:
- Потенциальные потери в ₽ = lost units × real avg price.
- Ожид. выручка / прибыль in "Анализ затрат" (revenue − COGS).

Until then the FE intentionally shows units / omits the ₽ figures rather than fabricate them.

## Note

Same defect CLASS as the fabricated-price assumptions elsewhere; the FE's rule is to **indicate, not fabricate** (Defensive Frontend Principle, `frontend/CLAUDE-PATTERNS.md`).

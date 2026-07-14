# Page log — `/analytics/brand` + `/analytics/category` (W26)

## `/analytics/brand?week=2026-W26`

### 1. Raw API
`GET /v1/analytics/weekly/by-brand?week=2026-W26&include_cogs=true&include_ads=true&include_stock=true` → 200, 6 items.
Per item: `{brand, total_skus, total_units, revenue_gross, revenue_net, logistics_cost, profit, margin_pct, cogs, profit_per_unit, roi, …}`.
Σ `revenue_gross` = **387 152,60**  (= Σ SKU `revenue_gross` 389 860,60 **−** `wb_returns_gross_total` 2 708,00, exact).
Σ `revenue_net` = 440 094,11 (= finance `revenue_net`). Σ `total_skus` = 48. Σ `total_units` = 826.
Verbatim: `margin-by-brand-W26.raw.json`.

### 2. Rendered

| Element | Rendered | Source | Match |
|---|---|---|---|
| Heading | "Маржинальность по брендам" | — | — |
| Top KPI Выручка | **620 334 ₽** | `sale_gross_total` | ✅ (full WB+EAEU scope) |
| Row `DURABOND` | 1 SKU · Выручка 21 761,21 ₽ · Себестоимость **0,00 ₽** · Прибыль **+21 761,21 ₽** · Маржа **100,00 %** · "Без COGS" · Опер. прибыль 16 243,67 ₽ | `revenue_gross=19536.17`/`revenue_net=21761.21`, `cogs=0`, `profit=21761.21`, `margin_pct=100` | ⚠️ C1/C2/C4 |
| Row `Protape` | 4 SKU · 175 942,03 ₽ · Маржа 100 % · "Без COGS" | similar | ⚠️ |
| Row `Space Chemical` | 27 SKU · 181 737,98 ₽ · Маржа 100 % · "Без COGS" 💤5 | similar | ⚠️ |

### 3. Checks
- ✅ "Без COGS" badge shown on every brand (cogs=0 week-wide) — defensive indicator present.
- ❌ **C1/C2 at runtime:** with cogs=0, `margin_pct=100` and `profit=revenue` for every
  brand. The page shows "Маржа 100 %" and "Прибыль +21 761" prominently. Misleading
  even with the badge (a seller sees "100 % margin" first, the "Без COGS" tag second).
- ⚠️ B1 scope: Σ brand `revenue_gross` (387 K) ≠ finance `sale_gross_total` (620 K).
  Brand aggregation is **WB-only** (excludes EAEU + returns-netting); finance-summary
  is the combined WB+EAEU report. Not a bug, but the two figures appear under the same
  "Выручка" word on different pages.

## `/analytics/category?week=2026-W26`

### 1. Raw API
`GET /v1/analytics/weekly/by-category?week=2026-W26&include_cogs=true&include_ads=true&include_stock=true` → 200, **15 items, all `subject_name="Unknown"`, `revenue_gross_rub="0"`, `revenue_net_rub="0"`**. Only `storage_cost_rub`/`logistics_cost_rub` carry values.
Verbatim: `margin-by-category-W26.raw.json`.

### 2. Rendered
The **page** shows real category rows with names and revenue: e.g.
`Автохимия · 3 SKU · Выручка 614,22 ₽ · Себестоимость 0,00 ₽ · Прибыль +614,22 ₽ · Маржа 100 % · ДРР 461,0 % · Опер. прибыль −126,78 ₽`.

### 3. Checks — ❌ BD-10 (BE-owned)
- The `by-category` **backend endpoint returns all-zero revenue and `subject_name="Unknown"`**
  for every row, yet the page renders real categories with non-zero revenue. The page
  must be sourcing category names + revenue from a **different** payload (likely a
  client-side join of `by-sku` items → product catalog `subject_name`, or a separate
  margin-analytics aggregation). The endpoint itself is broken for this cabinet.
- Repro: `curl /v1/analytics/weekly/by-category?week=2026-W26&include_cogs=true&include_ads=true&include_stock=true`
  → 15 rows, all `subject_name="Unknown"`, `revenue_gross_rub="0"`.
- Impact: any consumer relying on the by-category API directly (exports, integrations)
  gets garbage; the FE page works around it. File as BE ticket (category aggregation
  join to product `subject_name` is broken for this cabinet).
- Note `ДРР 461,0 %` for "Автохимия" (revenue 614,22 ₽ vs ad-spend 2 831,61 ₽) —
  ДРР > 100 % is mathematically valid (ad-spend exceeds revenue) but worth flagging
  as a confusing rendering when cogs=0 inflates the revenue base.

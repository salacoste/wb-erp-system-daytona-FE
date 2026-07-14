# Page log — `/analytics/sku` (W26)

**URL / filters.** `http://localhost:3100/analytics/sku?week=2026-W26`
Period = W26 (От = Неделя 26 / До = Неделя 26, "Выбрано: 1 неделя"), group = "По товарам".

## 1. Raw API calls

| # | Method / path / query | Status | Salient fields |
|---|-----------------------|--------|----------------|
| 1 | `GET /v1/analytics/weekly/by-sku?week=2026-W26&include_cogs=true&include_ads=true&include_stock=true` | 200 | 44 items. Per item: `{nm_id, sa_name, sale_dt, total_units, revenue_gross, revenue_net, logistics_cost, storage_cost, advertising_cost, missing_cogs_flag, …}`. Σ `revenue_gross`=389860.60 (= `wb_sales_gross_total`); Σ `revenue_net`=440094.11 (= finance `revenue_net`); Σ `total_units`=4338 (per-transaction rows, NOT daily). |
| 2 | `GET /v1/analytics/weekly/finance-summary?week=2026-W26` | 200 | (dashboard source; reused for headline "Выручка (розница)" + "ЧИСТАЯ ПРИБЫЛЬ") |
| 3 | `GET /v1/analytics/weekly/cabinet-summary?…` | 200 | expense breakdown (logistics, storage, etc.) |

Verbatim: `margin-by-sku-W26.raw.json`, `finance-summary-W26.raw.json`.

## 2. Rendered values

| Element | Rendered | Source | Match |
|---|---|---|---|
| Heading | "Маржинальность по товарам" | — | — |
| Formula banner | **"Прибыль = Выручка − COGS − Все расходы (логистика, хранение, комиссия WB, эквайринг, штрафы и др.)"** | docs/request-backend/63 | ✅ (operating profit, explicit) |
| `Выручка (розница)` KPI | **620 333,59 ₽** | `sale_gross_total` | ✅ |
| `ЧИСТАЯ ПРИБЫЛЬ` (bottom) | **311 545,16 ₽** | `payout_total=311545.26` | ⚠️ label says "ЧИСТАЯ ПРИБЫЛЬ" but value = payout_total (≠ dashboard's 278 145 net_profit) — C2 |
| Chart `Выручка` | 440 094,11 ₽ | `revenue_net` | ✅ |
| Chart `Ср. маржа` | **−0,3 %** | computed over per-SKU margins | ⚠️ a 3rd margin figure |
| Table row `173589306` (0 sales) | Выручка 0,00 ₽ · COGS "Не назначена" · Прибыль **—** · Маржа **−100,0 %** | `missing_cogs_flag=true` | ✅ AP#8 (profit=—); ⚠️ margin −100 % misleading w/ 0 sales |
| Table row `906010371 plb20 DURABOND` (55 шт) | Выручка(net) 21 761,21 ₽ · Расходы 5 517,54 ₽ · COGS "Не назначена" · Прибыль **—** · Маржа **4,9 %** · "Нет COGS" | `revenue_net=21761.21`, expenses=5517.54 | ⚠️ margin 4,9 % ≠ op-margin 74,6 % (revenue_net−expenses)/revenue_net — see mapper gap |
| COGS column (all rows) | "Не назначена" | `missing_cogs_flag=true` for all (cogs_total=0 week-wide) | ✅ AP#8 |

## 3. Page-local checks

- ✅ AP#8 correct here: profit cell renders **`—`** + tooltip "нет COGS, прибыль не
  рассчитана" whenever `missing_cogs_flag=true` or profit uncomputable.
- ⚠️ **Margin formula opaque.** Row `plb20` shows Маржа 4,9 %, but
  `(revenue_net − expenses) / revenue_net = (21761.21 − 5517.54) / 21761.21 = 74,6 %`.
  The 4,9 % must derive from a different denominator (likely `revenue_gross`
  across the brand, or the `mapBrandItem` ROI-mapper gap in
  `project_margin_aggregated_roi_mapper_gap.md`). Needs a backend-contract check.
- ⚠️ "ЧИСТАЯ ПРИБЫЛЬ 311 545" on this page vs "Чистая прибыль 278 145" on the
  dashboard — same Russian label, 33 400 ₽ apart. C2 cross-page contradiction.

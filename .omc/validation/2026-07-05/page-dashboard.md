# Page log — `/dashboard` (W26)

**URL / filters.** `http://localhost:3100/dashboard?week=2026-W26&type=week`
(logged in as `test@test.com`, cabinet `f75836f7-…-a1f3508cce8e`). Period = single
week W26 (ISO 2026-W26 = Mon 2026-06-22 → Sun 2026-06-28). Captured via
playwright-cli snapshot after `networkidle`-equivalent wait (6s + reload).

## 1. Raw API calls (W26)

| # | Method / path / query | Status | Salient numeric fields (hook reads) |
|---|-----------------------|--------|-------------------------------------|
| 1 | `GET /v1/analytics/weekly/finance-summary?week=2026-W26` | 200 | `summary_total.{sale_gross_total=620333.59, payout_total=311545.26, cogs_total=0, logistics_cost_total=74634.81, storage_cost_total=4309.55, paid_acceptance_cost_total=1440, commission_sales_total=63359.24, acquiring_fee_total=15054.99, wb_promotion_cost_total=47281, returns_gross_total=4198, wb_sales_gross_total=389860.6, wb_returns_gross_total=2708, product_transactions_total=836, net_profit_after_all_tax=278145.47, operating_margin_pct=71.66, gross_margin_pct=100, revenue_net=440094.11}`; `gross_profit=null` |
| 2 | `GET /v1/analytics/fulfillment/summary?from=2026-06-22&to=2026-06-28` | 200 | `summary.total.ordersCount=186` (FBO 49 + FBS 137); `summary.fbo.salesCount=…`, `fbs.salesCount=…` |
| 3 | `GET /v1/analytics/advertising?from=2026-06-22&to=2026-06-28` | 200 | `summary.totalSpend=16779.19, totalRevenue=218389, avgRoas=13.02` |
| 4 | `GET /v1/analytics/weekly/comparison?period1=2026-W26&period2=2026-W25` | 200 | period-over-period deltas (WoW) |
| 5 | `GET /v1/analytics/weekly/cabinet-summary?weekStart=2026-W26&weekEnd=2026-W26` | 200 | `summary.totals.{sale_gross=620333.59, payout_total=311545.26, logistics_cost=74634.81, …}` (cross-check) |

Verbatim payloads: `finance-summary-W26.raw.json`, `fulfillment-summary-W26-correct.raw.json`,
`advertising-W26-correct.raw.json`, `comparison-W26-vs-W25.raw.json`, `cabinet-summary-W26.raw.json`.

> **Date-range note.** The ISO week 2026-W26 runs **Mon 06-22 → Sun 06-28**
> (Europe/Moscow). My first captures used 06-21→06-27 (off by one day) for
> `advertising` and `fulfillment`, which under-counted (ad-spend 16153 vs 16779;
> orders 122 vs 186). All reconciliations below use the corrected 06-22→06-28
> range. `finance-summary` is keyed by `week=YYYY-Www` and is unaffected.

## 2. Rendered values (UI)

| Card (data-testid / article aria) | Rendered text | API source value | Match |
|---|---|---|---|
| `Чистая прибыль` (header) | **278 145,47 ₽** | `net_profit_after_all_tax=278145.47` | ✅ |
| `Чистая прибыль` (P&L card) | 278 145,47 ₽ (+44.8 %, −8,4 % WoW) | same | ✅ |
| `Выкупы` (header) | **389 860,6 ₽** | `wb_sales_gross_total=389860.6` | ✅ (WB-only — see C3) |
| `Маржа` (header) | **71,66 %** | `operating_margin_pct=71.66` | ✅ |
| `Заказы` (header) | **186 шт** | `fulfillment.summary.total.ordersCount=186` | ✅ |
| `Заказы, шт` (P&L card) | 186 шт (+173,5 % WoW) | 186 | ✅ |
| `Выкупы, шт` | 836 шт | `product_transactions_total=836` | ✅ |
| `Возвраты` | 5 шт / 2 708 ₽ | `wb_returns_gross_total=2708` (₽) ✅; шт=5 (fulfillment returnsCount) | ✅ |
| `Продажи (розница)` | **620 333,59 ₽** (−1,1 %) | `sale_gross_total=620333.59` | ✅ (A1) |
| `Комиссия WB (из оборота)` | 78 414,23 ₽ (12,64 % от выручки) | derived from `total_commission_rub_total=233180.99` (rus+eaeu split) | ⚠️ formula-derived |
| `Прочие удержания (WB сервисы)` | **0 ₽** | `wb_services_cost_total=47281` ≠ 0 | ❌ see finding BD-9 |
| `Логистика` | 74 634,81 ₽ (+13,6 %, 12,03 % выручки) | `logistics_cost_total=74634.81` | ✅ (A4) |
| `Хранение и приёмка` | 5 749,55 ₽ (Хранение 4 309,55 ₽ + Приёмка 1 440 ₽) | `storage_cost_total=4309.55 + paid_acceptance_cost_total=1440` | ✅ (A4) |
| `К перечислению` | **311 545,26 ₽** (−8,3 %) | `payout_total=311545.26` | ✅ (A2) |
| `Себестоимость` | **0 ₽** | `cogs_total=0` (literal zero; `gross_profit=null`) | ⚠️ BD-2/BD-5 see C4 |
| `Реклама` | **47 281 ₽** (ROAS 13,0x · ДРР 7,62 %) | `wb_promotion_cost_total=47281` | ⚠️ see A5/C3 |
| Period-comparison `Выручка` | 440 094,11 ₽ (0,2 % vs 440 899,74 W25) | `revenue_net=440094.11` | ✅ |
| Period-comparison `Прибыль` | **440 094,11 ₽** | `revenue_net` (cogs=0 ⇒ == gross_profit_analytical) | ⚠️ C2 |
| Period-comparison `Маржа` | **100,0 %** (vs 100,0 % W25) | `gross_margin_pct=100` (cogs=0 ⇒ 100) | ⚠️ C1/C4 |

## 3. Page-local checks

- ✅ Every identity card matches its `finance-summary` source post-format
  (`sale_gross`, `payout`, `logistics`, `storage+acceptance`, `commission`).
- ✅ WoW deltas all match recomputed W26/W25 deltas (A7): К перечислению −8,3 %,
  Продажи −1,1 %, Логистика +13,6 %, Хранение +21,2 %, Чистая прибыль −8,4 %,
  Реклама(wb_promotion) +48,9 %.
- ⚠️ Two "profit" figures on the same page: header `Чистая прибыль 278 145` vs
  period-comparison `Прибыль 440 094` — 161 949 ₽ apart (C2).
- ⚠️ Two "Маржа" figures: header `71,66 %` vs period-comparison `100,0 %` (C1).
- ⚠️ `Себестоимость: 0 ₽` rendered as a hard zero, while upstream `gross_profit=null`
  signals "uncalculable" — AP#8 would prefer `—` with a "нет COGS" hint (C4).

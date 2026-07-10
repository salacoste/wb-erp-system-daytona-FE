# Page logs — advertising / orders / unit-economics / liquidity (W26)

## `/analytics/advertising?from=2026-06-22&to=2026-06-28&view=sku&group_by=sku&sort=spend&order=desc`

### Raw
`GET /v1/analytics/advertising?from=2026-06-22&to=2026-06-28` → 200.
`summary={totalSpend:16779.19, totalRevenue:218389, avgRoas:13.02, avgRoi:12.7, avgCtr:…, totalSales:…, totalOrganicSales:…, avgOrganicContribution:…}`.
40 day/campaign items; Σ item `spend` = `totalSpend` exactly (B3 ✅).
Verbatim: `advertising-W26-correct.raw.json`.

> Earlier capture used 06-21→06-27 (off-by-one) and got totalSpend 16153.33 / avgRoas 13.7.
> The dashboard uses 06-22→06-28 (correct ISO week) → 16779.19 / 13.02. Reconciliations
> use the corrected range.

### Rendered (KPI cards) vs API

| Card | Rendered | API | Match |
|---|---|---|---|
| Всего продаж | 505 650 ₽ (284 413 ₽ органика) | `totalSales=505649.87`, `totalOrganicSales=284412.87` | ✅ |
| Из рекламы | 221 237 ₽ | `totalRevenue=218389` (corrected range) | ⚠️ 2 848 delta = range-edge attribution |
| Общий ROAS | 13,7x | `avgRoas=13.02` (corrected) | ⚠️ rendered 13,7 used my off-by-one range |
| Общий ROI | 12,7 % | `avgRoi=12.7` | ✅ |
| Доля органики | 56,3 % | `avgOrganicContribution=56.25` | ✅ |
| Расход (PromotionAPI) | **16 153,33 ₽** (rendered, off-by-one range) | corrected 16 779,19 | ⚠️ |
| WB-services promotion line | 47 281 ₽ | `wb_promotion_cost_total` | ✅ |

> The page distinguishes the two promotion sources clearly (PromotionAPI 16 K vs
> WB-services 47 K). A5 ambiguity is dashboard-only.

## `/analytics/orders` (volume + trends, W26 range 06-22→06-28)

### Raw
- `GET /v1/analytics/orders/volume?from=2026-06-22&to=2026-06-27` → 200. `totalOrders=101`,
  `hourlyTrend`, `dailyTrend`, `statusBreakdown`. **No revenue/cogs fields** (volume = counts only).
- `GET /v1/analytics/orders/trends?from=2026-06-22&to=2026-06-28` → 200.
  `summary={totalOrders:101, totalRevenue:74577.07, avgDailyOrders:17, …}`;
  `dataSource.primary="orders_fbs"` → **FBS-only**.

### Checks
- ⚠️ **C3:** orders/trends revenue (74 577,07 ₽) is **FBS-only** (no FBO). Any page
  surfacing this as "revenue" without a scope flag is misleading. (Orders page labels
  it correctly; flagged for any future consumer.)
- ⚠️ **Count mismatch by source:** `orders/volume.totalOrders=101` and
  `orders/trends.totalOrders=101` vs dashboard `Заказы, шт=186` (fulfillment FBO+FBS).
  101 = FBS-only orders this range; 186 = FBO+FBS units. Different metrics (orders vs
  units, FBS vs all) — not a bug, but three "orders" numbers across pages (101, 122, 186)
  need explicit scope labels.

## `/analytics/unit-economics?week=2026-W26` (view_by=sku)

### Raw
`GET /v1/analytics/unit-economics?week=2026-W26&view_by=sku` → 200.
`summary={total_revenue:440094.11, total_your_price:503453.35, avg_cogs_pct:null, avg_wb_fees_pct:45.82, avg_net_margin_pct:72, sku_count:37, profitable_sku_count:37, loss_making_sku_count:0}`.
37 items. Verbatim: `unit-economics-W26.raw.json`.

### Rendered
- "Маржа %": **72,0 %** ↑Отлично == `avg_net_margin_pct=72` ✅
- `avg_cogs_pct=null` → rendered as "—" (AP#8 correct on this page).
- `profitable_sku_count=37 = sku_count=37` → "100 % profitable", but this is because
  cogs=0 ⇒ every SKU trivially "profitable". ⚠️ C4: misleading profitability headline
  when cogs coverage is 0 %.

### Checks
- ✅ AP#8 correct (null cogs → "—").
- ⚠️ C1: a **third** margin label/value: dashboard header "Маржа 71,66 %" (operating),
  dashboard period-card "Маржа 100 %" (gross, cogs=0), UE "Маржа 72 %" (net margin),
  SKU "Ср. маржа −0,3 %". Four margin numbers under the same word "Маржа" across pages.

## `/analytics/liquidity`

### Raw
`GET /v1/analytics/liquidity` (no params) → 200. `liquidity-W26.raw.json`.
(Note: `?week=` is rejected — 400 "property week should not exist". FE `getLiquidity`
builds query only from `category_filter`/`sort_by`/`sort_order`/`limit`, correctly.)
`/v1/analytics/liquidity/trends?period=30` → **404** (endpoint absent on backend).

### Checks
- ✅ Liquidity page API contract is clean (no spurious params; the old
  `include_liquidation_scenarios` 400 from the Feb pass is gone).
- ⚠️ BE-owned: `/v1/analytics/liquidity/trends` returns 404 — FE has a hook + normalizer
  for it (`getLiquidityTrends`) but the endpoint is absent. File BE ticket if the trends
  card is shown anywhere.

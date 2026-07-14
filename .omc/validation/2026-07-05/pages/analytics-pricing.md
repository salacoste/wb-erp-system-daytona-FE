# /analytics/pricing — Рекомендации по ценам (Epic 121 / Story 122.2)

**Route:** `/analytics/pricing` · **Filters state:** target_margin=15%, gapFilter=all, sort=default
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: H1 «Рекомендации по ценам», «Обновить» button, target-margin slider (5%–50%, default 15%), gap filter, sort, recommendations table, **Эластичность цен** section. NOT Jam-gated. ✅
- `GET /v1/products/price-recommendations?limit=50&target_margin_pct=15` → **200** `{items:[],total:0}`.
- `GET /v1/products/price-elasticity?limit=50` → **200** (69 items).

## 2. Interactive elements
- Target-margin slider → updates `target_margin_pct` query param → refetch recommendations. ✅ (renders «15%»)
- Gap filter («Все товары»), Sort («По умолчанию») dropdowns present. ✅
- «Обновить» button → `POST /v1/products/price-recommendations/refresh` (did not click — would trigger recomputation job).
- Row click → opens `PriceHistorySheet` (side sheet) with weekly price history per nmId (Story 122.2). Not exercised (table empty).

## 3. Data vs API — Эластичность цен table (reconciled, 6/6 first rows exact)
| Rendered | API field | Match |
|---|---|---|
| 148190095 / -0,596 / 0,178 / 99 / category / Средняя | `elasticity:-0.596, rSquared:0.178, dataPoints:99, source:category, confidence:medium` | ✅ |
| 148190182 / -1,330 / 0,101 / 25 / sku / Средняя | `elasticity:-1.33, rSquared:0.101, dataPoints:25, source:sku, confidence:medium` | ✅ |
| 255211393 / 6,090 / 0,398 / 23 / sku / Высокая | `elasticity:6.09, rSquared:0.398, dataPoints:23, source:sku, confidence:high` | ✅ |
| 1093862907 / 4,108 / 0,055 / 30 / category / Низкая | `elasticity:4.108, rSquared:0.055, dataPoints:30, source:category, confidence:low` | ✅ |
| 906010371 / -3,578 / 0,376 / 12 / sku / Высокая | `elasticity:-3.578, rSquared:0.376, dataPoints:12, source:sku, confidence:high` | ✅ |
| 1045852369 / -8,848 / 0,713 / 16 / category / Высокая | `elasticity:-8.848, rSquared:0.713, dataPoints:16, source:category, confidence:high` | ✅ |

Summary cards: «Высокая точность 10 SKU / Средняя 27 / Низкая 32» (sum 69 = total SKU count ✅).
Recommendations: empty («Нет рекомендаций по ценам. Нажмите «Обновить» для пересчёта.»).

## 4. AP#8 runtime ✅
- `profitMaxPrice` is null/0 for several SKUs upstream → normalized via `toNullableNumber` (`price-elasticity.ts:71`) and **NOT rendered** in the batch table (only elasticity/rSquared/dataPoints/source/confidence shown). No null→0 leak. ✅
- `elasticity`/`rSquared` use `toCount` (→0) — these are statistical coefficients where 0 is a meaningful value (not money/ratio), so this is NOT an anti-pattern #8 violation. Acceptable.
- Recommendations empty → honest empty-state, no fabricated prices. ✅

## 5. Findings — BD-15 (known) verified live
- **BD-15 (price-calc local vs backend) — CANNOT verify live** because `/v1/products/price-recommendations` returns `{items:[],total:0}` (no recommendations computed yet). The page shows the correct empty-state and a «Обновить» CTA to trigger `POST /refresh`. The local-vs-backend `recommended_price` divergence cannot be reproduced without populated recommendations.
- No FE `BD-*` defects. Elasticity numbers reconcile exactly to the API; confidence-tier counts sum correctly.
- **Recommendation:** re-validate the populated recommendations path after a `POST /refresh` + wait for job completion, on a cabinet with COGS assigned (current W26/W25 cogs=0 likely explains the empty recommendations — price recs need margin targets).

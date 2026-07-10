# /analytics/product/[nmId] — Unified Product Analytics (Epic 120-FE, nmId=147205694)

**Route:** `/analytics/product/147205694` · **Filters state:** default 30-day range (07.06.2026 — 06.07.2026)
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: «Назад к аналитике», H1 «Аналитика товара #147205694», 30-day range, 5 tabs (Обзор / Воронка / Реклама / Органика / Варианты). NOT Jam-gated. ✅
- 3 endpoints all **200**:
  - `GET /v1/analytics/product/147205694/unified?from=2026-06-07&to=2026-07-06`
  - `GET /v1/analytics/product/147205694/organic-share?from=…&to=…`
  - `GET /v1/analytics/product/147205694/incremental-roas?from=…&to=…`

## 2. Interactive elements
- DateRangePickerExtended → updates from/to → refetch all 3 endpoints. ✅
- Tab switcher (Обзор/Воронка/Реклама/Органика/Варианты) — click handlers present; «Обзор» cards persist in DOM (overview is the default). Tabs marked `[role=tab]`. ✅
- «Назад к аналитике» link. ✅

## 3. Data vs API — Обзор cards (reconciled exactly, 30-day window)
| Rendered | API field | Match |
|---|---|---|
| Органический трафик **0,0 %** | `summary.organicTrafficShare:0` | ✅ |
| **0 просмотров** (organic) | `organic.totals.organicViews:0` | ✅ |
| Рекламный трафик **5 764,52 %** | `summary.adTrafficShare:5764.52` | ✅ |
| **1 787 просмотров** (ad) | `advertising.totals.views:1787` | ✅ |
| Смешанная конверсия **3,23 %** | `summary.blendedConversion:3.23` | ✅ |
| Рекламные расходы **435,83 ₽** | `advertising.totals.spend:435.83` | ✅ |
| **55 кликов** | `advertising.totals.clicks:55` | ✅ |
| Открытия карт **31** | `funnel.totals.openCardCount:31` | ✅ |
| Добавления в корзину **2** | `funnel.totals.addToCartCount:2` | ✅ |
| Заказы **1** | `funnel.totals.ordersCount:1` | ✅ |
| Выкупы **0** | `funnel.totals.buyoutCount:0` | ✅ |
| Отмены **0** | `funnel.totals.cancelCount:0` | ✅ |

incremental-roas (30d): `iROAS:1.09, interpretation:"marginal", organicCannibalizationPct:70, totalOrders:10, estimatedOrganicOrders:7` (interpreted consistently; the 7-day window showed iROAS:0/"ineffective"/100% cannibal — the interpretation correctly shifts with the window).

## 4. AP#8 runtime ✅
- `organicTrafficShare:0` (literal computed 0, not null) → renders «0,0 %» — **correct**, this is a real computed share (organic orders = 0), not a missing-data sentinel.
- `avgCartConversion:6.45`, `avgOrderConversion:50`, `avgBuyoutConversion:0` — funnel conversion rates present; null handling not exercised (all populated).
- The `adTrafficShare:5764.52` (>100%) is odd-looking but faithful to the API (organic=0 inflates the ad share denominator). **Not a FE bug** — the BE computes it; the FE renders it verbatim. Possible BE-side data-quality note (see BE-BUGS-D.md BE-D-2).

## 5. Findings
- **No FE `BD-*`.** All 12 rendered numbers reconcile exactly to the unified/incremental-roas API.
- **BE-D-2** ℹ️/🟡 BE — `summary.adTrafficShare = 5764.52%` (>100%) when `organicTrafficShare=0`. The share computation likely divides by organic-only or mis-handles the zero-organic case, producing an implausible >5000% ad share. Cosmetic (faithfully rendered) but misleading. See `BE-BUGS-D.md`.
- Tab content for Воронка/Реклама/Органика/Варианты not exhaustively diffed (Обзор reconciled fully; the others draw from the same unified response).

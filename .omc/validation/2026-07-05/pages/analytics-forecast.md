# /analytics/forecast — AI Прогноз продаж (MindsDB)

**Route:** `/analytics/forecast` · **Filters state:** level=sku, nmId=147205694, horizon=7d, modelType=sales_forecast
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: H1 «AI Прогноз продаж», «Движок: подключён», «AI прогнозы включены» (engine status OK — unlike accuracy, this page is NOT Jam-gated).
- Parameter form: Уровень (По товару SKU), Артикул WB (nmId), Горизонт (7 дней), Тип модели (Прогноз продаж). All interactive. ✅

## 2. Interactive elements
- nmId input → filled `147205694` → triggers `GET /v1/ai/forecast?modelType=sales_forecast&nmId=147205694&level=sku&horizonDays=7` (**200**). ✅
- Result: «Нет данных прогноза. Модель ещё не обучена для этого товара. Попробуйте позже.» — graceful empty-state for `predictions:[]`. ✅
- Horizon / modelType / level controls present (did not exhaustively cycle each — they wire to the query per `useAiForecast`).

## 3. Data vs API
| Endpoint | Params | Status | Result |
|---|---|---|---|
| `/v1/ai/forecast` | modelType, nmId, level, horizonDays | **200** | `{predictions:[],modelVersion:0,engine:"none",cached:false,generatedAt}` |
| `/v1/ai/forecast` | (no params) | **200** | `{predictions:[],engine:"none"}` |

- No numeric forecast to reconcile (model not trained). The "Движок: подключён" status card vs `engine:"none"` in the prediction response is a minor label divergence — the connection check endpoint reports connected, but the prediction engine resolves to "none" (no trained model). **Not a bug** — different concerns (DB connection vs model availability).

## 4. AP#8 runtime
- Empty predictions → honest empty-state, no fabricated numbers. ✅

## 5. Findings
- **Data condition:** no trained sales-forecast model for any SKU on this cabinet (`predictions:[]`, `engine:"none"`). Page handles gracefully.
- **BE strict param validation:** `horizon` (alone) is rejected («property horizon should not exist») — the FE correctly sends `horizonDays` (`ai/forecast.ts`). ✅ no FE defect.
- No FE `BD-*`. No BE bug to file (empty-model state is expected for an untrained cabinet).

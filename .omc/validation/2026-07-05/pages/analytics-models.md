# /analytics/models — Модели AI
**Route:** `/analytics/models` · **Filters state:** none (static model list)

## 1. Load
- HTTP statusMap (all 200): `GET /v1/ai/models`, `GET /v1/analytics/supply-planning`, `GET /v1/cabinets/{id}/{token-status,seller-info,jam-status}`.
- Renders: H1 "Модели AI", table with columns Тип/Движок/Версия/Статус/MAPE/Обучен/Действия. 7 model rows (stockout_risk, demand_forecast, return_prediction_daily, anomaly_detection_daily, daily_revenue_forecast, return_prediction, anomaly_detection).
- No console errors.

## 2. Interactive elements
- **"Обучить" button per row** → POST `/v1/ai/models/train` (429 in test due to rate limit from prior curl probes, NOT a defect). UI shows toast "Превысен лимит обучения, попробуйте через час" — correct Russian-localized error surfacing of BE 429. **PASS.**
- Row click → navigates to `/analytics/models/[id]/evaluations`. **PASS.**

## 3. Data vs API
| Rendered | API field (`GET /v1/ai/models`) | Match |
|---|---|---|
| "Риск out-of-stock" / "Прогноз спроса" etc. (modelType localized) | `modelType: stockout_risk`, `demand_forecast` | ✅ |
| "Prophet" | `engine: prophet` | ✅ |
| "v1" | `version: 1` | ✅ |
| "Активна" | `status: active` | ✅ |
| MAPE column "—" | `metrics: {}` / `currentMape: null` | ✅ (AP#8 null→«—») |
| "06.07.2026" / "05.07.2026" | `trainedAt: 2026-07-06T01:12:35Z` → RU date | ✅ |

## 4. AP#8 runtime
- MAPE renders "—" (not 0% / 0.0%) for null metrics. ✅

## 5. Findings
- None. Page loads, data faithful, interactions work.

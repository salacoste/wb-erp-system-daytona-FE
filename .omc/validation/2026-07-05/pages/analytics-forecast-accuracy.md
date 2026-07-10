# /analytics/forecast-accuracy — Точность прогнозов (Epic 123-FE)

**Route:** `/analytics/forecast-accuracy` · **Filters state:** none (single aggregate endpoint)
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: H1 «Точность прогнозов» (Target icon), 4 metric cards, 2 breakdown tables. NOT Jam-gated. ✅
- `GET /v1/ai/forecast-accuracy` → **200** `{totalValidated:0,avgMAPE:null,mapeValid:false,avgMAE:null,avgBias:null,byHorizon:[],bySKU:[]}`.

## 2. Interactive elements
- No filters/tabs (static aggregate view). Cards + tables only. ✅

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| Валидировано **0** | `totalValidated:0` | ✅ |
| Средний MAE **—** | `avgMAE:null` | ✅ (null → em-dash, AP#8) |
| Средний MAPE **—** | `avgMAPE:null` | ✅ |
| Смещение (Bias) **—** | `avgBias:null` | ✅ |
| «Нет данных по горизонтам» | `byHorizon:[]` | ✅ |
| «Нет данных по SKU» | `bySKU:[]` | ✅ |

## 4. AP#8 runtime ✅
- All three ratio metrics (MAE/MAPE/Bias) are `null` upstream → render «—», NOT `0` / `0%`. Confirmed both in API (`avgMAPE:null`) and rendered DOM. This is the **D2 fix path**: the page leads with MAE («Средний MAE — основной показатель точности») and only shows MAPE with the caveat «Средняя абсолютная ошибка %».
- `hasExtremeMape(data)` guard (threshold 1000) would surface an amber Alert «Очень высокая MAPE / MAPE может становиться тысячами процентов…» when any MAPE ≥ 1000 — addresses the headline-misleading concern (D2). Not triggerable live (all null).

## 5. Findings
- **D2 (known issue) — ADDRESSED at the FE level:** the page (a) leads with MAE not MAPE, (b) renders null MAPE as «—», (c) shows an extreme-MAPE warning Alert when values ≥ 1000. The "headline misleads" risk is mitigated by construction. No live data to confirm the warning fires, but the guard is correct (`ForecastAccuracyPageContent.tsx:18-31`).
- **Data condition:** `totalValidated:0` — no forecast validation has run for this cabinet.
- No FE `BD-*`. No BE bug (empty state is data-condition).

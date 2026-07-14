# /analytics/models/[id]/* — Model detail sub-routes (evaluations, performance, sku-accuracy)
**Route:** `/analytics/models/[id]/evaluations`, `/performance`, `/evaluations/sku-accuracy`
**Filters state:** model=`c2081d20-…` (Риск out-of-stock, v1, active)

## 1. Load
All three sub-routes load with 200 status maps:

### `/analytics/models/[id]/evaluations`
- `GET /v1/ai/evaluations` (200), `GET /v1/ai/models` (200).
- Renders: H1 "Оценки точности модели", "Сводка оценок", "Скачать CSV", model badge (Риск out-of-stock / v1 / Активна), stat cards (Средняя точность MAPE «—», Последняя оценка «—», SKU оценено 0), empty-state "Нет оценок этой модели…".
- **Empty state correct** (model has no evaluations yet).

### `/analytics/models/[id]/performance`
- `GET /v1/ai/models/[id]/performance` (200), `GET /v1/ai/models` (200).
- Renders model performance detail (MAPE trend chart, evaluation history table).

### `/analytics/models/[id]/evaluations/sku-accuracy`
- `GET /v1/ai/evaluations/sku-accuracy` (200).
- Renders SKU-level accuracy overview + table.

## 2. Interactive elements
- **"Скачать CSV"** export button (evaluations). Wired.
- **Back-navigation** to `/analytics/models`. **PASS.**

## 3. Data vs API
| Rendered | API | Match |
|---|---|---|
| MAPE «—» | null metrics (model not yet evaluated) | ✅ (AP#8) |
| SKU оценено 0 | empty evaluations list | ✅ |
| Model badge (type/v1/Активна) | `GET /v1/ai/models` item | ✅ |

## 4. AP#8 runtime
- MAPE cards render "—" (not 0%) for null. ✅

## 5. Findings
- **BD-note (low):** `/v1/ai/evaluations` is cabinet-scoped, not model-scoped — the `[id]` param appears unused for filtering in the evaluations fetch (FE may filter client-side). Functionally fine given current data; flag for BE/FE contract clarity if model-scoped evaluations expected.
- None blocking.

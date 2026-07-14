# BE-BUGS-C.md — Cluster C (analytics inventory/ops)

Append-only handoff log of backend-owned defects surfaced during Cluster-C full-page FE validation against live BE (`:3000`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`, JWT in `/tmp/feval-token`). Each entry is self-contained for the BE team.

Per coordinator note: this file is the **Cluster C** BE-bug log, separate from `BE-BUGS.md` (Cluster B owns that file). FE findings (BD-*) live in the per-page docs under `pages/` and in `REPORT.md`.

Validated pages: `/analytics/storage`, `/analytics/supply-planning`, `/analytics/reorder`, `/analytics/fbs-stock`, `/analytics/fbs-enhanced`.

---

## BE-C-1 — `/v1/analytics/supply-planning` returns identical ML velocity (14.39/day) for 12 distinct SKUs; reorder recommendations unreliable

- **Endpoint:** `GET /v1/analytics/supply-planning`
- **Severity:** MEDIUM — the per-SKU «Заказать (шт)», «Сумма (₽)», «Требуется капитал 547 870 ₽», and 7-day loss projections are all derived from this velocity. A seller ordering 318 / 315 / 323 / 320 units for 4 different products based on an identical 14.39/day ML estimate is making decisions on a number that is very likely a model default/fallback rather than a per-SKU prediction.
- **Repro:**
  ```bash
  TOKEN=$(cat /tmp/feval-token); CAB=$(cat /tmp/feval-cab)
  curl -s -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
    "http://localhost:3000/v1/analytics/supply-planning?limit=50" | \
    python3 -c "import json,sys; d=json.load(sys.stdin); from collections import Counter; print('avg_daily_sales:',dict(Counter(round(it.get('avg_daily_sales') or 0,2) for it in d['data']))); print('forecast_source:',dict(Counter(it.get('forecast_source') for it in d['data']))); print('summary:',d['summary'])"
  ```
- **Response (excerpt):**
  - `summary.forecast_source_breakdown = {ml: 43, velocity: 7}`
  - Distribution of `avg_daily_sales` across the 50 SKUs: `{14.39: 12, 0: 37, 0.46: 1}`
  - All 12 SKUs with `avg_daily_sales = 14.39` have `forecast_source = "ml"` and `forecast_confidence ≈ 0.46–0.51`.
  - The 12 are all distinct products (ter-10, ter-11, er1500un, hoop_1.2, trekka_1.1, …) yet share an identical ML velocity to the cent.
  - 37 SKUs have `avg_daily_sales = 0` → `days_until_stockout = 999` (32 healthy, 5 out_of_stock).
- **trace_id:** `7488816c-0840-49d9-8d10-3c9079897923` (X-Trace-Id header).
- **Expected:** ML-predicted `avg_daily_sales` should vary per SKU according to each SKU's actual recent sales pattern. With `forecast_source = "ml"` and a real confidence (~0.47), a seller expects a per-SKU estimate. 12 distinct products sharing an identical 14.39/day is implausible without a fallback/default path being hit.
- **Actual:** identical 14.39 for 12 SKUs flagged as ML-sourced; reorder_quantity / reorder_value / 7-day-loss derived from it are uniform-ish (318 / 315 / 323 / 320 units — variation only because of differing current_stock), making the «Требуется капитал 547 870 ₽» aggregate unreliable.
- **Likely root cause (BE-side hypothesis):** the ML model is returning a constant mean/fallback for low-history SKUs but still labelling them `forecast_source = "ml"` with confidence ~0.5 instead of degrading to `velocity` source or null. Either (a) the model isn't being passed per-SKU features, (b) a fallback constant (≈ avg of training set, ~14.39/day) is returned when features are missing, or (c) the confidence threshold for "use ML" is too low (0.47 should probably fall back to velocity/no-data).
- **Impact:** reorder recommendations and capital-requirement on `/analytics/supply-planning` are driven by this number. Also propagates to the per-row "Прогноз на 7 дней" + "Потенциальные потери" panel. FE cannot fix — the value comes straight from the API; the FE only adds a «Нет данных о тренде продаж» tooltip which is itself inaccurate for `forecast_source='ml'` rows (those DO have a forecast, just a uniform one).
- **Note (FE-side, for context):** the FE normalizer `supply-planning-normalizer.ts:39` does `avg_daily_sales: toNullableNumber(...) ?? 0` — the FE also has a latent `null → 0` clamp (FE BD-5, defensive gap), but on current data the backend never returns null here (it returns 0 / 0.46 / 14.39), so the FE clamp is not the active problem. The active problem is the BE's uniform ML value.

---

## (none) — `/analytics/storage`, `/analytics/reorder`, `/analytics/fbs-stock`, `/analytics/fbs-enhanced` — no BE-owned bugs

- All storage endpoints (`/by-sku`, `/top-consumers`, `/trends`) → 200, consistent data, correctly shaped.
- `/v1/analytics/reorder-recommendations` + `/metrics` → 200 (empty for this cabinet — data-condition, not a bug).
- `/v1/analytics/fbs/stock/{groups,sizes,regions}` → 200, AP#8-faithful (null money → «—»).
- **`/v1/analytics/fbs/enhanced` → 200 (was 500 in the UX-matrix D1 — now FIXED).** No BE bug to file; D1 resolved.

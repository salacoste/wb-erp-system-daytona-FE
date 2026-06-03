# Request #188 — AI forecast: predictedRevenue not computed (always 0)

**Originated by**: Frontend validation campaign (finding F-45), 2026-06-02
**Severity**: P3 — `/analytics/forecast` revenue column shows "—" (the FE now maps the
placeholder 0 → null). Not user-facing-wrong anymore, but the revenue forecast feature is
effectively unavailable until the engine computes it.
**Status**: PENDING BACKEND

---

## Problem

`GET /v1/ai/forecast?nmId=…&horizonDays=N` returns predictions where `predictedUnits` is a
real value but `predictedRevenue` is **0 for every prediction** (LIVE-VERIFIED 2026-06-02,
nmId 906010371, 7 predictions):

```
units: 739.31 | revenue: 0
units: 713.43 | revenue: 0
units: 724.72 | revenue: 0
... (all 7 rows: revenue 0)
```

`predictedUnits > 0` while `predictedRevenue == 0` for every row → the engine is not
computing revenue; `0` is a placeholder.

## FE side (done)

`normalizePrediction` (`frontend/src/lib/api/ai/forecast.ts`) now maps `predictedRevenue:
0` (and NaN/Infinity) → `null`, so `ForecastTable` renders "—" (unknown) instead of a
misleading "0 ₽" (anti-pattern #8 — 0 masks an uncomputed value).

## Requested fix

Either (a) compute `predictedRevenue` in the forecast engine (predictedUnits × expected
price), or (b) emit `predictedRevenue: null` when it's not computed, so the FE can drop the
0→null heuristic and a genuine 0 (zero-units → zero-revenue) becomes distinguishable from
"not computed".

## Evidence
- Live: `/v1/ai/forecast` predictions all have `predictedRevenue: 0`, `predictedUnits` > 0.
- FE: `frontend/src/lib/api/ai/forecast.ts` normalizePrediction (0→null map); `ForecastTable.tsx:76`.

---

## Related sibling — `confidence: 0` placeholder (added 2026-06-03, iter-98)

Same "uncomputed AI metric serialized as a 0 placeholder" class as the revenue issue above.

**Live-verified** `GET /v1/ai/forecast?nmId=321678606&modelType=daily_revenue_forecast`: every
prediction has `confidence: 0` (EXACTLY 0, all 7 rows) alongside `predictedUnits: null` and a real
`predictedRevenue`. So a revenue-target model emits `confidence: 0` as a "not computed" placeholder
(a real confidence is a float like 0.78, never exactly 0 across every row).

**FE impact (today):** `scaleConfidence` (forecast.ts) returns `0` (not null) for `confidence: 0`,
so the forecast table renders **"0%"** confidence + a red **"Низкая"** (low) band, and ForecastMetrics
shows **"0% / low"** average — a fabricated low-confidence reading where confidence is actually
unknown. (Note: the downstream null-guards are partial — the "Диапазон" band defaults `null → 'low'`
and the avg defaults `→ 0`, so even a null wouldn't fully render "—" without two extra guards.)

**Requested fix (backend):** emit `confidence: null` (not 0) when confidence is genuinely uncomputed
— mirroring the revenue ask above — so the FE shows "—" (unknown).

**FE-side stopgap (PENDING — deferred):** map `scaleConfidence(0) → null` + complete the two
downstream guards (ForecastTable band `null → '—'`, ForecastMetrics avg `null → '—'`), mirroring the
existing `predictedRevenue: 0 → null` convention. NOT YET APPLIED: `forecast.ts` + the forecast
components had ACTIVE uncommitted Epic-113 WIP at the time of discovery (iter-98); applying the
stopgap then would have clobbered that work. To be applied by the Epic-113 owner or a follow-up tick
once the WIP commits.

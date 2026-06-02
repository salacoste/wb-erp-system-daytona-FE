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

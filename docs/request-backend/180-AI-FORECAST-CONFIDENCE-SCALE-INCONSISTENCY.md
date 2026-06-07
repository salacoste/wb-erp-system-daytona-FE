# Request #180 — AI Forecast: `confidence` scale inconsistency (DTO doc 0-100 vs engine 0-1)

**Originated by**: Frontend validation campaign (validation finding F-17), 2026-06-02
**Severity**: P2 — non-blocking; FE has a magnitude-detection normalizer absorbing it (`src/lib/api/ai/forecast.ts` `scaleConfidence`). Worth fixing for contract clarity + to let the FE drop the heuristic.
**Status**: RESOLVED (2026-06-06) — DTO now documents 0-1 scale; engines clamp to [0,1]; confidence scale consistent everywhere

---

## Problem

The `confidence` field on `GET /v1/ai/forecast` predictions has a **self-contradictory scale contract**:

- **DTO documents 0-100**: `src/ai/dto/prediction.dto.ts:16` —
  `@ApiProperty({ description: 'Prediction confidence (0-100)', example: 82.5 })`
- **Engine emits 0-1**: live `/v1/ai/forecast` returns `confidence: 0.797…` (cabinet `f75836f7…`, prophet engine). Confirmed in code: `prophet.adapter.ts` `calculateConfidence` clamps to `[0,1]`; `ai-forecast.service.ts:17` `BASELINE_FALLBACK_CONFIDENCE = 0.3` is also 0-1.

So the OpenAPI/Swagger contract says one thing (0-100, example 82.5) and every live engine emits another (0-1).

## Impact (frontend)

The FE normalizer originally trusted the DTO and divided by 100 → every confidence collapsed to ~0.8%, so **all forecasts rendered ~1% confidence + "low" band + near-full-height chart confidence bands**. Fixed FE-side (F-17) with a magnitude-detecting normalizer (`raw > 1 ? raw/100 : raw`, clamped) — but that heuristic is ambiguous at the exact boundary `confidence === 1` (a 0-100 value of 1% is indistinguishable from a 0-1 value of 100%).

## Requested fix (pick one, make it consistent)

1. **Preferred**: confirm + guarantee `confidence` is always **0-1** (probability) across ALL engines (prophet, mindsdb, baseline), and **fix the stale DTO doc** `prediction.dto.ts:16` → `'Prediction confidence (0-1)', example: 0.82`.
2. Alternatively: standardize on 0-100 everywhere (engines + DTO) — but 0-1 matches the existing engine clamps + fallback constant, so option 1 is lower-risk.

Once a single scale is guaranteed, the FE can drop the magnitude heuristic and use a plain clamp.

## Evidence

- Live: `confidence: 0.7973609232852678` (3/7 predictions all 0.78-0.80).
- `src/ai/dto/prediction.dto.ts:16` (DTO doc says 0-100).
- `src/ai/services/ai-forecast.service.ts:17` (`BASELINE_FALLBACK_CONFIDENCE = 0.3`).
- FE normalizer: `frontend/src/lib/api/ai/forecast.ts` `scaleConfidence`.

# Request #185 — AI admin models: MAPE placeholder + flat-vs-nested shape

**Originated by**: Frontend validation campaign (validation finding F-25), 2026-06-02
**Severity**: P3 — admin-only page (`/analytics/ai-admin/models`); MAPE column currently renders `—` for all models. That is conservatively-correct (the models ARE un-evaluated), so there's no user-facing wrong data today — but the contract has two issues worth fixing.
**Status**: PENDING BACKEND

---

## Problem

`GET /v1/ai/admin/models` model items have shape:
`{ id, cabinetId, modelType, status, version, trainedAt, currentMape }` — a **flat `currentMape`**.

Two issues:

### 1. Flat `currentMape` vs nested `metrics.mape` (contract mismatch)
The FE shares `normalizeAiModel` (used by `/v1/ai/models` too), which reads `raw.metrics?.mape`. The admin endpoint has no `metrics` object → the FE always reads `null` → MAPE column is `—` for every admin model. The two endpoints (`/ai/models` nested vs `/ai/admin/models` flat) expose MAPE differently.

### 2. `currentMape: 0` is a misleading placeholder, not a real 0% MAPE
Live: all 15 models return `currentMape: 0`. But the training engines **hardcode** `metrics: { mape: 0 }` at train time:
- `prophet.adapter.ts:136` — `metrics: { mape: 0, dataPoints: … }`
- `mindsdb.adapter.ts:95` — `metrics: { mape: 0, dataPoints: 0 }` // "MindsDB doesn't expose metrics via REST"

The real MAPE is computed later by shadow-eval (`ai-shadow-eval.service.ts`). So `currentMape: 0` means **"not yet evaluated"**, not "0% error". If a frontend surfaced `currentMape` naively it would render "0% MAPE" → implying perfect models when they're actually un-evaluated. `currentMape` is typed `number | null` (DTO line 76) — so it CAN be null.

## Why the FE did NOT patch this

Surfacing `currentMape` with the current 0-placeholder would render misleading "0%". The conservatively-correct display (`—`) is what ships today. A FE 0→null heuristic was rejected: unverifiable (no evaluated models in test data), and risky on a shared normalizer.

## Requested fix

1. Send `currentMape: null` (not `0`) for un-evaluated models — the engines should default to `null`, and shadow-eval fills the real value. Then `0` would only ever be a real (implausible) measured 0%.
2. Align the admin endpoint MAPE shape with `/v1/ai/models` (nested `metrics.mape`) OR confirm flat `currentMape` is canonical so the FE can read it directly once (1) is fixed.

Once (1)+(2) land, the FE reads `currentMape` (or `metrics.mape`) and renders real MAPE for evaluated models + `—` for null.

## Evidence
- Live: 15 admin models, all `currentMape: 0` (un-evaluated), no `metrics` object.
- `src/ai/dto/admin-model-health.dto.ts:75-76` (`currentMape!: number | null`, example 12.5).
- `src/ai/engines/{prophet,mindsdb}.adapter.ts` (mape:0 placeholder).
- FE: `frontend/src/lib/api/ai/models.ts` `normalizeAiModel` reads `raw.metrics?.mape`.

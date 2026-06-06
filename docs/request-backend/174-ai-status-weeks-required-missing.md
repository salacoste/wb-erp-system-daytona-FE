# 174 — AI Status: `weeksRequired` field missing from `/v1/ai/status` response

**Filed**: 2026-05-17
**Severity**: MEDIUM
**Affected endpoint**: `GET /v1/ai/status`
**Status**: RESOLVED (2026-06-06) — added `weeksRequired: number` to AiStatusDto + service response
**Discovered via**: Epic 108-FE Visual UAT (finding F-1, `docs/polish/epic-108-uat-findings-2026-05-17.md`)

---

## Problem

The `/v1/ai/status` response does not include the `weeksRequired` field. The frontend expects this
field to display the progress text "X из Y недель" (e.g. "2 из 12 недель") in the collecting-state
progress tracker. Without it, the denominator is absent and the display reads "2 из 0 недель",
which is logically impossible and confusing for users.

## Root Cause

The backend `AiController.getStatus()` response schema does not include `weeksRequired` in its
serialized output. The test-API contract in `test-api/99-ai.http` (§ 4, line 243–254) confirms
the omission — the documented response shape contains `weeksCollected`, `progressPct`,
`missingRequirements`, `estimatedActivationDate`, `skuCount`, `orderCount`, and `cogsCoveragePct`,
but NOT `weeksRequired`.

## Frontend workaround (applied)

`src/lib/api/ai/status.ts` normalizer now preserves `null` when the field is absent (instead of
coalescing to `0`). The component `CollectingProgressTracker.tsx` renders the collected count only
(with correct Russian plural) when `weeksRequired` is null or 0, and logs a `console.warn` in
DevTools to surface the contract gap.

## Fix Scope (backend)

Add `weeksRequired: number` to the `AiStatusResponseDto` (or equivalent serializer/DTO) for the
`GET /v1/ai/status` endpoint. The value should represent the total weeks of sales data required
before the AI transitions from `collecting` to `sneak_preview` or `ready` state. Typical value
based on Epic 108 spec: **12 weeks** for `ready`, **6 weeks** for `sneak_preview` threshold.

If the threshold is model-type-dependent, return the applicable threshold for the cabinet's
currently assigned model type.

## Expected response shape (after fix)

```json
{
  "readinessLevel": "collecting",
  "weeksCollected": 2,
  "weeksRequired": 12,
  "progressPct": 17,
  "skuCount": 5,
  "orderCount": 120,
  "cogsCoveragePct": 85.0,
  "missingRequirements": ["10 more weeks of sales data needed"],
  "estimatedActivationDate": "2026-07-26T00:00:00.000Z"
}
```

## Reproduction

1. Log in as `test@test.com` (cabinet: `Space Chemical`)
2. `GET /v1/ai/status` with valid `Authorization` + `X-Cabinet-Id` headers
3. Observe response — `weeksRequired` key is absent
4. Frontend collecting-state tracker shows "2 из 0 недель"

## Resolution

When backend adds `weeksRequired`, the frontend normalizer will automatically propagate it through
(no additional frontend change required — the `console.warn` will stop firing and the "X из Y"
display will activate).

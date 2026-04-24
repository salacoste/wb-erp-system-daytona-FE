# Request 167 — Pipeline Health: `errorRate` Out of Range (> 1)

**Date**: 2026-04-24
**Priority**: Low (defensive guard — not yet observed in production; anomaly indicator added as precaution)
**Source**: Epic 92-FE Story 92.5 code review (H-4 finding) — Defensive Frontend Principle
**Status**: ⚠️ Preventive — backend should validate before this fires

---

## Problem

The `GET /v1/monitoring/pipeline-health-grid` endpoint returns `errorRate` as a proportion (0–1) per the API contract (Epic 91.3-FE). However, the frontend defensive guard in `MonitorPipelineHealth.tsx` (AC-9, Story 92.5) checks for `errorRate > 1` and renders an amber AlertTriangle if the value is out of range.

If a bug in the backend calculation produces `errorRate > 1` (e.g., integer percentage sent instead of decimal proportion, or division miscalculation), the frontend will:
- Render an amber warning indicator next to the pipeline row.
- Log a `console.warn` with the pipeline ID and actual value.
- Display tooltip: "Аномалия: показатель errorRate вне диапазона 0-1. Возможна ошибка данных."

This ticket documents the expected contract and requests a backend-side validation to prevent the anomaly from reaching the frontend.

---

## Expected Contract

Per Epic 91.3-FE (`src/app/(dashboard)/monitoring/types/monitoring-grid.ts:59`):

```typescript
/** Error rate (proportion 0–1). Example: 0.15 means 15% error rate. */
errorRate: number
```

The field **must** be in the range `[0, 1]`. Values > 1 are impossible per the business definition (error rate cannot exceed 100%).

---

## Root Cause (Hypothesis)

Backend to confirm. Possible causes:
1. **Percentage vs proportion bug**: Backend computes `errorCount / totalCount * 100` and stores the percentage (e.g., `15`) rather than the proportion (`0.15`).
2. **Division error**: Edge case where `totalCount = 0` leads to a division-by-zero producing `Infinity` or `NaN`, which serializes unexpectedly.
3. **Aggregation overflow**: A multi-period aggregation sums partial error rates without re-normalizing.

---

## Impact

- Frontend shows an amber anomaly indicator on the affected pipeline row in the Monitor Dashboard (`/monitor` page).
- The `console.warn` is logged in the browser DevTools, visible during debugging.
- No data is hidden or corrupted — the Defensive Frontend Principle ensures raw values are preserved and displayed.

---

## Reproduction

If `errorRate > 1` is ever returned:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "X-Cabinet-Id: $CABINET_ID" \
     "http://localhost:3000/v1/monitoring/pipeline-health-grid?resolution=day&from=2026-04-23T00:00:00Z&to=2026-04-24T00:00:00Z" \
  | jq '.pipelines[] | select(.errorRate > 1) | {pipelineId, errorRate, tasksWithErrors, totalResultErrors}'
```

Expected: empty output (no pipelines with `errorRate > 1`).
If output is non-empty: backend bug confirmed.

---

## Fix Scope (Backend)

1. **Add validation**: In the pipeline-health-grid aggregation service, add an assertion that `errorRate = clamp(errorRate, 0, 1)` before serialization. Log a warning if clamping occurs.
2. **Add contract test**: Unit test that `errorRate` is always in `[0, 1]` for all pipeline aggregation scenarios, including edge cases (`totalCount = 0`, `errorCount > totalCount`).

---

## Frontend Mitigation (Story 92.5-FE)

- `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` renders an amber `AlertTriangle` indicator next to the pipeline row when `errorRate > 1`.
- `console.warn` logged with pipeline ID and actual value.
- Tooltip: "Аномалия: показатель errorRate вне диапазона 0-1. Возможна ошибка данных."
- Reference comment in source: `// PENDING BACKEND: request #167 — pipeline errorRate out of range (> 1)`

---

## Resolution

- [ ] Backend team confirms `errorRate` is always in `[0, 1]` (or identifies the bug)
- [ ] Backend-side validation/clamping deployed
- [ ] Frontend anomaly indicator can remain (harmless when not triggered) or be removed after confirmed fix

---

## References

- Frontend guard: `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` (PipelineRow function)
- Type definition: `src/app/(dashboard)/monitoring/types/monitoring-grid.ts:59`
- Story: `_bmad-output/implementation-artifacts/92-5-fe-monitor-buyout-pipeline-health.md` (AC-9, H-4 review finding)
- Defensive Frontend Principle: `CLAUDE.md` § Defensive Frontend Principle

# Request #201 — `/v1/monitoring/dashboard` pipeline objects omit `errorRate` / `tasksWithErrors` / `totalResultErrors`

**Originated by**: Frontend validation campaign (iter-89), 2026-06-03
**Severity**: P3 — the Overview tab's per-pipeline amber error badge (Story 91.3-FE) can never fire for any pipeline. No wrong data is shown (the badge is simply absent); the status badge + 24h success-rate bar still convey health. Worth fixing to light up the intended error-rate granularity.
**Status**: RESOLVED (2026-06-06) — backend already returns fields; FE normalizer + type updated to pass them through

---

## Problem

`GET /v1/monitoring/dashboard` returns `pipelines[]` objects with exactly these keys (LIVE-VERIFIED 2026-06-03, cabinet `f75836f7-…`):

```
pipelineId, displayName, category, status, lastSuccessAt,
dataLagMinutes, dataLagDisplay, nextExpectedAt, successRate24h
```

The three **error-rate fields are absent**: `errorRate`, `tasksWithErrors`, `totalResultErrors`.

These fields DO exist on the sibling endpoint `GET /v1/monitoring/pipeline-health-grid` (`GridPipeline` shape — all three present, e.g. `errorRate: 0`), which powers the Heatmap tab and the `/monitor` route. Only the lighter `/dashboard` summary omits them.

## Impact (frontend)

`PipelineStatusGrid` (Overview tab) renders an amber "X% errors" badge per pipeline card:

```ts
// PipelineStatusGrid.tsx (pre-fix)
const hasErrors = errorRate >= 0.01   // errorRate is undefined at runtime → undefined >= 0.01 → false
```

Because the field is absent, `hasErrors` was permanently `false` — the badge (and its tooltip `{tasksWithErrors} задач с ошибками ({totalResultErrors} ошибок всего)`) never rendered. The FE type `DashboardPipeline` declared all three as required `number`, masking the gap at compile time.

## FE side (done, iter-89)

- `DashboardPipeline.errorRate` / `tasksWithErrors` / `totalResultErrors` made **optional** (honest type).
- Guarded the comparison: `const hasErrors = (errorRate ?? 0) >= 0.01` (no more `undefined >= 0.01` footgun) and the tooltip counts (`?? 0`). The badge degrades to hidden until the fields arrive — at which point it will light up automatically.

## Requested fix

Add `errorRate` (0–1 proportion), `tasksWithErrors` (count), `totalResultErrors` (count) to each `pipelines[]` item in the `/v1/monitoring/dashboard` response — the same values already computed for `pipeline-health-grid`. Then the Overview error badge works with no further FE change.

## Evidence

- Live: `/v1/monitoring/dashboard` `pipelines[0]` keys (above) — no error fields; `/v1/monitoring/pipeline-health-grid` items DO include `errorRate`/`tasksWithErrors`/`totalResultErrors`.
- FE: `frontend/src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:81-96` (destructure + `hasErrors`); `frontend/src/app/(dashboard)/monitoring/types/monitoring-enums.ts:35-47` (`DashboardPipeline`).
- Related: Request #167 (pipeline-health error-rate out-of-range — the grid endpoint's `errorRate`).

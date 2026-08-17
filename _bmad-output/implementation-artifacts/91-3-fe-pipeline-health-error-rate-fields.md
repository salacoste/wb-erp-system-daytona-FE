# Story 91.3-FE: Pipeline Health Error Rate Fields

Status: done

## Story

**As a** seller reviewing pipeline health on the monitoring page,
**I want** to see `errorRate` alongside `successRate` for each pipeline,
**so that** I can distinguish between "all tasks succeeded" (healthy) and "all tasks completed but some had errors" (warning).

**Epic**: 91-FE Backend Contract Updates (Epics 89-93 Integration)
**Priority**: P3
**Estimate**: 2 story points
**Closes Epic 91-FE** (3rd and final story)

---

## Problem Statement

Backend Epics 89-93 added 3 new fields to each pipeline in `GET /v1/monitoring/pipeline-health-grid`:

| Field | Type | Description |
|---|---|---|
| `errorRate` | `number` (0-1) | Proportion of completed tasks with errors |
| `tasksWithErrors` | `number` | Count of tasks with errors |
| `totalResultErrors` | `number` | Total error count across those tasks |

**Business logic**: A pipeline with `successRate: 1.0` but `errorRate > 0.1` should show `warning` status — all tasks completed, but many had non-fatal errors worth investigating.

Currently `PipelineStatusGrid.tsx` shows only `successRate24h` as a percentage + mini progress bar. The new fields add an "error layer" that distinguishes clean success from noisy success.

---

## Acceptance Criteria

### AC-1: Add new fields to types

- [ ] `src/app/(dashboard)/monitoring/types/monitoring-grid.ts` — add `errorRate: number`, `tasksWithErrors: number`, `totalResultErrors: number` to `GridPipeline` interface (line ~54).
- [ ] Also add to `DashboardPipeline` in `monitoring-enums.ts` if it's a separate type used by `PipelineStatusGrid`.

### AC-2: Display errorRate in PipelineStatusGrid

- [ ] `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx` — in `PipelineCard`, when `errorRate > 0`:
  - Show an amber badge or indicator next to the success rate.
  - Add a tooltip: "X задач завершились с ошибками (Y ошибок всего)" using `tasksWithErrors` and `totalResultErrors`.
- [ ] When `errorRate === 0`, show nothing extra (clean success).

### AC-3: Display errorRate in PipelineHeatmap (if applicable)

- [ ] `src/app/(dashboard)/monitoring/components/PipelineHeatmap.tsx` — if the heatmap summary shows `successRate`, also show `errorRate` when > 0 as a secondary metric.

### AC-4: Tests + validation

- [ ] Unit test for the error-rate display logic (render with errorRate > 0 → tooltip visible; errorRate === 0 → no extra badge).
- [ ] `npm run type-check && npm run lint` clean.
- [ ] `npm test -- --run` — 6792+ tests pass, zero regressions.

---

## Tasks / Subtasks

### Task 1: Add types (AC-1)
- [ ] 1.1: Add 3 fields to `GridPipeline` in `monitoring-grid.ts`.
- [ ] 1.2: Add 3 fields to `DashboardPipeline` in `monitoring-enums.ts` (if separate).
- [ ] 1.3: Type-check — verify no downstream breakage.

### Task 2: PipelineStatusGrid UI (AC-2)
- [ ] 2.1: In `PipelineCard`, destructure `errorRate`, `tasksWithErrors`, `totalResultErrors`.
- [ ] 2.2: Add conditional amber indicator when `errorRate > 0`.
- [ ] 2.3: Add tooltip with task/error counts.

### Task 3: PipelineHeatmap (AC-3)
- [ ] 3.1: Check if heatmap shows pipeline-level metrics. If yes, add errorRate.

### Task 4: Tests (AC-4)
- [ ] 4.1: Unit test for PipelineCard with errorRate > 0.
- [ ] 4.2: Unit test for PipelineCard with errorRate === 0.
- [ ] 4.3: Full regression.

---

## Dev Notes

### Where the types live

Pipeline types are split across two files in `src/app/(dashboard)/monitoring/types/`:
- `monitoring-enums.ts` — `DashboardPipeline` (used by PipelineStatusGrid for the dashboard overview)
- `monitoring-grid.ts` — `GridPipeline` (used by PipelineHeatmap for the detailed grid view)

Both need the 3 new fields.

### UI pattern for error indicator

```tsx
{pipeline.errorRate > 0 && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {Math.round(pipeline.errorRate * 100)}% ошибок
      </Badge>
    </TooltipTrigger>
    <TooltipContent>
      <p>{pipeline.tasksWithErrors} задач с ошибками ({pipeline.totalResultErrors} ошибок всего)</p>
    </TooltipContent>
  </Tooltip>
)}
```

### File-size budget

- `PipelineStatusGrid.tsx` — check current size. The PipelineCard function may need the errorRate logic (5-10 lines).
- `monitoring-grid.ts` — 3 lines added.
- `monitoring-enums.ts` — 3 lines added.

### Backlog ref

Backlog task-22 tracks this. Mark as Done when story completes.

---

## References

- Backlog doc-2 section 4 — pipeline health new fields
- Backlog task-22 — original tracking task
- `src/app/(dashboard)/monitoring/types/monitoring-grid.ts:45-60` — GridPipeline interface
- `src/app/(dashboard)/monitoring/types/monitoring-enums.ts:42` — successRate24h field
- `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:94-137` — PipelineCard component
- `src/app/(dashboard)/monitoring/components/PipelineHeatmap.tsx:74` — heatmap summary

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List

### Change Log

| Date | Change |
|---|---|
| 2026-04-21 | Story created. Closes Epic 91-FE (3/3). Add 3 error-rate fields to 2 type files + conditional amber indicator in PipelineStatusGrid + optional heatmap enhancement. Backlog task-22. |

---
id: task-22
title: >-
  Pipeline Health: integrate 3 new fields (errorRate, tasksWithErrors,
  totalResultErrors)
status: Done
assignee: []
created_date: '2026-04-19 15:36'
updated_date: '2026-04-21 11:43'
labels:
  - pipeline-health
  - new-field
  - backend-epics-89-93
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend Epics 89-93: Pipeline health grid now returns 3 new fields per pipeline:

- `errorRate: number` — 0-1, proportion of completed tasks with errors
- `tasksWithErrors: number` — count of such tasks
- `totalResultErrors: number` — total error count

**Logic:** Pipeline with `successRate: 1.0` but `errorRate > 0.1` gets `warning` status.

**Frontend action:**
- Show `errorRate` alongside `successRate` in monitoring/pipeline-health UI when `errorRate > 0`
- Tooltip: "X задач завершились с ошибками (Y ошибок всего)"
- Update pipeline health types in frontend

**Endpoint:** `GET /v1/monitoring/pipeline-health-grid?cabinetId=<uuid>`

This also affects task-20 (Monitor Dashboard Block 5) — the pipeline health block should show error rates.

Source: Backend Epics 89-93, doc-2 section 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PipelineHealthData type includes errorRate, tasksWithErrors, totalResultErrors
- [ ] #2 errorRate shown when > 0 in pipeline health UI
- [ ] #3 Tooltip shows task/error counts
- [ ] #4 Warning status badge for successRate=1 + errorRate>0.1
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed via Story 91.3-FE (2026-04-21). Added errorRate, tasksWithErrors, totalResultErrors to GridPipeline + DashboardPipeline types. Amber error badge + tooltip in PipelineStatusGrid when errorRate > 0. Type-check + lint clean, 6792 tests pass.
<!-- SECTION:NOTES:END -->

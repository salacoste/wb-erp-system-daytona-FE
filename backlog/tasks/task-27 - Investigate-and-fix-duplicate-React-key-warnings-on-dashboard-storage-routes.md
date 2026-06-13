---
id: task-27
title: Investigate and fix duplicate React key warnings on dashboard/storage routes
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-13 00:50'
labels:
  - qa-audit
  - react
  - frontend
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA browser console capture found repeated React duplicate-key warnings with an empty key on `/dashboard` and `/analytics/storage`, plus an internal React static-flag warning on dashboard. These warnings indicate unstable list identity and can cause omitted/duplicated UI nodes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Loading `/dashboard` produces no React duplicate-key warnings and no `Expected static flag was missing` React console error.
- [x] #2 Loading `/analytics/storage` produces no React duplicate-key warnings.
- [x] #3 The root list/component sources are identified and covered by targeted regression tests or console-clean E2E checks.
- [x] #4 The fix does not hide warnings by muting console output.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Resolved 2026-06-13: `/dashboard` now has no duplicate-key warnings and no `Expected static flag was missing` console error in live browser probe `/tmp/ug-task27-dashboard-probe.json` (`consoleEvents: []`, `pageErrors: []`, `failedRequests: []`). Root causes fixed without muting console output:

- Static-flag warning: `DashboardMetricsGridCards` is now a real child component instead of invoking a hook-using render helper conditionally from `DashboardMetricsGrid`; targeted regression in `MetricsGrid.test.tsx` covers loading→loaded React identity warnings.
- Duplicate empty-key warnings: dashboard `StorageTopConsumersWidget` now uses a composite row key fallback when backend-normalized `nm_id` is blank; targeted regression in `StorageTopConsumersWidget.test.tsx` covers multiple blank `nm_id` rows without duplicate-key warnings.
- `/analytics/storage` was already clean in prior evidence `/tmp/task23-30-browser-sweep.json` after PR #7; this task completes the remaining `/dashboard` acceptance criteria.

Verification evidence:

- `npm test -- --run src/components/custom/dashboard/__tests__/StorageTopConsumersWidget.test.tsx src/components/custom/dashboard/__tests__/epic65/MetricsGrid.test.tsx` — PASS, 83 tests.
- `npm test -- --run src/components/custom/dashboard/__tests__/StorageTopConsumersWidget.test.tsx src/components/custom/dashboard/__tests__/epic65/MetricsGrid.test.tsx src/hooks/__tests__/useProcessingStatus.test.ts` — PASS, 3 files / 90 tests including the task-24 partial frontend hook assertion.
- `/tmp/ug-task27-dashboard-probe.json` — PASS, `/dashboard` browser console has no React static-flag or duplicate-key events.
<!-- SECTION:NOTES:END -->

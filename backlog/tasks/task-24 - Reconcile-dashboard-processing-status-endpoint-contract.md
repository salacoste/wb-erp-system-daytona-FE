---
id: task-24
title: Reconcile dashboard processing-status endpoint contract
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-13 05:17'
labels:
  - qa-audit
  - backend-contract
  - dashboard
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA audit found that dashboard loads call `/v1/imports/historical?limit=5`, which currently returns 404 from the backend and surfaces console errors/warnings in `useProcessingStatus`. Decide whether to restore that endpoint or update the frontend to the supported backend path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Loading `/dashboard` does not produce a 404 for historical import/processing status data.
- [x] #2 The dashboard processing-status UI shows a valid empty/success/error state without console errors.
- [x] #3 Frontend API client and backend route contract are documented or covered by an integration/unit test.
- [x] #4 The fix preserves cabinet-scoped authorization semantics.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed 2026-06-13 via backend PR https://github.com/salacoste/wb-erp-system-daytona/pull/6 and frontend backlog reconciliation PR (this branch). Evidence:

- Backend route order fixed in clean backend branch `codex/fix-task24-historical-import-route-order` commit `bb8ea1b3`: `HistoricalImportController` is registered before generic `ImportsController @Get(':id')` in `src/imports/imports.module.ts`, preventing `/v1/imports/historical?limit=5` from being shadowed as an import id.
- Regression coverage added: `src/imports/controllers/__tests__/historical-route-order.spec.ts`.
- PASS: `npm test -- --runInBand src/imports/controllers/__tests__/historical-route-order.spec.ts` (3 tests).
- PASS: `npx eslint src/imports/imports.module.ts src/imports/controllers/__tests__/historical-route-order.spec.ts`.
- PASS: clean-backend live API probe `/tmp/task24-live-api-probe.json` against `/tmp/wb-backend-task24-clean` served on `localhost:3002`: valid auth + `X-Cabinet-Id` returned 200 (not 404), missing cabinet returned 400, missing auth returned 401.
- PASS: clean dashboard probe `/tmp/task24-clean-dashboard-probe.json` using `/tmp/wb-fe-task24-clean` at FE `04536d42` against clean patched backend on `localhost:3002`: `/v1/imports/historical?limit=5` returned 200, no console/page/request failures, no processing-status 404/warning.

Known unrelated backend baseline: `npm run type-check` on backend `origin/main` currently reports existing bigint-related errors outside the task-24 changed files; task-24 focused regression/lint/live probes passed.
<!-- SECTION:NOTES:END -->

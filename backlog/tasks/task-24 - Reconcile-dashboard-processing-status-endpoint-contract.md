---
id: task-24
title: Reconcile dashboard processing-status endpoint contract
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-18 01:22'
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
Reconciled 2026-06-13: remains open in the frontend repo. PR #7 did not change `src/hooks/useProcessingStatus.ts` or backend route precedence for `/v1/imports/historical?limit=5`; current frontend still calls that endpoint and prior browser evidence `/tmp/task23-30-browser-sweep.json` did not prove dashboard processing-status 404 is resolved. Keep To Do until backend/frontend contract is fixed and verified with cabinet-scoped route/API evidence.

Follow-up audit 2026-06-13: a local closure attempt cited backend regression coverage at `src/imports/controllers/__tests__/historical-route-order.spec.ts`, but that file is not present in this frontend repository. The added frontend hook assertion can prove only that `useProcessingStatus` calls `/v1/imports/historical?limit=5` and handles a successful empty response without logging warnings; it does not prove the backend route no longer returns 404 in the real dashboard flow. Task remains open.

2026-06-16 follow-up after task-31/G004: backend PR #7 is CLEAN/MERGEABLE at 803ccfcf with CI/E2E green and G004 checkpoint complete. Safe temp combined worktree `/tmp/wb-backend-task24-after-pr7` merged PR #7 then PR #6; only conflict was `src/imports/controllers/__tests__/historical-route-order.spec.ts` add/add between PR #7 reflective route-order test and PR #6 source-text route-order test. Resolving by keeping PR #7 reflective test passed `npm test -- --runInBand --forceExit src/imports/controllers/__tests__/historical-route-order.spec.ts` (3/3), `npm run check:circular --silent` (18 baseline/current, no new cycles), and `npm run type-check --silent` (0 baseline/current). Next required external step: merge PR #7, then rebase/update PR #6 and rerun full CI/live dashboard/API probes before marking task-24 Done.

2026-06-16 closure evidence on current main after backend PR #7 merge: PR #7 merged at `eab0ae849946efe19c8484bf27812e0297c86616`; backend main contains `HistoricalImportController` before `ImportsController` and `src/imports/controllers/__tests__/historical-route-order.spec.ts`. Local current-main verification in `/tmp/wb-backend-main-after-pr7`: `npm test -- --runInBand --forceExit src/imports/controllers/__tests__/historical-route-order.spec.ts` PASS (3/3), `npm run check:circular --silent` PASS (18 baseline/current), `npm run type-check --silent` PASS (0 errors). Live API probe `/tmp/task24-main-live-api-probe.json` against `localhost:3000`: valid auth + `X-Cabinet-Id` returned 200 with `{batches,total}` shape; missing `X-Cabinet-Id` returned 400; missing auth returned 401. Dashboard browser probe `/tmp/task24-main-dashboard-probe.json` against frontend `localhost:3100` and backend `localhost:3000`: h1 `Главная страница`, no console events, no page errors, no failed requests, `/v1/imports/historical?limit=5` returned 200, `hasProcessingStatus404=false`, `hasProcessingStatusWarning=false`. PR #6 closed without separate merge because the route fix is present in main via PR #7 merge; FE PR #10 remains documentation/status follow-up, not a blocker for task-24 acceptance.

2026-06-16 closure evidence after PR #7 merge: backend main now contains route-order fix and regression coverage (`src/imports/imports.module.ts`, `src/imports/controllers/__tests__/historical-route-order.spec.ts`, introduced on main before/at `348ac366` and preserved through `eab0ae84`). Local task24 worktree `/tmp/wb-backend-task24-clean` rebased/synced to `origin/main`; PR #6 branch became identical to `main` and GitHub closed PR #6 as empty/no-op after force sync. Verification: `npm test -- --runTestsByPath src/imports/controllers/__tests__/historical-route-order.spec.ts --runInBand --forceExit --coverage=false` PASS (3/3); `npm run type-check` PASS (0 baseline/current); `npm run check:circular` PASS (18 baseline/current). Live API probe on backend `:3000`/`:3001`: authenticated `GET /v1/imports/historical?limit=5` with `X-Cabinet-Id` returned 200 with `batches` array; same authenticated request without `X-Cabinet-Id` returned 400, preserving cabinet-scoped authorization semantics. Browser probe on current frontend `http://localhost:3100/dashboard?week=2026-W24&type=week`: h1 `Главная страница`, `GET http://localhost:3000/v1/imports/historical?limit=5` returned 200, zero post-auth console errors/warnings, no historical/processing-status 404s.

2026-06-18 local validation before doc-only closure commit: backend route contract regression `npm test -- --runInBand --forceExit src/imports/controllers/__tests__/historical-route-order.spec.ts` PASS (3/3), confirming `GET /v1/imports/historical?limit=5` stays cabinet-scoped and before the generic `:id` route. Frontend hook contract `cd frontend && npm test -- --run src/hooks/__tests__/useProcessingStatus.test.ts` PASS (7/7), confirming the dashboard processing-status client calls `/v1/imports/historical?limit=5` and handles empty/success/error states without warning spam. No product files are changed in this frontend status slice; it records the already-merged backend contract fix and verification evidence.

<!-- SECTION:NOTES:END -->

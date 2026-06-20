---
id: task-44
title: >-
  Triage operations validation batch failures for backfill FBS shipments and
  supplies flows
status: Done
assignee:
  - codex
created_date: '2026-06-16 17:56'
updated_date: '2026-06-18 02:35'
labels:
  - validation
  - triage
  - operations
  - e2e
  - a11y
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operations validation sweep over shipments/supplies/FBS/alerts/backfill found 29 failures out of 259 tests. Clusters observed: backfill smoke route/redirect/sidebar expectations; backfill a11y color contrast and scrollable-region-focusable violations; FBS enhanced missing expected fbs-funnel-svg in populated mock data and FBS export readiness issue; shipments-page smoke state selector mismatch; supplies modal ARIA issue; supplies list/detail/lifecycle stale or ambiguous selectors and URL/state assertions under current UI behavior. This task tracks triage and fixes by cluster.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each failing cluster is classified as product bug, backend/data issue, or stale/flaky E2E expectation.
- [x] #2 Real UI/a11y defects are fixed or split into follow-up tasks with evidence.
- [x] #3 Stale/flaky E2E selectors are corrected to current accessible UI behavior.
- [x] #4 Relevant targeted tests pass after each cluster fix.
- [x] #5 Backlog and OMX state include evidence for all fixed/skipped/follow-up outcomes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed operations validation batch triage/fix pass. Classified clusters and fixed real UI/a11y/functional defects, while correcting stale/flaky E2E expectations to current accessible UI behavior. Real product fixes included backfill contrast/scrollable table/dialog aria-modal, supply detail action wiring, invalid client directives in newly imported hooks, supply status badge accessibility/testability, and shipments loading state accessibility. Stale E2E updates covered backfill races, FBS current funnel/export behavior, supplies selectors/sort/pagination/detail/lifecycle expectations, and shipments empty/loading state assertions.

Classification summary: (1) product/a11y bugs fixed: backfill `not_started` contrast, shared table scrollable wrapper focusability, shared dialog `aria-modal`, shipments accessible loading state, supply status badge aria/test id. (2) product functional gap fixed: `/supplies/[id]` action buttons now open existing order picker/close/sticker flows (task-45 completed). (3) stale/flaky E2E expectations corrected: backfill page/sidebar waits, FBS enhanced old SVG expectation -> current conversion cards, FBS stock export mock filename, supplies accessible selectors/dialog-scoped submit/API mocks/sort/page assertions, supply detail selector/mobile scroll, supply lifecycle data-dependent skips, shipments table/empty/loading state smoke.

Evidence 2026-06-16 targeted: backfill-page 4 passed; settings/backfill-a11y 24 passed; fbs-enhanced populated section targeted passed; fbs-stock export targeted passed; shipments-page + shipments-list 13 passed / 16 skipped; supplies-list 28 passed; supply-detail + supply-lifecycle 41 passed / 3 skipped.

Evidence 2026-06-16 final operations smoke: `npx playwright test e2e/shipments-page.spec.ts e2e/shipments/shipments-a11y.spec.ts e2e/shipments/shipments-list.spec.ts e2e/shipments/shipments-detail.spec.ts e2e/shipments/shipments-lifecycle.spec.ts e2e/supplies-page.spec.ts e2e/supplies/supplies-a11y.spec.ts e2e/supplies/supplies-list.spec.ts e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts e2e/fbs-enhanced.spec.ts e2e/fbs-stock.spec.ts e2e/alerts-page.spec.ts e2e/backfill-page.spec.ts e2e/settings/backfill-a11y.spec.ts e2e/settings/backfill-admin.spec.ts --project=chromium --no-deps --reporter=line` => 196 passed, 63 skipped, 0 failed. Initial baseline for this batch was 165 passed, 61 skipped, 29 failed, 4 did not run; intermediate after first fixes was 175 passed, 60 skipped, 20 failed, 4 did not run.

Static evidence 2026-06-16: targeted ESLint on changed product/test files passed with `--max-warnings=0 --no-warn-ignored`; `npm run type-check` passed with 0 errors.


Evidence 2026-06-18: targeted source/unit/E2E ESLint passed with `--max-warnings=0` for task-44 source files, settings unit tests, and focused operations specs including backfill/settings a11y.

Evidence 2026-06-18: `npm run type-check` passed with 0 TypeScript errors.

Evidence 2026-06-18: `npm test -- --run src/components/custom/settings/__tests__/CabinetInfoCard.test.tsx src/components/custom/settings/__tests__/JamStatusBadge.test.tsx src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsEnhancedPageContent.test.tsx` => 3 files passed, 3 tests passed. FBS page coverage explicitly verifies the delayed-loading retry alert and `refetch` action.

Evidence 2026-06-18: focused operations Playwright `npx playwright test e2e/fbs-enhanced.spec.ts e2e/fbs-stock.spec.ts e2e/shipments-page.spec.ts e2e/shipments/shipments-list.spec.ts e2e/shipments/shipments-lifecycle.spec.ts e2e/supplies/supplies-list.spec.ts e2e/backfill-page.spec.ts e2e/settings/backfill-a11y.spec.ts --project=chromium --no-deps --reporter=line` => 70 passed, 16 skipped, 0 failed. The 16 skips were conditional data/UI skips in `shipments-list.spec.ts`: no shipments table/data, status filter not available, no pagination data/next page/rows-per-page selector, and create button not visible. `@mutating` shipment lifecycle tests are excluded by the default Playwright `grepInvert` mutation guard unless explicit sandbox mutation env is set, so they are not counted as product validation in this run.


Code review follow-up 2026-06-18: addressed review findings before amending task-44. Shared table scrollability is now opt-in (`scrollContainerTabIndex`/`scrollContainerAriaLabel`) and only the backfill status table opts into the keyboard-focusable scroll region. Shared dialog no longer hardcodes `aria-modal`; Radix Dialog owns modal semantics. Supplies sort E2E now asserts actual order changes and URL state, which exposed and fixed a real sort toggle bug in `useSuppliesPageState`.

Review-fix validation 2026-06-18: targeted supplies list `npx eslint e2e/supplies/supplies-list.spec.ts --max-warnings=0 --no-warn-ignored && npx playwright test e2e/supplies/supplies-list.spec.ts --project=chromium --no-deps --reporter=line` => 22 passed, 0 failed. Targeted task-44 static/unit validation rerun passed: source/E2E ESLint, `npm run type-check`, and settings/FBS unit tests (3 files, 3 tests). Focused task-44 Playwright suite rerun after review fixes => 70 passed, 16 skipped, 0 failed.

Scope note 2026-06-18: task-45 functional supply detail wiring was already committed separately as `6ec65209`; this task-44 commit references it as prior dependency evidence only and does not include task-45 files.
<!-- SECTION:NOTES:END -->

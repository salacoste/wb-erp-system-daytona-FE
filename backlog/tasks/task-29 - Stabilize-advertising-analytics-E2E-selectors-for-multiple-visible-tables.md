---
id: task-29
title: Stabilize advertising analytics E2E selectors for multiple visible tables
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-12 23:06'
labels:
  - qa-audit
  - e2e
  - advertising
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA targeted E2E found `e2e/advertising-analytics-epic-36.spec.ts` fails because `page.locator('table')` now matches both the cannibalization-risk table and the main advertising table. Manual browser verification shows `Всего продаж` and `Общий ROAS` are present, so this is test-selector drift rather than a confirmed product defect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Advertising Epic 36 regression test scopes the intended table by accessible name, column headers, test id, or containing section.
- [x] #2 The test passes when both risk and main data tables are visible.
- [x] #3 The test still verifies Epic 33 summary cards and sorting behavior.
- [x] #4 No product UI changes are required unless accessibility labels are missing for table disambiguation.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (4bdeb984/5fc4958a). Evidence: `e2e/advertising-analytics-epic-36.spec.ts` selectors were scoped to the intended advertising table/section while preserving summary-card and sorting assertions; `npx playwright test e2e/advertising-analytics-epic-36.spec.ts --project=chromium --no-deps` passed 5/5 in pre-merge verification, and post-merge CI run 27437914159 passed. No product UI change was needed beyond existing labels/testability.
<!-- SECTION:NOTES:END -->

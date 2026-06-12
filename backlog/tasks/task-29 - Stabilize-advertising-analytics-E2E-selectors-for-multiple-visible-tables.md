---
id: task-29
title: Stabilize advertising analytics E2E selectors for multiple visible tables
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
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
- [ ] #1 Advertising Epic 36 regression test scopes the intended table by accessible name, column headers, test id, or containing section.
- [ ] #2 The test passes when both risk and main data tables are visible.
- [ ] #3 The test still verifies Epic 33 summary cards and sorting behavior.
- [ ] #4 No product UI changes are required unless accessibility labels are missing for table disambiguation.
<!-- AC:END -->

---
id: task-27
title: Investigate and fix duplicate React key warnings on dashboard/storage routes
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
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
- [ ] #1 Loading `/dashboard` produces no React duplicate-key warnings and no `Expected static flag was missing` React console error.
- [ ] #2 Loading `/analytics/storage` produces no React duplicate-key warnings.
- [ ] #3 The root list/component sources are identified and covered by targeted regression tests or console-clean E2E checks.
- [ ] #4 The fix does not hide warnings by muting console output.
<!-- AC:END -->

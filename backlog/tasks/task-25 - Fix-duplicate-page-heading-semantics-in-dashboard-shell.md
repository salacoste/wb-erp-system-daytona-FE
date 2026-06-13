---
id: task-25
title: Fix duplicate page heading semantics in dashboard shell
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-12 23:06'
labels:
  - qa-audit
  - a11y
  - frontend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA route sweep found two H1 headings on every authenticated dashboard route: the top navbar renders `Dashboard` as `<h1>`, and each page renders its own H1. This weakens accessibility and automated heading checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Authenticated app shell no longer renders the navbar `Dashboard` label as an H1 landmark.
- [x] #2 Each audited dashboard route has exactly one page-specific H1 heading.
- [x] #3 Existing visual styling of the top navbar is preserved.
- [x] #4 A route or component regression test covers heading hierarchy for at least representative dashboard and analytics pages.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (4bdeb984/5fc4958a). Evidence: `src/components/custom/Navbar.tsx` renders the Dashboard label as a styled `div`, not H1; `src/components/custom/Navbar.test.tsx` asserts no navbar H1. Browser sweep `/tmp/task23-30-browser-sweep.json` showed representative routes with page-specific H1 values; focused tests `/tmp/task23-30-focused-tests2.log` passed including Navbar and settings/page tests.
<!-- SECTION:NOTES:END -->

---
id: task-25
title: Fix duplicate page heading semantics in dashboard shell
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
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
- [ ] #1 Authenticated app shell no longer renders the navbar `Dashboard` label as an H1 landmark.
- [ ] #2 Each audited dashboard route has exactly one page-specific H1 heading.
- [ ] #3 Existing visual styling of the top navbar is preserved.
- [ ] #4 A route or component regression test covers heading hierarchy for at least representative dashboard and analytics pages.
<!-- AC:END -->

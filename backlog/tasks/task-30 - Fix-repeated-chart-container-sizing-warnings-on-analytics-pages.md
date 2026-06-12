---
id: task-30
title: Fix repeated chart container sizing warnings on analytics pages
status: To Do
assignee: []
created_date: '2026-06-12 13:09'
labels:
  - qa-audit
  - charts
  - frontend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA route sweep found repeated Recharts warnings on `/analytics/advertising`, `/analytics/buyout`, `/analytics/returns`, and `/analytics/unit-economics`: chart width/height are `-1` and should be greater than 0. Pages render, but this indicates unstable chart container sizing and creates noisy browser console output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Audited analytics chart pages do not emit Recharts width/height `-1` warnings during normal desktop route load.
- [ ] #2 Charts preserve responsive behavior and do not visually collapse while data is loading or after data renders.
- [ ] #3 A representative browser or component regression test covers at least one affected chart container.
- [ ] #4 The fix avoids muting console warnings without correcting the sizing condition.
<!-- AC:END -->

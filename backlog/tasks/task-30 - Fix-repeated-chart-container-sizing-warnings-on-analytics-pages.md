---
id: task-30
title: Fix repeated chart container sizing warnings on analytics pages
status: Done
assignee: []
created_date: '2026-06-12 13:09'
updated_date: '2026-06-12 23:06'
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
- [x] #1 Audited analytics chart pages do not emit Recharts width/height `-1` warnings during normal desktop route load.
- [x] #2 Charts preserve responsive behavior and do not visually collapse while data is loading or after data renders.
- [x] #3 A representative browser or component regression test covers at least one affected chart container.
- [x] #4 The fix avoids muting console warnings without correcting the sizing condition.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (4bdeb984/5fc4958a). Evidence: reusable `src/components/custom/analytics/ResponsiveChartFrame.tsx` guarantees positive chart frame sizing and was applied to affected advertising/buyout/returns/unit-economics charts; `src/components/custom/analytics/ResponsiveChartFrame.test.tsx` covers the frame. Browser sweep `/tmp/task23-30-browser-sweep.json` showed affected chart pages loaded without Recharts `width/height=-1` console issues; focused tests `/tmp/task23-30-focused-tests2.log` and post-merge CI passed.
<!-- SECTION:NOTES:END -->

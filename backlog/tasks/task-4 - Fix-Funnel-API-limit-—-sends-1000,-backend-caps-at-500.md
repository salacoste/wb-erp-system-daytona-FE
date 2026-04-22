---
id: task-4
title: 'Fix Funnel API limit — sends 1000, backend caps at 500'
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - bug
  - P1
  - funnel
  - api
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
/analytics/funnel sends limit=1000 to GET /v1/analytics/funnel.
Backend returns 400: "limit must not be greater than 500".
Table still renders (44 rows) but console error present.
Fix: Change limit to 500 in funnel hook/API call.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.1-FE commit e46151b — FunnelProductFilter now uses limit=500 matching backend cap
<!-- SECTION:NOTES:END -->

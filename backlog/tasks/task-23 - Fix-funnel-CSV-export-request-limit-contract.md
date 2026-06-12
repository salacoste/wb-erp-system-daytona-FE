---
id: task-23
title: Fix funnel CSV export request limit contract
status: To Do
assignee: []
created_date: '2026-06-12 13:01'
labels:
  - qa-audit
  - frontend
  - backend-contract
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA audit found that loading `/analytics/funnel` triggers a failing export-data request to `/v1/analytics/funnel?...&limit=10000`, while the backend rejects limits greater than 500. This creates console/API errors and can leave CSV export data incomplete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Opening `/analytics/funnel` does not issue any `/v1/analytics/funnel` request with `limit` greater than the backend maximum.
- [ ] #2 CSV export still includes all intended funnel rows by using supported pagination or another backend-supported export path.
- [ ] #3 Browser console and network logs for `/analytics/funnel` have no 400 response caused by the export-data fetch.
- [ ] #4 A regression test covers the backend max-limit contract for funnel export data.
<!-- AC:END -->

---
id: task-23
title: Fix funnel CSV export request limit contract
status: Done
assignee: []
created_date: '2026-06-12 13:01'
updated_date: '2026-06-12 23:05'
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
- [x] #1 Opening `/analytics/funnel` does not issue any `/v1/analytics/funnel` request with `limit` greater than the backend maximum.
- [x] #2 CSV export still includes all intended funnel rows by using supported pagination or another backend-supported export path.
- [x] #3 Browser console and network logs for `/analytics/funnel` have no 400 response caused by the export-data fetch.
- [x] #4 A regression test covers the backend max-limit contract for funnel export data.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (merge commit 4bdeb984, implementation commit 5fc4958a). Evidence: `src/lib/api/funnel-export.ts` uses `FUNNEL_EXPORT_PAGE_SIZE = 500` and paginates; `src/app/(dashboard)/analytics/funnel/components/__tests__/useFunnelExportData.test.ts` asserts requests use limit 500 and aggregate rows. Browser sweep `/tmp/task23-30-browser-sweep.json` shows `/analytics/funnel` loaded with no console/network issues; focused tests `/tmp/task23-30-focused-tests2.log` passed 21 files / 231 tests; typecheck/lint logs clean except existing single warning.
<!-- SECTION:NOTES:END -->

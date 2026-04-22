---
id: task-2
title: Fix Backfill Admin page crash — client-side exception
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - bug
  - P0
  - backfill
  - settings
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
/settings/backfill shows "Application error: a client-side exception has occurred".
Backend API (/v1/admin/backfill/status) returns valid data.
Need to reproduce with dev tools open to capture stack trace.
Possibly rendering error in BackfillStatusTable or useAuth interaction.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in commits 12b697d + 33b0561 — added 'not_started' BackfillStatus, normalizer for camelCase→snake_case backend response, runtime validation via toBackfillStatus/toDataSource
<!-- SECTION:NOTES:END -->

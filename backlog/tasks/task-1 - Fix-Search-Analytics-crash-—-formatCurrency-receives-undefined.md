---
id: task-1
title: Fix Search Analytics crash — formatCurrency receives undefined
status: Done
assignee: []
created_date: '2026-04-12 23:36'
updated_date: '2026-04-14 01:24'
labels:
  - bug
  - P0
  - search-analytics
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SearchOrdersTab.tsx:29 — TypeError: Cannot read properties of undefined (reading toLocaleString).
formatCurrency receives undefined instead of a number. Page completely fails to render.
Fix: Add null guard: value?.toLocaleString() ?? "—"
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.1-FE commit 12b697d — SearchOrdersTab + SearchOrdersTable format functions now handle null/undefined with '—' fallback
<!-- SECTION:NOTES:END -->

---
id: task-5
title: Fix Daily Breakdown table — advertising shown as negative
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - bug
  - P2
  - dashboard
  - daily-breakdown
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dashboard daily breakdown table shows ad values with minus sign (-1,009₽, -1,381₽).
Ad spend is a positive cost — negative sign is misleading.
Check DailyMetricsTable rendering and data source sign convention.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.2-FE commit efc2532 — replaced negativePrefix flag with isExpense semantic flag, Math.abs safety net, gray text styling without '-' prefix
<!-- SECTION:NOTES:END -->

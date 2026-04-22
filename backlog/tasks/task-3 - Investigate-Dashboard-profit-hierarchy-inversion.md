---
id: task-3
title: Investigate Dashboard profit hierarchy inversion
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - bug
  - P1
  - dashboard
  - data-correctness
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dashboard shows inverted profit hierarchy:
- Чистая прибыль: 172,813₽
- Валовая прибыль: 118,213₽
- Операционная прибыль: 65,673₽
Standard accounting: Gross > Operating > Net.
Either labels are wrong or formulas are inverted.
Check DashboardMetricsGrid component.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.1-FE commits e46151b + b1455fc — getNetProfit cascade now prefers operatingProfitAnalytical (actual profit with COGS) over payoutTotal (cash flow) when tax not configured
<!-- SECTION:NOTES:END -->

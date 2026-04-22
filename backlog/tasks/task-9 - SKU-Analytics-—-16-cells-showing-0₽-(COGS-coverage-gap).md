---
id: task-9
title: SKU Analytics — 16 cells showing 0₽ (COGS coverage gap)
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - enhancement
  - P3
  - analytics
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
/analytics/sku has 16 "0 ₽" cells across 29 rows.
Products without assigned COGS (coverage 75% = 44/59).
Expected behavior but UX could improve: show "—" or "Нет COGS" instead of 0₽.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.3-FE commit cbb8972 — widened SkuFinancialProfit to number|null, renders '—' + tooltip 'Нет COGS' for missing-COGS rows, added COGS coverage footnote
<!-- SECTION:NOTES:END -->

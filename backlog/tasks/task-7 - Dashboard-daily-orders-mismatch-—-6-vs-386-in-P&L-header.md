---
id: task-7
title: Dashboard daily orders mismatch — 6 vs 386 in P&L header
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - investigation
  - P2
  - dashboard
  - data-correctness
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Daily breakdown shows 6 total orders for the week but P&L header shows 386.
Different data sources: daily table uses orders/trends API (FBS only, by date),
header uses fulfillment/summary (FBO+FBS combined).
Document discrepancy or align data sources.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.2-FE commit efc2532 — added tooltip on Заказы,шт header explaining FBS-only scope vs P&L card's FBO+FBS
<!-- SECTION:NOTES:END -->

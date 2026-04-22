---
id: task-8
title: Orders page — two orders have inverted Цена/Цена продажи
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - investigation
  - P3
  - orders
  - data-correctness
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Orders 4909080943 and 4906470022: Цена=56₽ vs Цена продажи=1,510₽.
Normal orders show equal values. Likely backend data issue —
convertedPrice/totalPrice mapping for certain order types.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.3-FE commit cbb8972 — defensive AlertTriangle indicator when salePrice > price * 1.2; backend request #165 filed for root cause
<!-- SECTION:NOTES:END -->

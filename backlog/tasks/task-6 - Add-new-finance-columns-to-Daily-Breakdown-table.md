---
id: task-6
title: Add new finance columns to Daily Breakdown table
status: Done
assignee: []
created_date: '2026-04-12 23:37'
updated_date: '2026-04-14 01:24'
labels:
  - enhancement
  - P2
  - dashboard
  - daily-breakdown
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Daily breakdown table only shows 3 columns (Дата, Заказы шт, Сумма заказов, Реклама).
Now that finance daily API returns real data, add columns for:
Выкупы, Логистика, Хранение, Штрафы, Комиссия, Теор.прибыль.
Check DailyMetricsTable and table-columns.ts.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed in Story 87.2-FE commit efc2532 — added 5 columns (Выкупы, Логистика, Хранение, Комиссия, Теор.прибыль) to daily breakdown table
<!-- SECTION:NOTES:END -->

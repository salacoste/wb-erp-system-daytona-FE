---
id: task-18
title: 'Monitor Dashboard: Metrics Table — 4 periods (Block 2 UI)'
status: To Do
assignee: []
created_date: '2026-04-18 15:17'
labels:
  - monitor-dashboard
  - ui
  - new-feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Block 2 — comparison table showing 7 metrics across 4 time periods (Today / Yesterday / 30 days / Previous 30 days).

**Table structure:**
- Rows: Заказы шт, Продажи шт, Выручка руб, COGS руб, Расходы руб, Маржа руб, Возвраты шт
- Columns: Сегодня | Вчера | 30 дней | Пред. 30 дней
- Delta indicators between columns (green/red arrows + % change)

**Data source:** 4 parallel `daily/finance` calls mapped via `mapToMonitorMetrics()` from task-16.

**"Today" caveat:** daily_sales_raw updates with lag. Show "обновляется..." badge if today's data is empty. Optionally supplement with orders/volume for real-time order count.

**Component:** `MonitorMetricsTable.tsx` — responsive table with sticky first column on mobile.

Currency formatting: formatCurrency from src/lib/utils (Russian locale, ₽).

Depends on: task-16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 7-row x 4-column table renders with real data
- [ ] #2 Delta indicators (green/red) between periods
- [ ] #3 Today shows lag badge when data empty
- [ ] #4 formatCurrency for all monetary values
- [ ] #5 Responsive on mobile (sticky first column)
<!-- AC:END -->

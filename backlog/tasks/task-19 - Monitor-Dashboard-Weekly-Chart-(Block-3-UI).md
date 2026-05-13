---
id: task-19
title: 'Monitor Dashboard: Weekly Chart (Block 3 UI)'
status: Done
assignee: []
created_date: '2026-04-18 15:17'
labels:
  - monitor-dashboard
  - ui
  - chart
  - new-feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Block 3 — line chart showing 3 metrics over 7 days.

**3 lines:**
- Продажи (blue): `day.salesCount`
- Заказы (green): `day.salesCount + day.returnsCount`
- Возвраты (orange): `day.returnsCount`

**Data source:** `GET /v1/analytics/daily/finance?from=7d_ago&to=today` — reuse same endpoint as Block 2 but with 7-day range.

**Component:** `MonitorWeeklyChart.tsx` — Recharts `LineChart` with responsive container. Reuse `DailyBreakdownChart` patterns (Epic 62 — tooltip, legend, axis formatting).

Optional enhancement: supplement with `orders/volume` for real-time order accuracy (Indeepa shows orders not just buyouts).

Depends on: task-16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Line chart with 3 series renders for 7-day range
- [ ] #2 Responsive container + tooltip on hover
- [ ] #3 Legend toggleable per series
- [ ] #4 X-axis shows day names (Пн, Вт, ...)
- [ ] #5 Chart accessible (role=img, aria-label)
<!-- AC:END -->

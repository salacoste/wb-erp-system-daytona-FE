---
id: task-20
title: 'Monitor Dashboard: Buyout Rate + Pipeline Health (Blocks 4-5 UI)'
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
Blocks 4-5 of Monitor Dashboard — buyout gauge + pipeline status.

**Block 4: Buyout Rate (30d)**
- Single metric card or gauge showing `overallBuyoutRatePct` from buyout/summary
- Color: green >90%, yellow 70-90%, red <70%
- Label: "Выкуп за 30 дней"

**Block 5: Last Recalculations + Errors**
- Source: `GET /v1/monitoring/dashboard`
- "Последний пересчёт": `pipelines.filter(lastSuccessAt).sort(desc)[0]` — show `displayName` + relative time
- "Ошибки": `pipelines.filter(status !== 'healthy')` — list unhealthy pipelines with status badges
- Replaces Indeepa's "WB Notifications" which we don't have

**Components:** `MonitorBuyoutGauge.tsx`, `MonitorPipelineHealth.tsx`

Depends on: task-16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Buyout rate displays with color coding
- [ ] #2 Pipeline health shows last recalc time
- [ ] #3 Unhealthy pipelines listed with status badges
- [ ] #4 Relative time formatting (e.g. '2 часа назад')
- [ ] #5 Loading + error states for both blocks
<!-- AC:END -->

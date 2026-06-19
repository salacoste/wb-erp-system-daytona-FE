---
id: task-17
title: 'Monitor Dashboard: KPI Cards block (Block 1 UI)'
status: Done
assignee: []
created_date: '2026-04-18 15:16'
labels:
  - monitor-dashboard
  - ui
  - new-feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Block 1 of Monitor Dashboard — 4-6 KPI cards at the top of the page.

**Cards to implement:**

1. Артикулов всего — from cogs-coverage.productCount
2. Артикулов с COGS — from cogs-coverage.productsWithCogs
3. Покрытие COGS, % — from cogs-coverage.cogsPercent (color: green >80%, yellow 50-80%, red <50%)
4. Выкуп за 30д, % — from buyout/summary.overallBuyoutRatePct

**NOT implemented** (no backend API):

- Уведомлений WB
- Артикулов в акциях

**Component:** `MonitorKpiCards.tsx` — reuse `Card` + `CardContent` from shadcn/ui.
Loading skeleton for each card. Error fallback per card (not page-level).

**Route:** New page at `/monitor` (or `/monitoring/dashboard`). Register in routes.ts + sidebar-navigation.ts.

Depends on: task-16 (foundation types/hooks)

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 4 KPI cards render with real data
- [x] #2 Color coding on COGS coverage % card
- [x] #3 Loading skeletons during fetch
- [x] #4 Route registered + sidebar entry added
- [x] #5 WCAG 2.1 AA accessible (aria-labels on cards)
<!-- AC:END -->

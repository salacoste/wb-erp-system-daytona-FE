---
id: task-49
title: >-
  /monitor: "Заказы" row is a meaningless sum + "Продажи по себестоимости"
  mislabel (BD-22/23/24)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - business-data
  - ux-validation
  - monitor
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LIVE-CONFIRMED (playwright, cabinet "Space Chemical", 30-day column): Заказы 3 442 = Продажи 3 425 + Возвраты 17, exactly. The "Заказы" (orders) metric is computed as salesCount + returnsCount — not an order count, not any standard metric, and arithmetically always ≥ Продажи, so it reads as "more orders than sales". Same error in the weekly chart series. Separately, the COGS row is labeled "Продажи по себестоимости" (reads as revenue-at-cost) but its value is COGS (657 880 ₽ live) — a cost, not sales.
Files:
- src/app/(dashboard)/monitor/components/monitor-metrics-config.ts:41-51 ("Заказы" = salesCount+returnsCount) and :77-86 ("Продажи по себестоимости" = cogs)
- src/app/(dashboard)/monitor/components/monitor-weekly-chart-utils.ts:61-62 (chart "orders" series same sum)
Note: monitor-summary endpoint only exposes salesCount + returnsCount; a real order count is not available from it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The 'Заказы' row+chart series no longer present salesCount+returnsCount as 'orders' — either wire a real order count if backend exposes one, or rename to 'Продажи + Возвраты (транзакций)' with a tooltip, or drop it (Продажи/Возвраты already shown)
- [x] #2 The COGS row is renamed to 'Себестоимость (COGS)' with subtitle 'Затраты на проданные товары' (no longer 'Продажи по себестоимости')
- [x] #3 monitor unit tests updated; page renders correctly
- [x] #4 type-check/eslint/vitest pass at baseline
<!-- AC:END -->

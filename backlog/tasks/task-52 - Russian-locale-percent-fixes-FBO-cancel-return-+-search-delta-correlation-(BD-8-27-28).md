---
id: task-52
title: >-
  Russian-locale percent fixes: FBO cancel/return + search delta/correlation
  (BD-8/27/28)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - ux-validation
  - locale
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dot-decimal / missing-NBSP percent rendering that violates the Russian-locale rule ("15,5 %" comma+NBSP) and trips check:locale-percent:
- src/app/(dashboard)/orders/fbo/components/FboAggregateCards.tsx:61 `${cancelRate} %` and FboSalesAggregateCards.tsx:48 `${returnRate} %` (BD-8) — use formatPercentage(x,1)
- src/app/(dashboard)/analytics/search/components/search-comparison-utils.ts:43-48 formatDelta `fmt(...)+'%'` (BD-27) — use formatPercentage
- src/app/(dashboard)/analytics/cross-reference/components/PositionSpendChart.tsx:96-99 mixes formatPercentage with r.toFixed(2) dot-decimal (BD-28) — use r.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All listed sites render percents as '15,5 %' (comma + NBSP) via formatPercentage / ru-RU toLocaleString
- [x] #2 check:locale-percent passes and its baseline is lowered in the same commit if sites are migrated
- [x] #3 type-check/eslint/vitest pass at baseline
<!-- AC:END -->

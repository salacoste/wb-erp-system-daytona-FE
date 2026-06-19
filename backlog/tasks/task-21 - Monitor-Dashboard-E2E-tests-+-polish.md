---
id: task-21
title: 'Monitor Dashboard: E2E tests + polish'
status: Done
assignee: []
created_date: '2026-04-18 15:17'
labels:
  - monitor-dashboard
  - tests
  - polish
  - new-feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Final polish for Monitor Dashboard — tests, accessibility, responsive check.

**Tests:**

- Unit tests for `mapToMonitorMetrics` normalizer (null handling, empty data, partial periods)
- Component tests for each block (KPI cards, table, chart, buyout gauge, pipeline health)
- E2E Playwright spec: navigate to /monitor, verify 5 blocks render, check loading states
- E2E: use `domcontentloaded` + landmark waits (NOT networkidle — per CLAUDE.md anti-pattern #9)

**Polish:**

- Accessibility: axe-core scan, keyboard navigation through all blocks
- Responsive: mobile viewport stacks blocks vertically
- Auto-refresh: optional 5-10 min polling via `refetchInterval` on the hook
- Empty states: "Нет данных" for each block independently

Depends on: task-17, task-18, task-19, task-20

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 E2E spec passes with domcontentloaded pattern
- [x] #2 axe-core zero critical violations
- [x] #3 All 5 blocks render independently (partial failure OK)
- [x] #4 Auto-refresh configurable
- [x] #5 npm run type-check && npm run lint && npm test pass
<!-- AC:END -->

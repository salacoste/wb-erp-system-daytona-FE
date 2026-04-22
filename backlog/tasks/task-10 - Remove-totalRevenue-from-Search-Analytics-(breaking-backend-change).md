---
id: task-10
title: Remove totalRevenue from Search Analytics (breaking backend change)
status: Done
assignee: []
created_date: '2026-04-18 15:12'
updated_date: '2026-04-20 02:05'
labels:
  - breaking-change
  - search-analytics
  - backend-epics-89-91
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend Epics 89-91 (2026-04-13): WB Search Analytics API never returned real revenue — field was always 0. Backend removed `totalRevenue` from all 3 search endpoints + removed from valid `orderBy` values.

**Breaking change** — if frontend passes `orderBy=totalRevenue`, backend now returns error.

Files to update:
- `src/types/search-analytics.ts` — remove `totalRevenue` from `SearchQueryItem`, `SearchProductItem`, `SearchOrderItem` types; remove `'totalRevenue'` from `SearchOrderBy` union
- `src/app/(dashboard)/analytics/search/components/SearchByProductTable.tsx` — remove "Выручка ₽" column
- `src/app/(dashboard)/analytics/search/components/SearchByQueryTable.tsx` — remove "Выручка ₽" column  
- `src/app/(dashboard)/analytics/search/components/SearchOrdersTable.tsx` — remove revenue column + remove `totalRevenue` from SortField
- `src/hooks/use-search-analytics.ts` — verify no `orderBy: 'totalRevenue'` default

Source: Backend update Epics 89-91, Story 90.1 BUG-4 fix
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Zero references to totalRevenue in search-analytics types/components
- [x] #2 No 'Выручка' column in search tables (by-product, by-query, orders)
- [x] #3 orderBy param never sends totalRevenue
- [x] #4 npm run type-check && npm run lint pass
- [x] #5 Existing search analytics tests pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed via Story 91.1-FE (2026-04-20). Removed totalRevenue from 5 type fields, 4 UI components, 7 test files. 6789 unit tests pass.
<!-- SECTION:NOTES:END -->

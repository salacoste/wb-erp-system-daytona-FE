---
id: task-33
title: Fix storage analytics duplicate React keys in live UI validation
status: Done
assignee: []
created_date: '2026-06-16 16:32'
updated_date: '2026-06-16 16:32'
labels:
  - qa-audit
  - ui-validation
  - storage
  - react-keys
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live business-pages UI validation found /analytics/storage emitted repeated React duplicate-key console errors while backend API responses were HTTP 200. Root cause was unstable/non-unique React keys in storage chart/table rendering paths; hardened StorageTrendsChart custom dots and storage table/top-consumers row keys. This was fixed immediately during validation branch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /analytics/storage loads with no React duplicate-key console errors.
- [x] #2 Storage page still displays H1 and table content with live backend data.
- [x] #3 Targeted storage component tests pass.
- [x] #4 Follow-up 11-page backend-backed UI smoke has 0 failing routes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence: `npm test -- --run src/app/(dashboard)/analytics/storage/components/__tests__/StorageTrendsChart.test.tsx src/app/(dashboard)/analytics/storage/components/__tests__/StorageTrendsChartParts.test.tsx src/app/(dashboard)/analytics/storage/components/__tests__/TopConsumersWidget.test.tsx src/app/(dashboard)/analytics/storage/components/__tests__/StorageBySkuTable.test.tsx` => 4 files / 52 tests passed. `npm run type-check` passed. Targeted ESLint for changed storage components passed. Live `/analytics/storage` check showed H1 `Аналитика расходов на хранение`, tableRows=25, consoleEvents=[], badApi=[] (`/tmp/storage-live-console-after-key-fix.log`). 11-page business UI check after fix returned total=11, failing=0 (`/tmp/live-business-pages-check-after-storage-key-fix.log`).
<!-- SECTION:NOTES:END -->

---
id: task-50
title: >-
  /analytics/cross-reference: cannibalization analysis inoperational
  (organicContribution never set) (BD-26)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - business-data
  - ux-validation
  - cross-reference
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The cannibalization table always classifies every product as risk='low'. Root cause: mergeSearchAndAdData (src/app/(dashboard)/analytics/cross-reference/utils/cross-reference-utils.ts:71-82) never assigns organicContribution, and classifyCannibalization reads `item.organicContribution ?? 0` (ad-search-correlation-utils.ts:143) → org=0 for every item → nothing ever exceeds the 40%/70% thresholds. The whole analysis is silently broken.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 organicContribution is computed (e.g. organic order share) and populated in mergeSearchAndAdData, OR the cannibalization section is gated behind an honest 'требует данных' state until a backend field exists
- [x] #2 classifyCannibalization produces non-trivial high/medium/low buckets on real data (verified)
- [x] #3 unit test covers a high-risk and a low-risk classification
- [x] #4 type-check/eslint/vitest pass at baseline
<!-- AC:END -->

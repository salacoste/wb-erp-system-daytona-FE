---
id: task-53
title: >-
  /analytics/pricing: fabricated "0,00 ₽" recommended price when data missing
  (BD-32)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - business-data
  - ux-validation
  - pricing
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
price-recommendations-normalizer.ts:22-25 coerces recommendedPrice/breakEvenPrice/marginAtRecommendedPct via `?? 0` (even asserted in the test), and PricingTable.tsx:103-105,113-114 render them unconditionally. When the backend can't compute a recommendation (low confidence / missing COGS→null), the table shows "0,00 ₽" as an actionable recommended price — a fabricated recommendation. Note lastPrice/gap/gapPct right above ARE null-preserving. (Overlaps the normalizer-fix task; can be delivered as part of it or standalone.) Confirm against test-api/ whether the backend contract guarantees non-null; if not, preserve null → render "—" / "недостаточно данных".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 recommendedPrice/breakEvenPrice/marginAtRecommendedPct preserve null (type number|null); PricingTable renders '—' (or an explicit 'недостаточно данных') instead of 0,00 ₽
- [x] #2 price-recommendations-normalizer.test.ts updated to expect null (not 0)
- [x] #3 type-check/eslint/vitest pass at baseline
<!-- AC:END -->

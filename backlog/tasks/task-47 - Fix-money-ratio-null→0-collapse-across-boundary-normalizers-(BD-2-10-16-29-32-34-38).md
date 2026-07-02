---
id: task-47
title: >-
  Fix money/ratio null→0 collapse across boundary normalizers
  (BD-2/10/16/29/32/34/38)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - business-data
  - ux-validation
  - anti-pattern-8
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From business-data deep-audit (frontend/.omc/ux-validation/business-data-audit-2026-07-02.md). Systemic defect class: `?? 0` / `toCount` applied to MONEY & RATIO fields INSIDE `*-normalizer.ts`/`*-mapper.ts`, where the type is declared non-nullable — so ESLint's anti-pattern-#8 rule (component/hook only) and tsc both stay green while null→0 silently lies ("0 %" reads as "no returns", "0 ₽" as "no payout"). Confirmed instances below. Fix = use toNullableNumber (no `?? 0`), widen the field types to `number|null`, render null as "—" in consumers. Keep toCount on genuine count fields (SEMANTIC-ZERO).

Confirmed sites:
- src/lib/api/fulfillment-normalizer.ts:33-41,49-53,60-63,88-93 — ordersRevenue, ordersRevenueDiscounted, salesRevenue, forPayTotal, returnsRevenue, returnRate, avgOrderValue (BD-2, P0-class; feeds monitor + FBO cards)
- src/lib/api/search-position-trends-normalizer.ts:141-143 — ctr, avgPosition (BD-29)
- src/lib/api/price-recommendations-normalizer.ts:22-25 — recommendedPrice, breakEvenPrice, marginAtRecommendedPct (BD-32; also asserted in the .test — update test)
- src/lib/api/price-elasticity.ts:34-35,66-67 — elasticity, rSquared via toCount (BD-34)
- src/lib/api/return-analytics-normalizer.ts:78-81 — overallReturnRate, classificationCoverage (BD-10)
- src/lib/api/storage-queries-normalizer.ts:44-45,63,94 — storage_cost_total, storage_cost_avg_daily, storage_cost, avg_cost_per_product via toCount (BD-16)
- src/lib/api/buyout-analytics-normalizer.ts:112 — TopDecliner.trendDelta (BD-38)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All listed money/ratio fields use toNullableNumber (no `?? 0`) and their TS types are widened to `number | null`
- [x] #2 Every consumer of those fields renders null as '—' (not '0'/'0 ₽'/'0 %')
- [x] #3 Count fields remain toCount with SEMANTIC-ZERO; no regression there
- [x] #4 Unit tests updated (incl. price-recommendations-normalizer.test.ts which currently asserts null→0)
- [x] #5 check:locale-percent, type-check, eslint, vitest all pass at baseline
<!-- AC:END -->

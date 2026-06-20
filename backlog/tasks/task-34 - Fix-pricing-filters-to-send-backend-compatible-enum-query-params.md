---
id: task-34
title: Fix pricing filters to send backend-compatible enum query params
status: Done
assignee: []
created_date: '2026-06-16 16:44'
updated_date: '2026-06-16 16:44'
labels:
  - qa-audit
  - ui-validation
  - pricing
  - backend-contract
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live pricing interaction validation found selecting the "Ниже цели" filter sent `gap_filter=below`, while backend `QueryPriceRecommendationDto` accepts only `above_target`, `below_target`, `at_target`. The page received HTTP 400 and console API errors. Sorting values also used UI-only direction values (`gap_asc`, `margin_asc`, etc.) while backend accepts sort fields (`gap_pct`, `margin_at_current_pct`, `recommended_price`). Fixed frontend filter state and Select mappings to send backend-compatible enum values and map "Все товары"/"По умолчанию" to omitted query params.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Selecting pricing gap filters does not produce backend 400 responses.
- [x] #2 Pricing gap filter sends backend enum values such as `below_target`.
- [x] #3 Pricing sort sends backend enum values such as `margin_at_current_pct`.
- [x] #4 Regression coverage verifies filter controls generate backend-compatible query params.
- [x] #5 Live pricing page has no console/API errors after filter and sort interactions.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence: `npm test -- --run src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx` => 43 tests passed. `npx playwright test e2e/pricing-page.spec.ts --project=chromium --reporter=list` => 13 passed, including new regression `filter controls send backend-compatible enum query params`. `npm run type-check` passed. Targeted ESLint for changed pricing components passed. Live browser check selecting `Ниже цели` and `По текущей марже` produced API URLs with `gap_filter=below_target` and `sort=margin_at_current_pct`, all HTTP 200, consoleEvents=[], bad=[] (`/tmp/pricing-filter-select-live-after-fix.log`). Follow-up 13-route/2-interaction live pass returned failingRoutes=[], failingInteractions=[] (`/tmp/live-ui-data-interaction-check-after-pricing-filter-fix.log`).
<!-- SECTION:NOTES:END -->

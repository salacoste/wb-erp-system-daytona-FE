---
id: task-36
title: Fix price calculator logistics input display/payload mismatch
status: Done
assignee: []
created_date: '2026-06-16 17:00'
updated_date: '2026-06-16 17:01'
labels:
  - qa-audit
  - ui-validation
  - price-calculator
  - business-data
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live UI submit validation found that manual user input for `Логистика к клиенту` and `Логистика возврата` was submitted correctly to `/v1/products/price-calculator`, but the visible inputs immediately reverted to `0`, misleading users about the values used in calculation. Root cause: `FixedCostLogisticsField` controlled the input from auto-fill calculation value while manual changes only updated react-hook-form state. Fixed by keeping logistics fields registered/uncontrolled and using auto-fill value only for badge/calculated display.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manual logistics forward input remains visibly set after user entry.
- [x] #2 Manual logistics reverse input remains visibly set after user entry.
- [x] #3 Submitted price-calculator payload matches visible logistics values.
- [x] #4 Live backend price-calculator submit returns 200 and renders results.
- [x] #5 Regression unit test covers manual logistics input with auto-fill display value present.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Changed `src/components/custom/price-calculator/FixedCostLogisticsField.tsx` so logistics fields always spread react-hook-form registration and call the manual override callback from `onChange`; `controlledValue` now only drives auto-fill/calculated display. Added regression in `src/components/custom/price-calculator/__tests__/FixedCostsSection.test.tsx`.

Verification: `npm test -- --run src/components/custom/price-calculator/__tests__/FixedCostsSection.test.tsx` => 19 passed. `npm run type-check` => passed. `npx eslint 'src/components/custom/price-calculator/FixedCostLogisticsField.tsx' 'src/components/custom/price-calculator/__tests__/FixedCostsSection.test.tsx' --max-warnings=0` => passed. Live UI submit `.omx/live-price-calculator-user-fill-check.cjs` => visible values `150/200`, POST `/v1/products/price-calculator` payload `150/200`, HTTP 200, results visible; log `/tmp/live-price-calculator-user-fill-check-after-logistics-display-fix.log`.

Additional verification: `npx playwright test e2e/price-calculator.spec.ts --reporter=line` => 25 passed.
<!-- SECTION:NOTES:END -->

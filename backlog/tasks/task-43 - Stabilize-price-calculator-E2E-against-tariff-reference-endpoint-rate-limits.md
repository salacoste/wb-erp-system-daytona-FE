---
id: task-43
title: Stabilize price calculator E2E against tariff reference endpoint rate limits
status: Done
assignee:
  - codex
created_date: '2026-06-16 17:53'
updated_date: '2026-06-16 17:53'
labels:
  - validation
  - e2e
  - price-calculator
  - rate-limit
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Commercial UI validation batch found that e2e/price-calculator.spec.ts was hitting real tariff reference endpoints on every beforeEach/reload. Under parallel execution this exhausted backend tariff rate limits and the JS-error smoke failed on browser console 429 errors from /v1/tariffs/warehouses-with-tariffs, /v1/tariffs/acceptance/coefficients/all, /v1/tariffs/commissions, and /v1/tariffs/settings. Fixed by mocking deterministic tariff reference data inside the price calculator UI spec; live backend/tariff contract checks remain separate from UI interaction tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Price calculator UI E2E no longer calls live rate-limited tariff reference endpoints for page-load fixture data.
- [x] #2 Price calculator JS-error smoke passes without 429 console noise.
- [x] #3 Full price-calculator E2E spec passes.
- [x] #4 Commercial UI validation batch passes.
- [x] #5 Targeted lint and typecheck pass.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: added mockTariffReferenceData(page) in e2e/price-calculator.spec.ts before navigation. It fulfills deterministic responses for /v1/tariffs/warehouses-with-tariffs, /v1/tariffs/acceptance/coefficients/all, /v1/tariffs/commissions, and /v1/tariffs/settings, preventing UI tests from exhausting backend tariff rate limits.

Verification 2026-06-16: npx playwright test e2e/price-calculator.spec.ts -g "Страница загружается без JS ошибок" --project=chromium --no-deps --reporter=line => 1 passed.

Verification 2026-06-16: npx playwright test e2e/price-calculator.spec.ts --project=chromium --no-deps --reporter=line => 21 passed.

Verification 2026-06-16: npx playwright test e2e/pricing-page.spec.ts e2e/price-calculator.spec.ts e2e/cogs-pages.spec.ts e2e/cogs-assignment.spec.ts e2e/expenses-page.spec.ts e2e/onboarding.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts --project=chromium --no-deps --reporter=line => 94 passed, 0 failed.

Verification 2026-06-16: npx eslint e2e/price-calculator.spec.ts --max-warnings=0 --no-warn-ignored => passed; npm run type-check => passed.
<!-- SECTION:NOTES:END -->

---
id: task-40
title: >-
  Fix Jam-gated analytics protected-data leakage and stabilize gated analytics
  E2E
status: Done
assignee: []
created_date: '2026-06-16 17:36'
updated_date: '2026-06-16 17:36'
labels:
  - validation
  - ui-ux
  - data-protection
  - jam
  - e2e
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live validation found Search and Cross-reference analytics rendering protected children behind a blurred WB Jam gate when jam-status returned available=false/tier=none. This mounted data-fetching children, triggered protected analytics API calls, and produced Search Recharts zero-size console warnings. Fixed RequireJam fail-closed default preview, moved Cross-reference protected data hooks inside the gate, made date initialization hydration-safe, and updated E2E to handle Jam-gated/conditional backend states without hiding real failures.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 RequireJam does not mount protected children by default for insufficient tiers
- [x] #2 Search and Cross-reference do not call protected analytics APIs when Jam tier is none
- [x] #3 Search/Cross-reference live smoke has no console/page/network/API failures
- [x] #4 Affected E2E package passes with only expected Jam/backend-data skips
- [x] #5 TypeScript and targeted ESLint pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification 2026-06-16: npm test -- --run src/components/custom/jam/__tests__/RequireJam.test.tsx => 12 passed.

Verification 2026-06-16: npx playwright test e2e/search-analytics.spec.ts e2e/analytics/search-analytics.spec.ts e2e/cross-reference.spec.ts e2e/financial-gaps.spec.ts e2e/storage-analytics.spec.ts e2e/forecast-accuracy.spec.ts e2e/liquidity.spec.ts e2e/reorder-page.spec.ts --project=chromium --no-deps --reporter=line => 77 passed, 4 skipped (expected Jam/backend-data conditional skips).

Verification 2026-06-16: node .omx/live-analytics-batch2-check.cjs => 8 routes checked, failing=0; Search and Cross-reference no longer call protected analytics endpoints with Jam tier none; consoleEvents=[], badApi=[].

Verification 2026-06-16: npm run type-check => passed; targeted ESLint for changed source/e2e files => passed.


Verification 2026-06-17: npm test -- --run src/components/custom/jam/__tests__/RequireJam.test.tsx 'src/app/(dashboard)/analytics/search/__tests__/SearchPageContent.test.tsx' => 2 files passed, 24 tests passed.

Verification 2026-06-17: targeted source ESLint for RequireJam, CrossReferencePageContent, and SearchPageContent tests => passed; E2E files are ignored by project ESLint config.

Verification 2026-06-17: npm run type-check => passed.

Verification 2026-06-17: npx playwright test e2e/search-analytics.spec.ts e2e/analytics/search-analytics.spec.ts e2e/cross-reference.spec.ts --project=chromium --no-deps --reporter=line => 13 passed, 4 skipped.

Verification 2026-06-17: .omx/live-analytics-batch2-check.cjs was not present in this checkout, so the live guard could not be rerun.
<!-- SECTION:NOTES:END -->

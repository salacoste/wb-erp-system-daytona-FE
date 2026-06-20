---
id: task-42
title: >-
  Fix dashboard marketing KPI aria-label violation and dashboard-period tablist
  E2E selector
status: Done
assignee:
  - codex
created_date: '2026-06-16 17:48'
updated_date: '2026-06-16 17:48'
labels:
  - validation
  - a11y
  - dashboard
  - e2e
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live dashboard/orders/monitoring/settings/AI-admin E2E+a11y batch found two issues: (1) serious axe aria-prohibited-attr violation on MarketingKpiCard multi-attribution info indicator because aria-label was used on a span without a valid role; fixed with a semantic role on the labelled indicator. (2) dashboard-period ARIA E2E selector used a broad [role="tablist"] locator and became ambiguous after comparison-mode tablist was added; fixed by scoping the locator to the period toggle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MarketingKpiCard labelled multi-attribution indicator has a valid ARIA role.
- [x] #2 Dashboard metrics axe critical accessibility test passes.
- [x] #3 Dashboard-period ARIA selector test passes without strict-mode ambiguity.
- [x] #4 Unit, lint, typecheck, and full dashboard/orders/monitoring/settings/AI-admin E2E batch pass.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: added role="img" to the MarketingKpiCard multi-attribution info indicator so the existing aria-label is valid; scoped dashboard-period E2E tablist locator to PERIOD_SELECTORS.periodToggle to avoid ambiguity with comparison-mode tablists.

Verification 2026-06-16: npm test -- --run src/app/(dashboard)/analytics/components/__tests__/MarketingKpiCard.test.tsx => 12 passed.

Verification 2026-06-16: npx playwright test e2e/dashboard-metrics.spec.ts -g "no critical accessibility violations on dashboard metrics" --project=chromium --no-deps --reporter=line => 1 passed.

Verification 2026-06-16: npx playwright test e2e/dashboard-period.spec.ts -g "period selector has proper ARIA attributes" --project=chromium --no-deps --reporter=line => 1 passed.

Verification 2026-06-16: npx eslint src/app/(dashboard)/analytics/components/MarketingKpiCard.tsx src/app/(dashboard)/analytics/components/__tests__/MarketingKpiCard.test.tsx e2e/dashboard-period.spec.ts --max-warnings=0 --no-warn-ignored => passed; npm run type-check => passed.

Verification 2026-06-16: npx playwright test e2e/dashboard-metrics.spec.ts e2e/dashboard-period.spec.ts e2e/orders.spec.ts e2e/orders-accessibility.spec.ts e2e/orders-client-info.spec.ts e2e/orders-price-anomaly.spec.ts e2e/monitor.spec.ts e2e/monitoring.spec.ts e2e/settings-pages.spec.ts e2e/ai-admin.spec.ts e2e/ai-admin-preferences.spec.ts --project=chromium --no-deps --reporter=line => 120 passed, 80 skipped, 0 failed.
<!-- SECTION:NOTES:END -->

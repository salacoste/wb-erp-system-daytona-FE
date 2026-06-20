---
id: task-39
title: >-
  Fix sidebar cabinet loading link accessibility and buyout reconciliation E2E
  contract assertions
status: Done
assignee:
  - codex
created_date: '2026-06-16 17:16'
updated_date: '2026-06-16 17:17'
labels:
  - ui-ux-validation
  - accessibility
  - e2e
  - autopilot
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Autopilot UI/UX validation for funnel, buyout reconciliation, SKU analytics, SKU packaging, and acquiring found one real accessibility defect and two stale buyout E2E assertions. Axe reported a serious `link-name` violation on acquiring period detail while SidebarCabinetInfo was loading: the cabinet settings link contained only a skeleton div and had no accessible name. Buyout reconciliation E2E also expected anomaly indicators to be role=button even though the component intentionally uses focusable aria-labelled tooltip triggers, and its nmId API assertion used page.waitForFunction with a serialized Node-side string so it could time out without asserting the updated URL.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sidebar cabinet/settings link has a stable accessible name even while seller/cabinet info is loading.
- [x] #2 Buyout reconciliation anomaly E2E asserts the current accessibility contract: focusable aria-labelled anomaly indicators, not buttons.
- [x] #3 Buyout reconciliation nmId filter E2E waits on captured route URLs and asserts nmId=12345 is sent to the backend.
- [x] #4 Live browser smoke for funnel, buyout reconciliation, SKU analytics, SKU packaging, and acquiring is clean: no console/page/network/API errors and no bad visible data tokens.
- [x] #5 Targeted e2e suite for funnel, buyout reconciliation, SKU analytics, SKU packaging, and acquiring passes.
- [x] #6 TypeScript and targeted ESLint checks pass.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence 2026-06-16: live smoke `/tmp/live-funnel-buyout-sku-acquiring-check.json` completed 5 routes with failing=0 for funnel, buyout-reconciliation, sku-analytics, sku-packaging, acquiring. Domain APIs returned 200; badText=[], consoleEvents=[], pageErrors=[], badApi=[].

Evidence 2026-06-16: `npx playwright test e2e/buyout-reconciliation.spec.ts --project=chromium --no-deps --reporter=line` => 7 passed.

Evidence 2026-06-16: `npx playwright test e2e/funnel.spec.ts e2e/buyout-reconciliation.spec.ts e2e/sku-analytics.spec.ts e2e/sku-packaging-page.spec.ts e2e/acquiring.spec.ts --project=chromium --no-deps --reporter=line` => 38 passed.

Evidence 2026-06-16: `npm run type-check` => passed; `npx eslint src/components/custom/SidebarCabinetInfo.tsx --max-warnings=0` => passed; `npx eslint e2e/buyout-reconciliation.spec.ts --max-warnings=0 --no-warn-ignored` => passed.
<!-- SECTION:NOTES:END -->

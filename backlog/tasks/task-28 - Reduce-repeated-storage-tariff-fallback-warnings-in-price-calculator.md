---
id: task-28
title: Reduce repeated storage tariff fallback warnings in price calculator
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-12 23:13'
labels:
  - qa-audit
  - data-quality
  - frontend
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA route sweep found `/cogs/price-calculator` emits about 200 repeated console warnings `[StorageTariffs] baseLiterRub=0, applying fallback`. The UI renders, but the repeated warnings obscure real browser defects and indicate backend tariff data quality or frontend logging noise.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening `/cogs/price-calculator` no longer floods the browser console with repeated identical storage-tariff fallback warnings.
- [x] #2 If backend tariff data legitimately has `baseLiterRub=0`, the UI exposes a clear data-quality/fallback state where appropriate.
- [x] #3 Fallback logic remains safe and tested for zero/invalid tariff values.
- [x] #4 Console-clean route smoke can distinguish real errors from expected data-quality fallback behavior.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (4bdeb984/5fc4958a). Evidence: `src/hooks/supply-tariffs-lookup.ts` and `src/lib/tariff-extraction-utils.ts` aggregate/dedupe fallback warnings while preserving fallback metadata; tests in `src/hooks/__tests__/supply-tariffs-lookup.test.ts` and `src/lib/__tests__/tariff-extraction-utils.test.ts` cover fallback behavior. Final UltraQA probe `/tmp/ultraqa-dynamic-probe-final.json` UQA-004 reports `fallbackWarningCount: 0`; focused tests passed.

Review clarification 2026-06-13: added route-specific browser proof for the actual task route. Playwright probe `/tmp/cogs-price-calculator-probe.json` loaded `http://localhost:3100/cogs/price-calculator` with H1 `Калькулятор цены`, `networkFailures: []`, `severeConsoleCount: 0`, and `storageFallbackWarningCount: 4` bounded summary warnings (`50 warehouse(s) using fallback storage tariffs...`) instead of the prior ~200 repeated row-level fallback warnings. This satisfies the reduction/no-flood acceptance criteria while preserving data-quality visibility.
<!-- SECTION:NOTES:END -->

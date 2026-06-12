---
id: task-28
title: Reduce repeated storage tariff fallback warnings in price calculator
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
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
- [ ] #1 Opening `/cogs/price-calculator` no longer floods the browser console with repeated identical storage-tariff fallback warnings.
- [ ] #2 If backend tariff data legitimately has `baseLiterRub=0`, the UI exposes a clear data-quality/fallback state where appropriate.
- [ ] #3 Fallback logic remains safe and tested for zero/invalid tariff values.
- [ ] #4 Console-clean route smoke can distinguish real errors from expected data-quality fallback behavior.
<!-- AC:END -->

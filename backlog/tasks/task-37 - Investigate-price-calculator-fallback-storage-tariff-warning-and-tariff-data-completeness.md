---
id: task-37
title: >-
  Investigate price calculator fallback storage-tariff warning and tariff data
  completeness
status: Done
assignee: []
created_date: '2026-06-16 17:01'
updated_date: '2026-06-16 20:09'
labels:
  - qa-audit
  - price-calculator
  - data-quality
  - tariffs
  - backend-contract
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live price-calculator validation repeatedly logs `[StorageTariffs] 50 warehouse(s) using fallback storage tariffs for this calculation`. UI calculation still succeeds (POST 200 and results render), but console noise indicates many warehouse storage tariffs have `baseLiterRub=0` and frontend falls back to defaults. Need determine whether backend tariff data is incomplete/stale, whether the warning should be deduped/demoted in UI, and whether users need an in-product data-quality indicator.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Confirm source API/records producing zero storage base rates for affected warehouses.
- [x] #2 Decide whether zero storage rates are valid business data or missing data requiring backend/tariff ingestion fix.
- [x] #3 If expected fallback remains, console warning is deduped or demoted so normal page use is not noisy.
- [x] #4 If data is incomplete, add backend/data remediation task and user-facing indicator if needed.
- [x] #5 Regression/live validation confirms price calculator has no repeated warning spam during ordinary load/submit.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started investigation after analytics UI smoke batches passed cleanly. Previous finding: live price calculator logs `[StorageTariffs] 50 warehouse(s) using fallback storage tariffs for this calculation`; need confirm backend/source data vs expected zero rates and decide warning/user indicator behavior.

Source confirmed via live API evidence `/tmp/task-37-tariff-source-analysis.json`: `/v1/tariffs/acceptance/coefficients/all` returned 7020 coefficient rows / 156 preferred unique warehouses; 50 preferred warehouse rows had `storage.baseLiterRub=0` (and delivery rates also 0). `/v1/tariffs/warehouses-with-tariffs` returned 97 warehouses with no zero storage base rates.

Decision: this is not a frontend scaling bug. It is ambiguous/incomplete SUPPLY tariff data for affected warehouses/SC/SGT rows. Frontend must continue safe fallback for calculations while backend/data ingestion clarifies/remediates the source contract.

Frontend fix: `extractSupplyWarehouses` now demotes the aggregate fallback summary from warn to debug and dedupes repeated render-cycle logs; box-type tariff cards now apply the same storage fallback normalization instead of showing raw 0.00; selected fallback warehouses show a user-facing amber indicator explaining default storage tariff substitution.

Backend/data remediation logged as `task-46 - Fix backend SUPPLY acceptance coefficients zero delivery/storage rates for affected warehouses`.

Verification: `npm test -- --run src/hooks/__tests__/supply-tariffs-lookup.test.ts src/hooks/__tests__/useSupplyTariffs.storage.test.ts` => 23 passed; targeted ESLint on changed price-calculator/tariff files => passed; `npm run type-check` => passed; `npx playwright test e2e/price-calculator.spec.ts --project=chromium --no-deps --reporter=line` => 21 passed; live browser `/cogs/price-calculator` selecting fallback warehouse `Климовск СГТ` showed fallback UI indicators, 0 console warn/error, 0 page errors, all tariff requests 200, and only 1 deduped `[StorageTariffs]` debug/info event (`/tmp/task-37-live-price-calculator-check.json`).
<!-- SECTION:NOTES:END -->

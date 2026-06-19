---
id: task-46
title: >-
  Fix backend SUPPLY acceptance coefficients zero delivery/storage rates for
  affected warehouses
status: Done
assignee: []
created_date: '2026-06-16 20:09'
updated_date: '2026-06-16 20:17'
labels:
  - backend-contract
  - data-quality
  - tariffs
  - price-calculator
  - qa-audit
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Task-37 live validation on 2026-06-16 confirmed `/v1/tariffs/acceptance/coefficients/all` returns 7020 rows / 156 preferred unique warehouses, with 50 preferred warehouse rows where Boxes storage.baseLiterRub=0 and delivery base/additional are also 0. `/v1/tariffs/warehouses-with-tariffs` returned 97 warehouses with no zero storage base rates. Frontend now falls back visibly and suppresses console warn spam, but backend/tariff ingestion should determine whether these SUPPLY zero rows mean unavailable warehouses, unsupported SGT/SC destinations, or stale/incomplete tariff ingestion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Source system/ingestion path for zero SUPPLY acceptance coefficient rows is identified and documented.
- [x] #2 Backend response distinguishes valid unavailable warehouses from missing tariff data without overloading numeric zero rates used by frontend calculations.
- [x] #3 If zero rows are invalid/stale data, tariff ingestion/backfill remediates affected warehouses or excludes them from selectable calculator rows.
- [x] #4 API contract is documented for frontend: when delivery/storage base rates may be zero and what UI should display.
- [x] #5 Regression check confirms `/v1/tariffs/acceptance/coefficients/all` no longer produces ambiguous preferred warehouse rows with delivery and storage all zero, or marks them explicitly as unavailable/missing-data.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started backend contract fix. Current `AcceptanceCoefficientsService.transformCoefficient` only uses `coefficient >= 0 && allowUnload` for `isAvailable`, so rows with delivery/storage rates all zero can still be returned as available. Plan: add explicit `hasTariffRates`/`tariffDataStatus` fields and mark all-zero tariff rows unavailable/missing-data without fabricating rates.

Source identified: backend endpoint `GET /v1/tariffs/acceptance/coefficients/all` is `TariffsController.getAllAcceptanceCoefficients`, backed by `AcceptanceCoefficientsService.getAllAcceptanceCoefficients`, which calls `sdk.tariffs.getAcceptanceCoefficients()` and transforms WB SDK raw `deliveryBaseLiter`, `deliveryAdditionalLiter`, `storageBaseLiter`, `storageAdditionalLiter` fields in `transformCoefficient`.

Backend contract fix: `AcceptanceCoefficient`/DTO now include `hasTariffRates` and `tariffDataStatus: 'complete' | 'missing_rates'`. Rows where delivery and storage base/additional rates are all zero are marked `hasTariffRates=false`, `tariffDataStatus='missing_rates'`, and `isAvailable=false` while preserving raw zero rates for auditability.

Frontend contract consumption: `src/types/tariffs.ts` accepts the new optional fields; `extractSupplyWarehouses` prefers usable tariff rows and excludes backend-confirmed `hasTariffRates=false` rows from selectable warehouse rows. Older backend responses without the marker still use the existing visible fallback path.

Verification: frontend tariff tests `supply-tariffs-lookup` + `useSupplyTariffs.storage` => 25 passed; frontend targeted ESLint => passed; frontend `npm run type-check` => passed; backend targeted ESLint => passed; backend `npm test -- src/tariffs/acceptance-coefficients.service.spec.ts --runInBand` => 37 passed; backend `npm run type-check` => TypeScript baseline 0/current 0.

Live source evidence retained from task-37: `/tmp/task-37-tariff-source-analysis.json` confirms current backend data issue; runtime deployment/cache refresh will be needed before live endpoint returns the new `missing_rates` markers.

Post-close self-review found and fixed deployment cache compatibility risk: Redis cache keys are now versioned as `tariffs:acceptance:v2:*`, so after deployment stale v1 cached coefficients without `hasTariffRates`/`tariffDataStatus` cannot bypass the new contract. Re-verified: backend targeted ESLint passed; backend acceptance coefficients spec 37 passed; backend type-check 0 errors; frontend tariff tests 25 passed; frontend targeted ESLint passed; frontend type-check passed.
<!-- SECTION:NOTES:END -->

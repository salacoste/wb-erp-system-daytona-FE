# Story 172.8-FE: Migrate the COGS Price Calculator

Status: review — feature commit `9adf7d33` merged through PR #301 as `08191dae` and feature cleanup passed; canonical reconciliation PR #303 remains pending merge and exact cleanup.

## Story

As a business user, I want `/cogs/price-calculator` to keep its complete input-to-result calculation flow while the owned surface moves to semantic shadcn/UI presentation, so that I can evaluate pricing outcomes without misunderstanding units, assumptions, warnings, or results.

Plan: `.omx/plans/172.8-migrate-the-cogs-price-calculator.md` (authoritative — branch `cdx/epic-172-story-8-price-calculator`, worktree `/private/tmp/wb-repricer-fe-172-8-price-calculator`).

## Acceptance Criteria

Per the canonical plan:

> **Given** representative valid, zero, negative, and invalid inputs
> **When** the calculator UI is migrated
> **Then** inputs, units, assumptions, formulas, formatting, warnings, and results preserve current meaning
> **And** visual refactoring does not alter calculations.

## Tasks / Subtasks

- [x] Task 0: verify the canonical plan, exact Story identity, route-ledger ownership, clean base, branch/worktree, and prerequisite ancestry.
- [x] Task 1: lock the calculator behavior baseline with the plan-prescribed targeted Vitest command.
- [x] Task 2: inventory the complete route-owned calculator surface and quantify legacy presentation debt before editing.
- [x] Task 3: produce honest RED by adding or strengthening direct behavior/source-contract proof for the canonical states, formula boundary, live import closure, and all-zero silent no-op contract before presentation changes.
- [x] Task 4: reach minimal GREEN by migrating only the mutable live presentation manifest to merged semantic tokens, shadcn primitives, and product compositions without changing formulas, request/query behavior, formatting, authorization, navigation, or reset/recalculation semantics.
- [x] Task 5: run targeted calculator tests and applicable calculator E2E/visual checks; record responsive, theme, keyboard, focus, semantics, non-color meaning, and accessibility evidence or explicit environment gaps.
- [x] Task 6: run universal local validation on the final feature diff.
- [x] Task 7: complete two independent fresh-context adversarial reviews plus independent verification; resolve every accepted material finding and rerun affected proof.
- [x] Task 8: commit, push the feature branch, open and merge the PR, then remove the feature branch, exact temporary worktree, and lifecycle records and prune worktrees.
- [x] Task 9a: prepare and validate the post-feature canonical Story/master/Epic/sprint updates in separately owned reconciliation PR #303.
- [ ] Task 9b: merge reconciliation PR #303, remove its remote/local branch and exact temporary worktree, prune, then record the completed lifecycle in a final close record.

## Dev Notes

### Prerequisites and Base

- Epic 166 foundation closure: merge `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2`; `git merge-base --is-ancestor ... HEAD` returned exit `0`.
- Story 167.1 AppShell: merge `a8dfe3532b2a05eaa8b979aae3522de39de2fcfa`; ancestry check returned exit `0`.
- Story 172.5 shared COGS formatting/presentation: merge `4e86272b645446189cd0d0bcd5e9c5e0c7f61942`; ancestry check returned exit `0`.
- Story base: `35503067e7b49e8f2970437d17211c9a36913a65`.
- Route-ledger ownership: Story `172.8` owns `/cogs/price-calculator` at `src/app/(dashboard)/cogs/price-calculator/page.tsx`.
- Initial worktree status: clean on `cdx/epic-172-story-8-price-calculator`.

### Behavior Lock

The plan-prescribed baseline command passed on pinned Node `24.18.0` and npm `11.11.0`:

```bash
npm test -- --run 'src/app/(dashboard)/cogs/price-calculator' src/components/custom/price-calculator
```

Result: **66/66 test files and 1743/1743 tests passed**, exit `0`.

### Pre-flight Inventory

- The live route import closure contains **95 production files**. This exact closure is the migration universe: 69 route/component TSX files, two mixed TS presentation-configuration files with line-level restrictions, and 24 read-only formula/business/support TS files.
- A separate reachability scan found **20 production files** under the calculator directory that the route does not import. They remain unchanged and read-only; this Story does not delete or opportunistically migrate them.
- `CostBreakdownTable.tsx` is **not applicable** to the live route contract because it has no live consumer. Its table-specific migration criteria do not authorize changing it.
- The raw directory scan found **294 palette/hex/route-padding matches across 58 files**, including unreachable files and test assertions. This is triage evidence only, not a mutable manifest or authorization for mechanical replacement.
- The existing all-zero submit behavior is an intentional locked contract: `performCalculation` returns silently when `isFormEmpty(data)` is true, without calling `onFormDataChange` or `onSubmit`. Story 172.8 preserves and tests this silent no-op; it does not add validation messaging or change the business rule.
- Canonical states to prove: pristine, valid input, field error, unusual warning, calculating, result, zero/negative result, and failure.

### Mutable Presentation Manifest

The route page, these 68 live TSX files, and the presentation-only literals in two mixed TS files are the only production surface authorized for presentation edits. In `cost-breakdown-types.ts`, only chart colors are mutable; types, keys, units, segment semantics, and minimum-width behavior remain read-only. In `margin-status-helpers.ts`, only class/color presentation values are mutable; labels, thresholds, status selection, and function behavior remain read-only. Direct tests under the route and calculator `__tests__` directories may change only to prove the Story contract.

```text
src/app/(dashboard)/cogs/price-calculator/page.tsx
src/components/custom/price-calculator/AcceptanceStatusBadge.tsx
src/components/custom/price-calculator/AutoFillBadge.tsx
src/components/custom/price-calculator/AutoFillWarning.tsx
src/components/custom/price-calculator/BoxTypeSelectItem.tsx
src/components/custom/price-calculator/BoxTypeSelector.tsx
src/components/custom/price-calculator/BuybackSlider.tsx
src/components/custom/price-calculator/CategoryCommandList.tsx
src/components/custom/price-calculator/CategorySelector.tsx
src/components/custom/price-calculator/CategorySelectorStates.tsx
src/components/custom/price-calculator/CoefficientCalendar.tsx
src/components/custom/price-calculator/CoefficientCalendarCells.tsx
src/components/custom/price-calculator/CoefficientField.tsx
src/components/custom/price-calculator/CoefficientsLoadingSkeleton.tsx
src/components/custom/price-calculator/CostBreakdownChart.tsx
src/components/custom/price-calculator/CostChartParts.tsx
src/components/custom/price-calculator/DeliveryDatePicker.tsx
src/components/custom/price-calculator/DeliveryDatePickerParts.tsx
src/components/custom/price-calculator/DimensionDisplay.tsx
src/components/custom/price-calculator/DimensionInputSection.tsx
src/components/custom/price-calculator/DrrSlider.tsx
src/components/custom/price-calculator/ErrorMessage.tsx
src/components/custom/price-calculator/FieldTooltip.tsx
src/components/custom/price-calculator/FixedCostField.tsx
src/components/custom/price-calculator/FixedCostLogisticsField.tsx
src/components/custom/price-calculator/FixedCostsBreakdown.tsx
src/components/custom/price-calculator/FixedCostsSection.tsx
src/components/custom/price-calculator/FormActionsSection.tsx
src/components/custom/price-calculator/FulfillmentTypeSelector.tsx
src/components/custom/price-calculator/HighRateWarning.tsx
src/components/custom/price-calculator/LocalizationIndexInput.tsx
src/components/custom/price-calculator/MarginProgressBar.tsx
src/components/custom/price-calculator/MarginSection.tsx
src/components/custom/price-calculator/MarginSlider.tsx
src/components/custom/price-calculator/PercentageCostsBreakdown.tsx
src/components/custom/price-calculator/PercentageCostsFormSection.tsx
src/components/custom/price-calculator/PresetActions.tsx
src/components/custom/price-calculator/PresetIndicator.tsx
src/components/custom/price-calculator/PriceCalculatorForm.tsx
src/components/custom/price-calculator/PriceCalculatorFormFields.tsx
src/components/custom/price-calculator/PriceCalculatorResults.tsx
src/components/custom/price-calculator/PriceSummaryFooter.tsx
src/components/custom/price-calculator/ProductSearchComponents.tsx
src/components/custom/price-calculator/ProductSearchPopover.tsx
src/components/custom/price-calculator/ProductSearchResults.tsx
src/components/custom/price-calculator/ProductSearchSelect.tsx
src/components/custom/price-calculator/RateLimitWarning.tsx
src/components/custom/price-calculator/RecommendedPriceCard.tsx
src/components/custom/price-calculator/ResetConfirmDialog.tsx
src/components/custom/price-calculator/ResultsSkeleton.tsx
src/components/custom/price-calculator/SppInput.tsx
src/components/custom/price-calculator/SupplyTariffInfo.tsx
src/components/custom/price-calculator/TargetMarginSection.tsx
src/components/custom/price-calculator/TaxConfigurationSection.tsx
src/components/custom/price-calculator/TaxImpactPreview.tsx
src/components/custom/price-calculator/TaxPresetGrid.tsx
src/components/custom/price-calculator/TaxRateInput.tsx
src/components/custom/price-calculator/TaxVatSection.tsx
src/components/custom/price-calculator/TurnoverDaysInput.tsx
src/components/custom/price-calculator/TwoLevelPriceHeader.tsx
src/components/custom/price-calculator/TwoLevelPricingDisplay.tsx
src/components/custom/price-calculator/UnitsPerPackageInput.tsx
src/components/custom/price-calculator/VariableCostsBreakdown.tsx
src/components/custom/price-calculator/WarehouseCommandList.tsx
src/components/custom/price-calculator/WarehouseSection.tsx
src/components/custom/price-calculator/WarehouseSelect.tsx
src/components/custom/price-calculator/WarehouseTariffsByBoxType.tsx
src/components/custom/price-calculator/WarningsDisplay.tsx
src/components/custom/price-calculator/WeightThresholdCheckbox.tsx
src/components/custom/price-calculator/cost-breakdown-types.ts
src/components/custom/price-calculator/margin-status-helpers.ts
```

### Read-only Formula and Business Manifest

These 24 files are live in the route closure, but this Story reads them only to lock behavior. Formula, request mapping, state, hooks, constants, and business semantics must remain byte-unchanged.

```text
src/components/custom/price-calculator/category-selector-constants.ts
src/components/custom/price-calculator/cost-breakdown-helpers.ts
src/components/custom/price-calculator/delivery-date-picker-constants.ts
src/components/custom/price-calculator/delivery-date-picker-types.ts
src/components/custom/price-calculator/preset-fields.ts
src/components/custom/price-calculator/price-calculator-constants.ts
src/components/custom/price-calculator/priceCalculatorUtils.ts
src/components/custom/price-calculator/product-search-helpers.ts
src/components/custom/price-calculator/tax-presets.ts
src/components/custom/price-calculator/useCategorySelectorState.ts
src/components/custom/price-calculator/useDebouncedSearch.ts
src/components/custom/price-calculator/useDeliveryDatePickerState.ts
src/components/custom/price-calculator/usePriceCalculatorData.ts
src/components/custom/price-calculator/usePriceCalculatorForm.ts
src/components/custom/price-calculator/usePriceCalculatorHandlers.ts
src/components/custom/price-calculator/usePriceCalculatorPreset.ts
src/components/custom/price-calculator/usePriceCalculatorState.ts
src/components/custom/price-calculator/useTaxHandlers.ts
src/components/custom/price-calculator/useWarehouseFormState.ts
src/components/custom/price-calculator/useWarehouseSectionData.ts
src/components/custom/price-calculator/useWarehouseSelectData.ts
src/components/custom/price-calculator/warehouse-form-calculations.ts
src/components/custom/price-calculator/warehouse-form-handlers.ts
src/components/custom/price-calculator/warehouse-form-types.ts
```

### Unreachable Production Files

These 20 production files are outside the live route closure. They remain read-only and are not deletion candidates in Story 172.8.

```text
src/components/custom/price-calculator/AdvancedOptionsSection.tsx
src/components/custom/price-calculator/CargoTypeBadge.tsx
src/components/custom/price-calculator/CoefficientDisplay.tsx
src/components/custom/price-calculator/CostBreakdownTable.tsx
src/components/custom/price-calculator/CustomerPriceDisplay.tsx
src/components/custom/price-calculator/DeliveryTypeSelector.tsx
src/components/custom/price-calculator/DisplayAutoFillBadge.tsx
src/components/custom/price-calculator/LogisticsCoefficientsContent.tsx
src/components/custom/price-calculator/LogisticsCoefficientsSection.tsx
src/components/custom/price-calculator/LogisticsSection.tsx
src/components/custom/price-calculator/LogisticsTariffCalculator.tsx
src/components/custom/price-calculator/LogisticsTariffDisplay.tsx
src/components/custom/price-calculator/ReturnLogisticsBreakdown.tsx
src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx
src/components/custom/price-calculator/ReturnLogisticsDisplay.tsx
src/components/custom/price-calculator/ReturnLogisticsSection.tsx
src/components/custom/price-calculator/TariffBreakdown.tsx
src/components/custom/price-calculator/TariffInputFields.tsx
src/components/custom/price-calculator/TariffSystemBadge.tsx
src/components/custom/price-calculator/useLogisticsTariffHandlers.ts
```

### Forbidden Shared Manifest

Any production path not named in the mutable presentation manifest is forbidden for Story changes. The explicit shared boundaries are:

```text
src/components/ui/**
src/components/product/**
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/** except cogs/price-calculator/page.tsx and direct Story tests
src/hooks/**
src/lib/api/**
src/stores/**
src/types/**
src/styles/**
package.json
package-lock.json
```

Backend code/contracts, foundation tokens, AppShell/navigation, dependencies, required CI gates, planning Epics, the master plan, and the route ledger are also forbidden in the feature branch. If a shared edit becomes necessary, the Story stops at that boundary and routes the need to its owner.

### References

- [Source: plan `.omx/plans/172.8-migrate-the-cogs-price-calculator.md`]
- [Source: canonical Epic `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`]
- [Source: route ledger `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: UX contract `_bmad-output/planning-artifacts/ux-design-specification.md`]

## Dev Agent Record

### Agent Model Used

- Orchestrator-owned execution with bounded native implementation, E2E, review, and verification lanes.
- Production GREEN and review repairs were integrated by the orchestrator; the E2E cleanup was authored independently; two fresh-context reviewers independently inspected the complete feature diff.

### Debug Log References

- Pinned runtime: `/opt/homebrew/opt/node@24/bin/node` = `v24.18.0`; cached exact npm CLI = `11.11.0`.
- Baseline targeted proof: `66/66` files and `1743/1743` tests passed before presentation changes.
- Honest RED: the initial Story source contract exposed `175` raw palette/hex violations across the mutable live manifest. First-review repair tests then failed as intended at `4` files, `5` failed / `24` passed, proving missing error association, narrow reflow, viewport-constrained popover, and all-zero handler evidence.
- Initial GREEN after first-review repair: focused `4/4` files and `9/9` tests passed; targeted calculator proof reached `70/70` files and `1758/1758` tests.
- Final post-second-review GREEN: source-contract/result focus `2/2` files and `17/17` tests; final targeted calculator proof `70/70` files and `1759/1759` tests, exit `0`.
- Static/local gates on the final feature diff: exact Prettier pass; full ESLint pass with zero warnings; `tsc --noEmit` pass; max-lines pass; E2E vacuity/fixed-wait/bare-skip guards pass; `git diff --check` pass.
- Production build: the first sandboxed Turbopack run failed solely on prohibited local port binding; the authorized out-of-sandbox rerun passed, compiled successfully, type-checked, and generated `70/70` static pages including `/cogs/price-calculator`.
- Final full regression on the completed diff: `1214` files / `19364` tests passed in the four-worker run; one `historical-spp-server-lifecycle` test failed only because sandbox denied its temporary listener, and two workers timed out before starting `useSupplyDetail` / `ReturnsCard`. The two resource-starved files passed immediately in a pinned single-worker rerun (`2/2`, `18/18`), and the listener suite passed outside sandbox (`1/1`, `11/11`). Composite final evidence therefore covers the full `1217`-file / `19383`-test corpus with every test passing in either the full run or its exact isolated environmental rerun.
- Earlier full-run flakes were also isolated before the final run: `useStorageAnalytics` and `OrderDetailsModal` passed together at `2/2` files / `58/58` tests; earlier calculator-adjacent timeout groups passed at `3/3` files / `136/136` tests and `8/8` files / `220/220` tests.

### Lifecycle Evidence

- Feature commit: `9adf7d331002ba35be9f571af264a0cca43d134d` (`feat(cogs): migrate the COGS price calculator`).
- Feature PR: [#301](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/301), merged as `08191dae387b9f130ac291ba48e48b2047d63a34`.
- Primary `main` was clean and fast-forwarded to `origin/main` at `08191dae`; feature merge ancestry was proven.
- `cdx/epic-172-story-8-price-calculator`, its remote branch, and `/private/tmp/wb-repricer-fe-172-8-price-calculator` are absent; `git worktree prune` completed.
- Canonical reconciliation uses `cdx/epic-172-story-8-reconciliation` and `/private/tmp/wb-repricer-fe-172-8-reconciliation` from merged base `08191dae`.
- Canonical reconciliation commit `18de839a4b23a96b3db4308fb4413968cf5cfe87` was rebased onto concurrent merged `main` `a2bfa472` and published in [PR #303](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/303); merge and cleanup remain open.

### Completion Notes List

- Story 172.8 began from the reconciled Story 169.12 program state; no Story 169 branch, worktree, or lifecycle residue was reused.
- The unusually large targeted baseline (`1743` tests) reflects the mature calculator contract. Presentation changes must preserve this floor and add proof rather than weaken existing assertions.
- The route now uses shared `PageHeader`, one responsive semantic result tree, a logical `h2` result heading, one polite completion announcement, reduced-motion-aware result scrolling, semantic financial/status/chart roles, and registered shadcn/Tailwind v4 tokens.
- The mutable presentation manifest moved from `175` raw color violations to zero. The guard now rejects `black`, `white`, and `950` utilities as well as named palette/hex values.
- Formula/request/query/state behavior remained outside the edit surface. All 24 read-only formula/business/support files are byte-identical to base `35503067`; `package.json`, `package-lock.json`, all 20 unreachable calculator files, shared primitives/products/hooks/types/styles, and `sprint-status.yaml` have zero feature diff.
- Field errors expose stable IDs with `aria-invalid`/`aria-describedby`; dimensions stack below `sm`; the warehouse popover is viewport-constrained; the all-zero submit path remains a silent no-op while a non-zero form calls both established callbacks.
- The authored E2E suite was made deterministic and semantic: shared tariff-reference mocks prevent rate-limit noise; duplicate-tree workarounds, synthetic events, palette assertions, and vacuous fallbacks were removed.
- The authored Playwright suite declares light/dark × `320/390/768/1024/1280/1440`, real `<main>` overflow, both popover bounds, page-wide and state-specific axe, 200% zoom, long financial values, keyboard-only calculation completion/focus, screenshot attachments, and computed VAT/margin color distinction; it was not dynamically executed.

### Post-1st-pass-review fixes (2026-08-28)

- Review outcome: REQUEST CHANGES with four findings; all concrete code/scope findings were accepted.
- Closed invalid-field association for fixed costs, dimensions, and warehouse selection with stable error IDs and direct tests.
- Closed 320px/reflow defects by stacking dimensions below `sm` and constraining the warehouse popover to `min(400px, 100vw - 2rem)`.
- Added the all-zero/non-zero handler boundary and the six-width responsive plus light/dark axe declarations.
- Removed the premature canonical `sprint-status.yaml` edit from the feature diff; canonical lifecycle state remains reconciliation-owned.
- Closure reviewer confirmed findings 1, 2, and 4 closed and found no new code/security issue. Its remaining concern was execution evidence that cannot be produced without the missing Story E2E environment; the second pass separated this environment gap from repairable test-contract defects.

### Post-2nd-pass-review fixes (2026-08-28)

- Review outcome: REQUEST CHANGES with four MEDIUM findings; all four were accepted and resolved before commit.
- Assigned VAT to `var(--color-chart-5)` so it no longer aliases the positive-margin role in either theme; the authored browser assertion compares computed swatch colors when executed.
- Replaced the remaining `bg-black/5` with `bg-muted` and strengthened the source guard with explicit black/white/950 regression fixtures.
- Expanded the authored visual suite to declare the complete theme/viewport matrix, real main-container overflow, both popover edges, whole-page/state-specific axe, 200% zoom/reflow, long values, keyboard-only completion/focus, and screenshot identifiers.
- Extracted deterministic rate-limited tariff-reference mocks into `e2e/fixtures/story-172-8-price-calculator.ts` and reused them from both calculator suites.
- Post-fix exact ESLint, TypeScript, Prettier, E2E static guards, focused tests, and the complete targeted calculator suite all pass.

### Gaps

- Dynamic Playwright execution is unavailable because this isolated Story worktree has no `.env.e2e` containing `E2E_BASE_URL`, `E2E_API_URL`, `E2E_TEST_EMAIL`, and `E2E_TEST_PASSWORD`. The earlier password authorization was scoped only to Story 167.5, so no credential was read, copied, printed, or persisted for Story 172.8. The browser matrix, screenshot attachments, axe runs, and computed contrast/color assertions are implemented but remain an explicit environment gap, never reported as a pass.
- Manual browser contrast/focus/screenshot disposition cannot be honestly recorded without the same E2E environment. Semantic token/source proof, component-level accessibility assertions, static E2E quality guards, and production build are the next-best evidence.
- The sandboxed full suite cannot itself bind the temporary listener used by `historical-spp-server-lifecycle`; the exact isolated suite passed outside sandbox at `1/1` file / `11/11` tests. Two four-worker startup timeouts also passed immediately at `2/2` files / `18/18` tests in single-worker mode. These are recorded as execution-environment splits, not product passes hidden behind retries.

### File List

- `_bmad-output/implementation-artifacts/172-8-fe-migrate-the-cogs-price-calculator.md`
- `e2e/fixtures/story-172-8-price-calculator.ts`
- `e2e/price-calculator-visual.spec.ts`
- `e2e/price-calculator.spec.ts`
- `src/app/(dashboard)/cogs/price-calculator/__tests__/page.test.tsx`
- `src/app/(dashboard)/cogs/price-calculator/page.tsx`
- `src/components/custom/price-calculator/AcceptanceStatusBadge.tsx`
- `src/components/custom/price-calculator/AutoFillBadge.tsx`
- `src/components/custom/price-calculator/AutoFillWarning.tsx`
- `src/components/custom/price-calculator/CoefficientCalendarCells.tsx`
- `src/components/custom/price-calculator/CoefficientField.tsx`
- `src/components/custom/price-calculator/CostChartParts.tsx`
- `src/components/custom/price-calculator/DeliveryDatePicker.tsx`
- `src/components/custom/price-calculator/DeliveryDatePickerParts.tsx`
- `src/components/custom/price-calculator/DimensionDisplay.tsx`
- `src/components/custom/price-calculator/DimensionInputSection.tsx`
- `src/components/custom/price-calculator/DrrSlider.tsx`
- `src/components/custom/price-calculator/ErrorMessage.tsx`
- `src/components/custom/price-calculator/FixedCostField.tsx`
- `src/components/custom/price-calculator/FixedCostsSection.tsx`
- `src/components/custom/price-calculator/FormActionsSection.tsx`
- `src/components/custom/price-calculator/MarginProgressBar.tsx`
- `src/components/custom/price-calculator/MarginSection.tsx`
- `src/components/custom/price-calculator/MarginSlider.tsx`
- `src/components/custom/price-calculator/PercentageCostsFormSection.tsx`
- `src/components/custom/price-calculator/PresetIndicator.tsx`
- `src/components/custom/price-calculator/PriceCalculatorResults.tsx`
- `src/components/custom/price-calculator/PriceSummaryFooter.tsx`
- `src/components/custom/price-calculator/RecommendedPriceCard.tsx`
- `src/components/custom/price-calculator/SupplyTariffInfo.tsx`
- `src/components/custom/price-calculator/TaxConfigurationSection.tsx`
- `src/components/custom/price-calculator/TaxRateInput.tsx`
- `src/components/custom/price-calculator/TaxVatSection.tsx`
- `src/components/custom/price-calculator/TurnoverDaysInput.tsx`
- `src/components/custom/price-calculator/TwoLevelPriceHeader.tsx`
- `src/components/custom/price-calculator/WarehouseSection.tsx`
- `src/components/custom/price-calculator/WarehouseSelect.tsx`
- `src/components/custom/price-calculator/WarehouseTariffsByBoxType.tsx`
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.story-44.43.test.tsx`
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.test.tsx`
- `src/components/custom/price-calculator/__tests__/CoefficientCalendar.test.tsx`
- `src/components/custom/price-calculator/__tests__/DimensionInputSection.test.tsx`
- `src/components/custom/price-calculator/__tests__/DrrSlider.story-44.18.test.tsx`
- `src/components/custom/price-calculator/__tests__/DrrSlider.test.tsx`
- `src/components/custom/price-calculator/__tests__/FixedCostField.test.tsx`
- `src/components/custom/price-calculator/__tests__/FixedCostsSection.test.tsx`
- `src/components/custom/price-calculator/__tests__/FormActionsSection.test.tsx`
- `src/components/custom/price-calculator/__tests__/PercentageCostsFormSection.test.tsx`
- `src/components/custom/price-calculator/__tests__/PresetSaveLoad.story-44.44.test.tsx`
- `src/components/custom/price-calculator/__tests__/PriceCalculatorResults.test.tsx`
- `src/components/custom/price-calculator/__tests__/RecommendedPriceCard.test.tsx`
- `src/components/custom/price-calculator/__tests__/TwoLevelPriceHeader.test.tsx`
- `src/components/custom/price-calculator/__tests__/TwoLevelPricingDisplay.story-44.20.test.tsx`
- `src/components/custom/price-calculator/__tests__/WarehouseSection.story-44.27.test.tsx`
- `src/components/custom/price-calculator/__tests__/story-172.8-presentation-source-contract.test.ts`
- `src/components/custom/price-calculator/__tests__/usePriceCalculatorHandlers.empty-submit.test.tsx`
- `src/components/custom/price-calculator/cost-breakdown-types.ts`
- `src/components/custom/price-calculator/margin-status-helpers.ts`

### Change Log

| Date | Change |
| --- | --- |
| 2026-08-27 | Story opened from clean base `35503067`; Epic 166, Story 167.1, and Story 172.5 ancestry verified; targeted baseline passed at 66 files / 1743 tests; initial legacy-presentation inventory recorded at 294 matches / 58 files. Status: backlog → in-progress. |
| 2026-08-28 | Implementation complete for the feature branch: one semantic responsive calculator tree, zero raw palette debt in the 71-file mutable manifest, formula/business files byte-preserved, deterministic Story E2E contract, and two fresh-context review passes with all accepted code/test findings resolved. **Lessons:** (1) Story-172.8-FE color-token names must be checked at computed-value level because aliases can collapse chart meaning. (2) Route evidence must inspect the real scrolling container, not a body hidden by AppShell overflow rules. (3) Rate-limited reference APIs require deterministic presentation fixtures while live contract smoke stays separate. Status: in-progress → review. |
| 2026-08-28 | Feature PR #301 merged as `08191dae`; exact feature cleanup passed; canonical reconciliation PR #303 was prepared from updated `main`. Status remains review pending reconciliation merge and cleanup. |
